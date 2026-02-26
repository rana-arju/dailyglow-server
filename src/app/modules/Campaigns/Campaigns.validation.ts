import { z } from 'zod';

const createCampaignManual = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    subject: z.string({ required_error: 'Subject is required' }),
    fromName: z.string({ required_error: 'From Name is required' }),
    fromEmail: z.string({ required_error: 'From Email is required' }).email(),
    replyTo: z.string().email().optional(),
    previewText: z.string().optional(),
    templateJson: z.string().optional(), // JSON string of email blocks
    htmlContent: z.string().optional(), // Optional, can be generated from templateJson
    recipients: z.array(
      z.object({
        email: z.string({ required_error: 'Email is required' }).email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    ).optional().default([]), // Make optional with empty array default
    folderId: z.string().optional(),
    userId: z.string().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'FAILED']).optional(),
  })
  .refine(
    (data) => data.templateJson || data.htmlContent,
    {
      message: 'Either templateJson or htmlContent is required',
      path: ['templateJson'],
    }
  )
  .refine(
    (data) => {
      // If status is DRAFT, recipients/folder not required
      if (data.status === 'DRAFT') {
        return true;
      }
      // For non-draft campaigns, require recipients or folderId
      return (data.recipients && data.recipients.length > 0) || data.folderId;
    },
    {
      message: 'Either recipients or folderId is required for non-draft campaigns',
      path: ['recipients'],
    }
  ),
});

const createCampaignCSV = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    subject: z.string({ required_error: 'Subject is required' }),
    fromName: z.string({ required_error: 'From Name is required' }),
    fromEmail: z.string({ required_error: 'From Email is required' }).email(),
    replyTo: z.string().email().optional(),
    previewText: z.string().optional(),
    templateJson: z.string().optional(),
    htmlContent: z.string().optional(),
    folderId: z.string().optional(),
    userId: z.string().optional(),
  }).refine(
    (data) => data.templateJson || data.htmlContent,
    {
      message: 'Either templateJson or htmlContent is required',
      path: ['templateJson'],
    }
  ),
});

const updateCampaign = z.object({
  body: z.object({
    name: z.string().optional(),
    subject: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().email().optional(),
    replyTo: z.string().email().optional(),
    previewText: z.string().optional(),
    templateJson: z.string().optional(),
    htmlContent: z.string().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'FAILED']).optional(),
  }),
});

export const CampaignValidation = {
  createCampaignManual,
  createCampaignCSV,
  updateCampaign,
};
