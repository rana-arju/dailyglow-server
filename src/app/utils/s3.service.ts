import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../../config';
import fs from 'fs';

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId as string,
    secretAccessKey: config.aws.secretAccessKey as string,
  },
});

/**
 * Upload a file to AWS S3
 * @param filePath Local path of the file to upload
 * @param key S3 key (identifier) for the file
 * @returns S3 URL of the uploaded file
 */
export const uploadToS3 = async (filePath: string, key: string): Promise<string> => {
  const fileStream = fs.createReadStream(filePath);
  
  const command = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
    Body: fileStream,
  });

  try {
    await s3Client.send(command);
    return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw error;
  }
};
