import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || '12',
  otp_expiry_time: process.env.OTP_ACCESS_EXPIRES_IN || '5',
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,

    reset_pass_secret: process.env.JWT_RESET_PASS_SECRET,
    reset_pass_token_expires_in: process.env.JWT_RESET_PASS_EXPIRES_IN,
    store_address_token_expires_in: process.env.JWT_STORE_ADDRESS_EXPIRES_IN,
  },
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.EMAIL_PASSWORD,
    contact_mail_address: process.env.CONTACT_MAIL_ADDRESS,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  stripe_secret: process.env.STRIPE_SECRET_KEY,
  webhooks_secret: process.env.WEBHOOK_SECRET_KEY,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // redirectUri: process.env.GOOGLE_REDIRECT_URI,
    // serviceAccount: {
    //   type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE || "service_account",
    //   projectId: process.env.GOOGLE_PROJECT_ID,
    //   privateKeyId: process.env.GOOGLE_PRIVATE_KEY_ID,
    //   privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    //   clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    //   clientId: process.env.GOOGLE_SERVICE_CLIENT_ID,
    //   authUri:
    //     process.env.GOOGLE_AUTH_URI ||
    //     "https://accounts.google.com/o/oauth2/auth",
    //   tokenUri:
    //     process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    //   authProviderX509CertUrl:
    //     process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL ||
    //     "https://www.googleapis.com/oauth2/v1/certs",
    //   clientX509CertUrl: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    // },
  },
  authentica: {
    apiKey: process.env.AUTHENTICA_API_KEY,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    fromEmail: process.env.AWS_FROM_EMAIL,
    s3Bucket: process.env.AWS_S3_BUCKET_NAME,
  },
  steadfast: {
    apiKey: process.env.STEADFAST_API_KEY,
    secretKey: process.env.STEADFAST_SECRET_KEY,
    baseUrl: process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1',
    webhookSecret: process.env.STEADFAST_WEBHOOK_SECRET,
  },
  appUrl:  'http://localhost:3002',
};
