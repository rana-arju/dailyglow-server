import config from '../../../config';
import prisma from '../../lib/prisma';
import sentEmailUtility from '../../utils/sentEmailUtility';

export const OTPFn = async (email: string, userId: string, emailSubject: string, emailTemplate: any) => {
  const OTP_EXPIRY_TIME = Number(config.otp_expiry_time) * 60 * 1000;
  const expiry = new Date(Date.now() + OTP_EXPIRY_TIME);
  const otpCode = Math.floor(100000 + Math.random() * 900000);
  const emailHTML = emailTemplate(otpCode);
  await sentEmailUtility(email, emailSubject, emailHTML);

  const existingOtp = await prisma.oTP.findFirst({
    where: { userId },
  });
  
  if (existingOtp) {
    await prisma.oTP.update({
      where: {
        id: existingOtp.id,
      },
      data: {
        otpCode: otpCode.toString(),
        userId,
        expiry,
      },
    });
  } else {
    await prisma.oTP.create({
      data: {
        otpCode: otpCode.toString(),
        userId,
        expiry,
      },
    });
  }
  return;
};
