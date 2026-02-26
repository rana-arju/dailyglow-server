import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailHeaders } from '../types/email.types';

export class EmailSenderService {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  async sendEmail(params: {
    to: string;
    from: string;
    fromName: string;
    replyTo?: string;
    subject: string;
    htmlBody: string;
    headers: EmailHeaders;
  }): Promise<{ messageId: string; success: boolean; error?: string }> {
    try {
      const command = new SendEmailCommand({
        Source: `${params.fromName} <${params.from}>`,
        Destination: {
          ToAddresses: [params.to]
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: params.htmlBody,
              Charset: 'UTF-8'
            }
          }
        },
        ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET
      });

      const response = await this.sesClient.send(command);
      
      return {
        messageId: response.MessageId || '',
        success: true
      };
    } catch (error: any) {
      console.error('Email send error:', error);
      return {
        messageId: '',
        success: false,
        error: error.message
      };
    }
  }

  async verifyDomain(domain: string): Promise<boolean> {
    // Implementation for domain verification
    // This would check SPF, DKIM, DMARC records
    return true;
  }
}
