/**
 * 🛡️ SECURITY MIDDLEWARE
 * Enterprise-grade security middleware for Souk El-Sayarat
 */

import { sanitizeInput, escapeHtml, generateCSRFToken, RateLimiter } from '@/utils/security';
import { Request, Response, NextFunction } from 'express';

// Global rate limiter instance
const globalRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Security middleware for API calls
export const securityMiddleware = {
  // Rate limiting middleware
  rateLimit: (identifier: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!globalRateLimiter.isAllowed(identifier)) {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        });
        return;
      }
      next();
    };
  },

  // Input sanitization middleware
  sanitizeInput: (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const sanitizedBody = sanitizeRequestBody(req.body);
      req.body = sanitizedBody;
    }
    next();
  },

  // XSS protection middleware
  xssProtection: (req: Request, res: Response, next: NextFunction) => {
    // Set XSS protection headers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },

  // CSRF protection middleware
  csrfProtection: (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      const csrfToken = req.headers['x-csrf-token'];
      const sessionToken = req.headers['x-session-token'];

      if (!csrfToken || !sessionToken) {
        res.status(403).json({
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request.',
        });
        return;
      }

      // Validate CSRF token (in real implementation, this would check against stored token)
      if (!validateCSRFToken(csrfToken as string, sessionToken as string)) {
        res.status(403).json({
          error: 'Invalid CSRF token',
          message: 'CSRF token validation failed.',
        });
        return;
      }
    }
    next();
  },
};

// Helper function to sanitize request body
const sanitizeRequestBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// CSRF token validation (simplified for demo)
const validateCSRFToken = (csrfToken: string, sessionToken: string): boolean => {
  // In a real implementation, this would:
  // 1. Validate the session token
  // 2. Retrieve the stored CSRF token for that session
  // 3. Compare the tokens
  return csrfToken.length === 64 && sessionToken.length > 0;
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Set CSP header
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.souk-el-sayarat.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspHeader);

  next();
};

// Authentication middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required.',
    });
    return;
  }

  const token = authHeader.substring(7);

  // In a real implementation, this would validate the JWT token
  if (!validateJWTToken(token)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token.',
    });
    return;
  }

  next();
};

// JWT token validation (simplified for demo)
const validateJWTToken = (token: string): boolean => {
  // In a real implementation, this would:
  // 1. Verify the JWT signature
  // 2. Check token expiration
  // 3. Validate token claims
  return token.length > 0;
};

// Admin role middleware
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.headers['x-user-role'];

  if (userRole !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required.',
    });
    return;
  }

  next();
};

// Vendor role middleware
export const vendorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.headers['x-user-role'];

  if (!['admin', 'vendor'].includes(userRole as string)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Vendor access required.',
    });
    return;
  }

  next();
};

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Security middleware error:', error);

  // Don't expose internal errors to client
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.',
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    };

    // Log security-relevant events
    if (res.statusCode >= 400) {
      console.warn('🔒 Security Event:', logData);
    }
  });

  next();
};
