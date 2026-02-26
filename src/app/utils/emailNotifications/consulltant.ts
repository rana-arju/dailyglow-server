// utils/email.ts
import nodemailer from 'nodemailer';
import config from '../../../config';

export const transporter = nodemailer.createTransport({
  service: 'Gmail', // or your SMTP service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendBusinessPlanAssignedEmail = async ({
  consultantEmail,
  consultantName,
  userName,
  businessTitle,
}: {
  consultantEmail: string;
  consultantName: string;
  userName: string;
  businessTitle: string;
}) => {
  const mailOptions = {
    from: `"bettyesses" <${config.emailSender.email}>`,
    to: consultantEmail,
    subject: `New Business Plan Assigned for Review`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Plan Assignment</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #000407;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #EEF6FF 0%, #FAFCFF 100%);
          }
          .email-container {
            background-color: #FFFFFF;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 36, 74, 0.12);
            border: 1px solid #E2E8F0;
          }
          .header {
            background: linear-gradient(135deg, #0556AB 0%, #00244A 100%);
            color: #FAFAFA;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
          }
          .content {
            color: #000407;
            line-height: 1.6;
          }
          .highlight {
            color: #0556AB;
            font-weight: 600;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E2E8F0;
            color: #61758A;
            font-size: 14px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h2 style="margin: 0;">🚗 The bettyesses</h2>
          </div>
          <div class="content">
            <p>Dear <span class="highlight">${consultantName}</span>,</p>
            <p>A new business plan titled <strong class="highlight">${businessTitle}</strong> submitted by <strong>${userName}</strong> has been assigned to you for review.</p>
            <p>Please log in to your consultant dashboard to begin your review.</p>
            <p>Thank you,<br><strong>The bettyesses Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email from bettyesses platform.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
