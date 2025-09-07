import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorsMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Set CORS headers
      const origin = req.headers.origin;
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://soukel-syarat.com',
        'https://www.soukel-syarat.com'
      ];

      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      this.logger.debug('CORS headers applied to request');
      next();

    } catch (error) {
      this.logger.error('Error applying CORS headers:', error);
      next();
    }
  }
}