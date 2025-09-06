/**
 * Security Monitoring Service
 * Real-time security monitoring and threat detection
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import ComprehensiveAuditLoggingService from './comprehensive-audit-logging.service';
import RateLimitingService from './rate-limiting.service';

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'brute_force' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach' | 'malicious_file' | 'rate_limit_exceeded' | 'xss_attempt' | 'injection_attempt' | 'privilege_escalation';
  title: string;
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface SecurityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  resolvedAlerts: number;
  unresolvedAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  recentAlerts: SecurityAlert[];
  topThreats: Array<{ type: string; count: number }>;
  securityScore: number;
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private alerts: SecurityAlert[] = [];
  private threatPatterns: ThreatPattern[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: ((alert: SecurityAlert) => void)[] = [];

  static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  // Initialize security monitoring
  static async initializeSecurityMonitoring() {
    const instance = SecurityMonitoringService.getInstance();
    await instance.setupThreatPatterns();
    instance.startMonitoring();
    instance.setupRealTimeAlerts();
    console.log('✅ Security monitoring initialized');
  }

  /**
   * Start security monitoring
   */
  private startMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 30 * 1000);

    // Initial check
    this.performSecurityChecks();
  }

  /**
   * Stop security monitoring
   */
  static stopMonitoring(): void {
    const instance = SecurityMonitoringService.getInstance();
    if (instance.monitoringInterval) {
      clearInterval(instance.monitoringInterval);
      instance.monitoringInterval = null;
    }
  }

  /**
   * Add alert callback
   */
  static addAlertCallback(callback: (alert: SecurityAlert) => void): void {
    const instance = SecurityMonitoringService.getInstance();
    instance.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  static removeAlertCallback(callback: (alert: SecurityAlert) => void): void {
    const instance = SecurityMonitoringService.getInstance();
    const index = instance.alertCallbacks.indexOf(callback);
    if (index > -1) {
      instance.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Create security alert
   */
  static async createSecurityAlert(
    type: SecurityAlert['type'],
    title: string,
    description: string,
    severity: SecurityAlert['severity'] = 'medium',
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<SecurityAlert> {
    const instance = SecurityMonitoringService.getInstance();
    
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      type,
      title,
      description,
      userId,
      ipAddress,
      userAgent,
      metadata,
      resolved: false
    };

    // Store in Firestore
    try {
      await addDoc(collection(db, 'securityAlerts'), {
        ...alert,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error storing security alert:', error);
    }

    // Add to local cache
    instance.alerts.unshift(alert);
    if (instance.alerts.length > 1000) {
      instance.alerts = instance.alerts.slice(0, 1000);
    }

    // Notify callbacks
    instance.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    // Log security event
    await ComprehensiveAuditLoggingService.logSecurityEvent(
      type,
      description,
      userId,
      ipAddress,
      severity,
      metadata
    );

    console.warn(`🚨 Security Alert: ${title} (${severity})`);
    return alert;
  }

  /**
   * Get security alerts
   */
  static async getSecurityAlerts(
    resolved?: boolean,
    severity?: string,
    type?: string,
    limit?: number
  ): Promise<SecurityAlert[]> {
    const instance = SecurityMonitoringService.getInstance();
    
    try {
      let q = query(collection(db, 'securityAlerts'));

      if (resolved !== undefined) {
        q = query(q, where('resolved', '==', resolved));
      }

      if (severity) {
        q = query(q, where('severity', '==', severity));
      }

      if (type) {
        q = query(q, where('type', '==', type));
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
      })) as SecurityAlert[];

    } catch (error) {
      console.error('Error getting security alerts:', error);
      return [];
    }
  }

  /**
   * Resolve security alert
   */
  static async resolveSecurityAlert(
    alertId: string,
    resolvedBy: string,
    resolution?: string
  ): Promise<boolean> {
    try {
      const alertRef = doc(db, 'securityAlerts', alertId);
      await updateDoc(alertRef, {
        resolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy,
        resolution
      });

      // Update local cache
      const instance = SecurityMonitoringService.getInstance();
      const alert = instance.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = new Date();
        alert.resolvedBy = resolvedBy;
        alert.resolution = resolution;
      }

      return true;
    } catch (error) {
      console.error('Error resolving security alert:', error);
      return false;
    }
  }

  /**
   * Get security metrics
   */
  static async getSecurityMetrics(): Promise<SecurityMetrics> {
    const instance = SecurityMonitoringService.getInstance();
    
    try {
      const alerts = await SecurityMonitoringService.getSecurityAlerts(undefined, undefined, undefined, 1000);
      
      const metrics: SecurityMetrics = {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
        lowAlerts: alerts.filter(a => a.severity === 'low').length,
        resolvedAlerts: alerts.filter(a => a.resolved).length,
        unresolvedAlerts: alerts.filter(a => !a.resolved).length,
        alertsByType: {},
        alertsBySeverity: {},
        recentAlerts: alerts.slice(0, 10),
        topThreats: [],
        securityScore: 0
      };

      // Calculate breakdowns
      alerts.forEach(alert => {
        metrics.alertsByType[alert.type] = (metrics.alertsByType[alert.type] || 0) + 1;
        metrics.alertsBySeverity[alert.severity] = (metrics.alertsBySeverity[alert.severity] || 0) + 1;
      });

      // Calculate top threats
      metrics.topThreats = Object.entries(metrics.alertsByType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate security score (0-100)
      const criticalWeight = 10;
      const highWeight = 5;
      const mediumWeight = 2;
      const lowWeight = 1;
      
      const totalWeight = metrics.criticalAlerts * criticalWeight + 
                         metrics.highAlerts * highWeight + 
                         metrics.mediumAlerts * mediumWeight + 
                         metrics.lowAlerts * lowWeight;
      
      metrics.securityScore = Math.max(0, 100 - totalWeight);

      return metrics;

    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        totalAlerts: 0,
        criticalAlerts: 0,
        highAlerts: 0,
        mediumAlerts: 0,
        lowAlerts: 0,
        resolvedAlerts: 0,
        unresolvedAlerts: 0,
        alertsByType: {},
        alertsBySeverity: {},
        recentAlerts: [],
        topThreats: [],
        securityScore: 100
      };
    }
  }

  /**
   * Setup threat patterns
   */
  private async setupThreatPatterns(): Promise<void> {
    this.threatPatterns = [
      {
        id: 'brute_force',
        name: 'Brute Force Attack',
        description: 'Multiple failed login attempts from same IP',
        pattern: /failed_login/i,
        severity: 'high',
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'xss_attempt',
        name: 'XSS Attack Attempt',
        description: 'Cross-site scripting attack detected',
        pattern: /<script|javascript:|on\w+\s*=/i,
        severity: 'high',
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'sql_injection',
        name: 'SQL Injection Attempt',
        description: 'SQL injection attack detected',
        pattern: /('|(\\')|(;)|(union)|(select)|(insert)|(update)|(delete)|(drop))/i,
        severity: 'critical',
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'path_traversal',
        name: 'Path Traversal Attack',
        description: 'Directory traversal attack detected',
        pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
        severity: 'high',
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'command_injection',
        name: 'Command Injection Attack',
        description: 'Command injection attack detected',
        pattern: /[;&|`$()]/,
        severity: 'critical',
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'suspicious_user_agent',
        name: 'Suspicious User Agent',
        description: 'Suspicious or malicious user agent detected',
        pattern: /bot|crawler|scanner|hack|exploit|malware/i,
        severity: 'medium',
        enabled: true,
        triggerCount: 0
      }
    ];
  }

  /**
   * Perform security checks
   */
  private async performSecurityChecks(): Promise<void> {
    try {
      // Check for brute force attacks
      await this.checkBruteForceAttacks();

      // Check for suspicious activity
      await this.checkSuspiciousActivity();

      // Check for rate limit violations
      await this.checkRateLimitViolations();

      // Check for malicious file uploads
      await this.checkMaliciousFileUploads();

      // Check for privilege escalation attempts
      await this.checkPrivilegeEscalation();

      // Check for data access anomalies
      await this.checkDataAccessAnomalies();

    } catch (error) {
      console.error('Error performing security checks:', error);
    }
  }

  /**
   * Check for brute force attacks
   */
  private async checkBruteForceAttacks(): Promise<void> {
    try {
      // Get recent failed login attempts
      const recentLogs = await ComprehensiveAuditLoggingService.queryAuditLogs({
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
          await SecurityMonitoringService.createSecurityAlert(
            'brute_force',
            'Brute Force Attack Detected',
            `High number of failed login attempts from IP ${ip}: ${count} attempts in 15 minutes`,
            'high',
            undefined,
            ip,
            undefined,
            { attemptCount: count, timeWindow: '15 minutes' }
          );
        }
      }

    } catch (error) {
      console.error('Error checking brute force attacks:', error);
    }
  }

  /**
   * Check for suspicious activity
   */
  private async checkSuspiciousActivity(): Promise<void> {
    try {
      // Get recent security events
      const recentEvents = await ComprehensiveAuditLoggingService.getSecurityEvents(false, undefined, 50);
      
      // Check for patterns
      const eventCounts: Record<string, number> = {};
      recentEvents.forEach(event => {
        eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
      });

      // Alert on high frequency events
      for (const [eventType, count] of Object.entries(eventCounts)) {
        if (count > 5) {
          await SecurityMonitoringService.createSecurityAlert(
            'suspicious_activity',
            'High Frequency Security Events',
            `High frequency of ${eventType} events: ${count} events in recent period`,
            'medium',
            undefined,
            undefined,
            undefined,
            { eventType, count }
          );
        }
      }

    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }

  /**
   * Check for rate limit violations
   */
  private async checkRateLimitViolations(): Promise<void> {
    try {
      const blockedIPs = RateLimitingService.getBlockedIPs();
      const blockedUsers = RateLimitingService.getBlockedUsers();
      const suspiciousIPs = RateLimitingService.getSuspiciousIPs();

      // Alert on blocked IPs
      for (const ip of blockedIPs) {
        await SecurityMonitoringService.createSecurityAlert(
          'rate_limit_exceeded',
          'IP Address Blocked',
          `IP address ${ip} has been blocked due to rate limit violations`,
          'high',
          undefined,
          ip,
          undefined,
          { reason: 'rate_limit_exceeded' }
        );
      }

      // Alert on blocked users
      for (const user of blockedUsers) {
        await SecurityMonitoringService.createSecurityAlert(
          'rate_limit_exceeded',
          'User Account Blocked',
          `User account ${user} has been blocked due to rate limit violations`,
          'high',
          user,
          undefined,
          undefined,
          { reason: 'rate_limit_exceeded' }
        );
      }

      // Alert on suspicious IPs
      for (const suspicious of suspiciousIPs) {
        if (suspicious.count > 20) {
          await SecurityMonitoringService.createSecurityAlert(
            'suspicious_activity',
            'Suspicious IP Activity',
            `IP address ${suspicious.ip} shows suspicious activity: ${suspicious.count} violations`,
            'medium',
            undefined,
            suspicious.ip,
            undefined,
            { violationCount: suspicious.count, lastSeen: suspicious.lastSeen }
          );
        }
      }

    } catch (error) {
      console.error('Error checking rate limit violations:', error);
    }
  }

  /**
   * Check for malicious file uploads
   */
  private async checkMaliciousFileUploads(): Promise<void> {
    try {
      // Get recent file upload events
      const recentLogs = await ComprehensiveAuditLoggingService.queryAuditLogs({
        action: 'file_upload',
        startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        limit: 100
      });

      // Check for suspicious file types
      const suspiciousFiles = recentLogs.filter(log => 
        log.metadata?.fileType && 
        (log.metadata.fileType.includes('executable') || 
         log.metadata.fileType.includes('script') ||
         log.metadata.fileType.includes('application/x-'))
      );

      if (suspiciousFiles.length > 0) {
        await SecurityMonitoringService.createSecurityAlert(
          'malicious_file',
          'Suspicious File Uploads Detected',
          `${suspiciousFiles.length} suspicious file uploads detected in the last hour`,
          'high',
          undefined,
          undefined,
          undefined,
          { suspiciousFileCount: suspiciousFiles.length, timeWindow: '1 hour' }
        );
      }

    } catch (error) {
      console.error('Error checking malicious file uploads:', error);
    }
  }

  /**
   * Check for privilege escalation attempts
   */
  private async checkPrivilegeEscalation(): Promise<void> {
    try {
      // Get recent authorization events
      const recentLogs = await ComprehensiveAuditLoggingService.queryAuditLogs({
        category: 'authorization',
        startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        limit: 100
      });

      // Check for failed authorization attempts
      const failedAuths = recentLogs.filter(log => !log.success);
      
      if (failedAuths.length > 10) {
        await SecurityMonitoringService.createSecurityAlert(
          'privilege_escalation',
          'Multiple Authorization Failures',
          `${failedAuths.length} failed authorization attempts detected in the last hour`,
          'high',
          undefined,
          undefined,
          undefined,
          { failedAuthCount: failedAuths.length, timeWindow: '1 hour' }
        );
      }

    } catch (error) {
      console.error('Error checking privilege escalation:', error);
    }
  }

  /**
   * Check for data access anomalies
   */
  private async checkDataAccessAnomalies(): Promise<void> {
    try {
      // Get recent data access events
      const recentLogs = await ComprehensiveAuditLoggingService.queryAuditLogs({
        category: 'data_access',
        startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        limit: 100
      });

      // Group by user
      const userAccessCounts: Record<string, number> = {};
      recentLogs.forEach(log => {
        if (log.userId) {
          userAccessCounts[log.userId] = (userAccessCounts[log.userId] || 0) + 1;
        }
      });

      // Check for unusual access patterns
      for (const [userId, count] of Object.entries(userAccessCounts)) {
        if (count > 100) {
          await SecurityMonitoringService.createSecurityAlert(
            'suspicious_activity',
            'Unusual Data Access Pattern',
            `User ${userId} has made ${count} data access requests in the last hour`,
            'medium',
            userId,
            undefined,
            undefined,
            { accessCount: count, timeWindow: '1 hour' }
          );
        }
      }

    } catch (error) {
      console.error('Error checking data access anomalies:', error);
    }
  }

  /**
   * Setup real-time alerts
   */
  private setupRealTimeAlerts(): void {
    // Listen for new security events
    const unsubscribe = onSnapshot(
      query(collection(db, 'securityEvents'), orderBy('timestamp', 'desc'), limit(10)),
      (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const event = change.doc.data();
            this.handleRealTimeSecurityEvent(event);
          }
        });
      }
    );

    // Store unsubscribe function for cleanup
    (this as any).unsubscribe = unsubscribe;
  }

  /**
   * Handle real-time security event
   */
  private handleRealTimeSecurityEvent(event: any): void {
    try {
      // Check if event matches any threat patterns
      for (const pattern of this.threatPatterns) {
        if (!pattern.enabled) continue;

        const description = event.description || '';
        if (pattern.pattern.test(description)) {
          pattern.triggerCount++;
          pattern.lastTriggered = new Date();

          // Create alert if pattern is triggered
          SecurityMonitoringService.createSecurityAlert(
            pattern.id as any,
            pattern.name,
            `Threat pattern detected: ${pattern.description}`,
            pattern.severity,
            event.userId,
            event.ipAddress,
            event.userAgent,
            { patternId: pattern.id, triggerCount: pattern.triggerCount }
          );
        }
      }

    } catch (error) {
      console.error('Error handling real-time security event:', error);
    }
  }

  /**
   * Get threat patterns
   */
  static getThreatPatterns(): ThreatPattern[] {
    const instance = SecurityMonitoringService.getInstance();
    return instance.threatPatterns;
  }

  /**
   * Update threat pattern
   */
  static updateThreatPattern(patternId: string, updates: Partial<ThreatPattern>): boolean {
    const instance = SecurityMonitoringService.getInstance();
    const pattern = instance.threatPatterns.find(p => p.id === patternId);
    
    if (pattern) {
      Object.assign(pattern, updates);
      return true;
    }
    
    return false;
  }

  /**
   * Add custom threat pattern
   */
  static addThreatPattern(pattern: Omit<ThreatPattern, 'id' | 'triggerCount'>): void {
    const instance = SecurityMonitoringService.getInstance();
    
    const newPattern: ThreatPattern = {
      ...pattern,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggerCount: 0
    };
    
    instance.threatPatterns.push(newPattern);
  }

  /**
   * Remove threat pattern
   */
  static removeThreatPattern(patternId: string): boolean {
    const instance = SecurityMonitoringService.getInstance();
    const index = instance.threatPatterns.findIndex(p => p.id === patternId);
    
    if (index > -1) {
      instance.threatPatterns.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Cleanup
   */
  static cleanup(): void {
    const instance = SecurityMonitoringService.getInstance();
    
    // Stop monitoring
    SecurityMonitoringService.stopMonitoring();
    
    // Unsubscribe from real-time listeners
    if ((instance as any).unsubscribe) {
      (instance as any).unsubscribe();
    }
    
    // Clear callbacks
    instance.alertCallbacks = [];
  }
}

// Initialize security monitoring
SecurityMonitoringService.initializeSecurityMonitoring().catch(console.error);

export default SecurityMonitoringService;