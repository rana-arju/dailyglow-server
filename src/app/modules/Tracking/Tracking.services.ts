import { ContactStatus } from '@prisma/client';
import prisma from '../../lib/prisma';

const trackOpen = async (campaignId: string, contactId: string) => {
  await prisma.campaignRecipient.updateMany({
    where: {
      campaignId,
      contactId,
    },
    data: {
      opened: true,
      openedAt: new Date(),
    },
  });
};

const trackClick = async (campaignId: string, contactId: string, url: string) => {
  await prisma.campaignRecipient.updateMany({
    where: {
      campaignId,
      contactId,
    },
    data: {
      clicked: true,
      clickedAt: new Date(),
    },
  });
};

const unsubscribe = async (contactId: string) => {
  await prisma.contact.update({
    where: { id: contactId },
    data: { status: 'UNSUBSCRIBED' },
  });
};

const handleSESWebhook = async (payload: any) => {
  const { eventType, mail, bounce, complaint, delivery } = payload;
  const messageId = mail.messageId;

  if (eventType === 'Bounce') {
    await prisma.campaignRecipient.updateMany({
      where: { messageId },
      data: { bounced: true },
    });

    // Update contact status if bounce is permanent
    if (bounce.bounceType === 'Permanent') {
      const recipient = await prisma.campaignRecipient.findFirst({
        where: { messageId },
      });
      if (recipient) {
        await prisma.contact.update({
          where: { id: recipient.contactId },
          data: { status: 'BOUNCED' },
        });
      }
    }
  } else if (eventType === 'Complaint') {
    await prisma.campaignRecipient.updateMany({
      where: { messageId },
      data: { complained: true },
    });

    const recipient = await prisma.campaignRecipient.findFirst({
      where: { messageId },
    });
    if (recipient) {
      await prisma.contact.update({
        where: { id: recipient.contactId },
        data: { status: 'COMPLAINED' },
      });
    }
  } else if (eventType === 'Delivery') {
    await prisma.campaignRecipient.updateMany({
      where: { messageId },
      data: { 
        delivered: true,
        deliveredAt: new Date()
      },
    });
  }
};

export const TrackingServices = {
  trackOpen,
  trackClick,
  unsubscribe,
  handleSESWebhook,
};
