/**
 * Comprehensive Audit Logging Service
 * Enterprise-level audit logging and security monitoring
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase.config';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method?: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'file_upload' | 'api_call' | 'security' | 'system';
  tags: string[];
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: 'login_attempt' | 'failed_login' | 'account_locked' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'file_upload' | 'api_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  description: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  category?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class ComprehensiveAuditLoggingService {
  private static instance: ComprehensiveAuditLoggingService;
  private logBuffer: AuditLogEntry[] = [];
  private securityEvents: SecurityEvent[] = [];
  private bufferSize = 100;
  private flushInterval = 30 * 1000; // 30 seconds

  static getInstance(): ComprehensiveAuditLoggingService {
    if (!ComprehensiveAuditLoggingService.instance) {
      ComprehensiveAuditLoggingService.instance = new ComprehensiveAuditLoggingService();
    }
    return ComprehensiveAuditLoggingService.instance;
  }

  // Initialize audit logging
  static async initializeAuditLogging() {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    instance.setupLogFlushing();
    instance.setupSecurityMonitoring();
    console.log('✅ Comprehensive audit logging initialized');
  }

  /**
   * Log authentication events
   */
  static async logAuthenticationEvent(
    action: 'login' | 'logout' | 'signup' | 'password_reset' | 'email_verification' | 'account_locked' | 'failed_login',
    userId?: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    const entry: AuditLogEntry = {
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action,
      resource: 'authentication',
      success,
      errorMessage,
      metadata,
      severity: success ? 'low' : 'high',
      category: 'authentication',
      tags: ['auth', action, success ? 'success' : 'failure']
    };

    await instance.logEntry(entry);
  }

  /**
   * Log data access events
   */
  static async logDataAccessEvent(
    action: 'read' | 'create' | 'update' | 'delete',
    resource: string,
    resourceId?: string,
    userId?: string,
    success: boolean = true,
    metadata?: Record<string, any>
  ): Promise<void> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    const entry: AuditLogEntry = {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      success,
      metadata,
      severity: success ? 'low' : 'medium',
      category: success ? 'data_access' : 'data_modification',
      tags: ['data', action, resource, success ? 'success' : 'failure']
    };

    await instance.logEntry(entry);
  }

  /**
   * Log API calls
   */
  static async logAPICall(
    method: string,
    endpoint: string,
    userId?: string,
    statusCode: number = 200,
    responseTime?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    const success = statusCode >= 200 && statusCode < 400;
    const severity = statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low';
    
    const entry: AuditLogEntry = {
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action: 'api_call',
      resource: 'api',
      method,
      endpoint,
      success,
      statusCode,
      metadata: {
        ...metadata,
        responseTime
      },
      severity,
      category: 'api_call',
      tags: ['api', method.toLowerCase(), endpoint, success ? 'success' : 'failure']
    };

    await instance.logEntry(entry);
  }

  /**
   * Log file upload events
   */
  static async logFileUploadEvent(
    fileName: string,
    fileSize: number,
    fileType: string,
    userId?: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    const entry: AuditLogEntry = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action: 'file_upload',
      resource: 'file_upload',
      success,
      errorMessage,
      metadata: {
        fileName,
        fileSize,
        fileType,
        ...metadata
      },
      severity: success ? 'low' : 'medium',
      category: 'file_upload',
      tags: ['file_upload', fileType.split('/')[0], success ? 'success' : 'failure']
    };

    await instance.logEntry(entry);
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    eventType: 'suspicious_activity' | 'unauthorized_access' | 'data_breach' | 'rate_limit_exceeded' | 'malicious_file' | 'sql_injection' | 'xss_attempt',
    description: string,
    userId?: string,
    ipAddress?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: Record<string, any>
  ): Promise<void> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    const entry: AuditLogEntry = {
      id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action: 'security_event',
      resource: 'security',
      success: false,
      errorMessage: description,
      metadata: {
        eventType,
        ipAddress,
        ...metadata
      },
      severity,
      category: 'security',
      tags: ['security', eventType, severity]
    };

    await instance.logEntry(entry);

    // Also create security event
    const securityEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType: eventType as any,
      severity,
      userId,
      ipAddress,
      description,
      metadata,
      resolved: false
    };

    await instance.logSecurityEvent(securityEvent);
  }

  /**
   * Log system events
   */
  static async logSystemEvent(
    action: 'startup' | 'shutdown' | 'error' | 'warning' | 'maintenance' | 'backup' | 'restore',
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low',
    metadata?: Record<string, any>
  ): Promise<void> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    const entry: AuditLogEntry = {
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      resource: 'system',
      success: action !== 'error',
      errorMessage: action === 'error' ? description : undefined,
      metadata,
      severity,
      category: 'system',
      tags: ['system', action, severity]
    };

    await instance.logEntry(entry);
  }

  /**
   * Query audit logs
   */
  static async queryAuditLogs(queryParams: AuditLogQuery): Promise<AuditLogEntry[]> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    try {
      let q = query(collection(db, 'auditLogs'));

      if (queryParams.userId) {
        q = query(q, where('userId', '==', queryParams.userId));
      }

      if (queryParams.action) {
        q = query(q, where('action', '==', queryParams.action));
      }

      if (queryParams.category) {
        q = query(q, where('category', '==', queryParams.category));
      }

      if (queryParams.severity) {
        q = query(q, where('severity', '==', queryParams.severity));
      }

      if (queryParams.startDate) {
        q = query(q, where('timestamp', '>=', queryParams.startDate));
      }

      if (queryParams.endDate) {
        q = query(q, where('timestamp', '<=', queryParams.endDate));
      }

      q = query(q, orderBy('timestamp', 'desc'));

      if (queryParams.limit) {
        q = query(q, limit(queryParams.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AuditLogEntry[];

    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  /**
   * Get security events
   */
  static async getSecurityEvents(
    resolved?: boolean,
    severity?: string,
    limit?: number
  ): Promise<SecurityEvent[]> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    try {
      let q = query(collection(db, 'securityEvents'));

      if (resolved !== undefined) {
        q = query(q, where('resolved', '==', resolved));
      }

      if (severity) {
        q = query(q, where('severity', '==', severity));
      }

      q = query(q, orderBy('timestamp', 'desc'));

      if (limit) {
        q = query(q, limit(limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate()
      })) as SecurityEvent[];

    } catch (error) {
      console.error('Error querying security events:', error);
      return [];
    }
  }

  /**
   * Resolve security event
   */
  static async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    resolution?: string
  ): Promise<boolean> {
    try {
      const eventRef = doc(db, 'securityEvents', eventId);
      await updateDoc(eventRef, {
        resolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy,
        resolution
      });
      return true;
    } catch (error) {
      console.error('Error resolving security event:', error);
      return false;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    successRate: number;
    errorRate: number;
    categoryBreakdown: Record<string, number>;
    severityBreakdown: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    const instance = ComprehensiveAuditLoggingService.getInstance();
    
    try {
      const queryParams: AuditLogQuery = {
        startDate,
        endDate,
        limit: 10000 // Large limit for statistics
      };

      const logs = await instance.queryAuditLogs(queryParams);
      
      const stats = {
        totalLogs: logs.length,
        successRate: 0,
        errorRate: 0,
        categoryBreakdown: {} as Record<string, number>,
        severityBreakdown: {} as Record<string, number>,
        topActions: [] as Array<{ action: string; count: number }>,
        topUsers: [] as Array<{ userId: string; count: number }>
      };

      if (logs.length === 0) return stats;

      // Calculate success/error rates
      const successCount = logs.filter(log => log.success).length;
      stats.successRate = (successCount / logs.length) * 100;
      stats.errorRate = 100 - stats.successRate;

      // Category breakdown
      logs.forEach(log => {
        stats.categoryBreakdown[log.category] = (stats.categoryBreakdown[log.category] || 0) + 1;
      });

      // Severity breakdown
      logs.forEach(log => {
        stats.severityBreakdown[log.severity] = (stats.severityBreakdown[log.severity] || 0) + 1;
      });

      // Top actions
      const actionCounts: Record<string, number> = {};
      logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
      stats.topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top users
      const userCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.userId) {
          userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
        }
      });
      stats.topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return stats;

    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalLogs: 0,
        successRate: 0,
        errorRate: 0,
        categoryBreakdown: {},
        severityBreakdown: {},
        topActions: [],
        topUsers: []
      };
    }
  }

  // Private helper methods

  private async logEntry(entry: AuditLogEntry): Promise<void> {
    try {
      // Add to buffer
      this.logBuffer.push(entry);

      // Flush if buffer is full
      if (this.logBuffer.length >= this.bufferSize) {
        await this.flushLogs();
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Audit Log:', entry);
      }

    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  }

  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await addDoc(collection(db, 'securityEvents'), {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const batch = this.logBuffer.map(entry => ({
        ...entry,
        timestamp: serverTimestamp()
      }));

      // Add to Firestore
      for (const entry of batch) {
        await addDoc(collection(db, 'auditLogs'), entry);
      }

      // Clear buffer
      this.logBuffer = [];

    } catch (error) {
      console.error('Error flushing audit logs:', error);
    }
  }

  private setupLogFlushing(): void {
    // Flush logs every 30 seconds
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Flush logs on page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });
  }

  private setupSecurityMonitoring(): void {
    // Monitor for suspicious patterns
    setInterval(() => {
      this.analyzeSuspiciousActivity();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async analyzeSuspiciousActivity(): Promise<void> {
    try {
      // Get recent failed login attempts
      const recentLogs = await this.queryAuditLogs({
        action: 'failed_login',
        startDate: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        limit: 100
      });

      // Group by IP address
      const ipCounts: Record<string, number> = {};
      recentLogs.forEach(log => {
        if (log.metadata?.ipAddress) {
          const ip = log.metadata.ipAddress;
          ipCounts[ip] = (ipCounts[ip] || 0) + 1;
        }
      });

      // Check for suspicious patterns
      for (const [ip, count] of Object.entries(ipCounts)) {
        if (count > 10) {
          await ComprehensiveAuditLoggingService.logSecurityEvent(
            'suspicious_activity',
            `High number of failed login attempts from IP ${ip}: ${count} attempts in 15 minutes`,
            undefined,
            ip,
            'high',
            { attemptCount: count, timeWindow: '15 minutes' }
          );
        }
      }

    } catch (error) {
      console.error('Error analyzing suspicious activity:', error);
    }
  }
}

// Initialize audit logging
ComprehensiveAuditLoggingService.initializeAuditLogging().catch(console.error);

export default ComprehensiveAuditLoggingService;