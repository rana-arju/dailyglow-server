import config from '../../config';

const nodemailer = require('nodemailer');
const smtpTransporter = require('nodemailer-smtp-transport');

let sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailHTML?: string, // HTML content as a parameter
  EmailText?: string
) => {
 const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',
   port: 587,
   secure: false,
   auth: {
     user: config.emailSender.email,
     pass: config.emailSender.app_pass,
   },
 });

  let mailOption = {
    from: config.emailSender.email,
    to: emailTo,
    subject: EmailSubject,
    text: EmailText,
    html: EmailHTML,
  };

  return await transporter.sendMail(mailOption);
};

export default sentEmailUtility;
