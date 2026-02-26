import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Multer error handler middleware
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          message: 'File too large',
          error: {
            type: 'FILE_TOO_LARGE',
            code: err.code,
            maxSize: '20MB',
            message: 'File size cannot exceed 20MB'
          }
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files',
          error: {
            type: 'TOO_MANY_FILES',
            code: err.code,
            maxFiles: 10,
            message: 'Cannot upload more than 10 files at once'
          }
        });
      
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many fields',
          error: {
            type: 'TOO_MANY_FIELDS',
            code: err.code,
            maxFields: 50,
            message: 'Request contains too many fields'
          }
        });
      
      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          success: false,
          message: 'Field name too long',
          error: {
            type: 'FIELD_NAME_TOO_LONG',
            code: err.code,
            message: 'Field name is too long'
          }
        });
      
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          message: 'Field value too large',
          error: {
            type: 'FIELD_VALUE_TOO_LARGE',
            code: err.code,
            maxSize: '20MB',
            message: 'Field value cannot exceed 20MB'
          }
        });
      
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many parts',
          error: {
            type: 'TOO_MANY_PARTS',
            code: err.code,
            maxParts: 60,
            message: 'Request contains too many parts (files + fields)'
          }
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field',
          error: {
            type: 'UNEXPECTED_FILE_FIELD',
            code: err.code,
            field: err.field,
            message: `Unexpected file field: ${err.field}`
          }
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: {
            type: 'MULTER_ERROR',
            code: err.code,
            message: err.message
          }
        });
    }
  }
  
  // Handle custom file filter errors
  if (err.message && err.message.includes('File type') && err.message.includes('is not allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: {
        type: 'INVALID_FILE_TYPE',
        message: err.message
      }
    });
  }
  
  // Pass other errors to the next error handler
  next(err);
};

export default handleMulterError;