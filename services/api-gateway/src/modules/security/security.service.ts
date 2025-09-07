import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityMonitoringService } from './security-monitoring.service';

export interface SecurityConfig {
  enableHelmet: boolean;
  enableCORS: boolean;
  enableRateLimiting: boolean;
  enableInputValidation: boolean;
  enableSecurityMonitoring: boolean;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  maxRequestSize: string;
  allowedFileTypes: string[];
  maxFileSize: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'rate_limit' | 'suspicious_request' | 'malicious_input' | 'unauthorized_access' | 'security_headers';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: {
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    reason?: string;
    action?: string;
  };
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly securityConfig: SecurityConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly securityMonitoringService: SecurityMonitoringService,
  ) {
    this.securityConfig = this.loadSecurityConfig();
    this.logger.log('Security Service initialized');
  }

  private loadSecurityConfig(): SecurityConfig {
    return {
      enableHelmet: this.configService.get<boolean>('SECURITY_ENABLE_HELMET', true),
      enableCORS: this.configService.get<boolean>('SECURITY_ENABLE_CORS', true),
      enableRateLimiting: this.configService.get<boolean>('SECURITY_ENABLE_RATE_LIMITING', true),
      enableInputValidation: this.configService.get<boolean>('SECURITY_ENABLE_INPUT_VALIDATION', true),
      enableSecurityMonitoring: this.configService.get<boolean>('SECURITY_ENABLE_MONITORING', true),
      corsOrigins: this.configService.get<string[]>('CORS_ORIGINS', ['http://localhost:3000']),
      rateLimitWindowMs: this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 60000),
      rateLimitMaxRequests: this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
      maxRequestSize: this.configService.get<string>('MAX_REQUEST_SIZE', '10mb'),
      allowedFileTypes: this.configService.get<string[]>('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']),
      maxFileSize: this.configService.get<number>('MAX_FILE_SIZE', 5 * 1024 * 1024), // 5MB
    };
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  async validateRequest(req: any): Promise<{ isValid: boolean; reason?: string; action?: string }> {
    try {
      // Check request size
      if (req.headers['content-length'] && parseInt(req.headers['content-length']) > this.parseSize(this.securityConfig.maxRequestSize)) {
        await this.logSecurityEvent({
          type: 'suspicious_request',
          severity: 'medium',
          source: 'request_validation',
          details: {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            endpoint: req.path,
            method: req.method,
            reason: 'Request size exceeds limit',
            action: 'reject'
          }
        });
        return { isValid: false, reason: 'Request size exceeds limit', action: 'reject' };
      }

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
          await this.logSecurityEvent({
            type: 'malicious_input',
            severity: 'high',
            source: 'request_validation',
            details: {
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              endpoint: req.path,
              method: req.method,
              reason: 'Suspicious pattern detected',
              action: 'block'
            }
          });
          return { isValid: false, reason: 'Suspicious pattern detected', action: 'block' };
        }
      }

      // Check for missing security headers
      const requiredHeaders = ['user-agent'];
      for (const header of requiredHeaders) {
        if (!req.headers[header]) {
          await this.logSecurityEvent({
            type: 'suspicious_request',
            severity: 'low',
            source: 'request_validation',
            details: {
              ip: req.ip,
              endpoint: req.path,
              method: req.method,
              reason: `Missing required header: ${header}`,
              action: 'warn'
            }
          });
        }
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating request:', error);
      return { isValid: false, reason: 'Validation error', action: 'reject' };
    }
  }

  async validateFileUpload(file: any): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Check file size
      if (file.size > this.securityConfig.maxFileSize) {
        await this.logSecurityEvent({
          type: 'suspicious_request',
          severity: 'medium',
          source: 'file_validation',
          details: {
            reason: 'File size exceeds limit',
            action: 'reject'
          }
        });
        return { isValid: false, reason: 'File size exceeds limit' };
      }

      // Check file type
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension || !this.securityConfig.allowedFileTypes.includes(fileExtension)) {
        await this.logSecurityEvent({
          type: 'malicious_input',
          severity: 'high',
          source: 'file_validation',
          details: {
            reason: 'File type not allowed',
            action: 'block'
          }
        });
        return { isValid: false, reason: 'File type not allowed' };
      }

      // Check for dangerous file names
      const dangerousPatterns = [
        /\.\./, // Path traversal
        /[<>:"|?*]/, // Invalid characters
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(file.originalname)) {
          await this.logSecurityEvent({
            type: 'malicious_input',
            severity: 'high',
            source: 'file_validation',
            details: {
              reason: 'Dangerous file name detected',
              action: 'block'
            }
          });
          return { isValid: false, reason: 'Dangerous file name detected' };
        }
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating file upload:', error);
      return { isValid: false, reason: 'File validation error' };
    }
  }

  async checkRateLimit(identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      // This would integrate with Redis for actual rate limiting
      // For now, we'll simulate the behavior
      const key = `rate_limit:${identifier}:${endpoint}`;
      const windowMs = this.securityConfig.rateLimitWindowMs;
      const maxRequests = this.securityConfig.rateLimitMaxRequests;

      // In a real implementation, this would check Redis
      // For now, we'll return a mock response
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowMs
      };
    } catch (error) {
      this.logger.error('Error checking rate limit:', error);
      return { allowed: false, remaining: 0, resetTime: 0 };
    }
  }

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...event
      };

      if (this.securityConfig.enableSecurityMonitoring) {
        await this.securityMonitoringService.logSecurityEvent(securityEvent);
      }

      this.logger.warn(`Security Event: ${event.type} - ${event.severity}`, {
        id: securityEvent.id,
        source: event.source,
        details: event.details
      });
    } catch (error) {
      this.logger.error('Error logging security event:', error);
    }
  }

  private parseSize(size: string): number {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (!match) return 0;
    return parseFloat(match[1]) * units[match[2] as keyof typeof units];
  }

  async getSecurityMetrics(): Promise<any> {
    try {
      if (this.securityConfig.enableSecurityMonitoring) {
        return await this.securityMonitoringService.getSecurityMetrics();
      }
      return null;
    } catch (error) {
      this.logger.error('Error getting security metrics:', error);
      return null;
    }
  }

  async getSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
    try {
      if (this.securityConfig.enableSecurityMonitoring) {
        return await this.securityMonitoringService.getSecurityEvents(limit);
      }
      return [];
    } catch (error) {
      this.logger.error('Error getting security events:', error);
      return [];
    }
  }
}