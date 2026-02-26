import { Campaign, Prisma } from '@prisma/client';
import { sendEmailViaSES } from '../../utils/ses.service';
import config from '../../../config';
import prisma from '../../lib/prisma';
import { IPaginationOptions } from '../../interface/pagination.type';
import { paginationHelper } from '../../helpers/paginationHelper';
import { parse } from 'csv-parse';
import fs from 'fs';
import { CampaignQueueService } from '../../../services/campaign-queue.service';
import { randomBytes } from 'crypto';

const queueService = new CampaignQueueService();

export type ICampaignFilterRequest = {
  searchTerm?: string;
  status?: string;
};

const createCampaignManual = async (payload: any): Promise<Campaign> => {
  const { recipients = [], userId, folderId, templateJson, ...campaignData } = payload;
  
  // Validate templateJson if provided
  if (templateJson) {
    try {
      JSON.parse(templateJson);
    } catch (error) {
      throw new Error('Invalid template JSON format');
    }
  }
  
  const result = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        ...campaignData,
        templateJson: templateJson || JSON.stringify({ blocks: [] }),
      },
    });

    // If folderId is provided, get all contacts from that folder
    let contactsToAdd = recipients;
    if (folderId && recipients.length === 0) {
      const folderContacts = await tx.contact.findMany({
        where: {
          folderId: folderId,
          status: 'SUBSCRIBED',
        },
      });
      contactsToAdd = folderContacts.map(c => ({
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
      }));
    }

    // Process recipients
    for (const recipient of contactsToAdd) {
      // Find existing contact by email
      let contact = await tx.contact.findUnique({
        where: {
          email: recipient.email,
        },
      });

      // If contact doesn't exist, create it (requires folderId)
      if (!contact && folderId) {
        const unsubscribeToken = randomBytes(32).toString('hex');
        contact = await tx.contact.create({
          data: {
            email: recipient.email,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            folderId: folderId,
            unsubscribeToken,
            status: 'SUBSCRIBED',
          },
        });
      }

      // Link to campaign if contact exists and is subscribed
      if (contact && contact.status === 'SUBSCRIBED') {
        const trackingToken = randomBytes(32).toString('hex');
        await tx.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            contactId: contact.id,
            trackingToken,
          },
        });
      }
    }

    // Update campaign with total recipients count
    const totalRecipients = await tx.campaignRecipient.count({
      where: { campaignId: campaign.id },
    });

    const updatedCampaign = await tx.campaign.update({
      where: { id: campaign.id },
      data: { totalRecipients },
    });

    return updatedCampaign;
  });

  return result;
};

const createCampaignCSV = async (payload: any, filePath: string): Promise<Campaign> => {
  const { userId, folderId, ...campaignData } = payload;
  const contacts: any[] = [];
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const record of parser) {
    if (record.email) {
      contacts.push({
        email: record.email,
        firstName: record.firstName || record.first_name || '',
        lastName: record.lastName || record.last_name || '',
      });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: campaignData,
    });

    for (const contactData of contacts) {
      // Find existing contact by email
      let contact = await tx.contact.findUnique({
        where: {
          email: contactData.email,
        },
      });

      // If contact doesn't exist, create it (requires folderId)
      if (!contact && folderId) {
        contact = await tx.contact.create({
          data: {
            ...contactData,
            folderId: folderId,
          },
        });
      }

      // Link to campaign if contact exists
      if (contact) {
        const trackingToken = randomBytes(32).toString('hex');
        await tx.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            contactId: contact.id,
            trackingToken,
          },
        });
      }
    }

    return campaign;
  });

  return result;
};

const getAllCampaigns = async (
  filters: ICampaignFilterRequest,
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.CampaignWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { subject: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.CampaignWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.campaign.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder as any,
    },
  });

  const total = await prisma.campaign.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getCampaignById = async (id: string) => {
  const result = await prisma.campaign.findUnique({
    where: { id },
    include: {
      recipients: {
        include: {
          contact: true,
        },
      },
    },
  });
  return result;
};

const updateCampaign = async (id: string, payload: any) => {
  // Check if campaign exists
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Only allow updates for DRAFT, SCHEDULED, or PAUSED campaigns
  if (!['DRAFT', 'SCHEDULED', 'PAUSED'].includes(campaign.status)) {
    throw new Error(`Cannot update campaign with status ${campaign.status}`);
  }

  const { recipients = [], ...campaignData } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // Prepare update data
    const updateData: any = {
      name: campaignData.name,
      subject: campaignData.subject,
      fromName: campaignData.fromName,
      fromEmail: campaignData.fromEmail,
      replyTo: campaignData.replyTo,
      previewText: campaignData.previewText,
    };

    // Update templateJson if provided
    if (campaignData.templateJson) {
      updateData.templateJson = campaignData.templateJson;
    }

    // Update campaign
    const updatedCampaign = await tx.campaign.update({
      where: { id },
      data: updateData,
    });

    // Update recipients if provided
    if (recipients.length > 0) {
      // Delete existing recipients
      await tx.campaignRecipient.deleteMany({
        where: { campaignId: id },
      });

      // Add new recipients
      for (const recipient of recipients) {
        // Find existing contact by email or contactId
        let contact;
        
        if (recipient.contactId) {
          contact = await tx.contact.findUnique({
            where: { id: recipient.contactId },
          });
        } else if (recipient.email) {
          contact = await tx.contact.findUnique({
            where: { email: recipient.email },
          });
        }

        // Link to campaign if contact exists and is subscribed
        if (contact && contact.status === 'SUBSCRIBED') {
          const trackingToken = randomBytes(32).toString('hex');
          await tx.campaignRecipient.create({
            data: {
              campaignId: id,
              contactId: contact.id,
              trackingToken,
            },
          });
        }
      }

      // Update campaign with total recipients count
      const totalRecipients = await tx.campaignRecipient.count({
        where: { campaignId: id },
      });

      await tx.campaign.update({
        where: { id },
        data: { totalRecipients },
      });
    }

    return updatedCampaign;
  });

  return result;
};

const sendCampaign = async (campaignId: string) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'DRAFT') {
    throw new Error('Campaign already sent or in progress');
  }

  // Queue campaign for sending using BullMQ
  await queueService.queueCampaign(campaignId, 500);

  return { 
    message: 'Campaign queued for sending',
    campaignId 
  };
};

const getCampaignStats = async (id: string) => {
  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId: id },
  });

  const stats = {
    sent: recipients.length,
    delivered: recipients.filter((r) => r.delivered).length,
    opens: recipients.filter((r) => r.opened).length,
    clicks: recipients.filter((r) => r.clicked).length,
    bounces: recipients.filter((r) => r.bounced).length,
    complaints: recipients.filter((r) => r.complained).length,
  };

  return stats;
};

export const CampaignServices = {
  createCampaignManual,
  createCampaignCSV,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  sendCampaign,
  getCampaignStats,
};
