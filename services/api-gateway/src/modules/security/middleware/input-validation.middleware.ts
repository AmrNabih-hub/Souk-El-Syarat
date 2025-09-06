import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class InputValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(InputValidationMiddleware.name);

  constructor() {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Basic input validation
      const validationResult = this.validateRequest(req);
      
      if (!validationResult.isValid) {
        this.logger.warn(`Input validation failed: ${validationResult.reason}`);

        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid request detected',
            error: 'Bad Request',
            details: validationResult.reason
          },
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.debug('Input validation passed for request');
      next();

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error in input validation middleware:', error);
      next();
    }
  }

  private validateRequest(req: Request): { isValid: boolean; reason?: string } {
    try {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi, // XSS
        /union\s+select/gi, // SQL injection
        /drop\s+table/gi, // SQL injection
        /javascript:/gi, // JavaScript injection
        /vbscript:/gi, // VBScript injection
        /onload\s*=/gi, // Event handler injection
        /onerror\s*=/gi, // Event handler injection
      ];

      const requestString = JSON.stringify({
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
      });

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(requestString)) {
          return { isValid: false, reason: 'Suspicious pattern detected' };
        }
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating request:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }
}