import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../../config";
import { v4 as uuidv4 } from 'uuid';

// Security-focused error logging
const logSecurityError = (error: any, req: Request, errorId: string) => {
  const logData = {
    errorId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id,
    errorType: error.constructor.name,
    message: error.message,
    stack: config.env !== 'production' ? error.stack : undefined
  };
  
  console.error('Application Error:', logData);
  
  // In production, you might want to send this to a logging service
  // like CloudWatch, Sentry, or similar
};

import handleClientError from "./handleClientError";

import handleZodError from "./handleZodError";
import { IGenericErrorMessage } from "../interface/error";
import handleValidationError from "./handleValidationError";
import ApiError from "./ApiError";


const GlobalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorId = uuidv4(); // Generate unique error ID for tracking
  let statusCode: any = httpStatus.INTERNAL_SERVER_ERROR;
  let message = error.message || "Something went wrong!";
  let errorMessages: IGenericErrorMessage[] = [];
  let shouldLogError = true;
  
  // Log security-related errors
  if (statusCode >= 400) {
    logSecurityError(error, req, errorId);
  }

  // handle prisma client validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle Zod Validation Errors
  else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle Prisma Client Known Request Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handleClientError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle Custom ApiError
  else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  } 
  
  // Handle Errors
  else if (error instanceof Error) {
    message = error?.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  // Prisma Client Initialization Error
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      "Failed to initialize Prisma Client. Check your database connection or Prisma configuration.";
    errorMessages = [
      {
        path: "",
        message: "Failed to initialize Prisma Client.",
      },
    ];
  }

  // Prisma Client Rust Panic Error
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message =
      "A critical error occurred in the Prisma engine. Please try again later.";
    errorMessages = [
      {
        path: "",
        message: "Prisma Client Rust Panic Error",
      },
    ];
  }

  // Prisma Client Unknown Request Error
  else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unknown error occurred while processing the request.";
    errorMessages = [
      {
        path: "",
        message: "Prisma Client Unknown Request Error",
      },
    ];
  }

  // Generic Error Handling (e.g., JavaScript Errors)
  else if (error instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Syntax error in the request. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Syntax Error",
      },
    ];
  } else if (error instanceof TypeError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Type error in the application. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Type Error",
      },
    ];
  } else if (error instanceof ReferenceError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Reference error in the application. Please verify your input.";
    errorMessages = [
      {
        path: "",
        message: "Reference Error",
      },
    ];
  }
  // Catch any other error type
  else {
    message = "An unexpected error occurred!";
    errorMessages = [
      {
        path: "",
        message: "An unexpected error occurred!",
      },
    ];
  }

  // Prepare response based on environment
  const response: any = {
    success: false,
    message: config.env === 'production' 
      ? sanitizeErrorMessage(message, statusCode) 
      : message,
    errorId,
    timestamp: new Date().toISOString()
  };
  
  // Only include detailed error information in development
  if (config.env !== 'production') {
    response.errorMessages = errorMessages;
    response.stack = error?.stack;
  } else {
    // In production, only include minimal error info to prevent information disclosure
    if (statusCode >= 500) {
      response.message = 'Internal server error. Please contact support.';
    }
  }
  
  // Security headers for error responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  res.status(statusCode).json(response);
};

// Sanitize error messages for production
const sanitizeErrorMessage = (message: string, statusCode: number): string => {
  // Map of safe error messages for production
  const safeMessages: { [key: number]: string } = {
    400: 'Bad request. Please check your input.',
    401: 'Authentication required.',
    403: 'Access denied.',
    404: 'Resource not found.',
    409: 'Conflict occurred.',
    422: 'Invalid input data.',
    429: 'Too many requests. Please try again later.',
    500: 'Internal server error.',
    502: 'Service temporarily unavailable.',
    503: 'Service unavailable.',
  };
  
  return safeMessages[statusCode] || 'An error occurred.';
};

export default GlobalErrorHandler;
