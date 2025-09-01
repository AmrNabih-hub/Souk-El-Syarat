/**
 * Advanced Security Middleware Suite
 * Based on OWASP Top 10 (2025) and Latest Security Standards
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import crypto from 'crypto';

/**
 * Rate Limiting Configuration
 * Implements adaptive rate limiting based on user behavior
 */
export const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const rateLimitInfo = (req as any).rateLimit;
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitInfo?.resetTime,
        limit: rateLimitInfo?.limit,
        remaining: rateLimitInfo?.remaining,
        reset: new Date(rateLimitInfo?.resetTime || Date.now()).toISOString()
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    },
    keyGenerator: (req: Request) => {
      // Use combination of IP and user ID if authenticated
      const userId = (req as any).user?.uid;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return userId ? `${ip}:${userId}` : ip;
    }
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per window for sensitive operations
  message: 'Too many attempts. Please try again later.'
});

/**
 * API Key validation for partner integrations
 */
export const apiKeyValidator = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return next(); // API key is optional
  }

  // Validate API key format (UUID v4)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key format',
      code: 'auth/invalid-api-key'
    });
  }

  // In production, validate against database
  // For now, we'll accept valid format
  (req as any).apiKey = apiKey;
  next();
};

/**
 * Request signing validation for high-security operations
 */
export const requestSignatureValidator = (secret: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    
    if (!signature || !timestamp) {
      return res.status(401).json({
        error: 'Missing request signature',
        code: 'auth/missing-signature'
      });
    }

    // Check timestamp is within 5 minutes
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
      return res.status(401).json({
        error: 'Request timestamp expired',
        code: 'auth/timestamp-expired'
      });
    }

    // Verify signature
    const payload = `${req.method}:${req.path}:${timestamp}:${JSON.stringify(req.body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({
        error: 'Invalid request signature',
        code: 'auth/invalid-signature'
      });
    }

    next();
  };
};

/**
 * Input sanitization middleware
 */
export const inputSanitizer = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query as any);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Deep sanitization function
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Remove potential XSS vectors
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Security headers using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com"
      ],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

/**
 * MongoDB injection prevention
 */
export const mongoSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }: any) => {
    console.warn(`Potential MongoDB injection attempt blocked: ${key}`);
  }
});

/**
 * HTTP Parameter Pollution prevention
 */
export const parameterPollutionPrevention = hpp({
  whitelist: ['sort', 'filter', 'page', 'limit'] // Allow these parameters to have arrays
});

/**
 * Request size limits
 */
export const requestSizeLimiter = {
  json: '10mb',
  urlencoded: { extended: true, limit: '10mb' },
  raw: '10mb',
  text: '10mb'
};

/**
 * Security audit logger
 */
export const securityAuditLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log security-relevant information
  const auditLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.uid,
    apiKey: (req as any).apiKey,
    origin: req.headers.origin,
    referer: req.headers.referer
  };

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const completeLog = {
      ...auditLog,
      statusCode: res.statusCode,
      duration,
      suspicious: res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429
    };

    if (completeLog.suspicious) {
      console.warn('Security audit:', completeLog);
    }
  });

  next();
};

/**
 * Combined security middleware
 */
export const applySecurity = (app: any) => {
  // Apply all security middlewares in order
  app.use(securityHeaders);
  app.use(mongoSanitizer);
  app.use(parameterPollutionPrevention);
  app.use(inputSanitizer);
  app.use(apiKeyValidator);
  app.use(securityAuditLogger);
  
  // Apply rate limiting
  app.use('/api/', createRateLimiter());
  app.use('/api/auth/', strictRateLimiter);
  app.use('/api/orders/', strictRateLimiter);
  
  return app;
};