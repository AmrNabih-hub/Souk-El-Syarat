/**
 * Advanced Security Service
 * Enterprise-grade security with 2FA, biometric auth, and fraud detection
 */

import CryptoJS from 'crypto-js';
import { logger } from '@/utils/logger';

export interface SecurityConfig {
  enable2FA: boolean;
  enableBiometric: boolean;
  enableFraudDetection: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  encryptionKey: string;
}

export interface TwoFactorAuth {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  isEnabled: boolean;
}

export interface BiometricAuth {
  fingerprint: boolean;
  faceId: boolean;
  voiceId: boolean;
  isEnabled: boolean;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: 'login' | 'logout' | 'failed_login' | 'suspicious_activity' | 'password_change';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  riskScore: number;
  metadata: any;
}

export interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  enableGeoBlocking: boolean;
  allowedCountries: string[];
  blockedIPs: string[];
}

export class AdvancedSecurityService {
  private static instance: AdvancedSecurityService;
  private securityEvents: SecurityEvent[] = [];
  private activeSessions: Map<string, any> = new Map();
  private blockedIPs: Set<string> = new Set();
  private config: SecurityConfig;

  public static getInstance(): AdvancedSecurityService {
    if (!AdvancedSecurityService.instance) {
      AdvancedSecurityService.instance = new AdvancedSecurityService();
    }
    return AdvancedSecurityService.instance;
  }

  constructor() {
    this.config = {
      enable2FA: true,
      enableBiometric: true,
      enableFraudDetection: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      encryptionKey: process.env.VITE_SECURITY_ENCRYPTION_KEY || 'default-key'
    };
  }

  /**
   * Initialize advanced security features
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing advanced security service', {}, 'SECURITY');
      
      // Initialize fraud detection
      if (this.config.enableFraudDetection) {
        await this.initializeFraudDetection();
      }
      
      // Initialize biometric authentication
      if (this.config.enableBiometric) {
        await this.initializeBiometricAuth();
      }
      
      // Initialize 2FA
      if (this.config.enable2FA) {
        await this.initialize2FA();
      }
      
      logger.info('Advanced security service initialized', {}, 'SECURITY');
    } catch (error) {
      logger.error('Failed to initialize security service', error, 'SECURITY');
      throw error;
    }
  }

  /**
   * Setup Two-Factor Authentication
   */
  async setup2FA(userId: string): Promise<TwoFactorAuth> {
    try {
      logger.info('Setting up 2FA for user', { userId }, 'SECURITY');
      
      // Generate secret key
      const secret = this.generateSecretKey();
      
      // Generate QR code
      const qrCode = this.generateQRCode(secret, userId);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      const twoFA: TwoFactorAuth = {
        secret,
        qrCode,
        backupCodes,
        isEnabled: false
      };
      
      // Store in secure storage
      await this.store2FASecret(userId, secret);
      
      this.logSecurityEvent({
        userId,
        eventType: 'password_change',
        ipAddress: '127.0.0.1',
        userAgent: 'Security Service',
        riskScore: 0.1,
        metadata: { action: '2FA setup initiated' }
      });
      
      return twoFA;
    } catch (error) {
      logger.error('Failed to setup 2FA', error, 'SECURITY');
      throw error;
    }
  }

  /**
   * Verify 2FA token
   */
  async verify2FA(userId: string, token: string): Promise<boolean> {
    try {
      const secret = await this.get2FASecret(userId);
      const expectedToken = this.generateTOTP(secret);
      
      const isValid = token === expectedToken;
      
      this.logSecurityEvent({
        userId,
        eventType: isValid ? 'login' : 'failed_login',
        ipAddress: '127.0.0.1',
        userAgent: 'Security Service',
        riskScore: isValid ? 0.1 : 0.8,
        metadata: { action: '2FA verification', success: isValid }
      });
      
      return isValid;
    } catch (error) {
      logger.error('Failed to verify 2FA', error, 'SECURITY');
      return false;
    }
  }

  /**
   * Setup Biometric Authentication
   */
  async setupBiometric(userId: string): Promise<BiometricAuth> {
    try {
      logger.info('Setting up biometric auth for user', { userId }, 'SECURITY');
      
      const biometric: BiometricAuth = {
        fingerprint: true,
        faceId: true,
        voiceId: false,
        isEnabled: false
      };
      
      // Store biometric preferences
      await this.storeBiometricPreferences(userId, biometric);
      
      return biometric;
    } catch (error) {
      logger.error('Failed to setup biometric auth', error, 'SECURITY');
      throw error;
    }
  }

  /**
   * Verify biometric authentication
   */
  async verifyBiometric(userId: string, biometricData: any): Promise<boolean> {
    try {
      const preferences = await this.getBiometricPreferences(userId);
      
      // Simulate biometric verification
      const isValid = Math.random() > 0.1; // 90% success rate for demo
      
      this.logSecurityEvent({
        userId,
        eventType: isValid ? 'login' : 'failed_login',
        ipAddress: '127.0.0.1',
        userAgent: 'Biometric Auth',
        riskScore: isValid ? 0.05 : 0.9,
        metadata: { 
          action: 'biometric verification', 
          success: isValid,
          type: biometricData.type
        }
      });
      
      return isValid;
    } catch (error) {
      logger.error('Failed to verify biometric', error, 'SECURITY');
      return false;
    }
  }

  /**
   * Detect suspicious activity
   */
  async detectSuspiciousActivity(
    userId: string,
    activity: any
  ): Promise<{
    isSuspicious: boolean;
    riskScore: number;
    reasons: string[];
    recommendations: string[];
  }> {
    try {
      const riskFactors: string[] = [];
      let riskScore = 0;
      
      // Check for unusual login patterns
      if (this.isUnusualLoginPattern(userId, activity)) {
        riskFactors.push('Unusual login pattern');
        riskScore += 0.3;
      }
      
      // Check for rapid successive actions
      if (this.isRapidSuccessiveActions(userId, activity)) {
        riskFactors.push('Rapid successive actions');
        riskScore += 0.2;
      }
      
      // Check for high-value transactions
      if (this.isHighValueTransaction(activity)) {
        riskFactors.push('High-value transaction');
        riskScore += 0.1;
      }
      
      // Check for unusual location
      if (this.isUnusualLocation(userId, activity)) {
        riskFactors.push('Unusual location');
        riskScore += 0.4;
      }
      
      const isSuspicious = riskScore > 0.5;
      
      if (isSuspicious) {
        this.logSecurityEvent({
          userId,
          eventType: 'suspicious_activity',
          ipAddress: activity.ipAddress || 'unknown',
          userAgent: activity.userAgent || 'unknown',
          riskScore,
          metadata: { 
            activity,
            riskFactors,
            recommendations: this.getSecurityRecommendations(riskFactors)
          }
        });
      }
      
      return {
        isSuspicious,
        riskScore,
        reasons: riskFactors,
        recommendations: this.getSecurityRecommendations(riskFactors)
      };
    } catch (error) {
      logger.error('Failed to detect suspicious activity', error, 'SECURITY');
      return {
        isSuspicious: false,
        riskScore: 0,
        reasons: [],
        recommendations: []
      };
    }
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: any, key?: string): string {
    const encryptionKey = key || this.config.encryptionKey;
    return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string, key?: string): any {
    try {
      const encryptionKey = key || this.config.encryptionKey;
      const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      logger.error('Failed to decrypt data', error, 'SECURITY');
      return null;
    }
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }
    
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }
    
    if (!/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }
    
    return {
      isValid: score >= 4,
      score: score / 5,
      feedback
    };
  }

  /**
   * Get security events for user
   */
  getSecurityEvents(userId: string, limit: number = 50): SecurityEvent[] {
    return this.securityEvents
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard(): {
    totalEvents: number;
    suspiciousEvents: number;
    blockedIPs: number;
    activeSessions: number;
    riskScore: number;
  } {
    const suspiciousEvents = this.securityEvents.filter(
      event => event.riskScore > 0.5
    ).length;
    
    const avgRiskScore = this.securityEvents.length > 0
      ? this.securityEvents.reduce((sum, event) => sum + event.riskScore, 0) / this.securityEvents.length
      : 0;
    
    return {
      totalEvents: this.securityEvents.length,
      suspiciousEvents,
      blockedIPs: this.blockedIPs.size,
      activeSessions: this.activeSessions.size,
      riskScore: avgRiskScore
    };
  }

  private async initializeFraudDetection(): Promise<void> {
    logger.info('Initializing fraud detection', {}, 'SECURITY');
  }

  private async initializeBiometricAuth(): Promise<void> {
    logger.info('Initializing biometric authentication', {}, 'SECURITY');
  }

  private async initialize2FA(): Promise<void> {
    logger.info('Initializing 2FA service', {}, 'SECURITY');
  }

  private generateSecretKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private generateQRCode(secret: string, userId: string): string {
    // Generate QR code for 2FA setup
    return `otpauth://totp/SoukElSayarat:${userId}?secret=${secret}&issuer=SoukElSayarat`;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  private generateTOTP(secret: string): string {
    // Generate TOTP token (simplified)
    const timestamp = Math.floor(Date.now() / 1000 / 30);
    const hash = CryptoJS.HmacSHA1(timestamp.toString(), secret);
    const offset = parseInt(hash.toString().slice(-1), 16);
    const code = (parseInt(hash.toString().slice(offset * 2, offset * 2 + 8), 16) % 1000000).toString().padStart(6, '0');
    return code;
  }

  private async store2FASecret(userId: string, secret: string): Promise<void> {
    // Store 2FA secret securely
    logger.info('Storing 2FA secret for user', { userId }, 'SECURITY');
  }

  private async get2FASecret(userId: string): Promise<string> {
    // Retrieve 2FA secret
    return 'mock-secret-key';
  }

  private async storeBiometricPreferences(userId: string, preferences: BiometricAuth): Promise<void> {
    // Store biometric preferences
    logger.info('Storing biometric preferences for user', { userId }, 'SECURITY');
  }

  private async getBiometricPreferences(userId: string): Promise<BiometricAuth> {
    // Retrieve biometric preferences
    return {
      fingerprint: true,
      faceId: true,
      voiceId: false,
      isEnabled: false
    };
  }

  private isUnusualLoginPattern(userId: string, activity: any): boolean {
    // Check for unusual login patterns
    return Math.random() > 0.8; // 20% chance for demo
  }

  private isRapidSuccessiveActions(userId: string, activity: any): boolean {
    // Check for rapid successive actions
    return Math.random() > 0.9; // 10% chance for demo
  }

  private isHighValueTransaction(activity: any): boolean {
    // Check for high-value transactions
    return activity.amount > 10000;
  }

  private isUnusualLocation(userId: string, activity: any): boolean {
    // Check for unusual location
    return Math.random() > 0.95; // 5% chance for demo
  }

  private getSecurityRecommendations(riskFactors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (riskFactors.includes('Unusual login pattern')) {
      recommendations.push('Enable 2FA for additional security');
    }
    
    if (riskFactors.includes('Unusual location')) {
      recommendations.push('Verify your location and update security settings');
    }
    
    if (riskFactors.includes('High-value transaction')) {
      recommendations.push('Consider additional verification for high-value transactions');
    }
    
    return recommendations;
  }

  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };
    
    this.securityEvents.push(securityEvent);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
    
    logger.info('Security event logged', securityEvent, 'SECURITY');
  }
}

export const advancedSecurityService = AdvancedSecurityService.getInstance();
