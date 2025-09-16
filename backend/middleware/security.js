const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const winston = require('winston');

// Security logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log', level: 'warn' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Rate limiting configurations
const createRateLimiters = () => ({
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 900
      });
    }
  }),

  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // limit auth attempts
    skipSuccessfulRequests: true,
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    handler: (req, res) => {
      securityLogger.warn('Auth rate limit exceeded', {
        ip: req.ip,
        email: req.body.email,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: 'Too many authentication attempts',
        retryAfter: 900
      });
    }
  }),

  api: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute for API
    message: {
      error: 'API rate limit exceeded',
      retryAfter: '1 minute'
    }
  })
});

// CORS configuration
const createCorsConfig = () => ({
  development: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma'
    ]
  },
  production: {
    origin: [
      'https://souk-el-syarat.web.app',
      'https://souk-el-sayarat.com',
      'https://www.souk-el-sayarat.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma'
    ]
  }
});

// Helmet security configuration
const createHelmetConfig = () => ({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "http:",
        "https://firebasestorage.googleapis.com",
        "https://storage.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://www.gstatic.com",
        "https://www.google.com",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'",
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://firebaseinstallations.googleapis.com",
        "https://securetoken.googleapis.com"
      ],
      frameSrc: [
        "'self'",
        "https://www.google.com"
      ]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Input validation middleware
const validateInput = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    securityLogger.warn('Input validation failed', {
      ip: req.ip,
      url: req.originalUrl,
      error: error.details[0].message,
      body: req.body
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('content-length')
    };

    if (res.statusCode >= 400) {
      securityLogger.warn('Request failed', logData);
    } else {
      securityLogger.info('Request completed', logData);
    }
  });
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  securityLogger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Not found middleware
const notFoundHandler = (req, res) => {
  securityLogger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
};

module.exports = {
  createRateLimiters,
  createCorsConfig,
  createHelmetConfig,
  validateInput,
  securityHeaders,
  requestLogger,
  errorHandler,
  notFoundHandler,
  securityLogger
};