/**
 * 🔐 COMPREHENSIVE SECURITY SERVICE
 * Enterprise-grade security implementation for Souk El-Syarat
 */

import { auth, db, functions } from '@/config/firebase.config';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import CryptoJS from 'crypto-js';

// Security configuration
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  ENCRYPTION_KEY: process.env.VITE_ENCRYPTION_KEY || 'souk-el-syarat-secure-2024',
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100
};

interface SecurityLog {
  userId?: string;
  action: string;
  ip?: string;
  userAgent?: string;
  timestamp: Timestamp;
  status: 'success' | 'failure' | 'warning';
  details?: any;
}

interface UserSecurity {
  loginAttempts: number;
  lastLoginAttempt?: Timestamp;
  lockedUntil?: Timestamp;
  twoFactorEnabled: boolean;
  trustedDevices: string[];
  securityQuestions?: { question: string; answer: string }[];
  lastPasswordChange?: Timestamp;
  sessionToken?: string;
  sessionExpiry?: Timestamp;
}

class SecurityService {
  private static instance: SecurityService;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.initializeSecurityMonitoring();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring() {
    // Monitor authentication state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.validateSession(user);
        this.logSecurityEvent(user.uid, 'auth_state_change', 'success');
      }
    });

    // Set up periodic security checks
    setInterval(() => {
      this.performSecurityAudit();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, SECURITY_CONFIG.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECURITY_CONFIG.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Hash passwords with salt
   */
  hashPassword(password: string, salt?: string): string {
    const actualSalt = salt || CryptoJS.lib.WordArray.random(128/8).toString();
    return CryptoJS.PBKDF2(password, actualSalt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`);
    }

    if (!SECURITY_CONFIG.PASSWORD_REGEX.test(password)) {
      errors.push('Password must contain uppercase, lowercase, number, and special character');
    }

    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password is too common');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Secure login with brute force protection
   */
  async secureLogin(email: string, password: string, deviceId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(email)) {
        return { success: false, error: 'Too many requests. Please try again later.' };
      }

      // Check if account is locked
      const securityDoc = await getDoc(doc(db, 'userSecurity', email));
      const security = securityDoc.data() as UserSecurity;

      if (security?.lockedUntil && security.lockedUntil.toDate() > new Date()) {
        return { success: false, error: 'Account is locked. Please try again later.' };
      }

      // Attempt login
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Reset login attempts on success
      await this.updateSecurityRecord(email, {
        loginAttempts: 0,
        lastLoginAttempt: serverTimestamp()
      });

      // Generate session token
      const sessionToken = this.generateSessionToken();
      await this.createSession(result.user.uid, sessionToken, deviceId);

      // Log successful login
      await this.logSecurityEvent(result.user.uid, 'login', 'success', { deviceId });

      return { success: true, user: result.user };

    } catch (error: any) {
      // Update failed login attempts
      await this.handleFailedLogin(email);
      
      // Log failed login
      await this.logSecurityEvent(undefined, 'login', 'failure', { email, error: error.message });

      return { success: false, error: error.message };
    }
  }

  /**
   * Handle failed login attempts
   */
  private async handleFailedLogin(email: string) {
    const securityRef = doc(db, 'userSecurity', email);
    const securityDoc = await getDoc(securityRef);
    const security = securityDoc.data() as UserSecurity || { loginAttempts: 0, twoFactorEnabled: false, trustedDevices: [] };

    const newAttempts = security.loginAttempts + 1;
    const updateData: any = {
      loginAttempts: newAttempts,
      lastLoginAttempt: serverTimestamp()
    };

    // Lock account after max attempts
    if (newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = Timestamp.fromDate(new Date(Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION));
      updateData.loginAttempts = 0; // Reset counter
    }

    if (securityDoc.exists()) {
      await updateDoc(securityRef, updateData);
    } else {
      await setDoc(securityRef, { ...security, ...updateData });
    }
  }

  /**
   * Update security record
   */
  private async updateSecurityRecord(email: string, data: Partial<UserSecurity>) {
    const securityRef = doc(db, 'userSecurity', email);
    const securityDoc = await getDoc(securityRef);

    if (securityDoc.exists()) {
      await updateDoc(securityRef, data);
    } else {
      await setDoc(securityRef, { ...data, twoFactorEnabled: false, trustedDevices: [] });
    }
  }

  /**
   * Generate secure session token
   */
  private generateSessionToken(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  /**
   * Create user session
   */
  private async createSession(userId: string, token: string, deviceId: string) {
    const sessionData = {
      userId,
      token: this.encryptData(token),
      deviceId,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT)),
      isActive: true
    };

    await setDoc(doc(db, 'sessions', `${userId}_${deviceId}`), sessionData);
  }

  /**
   * Validate user session
   */
  async validateSession(user: User): Promise<boolean> {
    try {
      const deviceId = this.getDeviceId();
      const sessionDoc = await getDoc(doc(db, 'sessions', `${user.uid}_${deviceId}`));

      if (!sessionDoc.exists()) {
        return false;
      }

      const session = sessionDoc.data();
      const now = new Date();

      if (session.expiresAt.toDate() < now) {
        // Session expired
        await this.endSession(user.uid, deviceId);
        return false;
      }

      // Extend session
      await updateDoc(doc(db, 'sessions', `${user.uid}_${deviceId}`), {
        expiresAt: Timestamp.fromDate(new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT))
      });

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * End user session
   */
  private async endSession(userId: string, deviceId: string) {
    await updateDoc(doc(db, 'sessions', `${userId}_${deviceId}`), {
      isActive: false,
      endedAt: serverTimestamp()
    });
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(identifier);

    if (!record || record.resetTime < now) {
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      });
      return true;
    }

    if (record.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    userId: string | undefined,
    action: string,
    status: 'success' | 'failure' | 'warning',
    details?: any
  ) {
    try {
      const log: SecurityLog = {
        userId,
        action,
        status,
        timestamp: serverTimestamp() as Timestamp,
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent,
        details
      };

      await setDoc(doc(collection(db, 'securityLogs')), log);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = CryptoJS.lib.WordArray.random(128/8).toString();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Perform security audit
   */
  private async performSecurityAudit() {
    try {
      // Check for suspicious activities
      const recentLogs = await getDocs(
        query(
          collection(db, 'securityLogs'),
          where('status', '==', 'failure'),
          where('timestamp', '>', Timestamp.fromDate(new Date(Date.now() - 3600000)))
        )
      );

      if (recentLogs.size > 10) {
        // Alert admin about suspicious activity
        await this.alertAdmin('High number of failed login attempts detected');
      }
    } catch (error) {
      console.error('Security audit failed:', error);
    }
  }

  /**
   * Alert admin about security issues
   */
  private async alertAdmin(message: string) {
    // In production, this would send email/SMS to admin
    console.error('SECURITY ALERT:', message);
    
    await setDoc(doc(collection(db, 'adminAlerts')), {
      message,
      timestamp: serverTimestamp(),
      severity: 'high',
      handled: false
    });
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    // Remove potential XSS attacks
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    const storedToken = sessionStorage.getItem('csrfToken');
    return token === storedToken;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    const token = CryptoJS.lib.WordArray.random(256/8).toString();
    sessionStorage.setItem('csrfToken', token);
    return token;
  }
}

export const securityService = SecurityService.getInstance();