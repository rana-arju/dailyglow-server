import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import globalErrorHandler from './app/errors/globalErrorHandler';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import router from './app/routes';

// Security middleware imports
import {
  securityHeaders,
  parameterPollutionProtection,
  mongoSanitization,
  xssProtection,
  compressionMiddleware,
  requestSizeLimit,
  apiSecurityHeaders,
  securityLogger,
  validateContentType,
} from './app/middlewares/security';
import { generalRateLimit, speedLimiter } from './app/middlewares/rateLimiter';
import securityConfig from './config/security';
import handleMulterError from './app/middlewares/multerErrorHandler';

const app: Application = express();

// Trust proxy (for proper IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Security headers (should be first)
app.use(securityHeaders);

// Request logging for security events
app.use(securityLogger);

// Compression middleware
app.use(compressionMiddleware);

// Rate limiting
// app.use(generalRateLimit);
// app.use(speedLimiter);

// Request size limiting
app.use(requestSizeLimit);

// Static file serving with CORS for uploads (before other middleware)
app.use(
  '/uploads',
  cors({
    origin: function (origin: any, callback: any) {
      const allowedOrigins = [
        'http://206.162.244.131:3002',
        'http://localhost:3002',
        'http://localhost:3031',
        'http://localhost:3000',
        'http://206.162.244.131:3031',
        // Add more frontend origins as needed
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins for static files
      }
    },
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
  }),
  express.static(path.join(__dirname, '..', 'public', 'uploads'), {
    setHeaders: (res, path) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    },
  })
);

// Serve static chart files with CORS
app.use(
  '/charts',
  cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
  }),
  express.static(path.join(__dirname, '../assets/charts'), {
    setHeaders: (res, path) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  })
);

// CORS with enhanced security for API routes
app.use(cors(securityConfig.cors));

// Parameter pollution protection
app.use(parameterPollutionProtection);

// MongoDB injection protection
app.use(mongoSanitization);

// Content-Type validation for POST/PUT requests
app.use(validateContentType(['application/json', 'multipart/form-data']));

// API security headers
app.use(apiSecurityHeaders);

//parser with size limits
app.use(express.json({ limit: securityConfig.requestLimits.jsonLimit }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: securityConfig.requestLimits.urlEncodedLimit }));

// XSS protection (after parsing)
app.use(xssProtection);

app.get('/', (req: Request, res: Response) => {
  res.send({
    success: true,
    Message: 'Daily Glow Server is running...',
    data: {
      Developer: 'Rana Arju',
      version: 1.0,
    },
  });
});

app.use(morgan('dev'));

app.use('/api/v1', router);

// Handle multer errors specifically
app.use(handleMulterError);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
});

export default app;
