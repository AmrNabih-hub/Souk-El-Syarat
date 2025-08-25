/**
 * Enterprise Security Manager
 * Advanced security monitoring, threat detection, and protection systems
 */

// Security manager with comprehensive threat detection

// Security Types
export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MALICIOUS_INPUT = 'malicious_input',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SESSION_HIJACK = 'session_hijack',
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  level: ThreatLevel;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  url: string;
  details: Record<string, any>;
  blocked: boolean;
  automated: boolean;
}

export interface SecurityRule {
  id: string;
  name: string;
  type: SecurityEventType;
  enabled: boolean;
  threshold: number;
  timeWindow: number; // in milliseconds
  action: 'log' | 'warn' | 'block' | 'ban';
  autoRemediation: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  riskScore: number;
  events: SecurityEvent[];
}

// Security Configuration
const DEFAULT_SECURITY_RULES: SecurityRule[] = [
  {
    id: 'auth_failure_rule',
    name: 'Authentication Failure Detection',
    type: SecurityEventType.AUTHENTICATION_FAILURE,
    enabled: true,
    threshold: 5,
    timeWindow: 300000, // 5 minutes
    action: 'block',
    autoRemediation: true,
  },
  {
    id: 'rate_limit_rule',
    name: 'Rate Limiting',
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    enabled: true,
    threshold: 100,
    timeWindow: 60000, // 1 minute
    action: 'block',
    autoRemediation: true,
  },
  {
    id: 'xss_detection_rule',
    name: 'XSS Attack Detection',
    type: SecurityEventType.XSS_ATTEMPT,
    enabled: true,
    threshold: 1,
    timeWindow: 1000,
    action: 'block',
    autoRemediation: true,
  },
  {
    id: 'suspicious_activity_rule',
    name: 'Suspicious Activity Detection',
    type: SecurityEventType.SUSPICIOUS_ACTIVITY,
    enabled: true,
    threshold: 10,
    timeWindow: 600000, // 10 minutes
    action: 'warn',
    autoRemediation: false,
  },
];

// Main Security Manager Class
export class SecurityManager {
  private static instance: SecurityManager;
  private rules: Map<string, SecurityRule> = new Map();
  private events: SecurityEvent[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private blockedIps: Set<string> = new Set();
  private blockedUsers: Set<string> = new Set();
  private isMonitoring: boolean = false;
  private reportingEndpoint: string = '/api/security';

  private constructor() {
    this.initializeRules();
    this.setupEventListeners();
    this.startMonitoring();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private initializeRules(): void {
    DEFAULT_SECURITY_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Monitor for XSS attempts
    this.setupXSSDetection();
    
    // Monitor for suspicious DOM manipulation
    this.setupDOMMonitoring();
    
    // Monitor for suspicious network activity
    this.setupNetworkMonitoring();
    
    // Monitor for console manipulation attempts
    this.setupConsoleMonitoring();
  }

  private setupXSSDetection(): void {
    // Monitor for script injections
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name: string, value: string) {
      if (SecurityManager.getInstance().detectXSS(value)) {
        SecurityManager.getInstance().recordSecurityEvent({
          type: SecurityEventType.XSS_ATTEMPT,
          level: ThreatLevel.HIGH,
          details: { attribute: name, value, element: this.tagName },
          blocked: true,
          automated: true,
        });
        return; // Block the operation
      }
      return originalSetAttribute.call(this, name, value);
    };

    // Monitor innerHTML changes
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTML) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value: string) {
          if (SecurityManager.getInstance().detectXSS(value)) {
            SecurityManager.getInstance().recordSecurityEvent({
              type: SecurityEventType.XSS_ATTEMPT,
              level: ThreatLevel.HIGH,
              details: { innerHTML: value, element: this.tagName },
              blocked: true,
              automated: true,
            });
            return; // Block the operation
          }
          originalInnerHTML.set?.call(this, value);
        },
        get: originalInnerHTML.get,
      });
    }
  }

  private setupDOMMonitoring(): void {
    // Monitor for suspicious DOM mutations
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (this.isSuspiciousElement(element)) {
                  this.recordSecurityEvent({
                    type: SecurityEventType.SUSPICIOUS_ACTIVITY,
                    level: ThreatLevel.MEDIUM,
                    details: { 
                      mutation: 'childList', 
                      element: element.tagName,
                      innerHTML: element.innerHTML.substring(0, 100),
                    },
                    blocked: false,
                    automated: true,
                  });
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'href', 'onclick', 'onload'],
      });
    }
  }

  private setupNetworkMonitoring(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Check for suspicious URLs
      if (this.isSuspiciousUrl(url)) {
        this.recordSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          level: ThreatLevel.MEDIUM,
          details: { url, method: init?.method || 'GET' },
          blocked: false,
          automated: true,
        });
      }

      return originalFetch(input, init);
    };

    // Monitor XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
      const urlString = url.toString();
      if (SecurityManager.getInstance().isSuspiciousUrl(urlString)) {
        SecurityManager.getInstance().recordSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          level: ThreatLevel.MEDIUM,
          details: { url: urlString, method },
          blocked: false,
          automated: true,
        });
      }
      return originalXHROpen.call(this, method, url);
    };
  }

  private setupConsoleMonitoring(): void {
    // Monitor console access (potential debugging attempts)
    let consoleAccessCount = 0;
    const originalLog = console.log;
    
    console.log = (...args: any[]) => {
      consoleAccessCount++;
      
      // Alert on excessive console usage (potential debugging)
      if (consoleAccessCount > 50 && process.env.NODE_ENV === 'production') {
        this.recordSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          level: ThreatLevel.LOW,
          details: { consoleAccessCount, args: args.slice(0, 3) },
          blocked: false,
          automated: true,
        });
      }
      
      return originalLog.apply(console, args);
    };
  }

  // Security Detection Methods
  private detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  private isSuspiciousElement(element: Element): boolean {
    const suspiciousTags = ['script', 'iframe', 'object', 'embed'];
    const suspiciousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
    
    if (suspiciousTags.includes(element.tagName.toLowerCase())) {
      return true;
    }

    return suspiciousAttributes.some(attr => element.hasAttribute(attr));
  }

  private isSuspiciousUrl(url: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /file:\/\//i,
      /\.onion/i, // Tor hidden services
      /bit\.ly|tinyurl|t\.co/i, // URL shorteners (can be suspicious)
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  // Input Validation and Sanitization
  public validateInput(input: string, type: 'email' | 'url' | 'text' | 'html'): {
    isValid: boolean;
    sanitized: string;
    threats: string[];
  } {
    const threats: string[] = [];
    let sanitized = input;
    let isValid = true;

    // Check for XSS
    if (this.detectXSS(input)) {
      threats.push('XSS attempt detected');
      isValid = false;
    }

    // Type-specific validation
    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          threats.push('Invalid email format');
          isValid = false;
        }
        break;

      case 'url':
        try {
          new URL(input);
          if (this.isSuspiciousUrl(input)) {
            threats.push('Suspicious URL detected');
            isValid = false;
          }
        } catch {
          threats.push('Invalid URL format');
          isValid = false;
        }
        break;

      case 'html':
        // Sanitize HTML content
        sanitized = this.sanitizeHTML(input);
        break;

      case 'text':
        // Basic text sanitization
        sanitized = input.replace(/[<>]/g, '');
        break;
    }

    if (threats.length > 0) {
      this.recordSecurityEvent({
        type: SecurityEventType.MALICIOUS_INPUT,
        level: ThreatLevel.MEDIUM,
        details: { input: input.substring(0, 100), type, threats },
        blocked: !isValid,
        automated: true,
      });
    }

    return { isValid, sanitized, threats };
  }

  private sanitizeHTML(html: string): string {
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const allowedAttributes = ['class', 'id'];

    // Simple HTML sanitization (in production, use DOMPurify)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }

  // Rate Limiting
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  public checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= limit) {
      this.recordSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        level: ThreatLevel.MEDIUM,
        details: { identifier, limit, count: entry.count },
        blocked: true,
        automated: true,
      });
      return false;
    }

    entry.count++;
    return true;
  }

  // Session Management
  public createSession(userId: string): string {
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      isActive: true,
      riskScore: 0,
      events: [],
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  public validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    // Check session timeout (30 minutes)
    const timeout = 30 * 60 * 1000;
    if (Date.now() - session.lastActivity.getTime() > timeout) {
      this.invalidateSession(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = new Date();
    return true;
  }

  public invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private getClientIP(): string {
    // This would typically be handled server-side
    return 'client-ip-placeholder';
  }

  // Security Event Recording
  public recordSecurityEvent(eventData: Partial<SecurityEvent>): void {
    const event: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventData.type!,
      level: eventData.level!,
      timestamp: new Date(),
      sessionId: this.getCurrentSessionId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      details: eventData.details || {},
      blocked: eventData.blocked || false,
      automated: eventData.automated || false,
      ...eventData,
    };

    this.events.push(event);

    // Update session risk score
    this.updateSessionRiskScore(event);

    // Check if rule thresholds are exceeded
    this.evaluateSecurityRules(event);

    // Log event
    this.logSecurityEvent(event);

    // Send to monitoring service
    this.sendSecurityEvent(event);
  }

  private getCurrentSessionId(): string {
    return sessionStorage.getItem('security-session-id') || 'anonymous';
  }

  private updateSessionRiskScore(event: SecurityEvent): void {
    const session = this.sessions.get(event.sessionId);
    if (session) {
      const riskIncrease = this.calculateRiskIncrease(event);
      session.riskScore += riskIncrease;
      session.events.push(event);

      // Alert on high risk score
      if (session.riskScore > 100) {
        this.recordSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          level: ThreatLevel.HIGH,
          details: { riskScore: session.riskScore, userId: session.userId },
          blocked: false,
          automated: true,
        });
      }
    }
  }

  private calculateRiskIncrease(event: SecurityEvent): number {
    const riskValues = {
      [ThreatLevel.LOW]: 5,
      [ThreatLevel.MEDIUM]: 15,
      [ThreatLevel.HIGH]: 30,
      [ThreatLevel.CRITICAL]: 50,
    };

    return riskValues[event.level] || 0;
  }

  private evaluateSecurityRules(event: SecurityEvent): void {
    const rule = Array.from(this.rules.values()).find(r => r.type === event.type);
    if (!rule || !rule.enabled) return;

    // Count recent events of this type
    const recentEvents = this.events.filter(e => 
      e.type === event.type &&
      e.timestamp.getTime() > Date.now() - rule.timeWindow
    );

    if (recentEvents.length >= rule.threshold) {
      this.executeSecurityAction(rule, event, recentEvents);
    }
  }

  private executeSecurityAction(
    rule: SecurityRule, 
    event: SecurityEvent, 
    recentEvents: SecurityEvent[]
  ): void {
    switch (rule.action) {
      case 'block':
        this.blockUser(event.userId);
        break;
      case 'ban':
        this.banIP(event.ipAddress);
        break;
      case 'warn':
        this.sendSecurityAlert(rule, event, recentEvents);
        break;
      case 'log':
        console.warn(`Security rule "${rule.name}" triggered`, { rule, event, recentEvents });
        break;
    }
  }

  private blockUser(userId?: string): void {
    if (userId) {
      this.blockedUsers.add(userId);
    }
  }

  private banIP(ipAddress: string): void {
    this.blockedIps.add(ipAddress);
  }

  private async sendSecurityAlert(
    rule: SecurityRule, 
    event: SecurityEvent, 
    recentEvents: SecurityEvent[]
  ): Promise<void> {
    try {
      await fetch('/api/security/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rule,
          event,
          recentEvents: recentEvents.length,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to send security alert:', error);
    }
  }

  private logSecurityEvent(event: SecurityEvent): void {
    const logLevel = {
      [ThreatLevel.LOW]: 'info',
      [ThreatLevel.MEDIUM]: 'warn',
      [ThreatLevel.HIGH]: 'error',
      [ThreatLevel.CRITICAL]: 'error',
    }[event.level];

    console[logLevel as 'info' | 'warn' | 'error'](
      `🛡️ Security Event [${event.level.toUpperCase()}]: ${event.type}`,
      event
    );
  }

  private async sendSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'security_event',
          event,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to send security event:', error);
    }
  }

  // Public API Methods
  public startMonitoring(): void {
    this.isMonitoring = true;
    console.log('🛡️ Security monitoring started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('⏹️ Security monitoring stopped');
  }

  public getSecurityEvents(): SecurityEvent[] {
    return [...this.events];
  }

  public getSecurityReport(): {
    summary: {
      totalEvents: number;
      highThreatEvents: number;
      blockedEvents: number;
      riskScore: number;
    };
    events: SecurityEvent[];
    recommendations: string[];
  } {
    const highThreatEvents = this.events.filter(e => 
      e.level === ThreatLevel.HIGH || e.level === ThreatLevel.CRITICAL
    );
    
    const blockedEvents = this.events.filter(e => e.blocked);
    
    const riskScore = this.events.reduce((score, event) => 
      score + this.calculateRiskIncrease(event), 0
    );

    const recommendations: string[] = [];
    
    if (highThreatEvents.length > 5) {
      recommendations.push('High number of security threats detected - review security policies');
    }
    
    if (blockedEvents.length > 10) {
      recommendations.push('Many blocked events - consider implementing additional security measures');
    }

    return {
      summary: {
        totalEvents: this.events.length,
        highThreatEvents: highThreatEvents.length,
        blockedEvents: blockedEvents.length,
        riskScore,
      },
      events: this.events,
      recommendations,
    };
  }
}

// Initialize security manager
export const securityManager = SecurityManager.getInstance();

// React Hook for Security
export function useSecurity() {
  const manager = SecurityManager.getInstance();
  
  const validateInput = (input: string, type: 'email' | 'url' | 'text' | 'html') =>
    manager.validateInput(input, type);
  
  const checkRateLimit = (identifier: string, limit: number, windowMs: number) =>
    manager.checkRateLimit(identifier, limit, windowMs);
  
  const recordEvent = (eventData: Partial<SecurityEvent>) =>
    manager.recordSecurityEvent(eventData);
  
  const getReport = () => manager.getSecurityReport();
  
  return {
    validateInput,
    checkRateLimit,
    recordEvent,
    getReport,
    manager,
  };
}

export default securityManager;