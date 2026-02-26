import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import config from '../../config';

const sesClient = new SESClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId as string,
    secretAccessKey: config.aws.secretAccessKey as string,
  },
});

/**
 * Send email using AWS SES
 * @param to recipient email
 * @param subject email subject
 * @param htmlBody email html content
 * @param fromEmail optional from email (defaults to config)
 */
export const sendEmailViaSES = async (
  to: string,
  subject: string,
  htmlBody: string,
  fromEmail?: string
) => {
  const from = fromEmail || config.aws.fromEmail;

  // SES SendEmailCommand is simpler for basic HTML, but SendRawEmailCommand
  // or just SendEmailCommand is fine for our MVP.
  // Let's use SendEmailCommand as it's cleaner for simple HTML.
  const { SendEmailCommand } = await import('@aws-sdk/client-ses');
  
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: from as string,
  });

  try {
    const result = await sesClient.send(command);
    return result.MessageId;
  } catch (error) {
    console.error('SES Sending Error:', error);
    throw error;
  }
};
