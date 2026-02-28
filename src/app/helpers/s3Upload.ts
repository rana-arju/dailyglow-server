import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import config from '../../config';

// Initialize S3 Client
const s3Client = new S3Client({
  region: config.aws.region || 'us-east-1',
  credentials: {
    accessKeyId: config.aws.accessKeyId || '',
    secretAccessKey: config.aws.secretAccessKey || '',
  },
});

interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload file to S3 bucket
 * @param filePath - Local file path
 * @param key - S3 object key (file name in bucket)
 * @param bucketName - S3 bucket name
 * @returns Upload result with URL
 */
export const uploadToS3 = async (
  filePath: string,
  key: string,
  bucketName: string
): Promise<UploadResult> => {
  try {
    // Read file from local storage
    const fileContent = fs.readFileSync(filePath);
    
    // Get file extension and set content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      // ACL removed - bucket has ACLs disabled, use bucket policy instead
    });

    await s3Client.send(command);

    // Construct S3 URL
    const s3Url = `https://${bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

    return {
      success: true,
      url: s3Url,
      key: key,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload to S3',
    };
  }
};

/**
 * Delete file from S3 bucket
 * @param key - S3 object key
 * @param bucketName - S3 bucket name
 * @returns Deletion result
 */
export const deleteFromS3 = async (
  key: string,
  bucketName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete from S3',
    };
  }
};

/**
 * Upload file to S3 and delete local file
 * @param localFilePath - Local file path
 * @param s3Key - S3 object key
 * @param bucketName - S3 bucket name
 * @returns Upload result
 */
export const uploadAndCleanup = async (
  localFilePath: string,
  s3Key: string,
  bucketName: string
): Promise<UploadResult> => {
  try {
    // Upload to S3
    const uploadResult = await uploadToS3(localFilePath, s3Key, bucketName);

    if (uploadResult.success) {
      // Delete local file after successful upload
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (deleteError: any) {
        // Don't fail the upload if local deletion fails
      }
    }

    return uploadResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload and cleanup',
    };
  }
};

/**
 * Extract S3 key from S3 URL
 * @param s3Url - Full S3 URL
 * @returns S3 key or null
 */
export const extractS3Key = (s3Url: string): string | null => {
  try {
    // Handle different S3 URL formats
    // Format 1: https://bucket-name.s3.region.amazonaws.com/key
    // Format 2: https://s3.region.amazonaws.com/bucket-name/key
    
    const url = new URL(s3Url);
    const pathname = url.pathname;
    
    // Remove leading slash and return the key
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  } catch (error) {
    return null;
  }
};

export default {
  uploadToS3,
  deleteFromS3,
  uploadAndCleanup,
  extractS3Key,
};
