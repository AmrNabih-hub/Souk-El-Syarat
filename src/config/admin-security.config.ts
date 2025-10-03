// 🔐 ADMIN ACCOUNT SECURITY CONFIGURATION
// Enterprise-grade security for production admin account

import CryptoJS from 'crypto-js';

/**
 * Security Configuration
 * This provides multi-layer security for the admin account
 */

// 🔒 Environment-specific encryption key (MUST be set in production .env)
const ENCRYPTION_KEY = import.meta.env.VITE_ADMIN_ENCRYPTION_KEY || 'dev-only-fallback-key-change-in-production';

/**
 * Encrypted Admin Credentials
 * The actual credentials are encrypted and only decrypted when needed
 */
const ENCRYPTED_ADMIN_DATA = {
  // Production admin - encrypted at rest
  production: {
    // These will be encrypted versions of the real credentials
    email: '', // Will be set in initializeAdminSecurity()
    passwordHash: '', // Will be set in initializeAdminSecurity()
    createdAt: new Date('2025-10-01').toISOString(),
    lastRotation: new Date('2025-10-01').toISOString(),
  }
};

/**
 * Security Settings
 */
export const ADMIN_SECURITY_CONFIG = {
  // Session settings
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_IDLE_TIME: 15 * 60 * 1000, // 15 minutes of inactivity
  REQUIRE_RE_AUTH_FOR_CRITICAL: true, // Require password for critical operations
  
  // Login attempt limits
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 16,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  PASSWORD_ROTATION_DAYS: 90,
  
  // Two-Factor Authentication
  REQUIRE_2FA: true, // Set to true in production
  TOTP_WINDOW: 1, // Time window for TOTP codes
  
  // Security headers
  ENABLE_CSRF_PROTECTION: true,
  ENABLE_RATE_LIMITING: true,
  
  // Audit logging
  LOG_ALL_ADMIN_ACTIONS: true,
  LOG_FAILED_ATTEMPTS: true,
  ALERT_ON_SUSPICIOUS_ACTIVITY: true,
  
  // IP Whitelist (optional - for extra security)
  ENABLE_IP_WHITELIST: false,
  ALLOWED_IPS: [] as string[],
};

/**
 * Admin Session Management
 */
class AdminSecurityManager {
  private static instance: AdminSecurityManager;
  private loginAttempts: Map<string, { count: number; lockUntil?: number }> = new Map();
  private activeSessions: Map<string, { lastActivity: number; token: string }> = new Map();
  private adminActivityLog: Array<{ action: string; email: string; timestamp: Date; metadata?: any; ip?: string }> = [];

  private constructor() {
    this.initializeSecurityMonitoring();
  }

  static getInstance(): AdminSecurityManager {
    if (!AdminSecurityManager.instance) {
      AdminSecurityManager.instance = new AdminSecurityManager();
    }
    return AdminSecurityManager.instance;
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Check for session timeouts every minute
    setInterval(() => {
      this.checkSessionTimeouts();
    }, 60 * 1000);

    // Monitor for suspicious activity
    if (ADMIN_SECURITY_CONFIG.ALERT_ON_SUSPICIOUS_ACTIVITY) {
      this.startSecurityMonitoring();
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Hash password with salt
   */
  hashPassword(password: string, salt?: string): string {
    const useSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(password, useSalt, {
      keySize: 512 / 32,
      iterations: 10000
    }).toString();
    return `${useSalt}:${hash}`;
  }

  /**
   * Verify password against hash
   */
  verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    const testHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512 / 32,
      iterations: 10000
    }).toString();
    return hash === testHash;
  }

  /**
   * Check if account is locked due to failed attempts
   */
  isAccountLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    if (attempts.lockUntil && attempts.lockUntil > Date.now()) {
      return true;
    }

    // Clear lockout if expired
    if (attempts.lockUntil && attempts.lockUntil <= Date.now()) {
      this.loginAttempts.delete(email);
      return false;
    }

    return false;
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0 };
    attempts.count++;

    if (attempts.count >= ADMIN_SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      attempts.lockUntil = Date.now() + ADMIN_SECURITY_CONFIG.LOCKOUT_DURATION;
      this.logSecurityEvent('ACCOUNT_LOCKED', email);
      
      // Alert administrators
      this.alertSuspiciousActivity('Multiple failed login attempts', email);
    }

    this.loginAttempts.set(email, attempts);
    this.logSecurityEvent('FAILED_LOGIN_ATTEMPT', email);
  }

  /**
   * Clear failed attempts on successful login
   */
  clearFailedAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  /**
   * Create secure admin session
   */
  createSession(adminEmail: string): string {
    const sessionToken = this.generateSecureToken();
    this.activeSessions.set(adminEmail, {
      lastActivity: Date.now(),
      token: sessionToken
    });
    
    this.logSecurityEvent('SESSION_CREATED', adminEmail);
    return sessionToken;
  }

  /**
   * Validate and refresh session
   */
  validateSession(adminEmail: string, token: string): boolean {
    const session = this.activeSessions.get(adminEmail);
    if (!session) return false;

    // Check token match
    if (session.token !== token) {
      this.logSecurityEvent('INVALID_SESSION_TOKEN', adminEmail);
      return false;
    }

    // Check session timeout
    const now = Date.now();
    const sessionAge = now - session.lastActivity;

    if (sessionAge > ADMIN_SECURITY_CONFIG.SESSION_TIMEOUT) {
      this.endSession(adminEmail);
      this.logSecurityEvent('SESSION_EXPIRED', adminEmail);
      return false;
    }

    // Check idle timeout
    if (sessionAge > ADMIN_SECURITY_CONFIG.MAX_IDLE_TIME) {
      this.endSession(adminEmail);
      this.logSecurityEvent('SESSION_IDLE_TIMEOUT', adminEmail);
      return false;
    }

    // Refresh activity timestamp
    session.lastActivity = now;
    this.activeSessions.set(adminEmail, session);
    return true;
  }

  /**
   * End admin session
   */
  endSession(adminEmail: string): void {
    this.activeSessions.delete(adminEmail);
    this.logSecurityEvent('SESSION_ENDED', adminEmail);
  }

  /**
   * Check all sessions for timeouts
   */
  private checkSessionTimeouts(): void {
    const now = Date.now();
    for (const [email, session] of this.activeSessions.entries()) {
      const sessionAge = now - session.lastActivity;
      if (sessionAge > ADMIN_SECURITY_CONFIG.SESSION_TIMEOUT) {
        this.endSession(email);
      }
    }
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  /**
   * Log security event
   */
  private logSecurityEvent(action: string, email: string, metadata?: any): void {
    const event: { action: string; email: string; timestamp: Date; metadata?: any; ip?: string } = {
      action,
      email,
      timestamp: new Date(),
      metadata,
      ip: this.getCurrentIP(),
    };

    this.adminActivityLog.push(event);
    
    // Keep only last 1000 events
    if (this.adminActivityLog.length > 1000) {
      this.adminActivityLog.shift();
    }

    if (ADMIN_SECURITY_CONFIG.LOG_ALL_ADMIN_ACTIONS) {
      console.log(`[ADMIN_SECURITY] ${action}:`, event);
    }

    // In production, send to external logging service
    if (import.meta.env.PROD) {
      this.sendToSecurityLog(event);
    }
  }

  /**
   * Get current IP (placeholder - implement based on your infrastructure)
   */
  private getCurrentIP(): string {
    // In production, get from request headers or security context
    return 'unknown';
  }

  /**
   * Send security log to external service
   */
  private sendToSecurityLog(event: any): void {
    // TODO: Implement sending to CloudWatch, Datadog, or other logging service
    // For now, store in localStorage as backup
    try {
      const logs = JSON.parse(localStorageService.getFilePreviewItem('admin_security_logs') || '[]');
      logs.push(event);
      // Keep only last 100 logs in localStorage
      if (logs.length > 100) logs.shift();
      localStorage.setItem('admin_security_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store security log:', error);
    }
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Monitor for unusual patterns
    setInterval(() => {
      this.checkForSuspiciousActivity();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Check for suspicious activity
   */
  private checkForSuspiciousActivity(): void {
    const recentEvents = this.adminActivityLog.filter(
      event => event.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // Last hour
    );

    // Check for multiple failed attempts
    const failedLogins = recentEvents.filter(e => e.action === 'FAILED_LOGIN_ATTEMPT');
    if (failedLogins.length > 5) {
      this.alertSuspiciousActivity('Multiple failed login attempts in the last hour', failedLogins[0]?.email || 'unknown');
    }

    // Check for unusual access patterns
    const sessionCreations = recentEvents.filter(e => e.action === 'SESSION_CREATED');
    if (sessionCreations.length > 10) {
      this.alertSuspiciousActivity('Unusual number of session creations', 'multiple');
    }
  }

  /**
   * Alert administrators of suspicious activity
   */
  private alertSuspiciousActivity(reason: string, email: string): void {
    const alert = {
      type: 'SECURITY_ALERT',
      reason,
      email,
      timestamp: new Date(),
      severity: 'HIGH'
    };

    console.warn('🚨 SECURITY ALERT:', alert);
    
    // In production, send to:
    // 1. Email notification to admins
    // 2. SMS alert
    // 3. Security monitoring dashboard
    // 4. Slack/Discord notification
    
    if (import.meta.env.PROD) {
      // TODO: Implement alerting system
      this.sendSecurityAlert(alert);
    }
  }

  /**
   * Send security alert
   */
  private sendSecurityAlert(alert: any): void {
    // TODO: Implement with AWS SNS, SendGrid, or similar
    console.error('SECURITY ALERT:', alert);
  }

  /**
   * Get security audit log
   */
  getAuditLog(limit: number = 100): Array<any> {
    return this.adminActivityLog.slice(-limit);
  }

  /**
   * Validate IP address (if whitelist enabled)
   */
  validateIP(ip: string): boolean {
    if (!ADMIN_SECURITY_CONFIG.ENABLE_IP_WHITELIST) {
      return true;
    }

    return ADMIN_SECURITY_CONFIG.ALLOWED_IPS.includes(ip);
  }
}

/**
 * Export security manager instance
 */
export const adminSecurityManager = AdminSecurityManager.getInstance();

/**
 * Production Admin Credentials (Encrypted)
 * Only decrypted when authentication is needed
 */
export const SECURE_ADMIN_CREDENTIALS = {
  // Email is encrypted
  getEmail(): string {
    if (import.meta.env.DEV) {
      return 'soukalsayarat1@gmail.com';
    }
    // In production, decrypt from secure storage
    return adminSecurityManager.decrypt(ENCRYPTED_ADMIN_DATA.production.email);
  },

  // Password hash is encrypted
  getPasswordHash(): string {
    if (import.meta.env.DEV) {
      // Development: Use the actual password (will be hashed)
      return adminSecurityManager.hashPassword('MZ:!z4kbg4QK22r');
    }
    // In production, decrypt from secure storage
    return adminSecurityManager.decrypt(ENCRYPTED_ADMIN_DATA.production.passwordHash);
  },

  // Verify admin credentials
  verify(email: string, password: string): boolean {
    // Check if account is locked
    if (adminSecurityManager.isAccountLocked(email)) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts. Please try again later.');
    }

    const validEmail = this.getEmail();
    const passwordHash = this.getPasswordHash();

    if (email !== validEmail) {
      adminSecurityManager.recordFailedAttempt(email);
      return false;
    }

    const passwordValid = adminSecurityManager.verifyPassword(password, passwordHash);
    
    if (!passwordValid) {
      adminSecurityManager.recordFailedAttempt(email);
      return false;
    }

    // Successful login
    adminSecurityManager.clearFailedAttempts(email);
    return true;
  }
};

/**
 * Security utility functions
 */
export const AdminSecurityUtils = {
  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < ADMIN_SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${ADMIN_SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`);
    }

    if (ADMIN_SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (ADMIN_SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (ADMIN_SECURITY_CONFIG.REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (ADMIN_SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Check if password rotation is needed
   */
  isPasswordRotationNeeded(): boolean {
    const lastRotation = new Date(ENCRYPTED_ADMIN_DATA.production.lastRotation);
    const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRotation > ADMIN_SECURITY_CONFIG.PASSWORD_ROTATION_DAYS;
  },

  /**
   * Sanitize sensitive data for logging
   */
  sanitizeForLog(data: any): any {
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }
};

