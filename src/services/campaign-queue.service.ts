import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { EmailRendererService } from './email-renderer.service';
import { EmailSenderService } from './email-sender.service';
import { EmailTemplate, EmailRenderContext } from '../types/email.types';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();
const emailRenderer = new EmailRendererService();
const emailSender = new EmailSenderService();

interface CampaignJobData {
  campaignId: string;
  batchSize: number;
}

interface EmailJobData {
  campaignId: string;
  recipientId: string;
  contactId: string;
  trackingToken: string;
}

export class CampaignQueueService {
  private campaignQueue: Queue;
  private emailQueue: Queue;
  private campaignWorker: Worker;
  private emailWorker: Worker;

  constructor() {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    };

    this.campaignQueue = new Queue('campaign-processing', { connection });
    this.emailQueue = new Queue('email-sending', { 
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    this.campaignWorker = new Worker('campaign-processing', this.processCampaign.bind(this), { connection });
    this.emailWorker = new Worker('email-sending', this.sendEmail.bind(this), { 
      connection,
      concurrency: 10,
      limiter: {
        max: 14, // SES default: 14 emails per second
        duration: 1000
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.campaignWorker.on('completed', (job) => {
      console.log(`Campaign job ${job.id} completed`);
    });

    this.campaignWorker.on('failed', (job, err) => {
      console.error(`Campaign job ${job?.id} failed:`, err);
    });

    this.emailWorker.on('completed', (job) => {
      console.log(`Email job ${job.id} completed`);
    });

    this.emailWorker.on('failed', (job, err) => {
      console.error(`Email job ${job?.id} failed:`, err);
    });
  }

  async queueCampaign(campaignId: string, batchSize: number = 500): Promise<void> {
    await this.campaignQueue.add('process-campaign', {
      campaignId,
      batchSize
    });
  }

  private async processCampaign(job: Job<CampaignJobData>): Promise<void> {
    const { campaignId, batchSize } = job.data;

    try {
      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'SENDING' }
      });

      // Get campaign details
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get subscribed contacts (skip unsubscribed)
      const contacts = await prisma.contact.findMany({
        where: {
          status: 'SUBSCRIBED'
        }
      });

      // Create recipients with tracking tokens
      const recipients = await Promise.all(
        contacts.map(async (contact) => {
          const trackingToken = randomBytes(32).toString('hex');
          
          return prisma.campaignRecipient.create({
            data: {
              campaignId,
              contactId: contact.id,
              trackingToken
            }
          });
        })
      );

      // Update total recipients
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { totalRecipients: recipients.length }
      });

      // Queue individual emails in batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(recipient =>
            this.emailQueue.add('send-email', {
              campaignId,
              recipientId: recipient.id,
              contactId: recipient.contactId,
              trackingToken: recipient.trackingToken
            })
          )
        );

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('Campaign processing error:', error);
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  }

  private async sendEmail(job: Job<EmailJobData>): Promise<void> {
    const { campaignId, recipientId, contactId, trackingToken } = job.data;

    try {
      // Get campaign and contact details
      const [campaign, contact, recipient] = await Promise.all([
        prisma.campaign.findUnique({ where: { id: campaignId } }),
        prisma.contact.findUnique({ where: { id: contactId } }),
        prisma.campaignRecipient.findUnique({ where: { id: recipientId } })
      ]);

      if (!campaign || !contact || !recipient) {
        throw new Error('Campaign, contact, or recipient not found');
      }

      // Skip if contact unsubscribed
      if (contact.status !== 'SUBSCRIBED') {
        await prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: { 
            errorMessage: 'Contact unsubscribed',
            updatedAt: new Date()
          }
        });
        return;
      }

      // Parse template JSON
      const template: EmailTemplate = JSON.parse(campaign.templateJson);

      // Build render context
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const context: EmailRenderContext = {
        campaignId,
        contactId,
        trackingToken,
        contact: {
          email: contact.email,
          firstName: contact.firstName || undefined,
          lastName: contact.lastName || undefined
        },
        campaign: {
          subject: campaign.subject,
          previewText: campaign.previewText || undefined,
          fromName: campaign.fromName,
          fromEmail: campaign.fromEmail
        },
        unsubscribeUrl: `${baseUrl}/api/unsubscribe?token=${trackingToken}`,
        trackingPixelUrl: `${baseUrl}/api/track/open?t=${trackingToken}`
      };

      // Render HTML
      const htmlContent = emailRenderer.renderTemplate(template, context);

      // Send email
      const result = await emailSender.sendEmail({
        to: contact.email,
        from: campaign.fromEmail,
        fromName: campaign.fromName,
        replyTo: campaign.replyTo || undefined,
        subject: campaign.subject,
        htmlBody: htmlContent,
        headers: {
          'List-Unsubscribe': `<${context.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Campaign-ID': campaignId,
          'X-Tracking-Token': trackingToken
        }
      });

      // Update recipient status
      if (result.success) {
        await prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            messageId: result.messageId,
            delivered: true,
            sentAt: new Date(),
            deliveredAt: new Date()
          }
        });

        // Increment sent count
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } }
        });
      } else {
        await prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            errorMessage: result.error,
            updatedAt: new Date()
          }
        });
      }

    } catch (error: any) {
      console.error('Email sending error:', error);
      await prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          errorMessage: error.message,
          updatedAt: new Date()
        }
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.campaignWorker.close();
    await this.emailWorker.close();
    await this.campaignQueue.close();
    await this.emailQueue.close();
  }
}
