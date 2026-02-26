import config from './index';

export const securityConfig = {
  // Rate limiting configuration
  rateLimiting: {
    // General API rate limiting
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
    },

    // Authentication endpoints (more strict)
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 auth attempts per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
    },

    // Login specific (very strict)
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 login attempts per windowMs
      message: {
        error: 'Too many login attempts, please try again later.',
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful requests
    },

    // Password reset (strict)
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // Limit each IP to 3 password reset attempts per hour
      message: {
        error: 'Too many password reset attempts, please try again later.',
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
    },
  },

  // Slow down configuration (progressive delays)
  slowDown: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 5, // Allow 5 requests per windowMs without delay
    delayMs: (used: number) => (used - 5) * 100, // Add 100ms delay per request after 5th
    maxDelayMs: 5000, // Maximum delay of 5 seconds
  },

  // Request size limits
  requestLimits: {
    jsonLimit: '20mb',
    urlEncodedLimit: '20mb',
    fileUploadLimit: '20mb',
  },

  // Security headers configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable if you need to load external resources
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  },

  // CORS configuration
  cors: {
    origin: function (origin: any, callback: any) {
      const allowedOrigins = [
        'http://206.162.244.131:3002',
        'http://206.162.244.131:3031',
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3031',
        // Add production URLs here
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // For development, log and allow - for production, reject
        callback(null, true); // Change to callback(new Error('Not allowed by CORS')) in production
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // JWT security settings
  jwt: {
    algorithms: ['HS256'],
    issuer: 'bettyesses-server',
    audience: 'bettyesses-app',
    clockTolerance: 10, // 10 seconds clock skew tolerance
    maxAge: config.jwt.access_expires_in,
  },

  // Session security
  session: {
    name: 'sessionId', // Don't use default session name
    secret: config.jwt.access_secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.env === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' as const,
    },
  },
};

export default securityConfig;
