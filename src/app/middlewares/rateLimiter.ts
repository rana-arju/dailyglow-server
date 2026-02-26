import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import securityConfig from '../../config/security';



// General API rate limiter (uses default IP handling)
export const generalRateLimit = rateLimit({
  ...securityConfig.rateLimiting.general,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: securityConfig.rateLimiting.general.message.error,
      error: {
        type: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(securityConfig.rateLimiting.general.windowMs / 1000),
      }
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  }
});

// Authentication endpoints rate limiter (uses default IP handling)
export const authRateLimit = rateLimit({
  ...securityConfig.rateLimiting.auth,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: securityConfig.rateLimiting.auth.message.error,
      error: {
        type: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(securityConfig.rateLimiting.auth.windowMs / 1000),
      }
    });
  }
});

// Login specific rate limiter (uses default IP handling)
export const loginRateLimit = rateLimit({
  ...securityConfig.rateLimiting.login,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: securityConfig.rateLimiting.login.message.error,
      error: {
        type: 'LOGIN_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(securityConfig.rateLimiting.login.windowMs / 1000),
        hint: 'Too many failed login attempts. Please try again later or reset your password.'
      }
    });
  }
});

// Password reset rate limiter (uses default IP handling)
export const passwordResetRateLimit = rateLimit({
  ...securityConfig.rateLimiting.passwordReset,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: securityConfig.rateLimiting.passwordReset.message.error,
      error: {
        type: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(securityConfig.rateLimiting.passwordReset.windowMs / 1000),
      }
    });
  }
});

// Slow down middleware for progressive delays (uses default IP handling)
export const speedLimiter = slowDown({
  ...securityConfig.slowDown
});

// OTP request rate limiter (uses default IP handling)
export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Allow only 3 OTP requests per 5 minutes
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests. Please wait before requesting another.',
      error: {
        type: 'OTP_RATE_LIMIT_EXCEEDED',
        retryAfter: 300, // 5 minutes in seconds
      }
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter (uses default IP handling)
export const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 file uploads per hour
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'File upload limit exceeded. Please try again later.',
      error: {
        type: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED',
        retryAfter: 3600,
      }
    });
  },
  skip: (req: Request) => {
    // Skip for small files or specific endpoints
    const contentLength = req.headers['content-length'];
    return !!(contentLength && parseInt(contentLength) < 1024 * 1024); // Skip for files < 1MB
  }
});

// Admin endpoints rate limiter (uses default IP handling)
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Higher limit for admin operations
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Admin rate limit exceeded. Please try again later.',
      error: {
        type: 'ADMIN_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(15 * 60), // 15 minutes
      }
    });
  }
});

// For authenticated endpoints that need user-specific rate limiting
// Only use custom keyGenerator for authenticated users (not IP-based)
export const authenticatedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes for authenticated users
  keyGenerator: (req: Request): string => {
    const userId = (req as any).user?.id;
    // Only use user ID for authenticated users
    return userId ? `user:${userId}` : 'anonymous';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this user. Please try again later.',
      error: {
        type: 'AUTHENTICATED_RATE_LIMIT_EXCEEDED',
        retryAfter: 900, // 15 minutes
      }
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Cleanup function for graceful shutdown
export const cleanup = () => {
  console.log('Rate limiter cleanup completed');
};

// Export all rate limiters
export default {
  general: generalRateLimit,
  auth: authRateLimit,
  login: loginRateLimit,
  passwordReset: passwordResetRateLimit,
  speed: speedLimiter,
  otp: otpRateLimit,
  fileUpload: fileUploadRateLimit,
  admin: adminRateLimit,
  authenticated: authenticatedRateLimit,
  cleanup
};
