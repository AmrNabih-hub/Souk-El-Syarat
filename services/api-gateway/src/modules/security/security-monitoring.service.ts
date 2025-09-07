import { Injectable, Logger } from '@nestjs/common';
import { SecurityEvent } from './security.service';

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly securityEvents: SecurityEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10,000 events

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Add event to memory store
      this.securityEvents.push(event);
      
      // Keep only the last maxEvents
      if (this.securityEvents.length > this.maxEvents) {
        this.securityEvents.splice(0, this.securityEvents.length - this.maxEvents);
      }

      // Log to console for debugging
      this.logger.warn(`Security Event Logged: ${event.type}`, {
        id: event.id,
        severity: event.severity,
        source: event.source,
        details: event.details
      });

      // In a real implementation, this would also:
      // 1. Send to external security monitoring service
      // 2. Store in database
      // 3. Send alerts for critical events
      // 4. Update security metrics

    } catch (error) {
      this.logger.error('Error logging security event:', error);
    }
  }

  async getSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
    try {
      return this.securityEvents
        .slice(-limit)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error('Error getting security events:', error);
      return [];
    }
  }

  async getSecurityEventsByType(type: SecurityEvent['type'], limit: number = 100): Promise<SecurityEvent[]> {
    try {
      return this.securityEvents
        .filter(event => event.type === type)
        .slice(-limit)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error('Error getting security events by type:', error);
      return [];
    }
  }

  async getSecurityEventsBySeverity(severity: SecurityEvent['severity'], limit: number = 100): Promise<SecurityEvent[]> {
    try {
      return this.securityEvents
        .filter(event => event.severity === severity)
        .slice(-limit)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error('Error getting security events by severity:', error);
      return [];
    }
  }

  async getSecurityMetrics(): Promise<any> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      const events24h = this.securityEvents.filter(event => event.timestamp >= last24Hours);
      const events1h = this.securityEvents.filter(event => event.timestamp >= lastHour);

      const metrics = {
        totalEvents: this.securityEvents.length,
        events24h: events24h.length,
        events1h: events1h.length,
        byType: {
          rate_limit: events24h.filter(e => e.type === 'rate_limit').length,
          suspicious_request: events24h.filter(e => e.type === 'suspicious_request').length,
          malicious_input: events24h.filter(e => e.type === 'malicious_input').length,
          unauthorized_access: events24h.filter(e => e.type === 'unauthorized_access').length,
          security_headers: events24h.filter(e => e.type === 'security_headers').length,
        },
        bySeverity: {
          low: events24h.filter(e => e.severity === 'low').length,
          medium: events24h.filter(e => e.severity === 'medium').length,
          high: events24h.filter(e => e.severity === 'high').length,
          critical: events24h.filter(e => e.severity === 'critical').length,
        },
        topSources: this.getTopSources(events24h),
        topIPs: this.getTopIPs(events24h),
        topEndpoints: this.getTopEndpoints(events24h),
        lastUpdated: now.toISOString()
      };

      return metrics;
    } catch (error) {
      this.logger.error('Error getting security metrics:', error);
      return null;
    }
  }

  private getTopSources(events: SecurityEvent[], limit: number = 10): Array<{ source: string; count: number }> {
    const sourceCounts = events.reduce((acc, event) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private getTopIPs(events: SecurityEvent[], limit: number = 10): Array<{ ip: string; count: number }> {
    const ipCounts = events.reduce((acc, event) => {
      const ip = event.details.ip;
      if (ip) {
        acc[ip] = (acc[ip] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private getTopEndpoints(events: SecurityEvent[], limit: number = 10): Array<{ endpoint: string; count: number }> {
    const endpointCounts = events.reduce((acc, event) => {
      const endpoint = event.details.endpoint;
      if (endpoint) {
        acc[endpoint] = (acc[endpoint] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async clearOldEvents(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const initialLength = this.securityEvents.length;
      
      // Remove events older than cutoff date
      for (let i = this.securityEvents.length - 1; i >= 0; i--) {
        if (this.securityEvents[i].timestamp < cutoffDate) {
          this.securityEvents.splice(i, 1);
        }
      }
      
      const removedCount = initialLength - this.securityEvents.length;
      this.logger.log(`Cleared ${removedCount} old security events`);
      
      return removedCount;
    } catch (error) {
      this.logger.error('Error clearing old events:', error);
      return 0;
    }
  }

  async exportSecurityEvents(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      if (format === 'json') {
        return JSON.stringify(this.securityEvents, null, 2);
      } else if (format === 'csv') {
        const headers = ['id', 'timestamp', 'type', 'severity', 'source', 'ip', 'userAgent', 'endpoint', 'method', 'reason', 'action'];
        const csvRows = [headers.join(',')];
        
        for (const event of this.securityEvents) {
          const row = [
            event.id,
            event.timestamp.toISOString(),
            event.type,
            event.severity,
            event.source,
            event.details.ip || '',
            event.details.userAgent || '',
            event.details.endpoint || '',
            event.details.method || '',
            event.details.reason || '',
            event.details.action || ''
          ].map(field => `"${field}"`);
          csvRows.push(row.join(','));
        }
        
        return csvRows.join('\n');
      }
      
      return '';
    } catch (error) {
      this.logger.error('Error exporting security events:', error);
      return '';
    }
  }
}