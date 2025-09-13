/**
 * Advanced Authentication Service for Souk El-Sayarat
 * Enhanced security features, session management, and credential protection
 */

import { auth, db } from '@/config/firebase.config';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  onAuthStateChanged,
  reload,
  deleteUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  multiFactor,
  PhoneMultiFactorGenerator,
  connectAuthEmulator,
  getAuth,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { User, UserRole } from '@/types';

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  requireEmailVerification: boolean;
  enableTwoFactor: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    location?: string;
  };
  isActive: boolean;
  lastActivity: Date;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'email_change' | 'suspicious_activity';
  timestamp: Date;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export class AdvancedAuthService {
  private static instance: AdvancedAuthService;
  private securityConfig: SecurityConfig;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private activityTimer: ReturnType<typeof setTimeout> | null = null;
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private activeSessions: Map<string, AuthSession> = new Map();

  // Default security configuration
  private defaultSecurityConfig: SecurityConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    requireEmailVerification: true,
    enableTwoFactor: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
  };

  private constructor() {
    this.securityConfig = this.defaultSecurityConfig;
    this.initializeSecurityMonitoring();
  }

  static getInstance(): AdvancedAuthService {
    if (!AdvancedAuthService.instance) {
      AdvancedAuthService.instance = new AdvancedAuthService();
    }
    return AdvancedAuthService.instance;
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Monitor for suspicious activities
    this.monitorSuspiciousActivities();

    // Clean up expired sessions periodically
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Validate password against security policy
   */
  private validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.securityConfig.passwordPolicy;

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if account is locked due to failed attempts
   */
  private isAccountLocked(email: string): boolean {
    const attempts = this.failedAttempts.get(email);
    if (!attempts) return false;

    if (attempts.count >= this.securityConfig.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      if (timeSinceLastAttempt < this.securityConfig.lockoutDuration) {
        return true;
      } else {
        // Reset failed attempts after lockout duration
        this.failedAttempts.delete(email);
        return false;
      }
    }

    return false;
  }

  /**
   * Record failed login attempt
   */
  private recordFailedAttempt(email: string): void {
    const attempts = this.failedAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.failedAttempts.set(email, attempts);
  }

  /**
   * Clear failed attempts on successful login
   */
  private clearFailedAttempts(email: string): void {
    this.failedAttempts.delete(email);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const eventRef = collection(db, 'security_events');
      await setDoc(doc(eventRef), {
        ...event,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Create new session
   */
  private async createSession(userId: string, deviceInfo: AuthSession['deviceInfo']): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: AuthSession = {
      userId,
      token: sessionId,
      expiresAt: new Date(Date.now() + this.securityConfig.sessionTimeout),
      deviceInfo,
      isActive: true,
      lastActivity: new Date(),
    };

    this.activeSessions.set(sessionId, session);

    // Store session in Firestore for multi-device management
    try {
      await setDoc(doc(db, 'user_sessions', sessionId), {
        ...session,
        expiresAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to store session:', error);
    }

    return sessionId;
  }

  /**
   * Validate session
   */
  private async validateSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    if (!session.isActive || session.expiresAt < new Date()) {
      await this.invalidateSession(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Invalidate session
   */
  private async invalidateSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);

    try {
      await updateDoc(doc(db, 'user_sessions', sessionId), {
        isActive: false,
        invalidatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Monitor suspicious activities
   */
  private monitorSuspiciousActivities(): void {
    // Monitor for rapid failed login attempts
    setInterval(() => {
      const suspiciousActivities = Array.from(this.failedAttempts.entries())
        .filter(([, attempts]) => attempts.count >= 3)
        .map(([email, attempts]) => ({ email, attempts }));

      if (suspiciousActivities.length > 0) {
        console.warn('🚨 Suspicious login activity detected:', suspiciousActivities);
        // In production, this could trigger alerts or temporary blocks
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const expiredSessions = Array.from(this.activeSessions.entries())
      .filter(([, session]) => session.expiresAt < new Date())
      .map(([sessionId]) => sessionId);

    for (const sessionId of expiredSessions) {
      await this.invalidateSession(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Enhanced sign up with security validation
   */
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer',
    additionalData?: {
      phoneNumber?: string;
      acceptTerms?: boolean;
      marketingConsent?: boolean;
    }
  ): Promise<{ user: User; sessionId: string }> {
    const instance = AdvancedAuthService.getInstance();

    try {
      // Validate password security
      const passwordValidation = instance.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Check if account is locked
      if (instance.isAccountLocked(email)) {
        await instance.logSecurityEvent({
          userId: 'unknown',
          type: 'suspicious_activity',
          details: { action: 'signup_attempt_locked_account', email },
          ipAddress: 'unknown',
          userAgent: navigator.userAgent,
        });
        throw new Error('Account is temporarily locked due to suspicious activity. Please try again later.');
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send email verification
      if (instance.securityConfig.requireEmailVerification) {
        await sendEmailVerification(firebaseUser, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });
      }

      // Update profile
      await updateProfile(firebaseUser, { displayName });

      // Create user document
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email!,
        displayName,
        phoneNumber: additionalData?.phoneNumber || firebaseUser.phoneNumber || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        role,
        isActive: true,
        emailVerified: firebaseUser.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          language: 'ar',
          currency: 'EGP',
          notifications: {
            email: additionalData?.marketingConsent ?? true,
            sms: false,
            push: true,
          },
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      const user: User = { id: firebaseUser.uid, ...userData };

      // Create session
      const deviceInfo = {
        userAgent: navigator.userAgent,
        ipAddress: 'unknown', // Would need server-side IP detection
      };
      const sessionId = await instance.createSession(firebaseUser.uid, deviceInfo);

      // Log successful registration
      await instance.logSecurityEvent({
        userId: firebaseUser.uid,
        type: 'login',
        details: { action: 'user_registration', role },
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      });

      return { user, sessionId };

    } catch (error) {
      // Log failed registration attempt
      await instance.logSecurityEvent({
        userId: 'unknown',
        type: 'failed_login',
        details: { action: 'registration_failed', error: (error as Error).message },
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
      });

      throw new Error(instance.getAuthErrorMessage((error as { code?: string }).code));
    }
  }

  /**
   * Enhanced sign in with security checks
   */
  static async signIn(
    email: string,
    password: string,
    deviceInfo?: AuthSession['deviceInfo']
  ): Promise<{ user: User; sessionId: string }> {
    const instance = AdvancedAuthService.getInstance();

    try {
      // Check if account is locked
      if (instance.isAccountLocked(email)) {
        await instance.logSecurityEvent({
          userId: 'unknown',
          type: 'suspicious_activity',
          details: { action: 'login_attempt_locked_account', email },
          ipAddress: deviceInfo?.ipAddress || 'unknown',
          userAgent: deviceInfo?.userAgent || navigator.userAgent,
        });
        throw new Error('Account is temporarily locked due to suspicious activity. Please try again later.');
      }

      // Attempt sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Clear failed attempts on successful login
      instance.clearFailedAttempts(email);

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      if (!userData?.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Check email verification
      if (instance.securityConfig.requireEmailVerification &&
          userData.role !== 'admin' &&
          !firebaseUser.emailVerified) {
        throw new Error('Please verify your email before signing in');
      }

      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const user: User = {
        id: firebaseUser.uid,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
      };

      // Create session
      const sessionDeviceInfo = deviceInfo || {
        userAgent: navigator.userAgent,
        ipAddress: 'unknown',
      };
      const sessionId = await instance.createSession(firebaseUser.uid, sessionDeviceInfo);

      // Log successful login
      await instance.logSecurityEvent({
        userId: firebaseUser.uid,
        type: 'login',
        details: { action: 'user_login', role: userData.role },
        ipAddress: sessionDeviceInfo.ipAddress,
        userAgent: sessionDeviceInfo.userAgent,
      });

      return { user, sessionId };

    } catch (error) {
      // Record failed attempt
      instance.recordFailedAttempt(email);

      // Log failed login
      await instance.logSecurityEvent({
        userId: 'unknown',
        type: 'failed_login',
        details: { action: 'login_failed', email, error: (error as Error).message },
        ipAddress: deviceInfo?.ipAddress || 'unknown',
        userAgent: deviceInfo?.userAgent || navigator.userAgent,
      });

      throw new Error(instance.getAuthErrorMessage((error as { code?: string }).code));
    }
  }

  /**
   * Enhanced sign out with session cleanup
   */
  static async signOut(sessionId?: string): Promise<void> {
    const instance = AdvancedAuthService.getInstance();

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Log logout event
        await instance.logSecurityEvent({
          userId: currentUser.uid,
          type: 'logout',
          details: { action: 'user_logout' },
          ipAddress: 'unknown',
          userAgent: navigator.userAgent,
        });

        // Invalidate session
        if (sessionId) {
          await instance.invalidateSession(sessionId);
        }

        // Clear all active sessions for this user
        const userSessions = Array.from(instance.activeSessions.entries())
          .filter(([, session]) => session.userId === currentUser.uid)
          .map(([sessionId]) => sessionId);

        for (const session of userSessions) {
          await instance.invalidateSession(session);
        }
      }

      await firebaseSignOut(auth);

    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out properly');
    }
  }

  /**
   * Enhanced password reset with security tracking
   */
  static async resetPassword(email: string): Promise<void> {
    const instance = AdvancedAuthService.getInstance();

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });

      // Log password reset request
      await instance.logSecurityEvent({
        userId: 'unknown',
        type: 'password_change',
        details: { action: 'password_reset_requested', email },
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
      });

    } catch (error) {
      await instance.logSecurityEvent({
        userId: 'unknown',
        type: 'suspicious_activity',
        details: { action: 'password_reset_failed', email, error: (error as Error).message },
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
      });

      throw new Error(instance.getAuthErrorMessage((error as { code?: string }).code));
    }
  }

  /**
   * Update password with enhanced security
   */
  static async updatePassword(newPassword: string, sessionId?: string): Promise<void> {
    const instance = AdvancedAuthService.getInstance();

    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      // Validate new password
      const passwordValidation = instance.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      await updatePassword(auth.currentUser, newPassword);

      // Log password change
      await instance.logSecurityEvent({
        userId: auth.currentUser.uid,
        type: 'password_change',
        details: { action: 'password_updated' },
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
      });

      // Invalidate all other sessions for security
      if (sessionId) {
        const userSessions = Array.from(instance.activeSessions.entries())
          .filter(([, session]) => session.userId === auth.currentUser!.uid && session.token !== sessionId)
          .map(([sessionId]) => sessionId);

        for (const session of userSessions) {
          await instance.invalidateSession(session);
        }
      }

    } catch (error) {
      throw new Error(instance.getAuthErrorMessage((error as { code?: string }).code));
    }
  }

  /**
   * Get active sessions for user
   */
  static async getActiveSessions(userId: string): Promise<AuthSession[]> {
    const instance = AdvancedAuthService.getInstance();

    // Get sessions from memory (for current session)
    const memorySessions = Array.from(instance.activeSessions.values())
      .filter(session => session.userId === userId && session.isActive);

    // In a real implementation, you'd also fetch from Firestore
    // to get sessions from other devices/browsers

    return memorySessions;
  }

  /**
   * Get security events for user
   */
  static async getSecurityEvents(userId: string, limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const q = query(
        collection(db, 'security_events'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as SecurityEvent[];

    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  /**
   * Configure security settings
   */
  configureSecurity(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
  }

  /**
   * Get current security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  /**
   * Enhanced error message handler
   */
  private static getAuthErrorMessage(errorCode?: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address format',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Account temporarily locked',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/weak-password': 'Password is too weak. Use at least 8 characters with mixed case, numbers, and symbols',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/multi-factor-auth-required': 'Multi-factor authentication required',
      'auth/requires-recent-login': 'Please sign in again to perform this action',
      'auth/operation-not-allowed': 'This operation is not allowed',
      'auth/account-exists-with-different-credential': 'An account already exists with this email',
      'auth/credential-already-in-use': 'This credential is already associated with another account',
      'auth/invalid-credential': 'Invalid credentials provided',
      'auth/user-token-expired': 'Your session has expired. Please sign in again',
      'auth/user-mismatch': 'User credential mismatch',
      'auth/invalid-verification-id': 'Invalid verification ID',
      'auth/quota-exceeded': 'Service quota exceeded. Please try again later',
      'auth/maximum-second-factor-count-exceeded': 'Maximum number of second factors exceeded',
      'auth/second-factor-already-enrolled': 'Second factor already enrolled',
      'auth/second-factor-required': 'Second factor authentication required',
    };

    return errorMessages[errorCode || ''] || 'Authentication failed. Please try again.';
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    this.activeSessions.clear();
    this.failedAttempts.clear();
  }
}

// Export singleton instance
export const advancedAuthService = AdvancedAuthService.getInstance();
