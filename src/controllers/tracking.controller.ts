import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TrackingController {
  /**
   * Track email open
   */
  async trackOpen(req: Request, res: Response): Promise<void> {
    try {
      const { t: trackingToken } = req.query;

      if (!trackingToken || typeof trackingToken !== 'string') {
        res.status(400).send('Invalid tracking token');
        return;
      }

      // Find recipient by tracking token
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { trackingToken }
      });

      if (recipient && !recipient.opened) {
        // Update recipient
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            opened: true,
            openedAt: new Date()
          }
        });

        // Increment campaign open count
        await prisma.campaign.update({
          where: { id: recipient.campaignId },
          data: { openCount: { increment: 1 } }
        });
      }

      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );

      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache'
      });
      res.end(pixel);
    } catch (error) {
      console.error('Track open error:', error);
      res.status(500).send('Error tracking open');
    }
  }

  /**
   * Track email click
   */
  async trackClick(req: Request, res: Response): Promise<void> {
    try {
      const { t: trackingToken, u: originalUrl } = req.query;

      if (!trackingToken || typeof trackingToken !== 'string') {
        res.status(400).send('Invalid tracking token');
        return;
      }

      if (!originalUrl || typeof originalUrl !== 'string') {
        res.status(400).send('Invalid URL');
        return;
      }

      // Find recipient by tracking token
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { trackingToken }
      });

      if (recipient) {
        // Record click
        await prisma.campaignClick.create({
          data: {
            recipientId: recipient.id,
            url: originalUrl,
            clickedAt: new Date()
          }
        });

        // Update recipient if first click
        if (!recipient.clicked) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              clicked: true,
              clickedAt: new Date()
            }
          });

          // Increment campaign click count
          await prisma.campaign.update({
            where: { id: recipient.campaignId },
            data: { clickCount: { increment: 1 } }
          });
        }
      }

      // Redirect to original URL
      res.redirect(302, originalUrl);
    } catch (error) {
      console.error('Track click error:', error);
      res.status(500).send('Error tracking click');
    }
  }

  /**
   * Handle unsubscribe
   */
  async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const { token: trackingToken } = req.query;

      if (!trackingToken || typeof trackingToken !== 'string') {
        res.status(400).send('Invalid unsubscribe token');
        return;
      }

      // Find recipient by tracking token
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { trackingToken },
        include: { contact: true }
      });

      if (!recipient) {
        res.status(404).send('Recipient not found');
        return;
      }

      // Update contact status
      await prisma.contact.update({
        where: { id: recipient.contactId },
        data: {
          status: 'UNSUBSCRIBED',
          unsubscribedAt: new Date()
        }
      });

      // Update recipient
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          unsubscribed: true,
          unsubscribedAt: new Date()
        }
      });

      // Increment campaign unsubscribe count
      await prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { unsubscribeCount: { increment: 1 } }
      });

      // Return success page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #333;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ You've been unsubscribed</h1>
            <p>You will no longer receive emails from us.</p>
            <p>If this was a mistake, please contact us to resubscribe.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).send('Error processing unsubscribe');
    }
  }

  /**
   * Handle one-click unsubscribe (RFC 8058)
   */
  async unsubscribeOneClick(req: Request, res: Response): Promise<void> {
    try {
      const { token: trackingToken } = req.body;

      if (!trackingToken || typeof trackingToken !== 'string') {
        res.status(400).send('Invalid unsubscribe token');
        return;
      }

      // Find recipient by tracking token
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { trackingToken }
      });

      if (!recipient) {
        res.status(404).send('Recipient not found');
        return;
      }

      // Update contact status
      await prisma.contact.update({
        where: { id: recipient.contactId },
        data: {
          status: 'UNSUBSCRIBED',
          unsubscribedAt: new Date()
        }
      });

      // Update recipient
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          unsubscribed: true,
          unsubscribedAt: new Date()
        }
      });

      // Increment campaign unsubscribe count
      await prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { unsubscribeCount: { increment: 1 } }
      });

      res.status(200).send('OK');
    } catch (error) {
      console.error('One-click unsubscribe error:', error);
      res.status(500).send('Error processing unsubscribe');
    }
  }
}
