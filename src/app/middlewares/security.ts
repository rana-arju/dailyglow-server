import helmet from 'helmet';
import xss from 'xss';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import securityConfig from '../../config/security';
import config from '../../config';

// Configure Helmet for security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Skip restrictive headers for static file serving
  if (req.path.startsWith('/uploads/') || req.path.startsWith('/charts/')) {
    // Only apply basic security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    return next();
  }
  
  // Apply full helmet configuration for other routes
  return helmet({
    ...securityConfig.helmet,
    // Only enable HTTPS in production
    hsts: config.env === 'production' ? securityConfig.helmet.hsts : false,
    // Configure CSP based on environment
    contentSecurityPolicy: config.env === 'production' ? securityConfig.helmet.contentSecurityPolicy : false
  })(req, res, next);
};

// HTTP Parameter Pollution protection
export const parameterPollutionProtection = hpp({
  whitelist: [
    'tags', // Allow multiple tags
    'categories', // Allow multiple categories
    'ids', // Allow multiple IDs
    'types' // Allow multiple types
  ]
});

// MongoDB injection protection
export const mongoSanitization = mongoSanitize({
  onSanitize: ({ req, key }: { req: Request, key: string }) => {
    console.warn(`MongoDB injection attempt detected: ${key} from ${req.ip}`);
  },
});

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Helper function to recursively sanitize objects
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return xss(obj, {
      whiteList: {
        // Allow basic formatting tags if needed
        strong: [],
        b: [],
        em: [],
        i: [],
        u: [],
        br: [],
        p: [],
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    });
  }
  
  return obj;
};

// Content compression middleware
export const compressionMiddleware = compression({
  // Only compress responses larger than 1kb
  threshold: 1024,
  // Compression level (1-9, 6 is default)
  level: 6,
  // Don't compress if client doesn't support it
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// Request size limiting middleware
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.headers['content-length'];
  
  if (contentLength) {
    const size = parseInt(contentLength);
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    if (size > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        error: {
          type: 'PAYLOAD_TOO_LARGE',
          maxSize: `${maxSize / (1024 * 1024)}MB`,
          receivedSize: `${Math.round(size / (1024 * 1024) * 100) / 100}MB`
        }
      });
    }
  }
  
  next();
};

// Security headers for API responses
export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
  
  // Cache control for sensitive endpoints
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// Generate unique request ID
const generateRequestId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// File upload security middleware
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] | undefined;
  
  if (files && files.length > 0) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    
    for (const file of files) {
      // Check file type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type ${file.mimetype} is not allowed`,
          error: {
            type: 'INVALID_FILE_TYPE',
            allowedTypes: allowedMimeTypes
          }
        });
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        return res.status(413).json({
          success: false,
          message: 'File too large',
          error: {
            type: 'FILE_TOO_LARGE',
            maxSize: `${maxFileSize / (1024 * 1024)}MB`,
            receivedSize: `${Math.round(file.size / (1024 * 1024) * 100) / 100}MB`
          }
        });
      }
      
      // Basic file name sanitization
      file.originalname = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    }
  }
  
  next();
};

// IP whitelist middleware (for admin or sensitive endpoints)
export const ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (config.env === 'development') {
      return next(); // Skip IP whitelist in development
    }
    
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP || '')) {
      console.warn(`Access denied for IP: ${clientIP} on ${req.path}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: {
          type: 'IP_NOT_WHITELISTED'
        }
      });
    }
    
    next();
  };
};

// Request logging for security events
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };
    
    // Log suspicious requests
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('Security event:', logData);
    }
  });
  
  next();
};

// Content-Type validation middleware
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next(); // Skip validation for GET and DELETE
    }
    
    const contentType = req.headers['content-type'];
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type header is required',
        error: {
          type: 'MISSING_CONTENT_TYPE'
        }
      });
    }
    
    const isValidType = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (!isValidType) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported Media Type',
        error: {
          type: 'UNSUPPORTED_MEDIA_TYPE',
          received: contentType,
          allowed: allowedTypes
        }
      });
    }
    
    next();
  };
};

export default {
  securityHeaders,
  parameterPollutionProtection,
  mongoSanitization,
  xssProtection,
  compressionMiddleware,
  requestSizeLimit,
  apiSecurityHeaders,
  fileUploadSecurity,
  ipWhitelist,
  securityLogger,
  validateContentType
};
