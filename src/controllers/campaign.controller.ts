import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CampaignQueueService } from '../services/campaign-queue.service';

const prisma = new PrismaClient();
const queueService = new CampaignQueueService();

export class CampaignController {
  /**
   * Create campaign
   */
  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        subject,
        previewText,
        fromName,
        fromEmail,
        replyTo,
        templateJson
      } = req.body;

      // Validate required fields
      if (!name || !subject || !fromName || !fromEmail || !templateJson) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Validate template JSON
      try {
        JSON.parse(templateJson);
      } catch (error) {
        res.status(400).json({ error: 'Invalid template JSON' });
        return;
      }

      const campaign = await prisma.campaign.create({
        data: {
          name,
          subject,
          previewText,
          fromName,
          fromEmail,
          replyTo,
          templateJson,
          status: 'DRAFT'
        }
      });

      res.status(201).json(campaign);
    } catch (error: any) {
      console.error('Create campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        subject,
        previewText,
        fromName,
        fromEmail,
        replyTo,
        templateJson
      } = req.body;

      // Check if campaign exists and is editable
      const existing = await prisma.campaign.findUnique({
        where: { id }
      });

      if (!existing) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (existing.status !== 'DRAFT') {
        res.status(400).json({ error: 'Cannot edit campaign that is not in draft status' });
        return;
      }

      // Validate template JSON if provided
      if (templateJson) {
        try {
          JSON.parse(templateJson);
        } catch (error) {
          res.status(400).json({ error: 'Invalid template JSON' });
          return;
        }
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          name,
          subject,
          previewText,
          fromName,
          fromEmail,
          replyTo,
          templateJson
        }
      });

      res.json(campaign);
    } catch (error: any) {
      console.error('Update campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          recipients: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      res.json(campaign);
    } catch (error: any) {
      console.error('Get campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * List campaigns
   */
  async listCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where = status ? { status: status as any } : {};

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.campaign.count({ where })
      ]);

      res.json({
        campaigns,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('List campaigns error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Send campaign
   */
  async sendCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id }
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.status !== 'DRAFT') {
        res.status(400).json({ error: 'Campaign already sent or in progress' });
        return;
      }

      // Queue campaign for sending
      await queueService.queueCampaign(id);

      res.json({ message: 'Campaign queued for sending', campaignId: id });
    } catch (error: any) {
      console.error('Send campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id }
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const stats = {
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        openCount: campaign.openCount,
        clickCount: campaign.clickCount,
        unsubscribeCount: campaign.unsubscribeCount,
        bounceCount: campaign.bounceCount,
        openRate: campaign.sentCount > 0 
          ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(2) 
          : '0.00',
        clickRate: campaign.sentCount > 0 
          ? ((campaign.clickCount / campaign.sentCount) * 100).toFixed(2) 
          : '0.00',
        unsubscribeRate: campaign.sentCount > 0 
          ? ((campaign.unsubscribeCount / campaign.sentCount) * 100).toFixed(2) 
          : '0.00'
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Get campaign stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id }
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.status === 'SENDING') {
        res.status(400).json({ error: 'Cannot delete campaign that is currently sending' });
        return;
      }

      await prisma.campaign.delete({
        where: { id }
      });

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error: any) {
      console.error('Delete campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
