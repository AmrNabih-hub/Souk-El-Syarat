import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitingMiddleware.name);
  private readonly rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  constructor() {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const identifier = this.getIdentifier(req);
      const endpoint = this.getEndpoint(req);
      
      // Check rate limit
      const rateLimitResult = await this.checkRateLimit(identifier, endpoint);
      
      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        this.logger.warn(`Rate limit exceeded for ${identifier} on ${endpoint}`);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', '100');
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
        res.setHeader('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000));

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded. Please try again later.',
            error: 'Too Many Requests',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

      this.logger.debug(`Rate limit check passed for ${identifier} on ${endpoint}`);
      next();

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error in rate limiting middleware:', error);
      next();
    }
  }

  private getIdentifier(req: Request): string {
    // Use IP address as primary identifier
    // In a real implementation, you might also consider user ID if authenticated
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private getEndpoint(req: Request): string {
    // Group endpoints by pattern to avoid too many rate limit keys
    const path = req.path;
    
    // Auth endpoints
    if (path.startsWith('/auth/')) {
      return '/auth/*';
    }
    
    // API endpoints
    if (path.startsWith('/api/')) {
      return '/api/*';
    }
    
    // Test endpoints
    if (path.startsWith('/test/')) {
      return '/test/*';
    }
    
    // Health check
    if (path === '/health') {
      return '/health';
    }
    
    // Default to the actual path
    return path;
  }

  private async checkRateLimit(identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    const current = this.rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or create new entry
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }

    // Increment count
    current.count++;
    this.rateLimitStore.set(key, current);

    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  // Clean up old entries periodically
  private cleanupOldEntries(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (now > value.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}