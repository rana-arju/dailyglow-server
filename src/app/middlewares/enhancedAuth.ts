import { NextFunction, Request, Response } from 'express';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import httpStatus from 'http-status';
import { jwtHelpers } from '../helpers/jwtHelpers';
import prisma from '../lib/prisma';
import { UserStatus } from '@prisma/client';
import ApiError from '../errors/ApiError';

// In-memory token blacklist with automatic cleanup
const tokenBlacklist = new Map<string, number>(); // token -> expiry timestamp

// Clean up expired tokens every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) {
      tokenBlacklist.delete(token);
    }
  }
}, 30 * 60 * 1000);

// Enhanced authentication middleware
const enhancedAuth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const startTime = Date.now();
      const headersAuth = req.headers.authorization;
      const userAgent = req.headers['user-agent'] || 'unknown';
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      
      // Check for proper authorization header format
      if (!headersAuth || !headersAuth.startsWith('Bearer ')) {
        logSecurityEvent('INVALID_AUTH_FORMAT', { ip: clientIP, userAgent, path: req.path });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authorization format!');
      }
      
      const token: string | undefined = headersAuth?.split(' ')[1];
      
      if (!token) {
        logSecurityEvent('MISSING_TOKEN', { ip: clientIP, userAgent, path: req.path });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }
      
      // Check if token is blacklisted
      if (isTokenBlacklisted(token)) {
        logSecurityEvent('BLACKLISTED_TOKEN_USED', { ip: clientIP, userAgent, path: req.path, token: token.substring(0, 10) + '...' });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has been revoked!');
      }
      
      // Verify JWT token with enhanced security
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.access_secret as Secret
      );
      
      if (!verifiedUser?.email || !verifiedUser?.id) {
        logSecurityEvent('INVALID_TOKEN', { ip: clientIP, userAgent, path: req.path, token: token.substring(0, 10) + '...' });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload!');
      }
      
      // Check token freshness (prevent use of old tokens)
      const tokenAge = Date.now() / 1000 - (verifiedUser.iat || 0);
      const maxTokenAge = 24 * 60 * 60; // 24 hours
      
      if (tokenAge > maxTokenAge) {
        logSecurityEvent('EXPIRED_TOKEN_USED', { 
          ip: clientIP, 
          userAgent, 
          path: req.path, 
          tokenAge: Math.round(tokenAge / 3600) + ' hours',
          userId: verifiedUser.id 
        });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Token is too old, please re-authenticate!');
      }
      
      const { id, email } = verifiedUser;
      
      // Fetch user with security checks
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          isDeleted: true,
          updatedAt: true,
        }
      });
      
      if (!user) {
        logSecurityEvent('TOKEN_FOR_NONEXISTENT_USER', { 
          ip: clientIP, 
          userAgent, 
          path: req.path, 
          userId: id,
          email 
        });
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');
      }
      
      // Check if user is deleted
      if (user.isDeleted) {
        logSecurityEvent('DELETED_USER_ACCESS_ATTEMPT', { 
          ip: clientIP, 
          userAgent, 
          path: req.path, 
          userId: id,
          email 
        });
        throw new ApiError(httpStatus.FORBIDDEN, 'Account has been deleted!');
      }
      
      // Check user status
      if (user.status === UserStatus.BLOCKED) {
        logSecurityEvent('BLOCKED_USER_ACCESS_ATTEMPT', { 
          ip: clientIP, 
          userAgent, 
          path: req.path, 
          userId: id,
          email 
        });
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
      }
      
      if (user.status === UserStatus.INACTIVE) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Your account is not activated yet!');
      }
      
      if (user.status === UserStatus.PENDING) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Your account is not accepted yet!');
      }
      
      // Role-based access control
      if (roles.length && !roles.includes(verifiedUser.role)) {
        logSecurityEvent('INSUFFICIENT_PERMISSIONS', { 
          ip: clientIP, 
          userAgent, 
          path: req.path, 
          userId: id,
          email,
          userRole: verifiedUser.role,
          requiredRoles: roles
        });
        throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions!');
      }
      
      // Add user info to request
      req.user = {
        ...verifiedUser,
        ip: clientIP,
        userAgent,
        loginTime: startTime
      } as JwtPayload;
      
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Enhanced OTP check middleware
export const enhancedCheckOTP = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const headersAuth = req.headers.authorization;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    if (!headersAuth || !headersAuth.startsWith('Bearer ')) {
      logSecurityEvent('OTP_INVALID_AUTH_FORMAT', { ip: clientIP, userAgent, path: req.path });
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authorization format!');
    }
    
    const token: string | undefined = headersAuth?.split(' ')[1];
    
    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }
    
    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      logSecurityEvent('OTP_BLACKLISTED_TOKEN_USED', { ip: clientIP, userAgent, path: req.path });
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has been revoked!');
    }
    
    const verifiedUser = jwtHelpers.verifyToken(
      token,
      config.jwt.reset_pass_secret as Secret
    );
    
    if (!verifiedUser?.id) {
      logSecurityEvent('OTP_INVALID_TOKEN', { ip: clientIP, userAgent, path: req.path });
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid reset token!');
    }
    
    const { id } = verifiedUser;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isDeleted: true,
        status: true,
      }
    });
    
    if (!user) {
      logSecurityEvent('OTP_USER_NOT_FOUND', { ip: clientIP, userAgent, path: req.path, userId: id });
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');
    }
    
    if (user.isDeleted) {
      logSecurityEvent('OTP_DELETED_USER', { ip: clientIP, userAgent, path: req.path, userId: id, email: user.email });
      throw new ApiError(httpStatus.FORBIDDEN, 'Account has been deleted!');
    }
    
    req.user = { ...verifiedUser, ip: clientIP, userAgent } as JwtPayload;
    next();
  } catch (err) {
    next(err);
  }
};

// Token blacklisting functions (in-memory)
export const blacklistToken = (token: string): void => {
  try {
    // Decode token to get expiry time
    const decoded = jwtHelpers.verifyToken(token, config.jwt.access_secret as Secret);
    const expiryTime = decoded.exp ? decoded.exp * 1000 : Date.now() + (24 * 60 * 60 * 1000);
    tokenBlacklist.set(token, expiryTime);
  } catch (error) {
    // If token is invalid, still blacklist it for a default time
    tokenBlacklist.set(token, Date.now() + (24 * 60 * 60 * 1000));
  }
};

export const isTokenBlacklisted = (token: string): boolean => {
  const expiry = tokenBlacklist.get(token);
  if (!expiry) return false;
  
  if (expiry < Date.now()) {
    tokenBlacklist.delete(token);
    return false;
  }
  
  return true;
};

// Logout middleware that blacklists the token
export const logout = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      blacklistToken(token);
      logSecurityEvent('USER_LOGOUT', { 
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Security event logging
const logSecurityEvent = (eventType: string, details: Record<string, any>) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    details,
    severity: getSeverityLevel(eventType)
  };
  
  console.warn('Security Event:', logEntry);
  
  // In production, you might want to send this to a security monitoring service
  // or store in a dedicated security logs table
};

const getSeverityLevel = (eventType: string): 'low' | 'medium' | 'high' | 'critical' => {
  const criticalEvents = ['DELETED_USER_ACCESS_ATTEMPT', 'BLOCKED_USER_ACCESS_ATTEMPT', 'TOKEN_FOR_NONEXISTENT_USER'];
  const highEvents = ['BLACKLISTED_TOKEN_USED', 'EXPIRED_TOKEN_USED', 'TOKEN_BEFORE_PASSWORD_CHANGE'];
  const mediumEvents = ['INVALID_TOKEN', 'INSUFFICIENT_PERMISSIONS', 'LOCKED_ACCOUNT_ACCESS_ATTEMPT'];
  
  if (criticalEvents.includes(eventType)) return 'critical';
  if (highEvents.includes(eventType)) return 'high';
  if (mediumEvents.includes(eventType)) return 'medium';
  return 'low';
};

// Cleanup function
export const cleanup = () => {
  tokenBlacklist.clear();
};

export default enhancedAuth;
