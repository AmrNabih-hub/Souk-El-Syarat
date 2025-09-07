/**
 * Enhanced Security Authentication Service
 * Bulletproof authentication with enterprise-level security
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
  deleteUser,
  reload,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  getIdToken,
  updateEmail,
  verifyBeforeUpdateEmail,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
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
  writeBatch,
  increment,
} from 'firebase/firestore';
import { ref, set, get, push } from 'firebase/database';
import { realtimeDb } from '@/config/firebase.config';
import InputSanitizationService from './input-sanitization.service';

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  role: string;
  permissions: string[];
  refreshToken: string;
  lastRefresh: Date;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  tokenExpiry: number; // in minutes
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  enableMFA: boolean;
  enableAccountLockout: boolean;
  enableAuditLogging: boolean;
  enableSuspiciousActivityDetection: boolean;
}

export class EnhancedSecurityAuthService {
  private static instance: EnhancedSecurityAuthService;
  private securityAuditLogs: SecurityAuditLog[] = [];
  private tokenCache: Map<string, AuthToken> = new Map();
  private failedAttempts: Map<string, { count: number; lastAttempt: Date; lockoutUntil?: Date }> = new Map();
  private activeSessions: Map<string, { userId: string; lastActivity: Date; ipAddress: string }> = new Map();
  
  private securitySettings: SecuritySettings = {
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    tokenExpiry: 60,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    enableMFA: true,
    enableAccountLockout: true,
    enableAuditLogging: true,
    enableSuspiciousActivityDetection: true,
  };

  static getInstance(): EnhancedSecurityAuthService {
    if (!EnhancedSecurityAuthService.instance) {
      EnhancedSecurityAuthService.instance = new EnhancedSecurityAuthService();
    }
    return EnhancedSecurityAuthService.instance;
  }

  // Initialize enhanced security auth
  static async initializeEnhancedAuth(): Promise<void> {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      const instance = EnhancedSecurityAuthService.getInstance();
      await instance.setupSecurityMonitoring();
      await instance.cleanupExpiredSessions();
      
      console.log('✅ Enhanced security auth initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced security auth:', error);
      throw error;
    }
  }

  // Enhanced sign up with comprehensive security
  static async secureSignUp(
    email: string,
    password: string,
    displayName: string,
    role: string = 'customer',
    additionalData?: Record<string, any>
  ): Promise<{ user: any; requiresVerification: boolean }> {
    const instance = EnhancedSecurityAuthService.getInstance();
    
    try {
      // Security validation
      await instance.validateSignUpData(email, password, displayName, role);
      
      // Check for existing user
      const existingUser = await instance.checkExistingUser(email);
      if (existingUser) {
        await instance.logSecurityEvent('unknown', 'signup_attempt_existing_email', false, 'Email already exists', 'medium');
        throw new Error('User already exists with this email');
      }

      // Check for suspicious activity
      await instance.checkSuspiciousActivity(email, 'signup');

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Update profile
      await updateProfile(firebaseUser, { displayName });

      // Create secure user document
      const userData = await instance.createSecureUserDocument(
        firebaseUser,
        displayName,
        role,
        additionalData
      );

      // Log successful signup
      await instance.logSecurityEvent(firebaseUser.uid, 'signup', true, undefined, 'low');

      // Setup MFA if enabled
      if (instance.securitySettings.enableMFA) {
        await instance.setupMFA(firebaseUser);
      }

      return {
        user: userData,
        requiresVerification: instance.securitySettings.requireEmailVerification
      };

    } catch (error: any) {
      await instance.logSecurityEvent('unknown', 'signup_failed', false, error.message, 'high');
      throw new Error(instance.getEnhancedAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced sign in with security checks
  static async secureSignIn(email: string, password: string): Promise<any> {
    const instance = EnhancedSecurityAuthService.getInstance();
    
    try {
      // Check for account lockout
      await instance.checkAccountLockout(email);
      
      // Validate input
      const emailValidation = InputSanitizationService.validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error('Invalid email format');
      }

      // Check for suspicious activity
      await instance.checkSuspiciousActivity(email, 'login');

      // Attempt sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Verify user document exists and is active
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User account not found');
      }

      const userData = userDoc.data();
      if (!userData.isActive) {
        await instance.logSecurityEvent(firebaseUser.uid, 'login_attempt_deactivated', false, 'Account deactivated', 'high');
        throw new Error('Account is deactivated');
      }

      // Check if email is verified
      if (instance.securitySettings.requireEmailVerification && !firebaseUser.emailVerified) {
        await instance.logSecurityEvent(firebaseUser.uid, 'login_attempt_unverified', false, 'Email not verified', 'medium');
        throw new Error('Email verification required');
      }

      // Reset failed attempts on successful login
      instance.failedAttempts.delete(email);

      // Update last login and session info
      await instance.updateUserSession(firebaseUser.uid, email);

      // Log successful login
      await instance.logSecurityEvent(firebaseUser.uid, 'login', true, undefined, 'low');

      // Create user object
      const user = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: userData.displayName || firebaseUser.displayName || 'User',
        phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || undefined,
        photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
        role: userData.role || 'customer',
        isActive: userData.isActive !== false,
        emailVerified: firebaseUser.emailVerified,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        preferences: userData.preferences || {
          language: 'ar' as 'ar' | 'en',
          currency: 'EGP' as 'EGP' | 'USD',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      };

      return user;

    } catch (error: any) {
      // Handle failed login attempts
      await instance.handleFailedLogin(email);
      
      // Log failed login
      await instance.logSecurityEvent('unknown', 'login_failed', false, error.message, 'high');
      
      throw new Error(instance.getEnhancedAuthErrorMessage(error.code, error.message));
    }
  }

  // Secure Google sign in
  static async secureGoogleSignIn(): Promise<any> {
    const instance = EnhancedSecurityAuthService.getInstance();
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check for suspicious activity
      await instance.checkSuspiciousActivity(firebaseUser.email!, 'google_login');

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        const userData = await instance.createSecureUserDocument(
          firebaseUser,
          firebaseUser.displayName || 'User',
          'customer'
        );
        
        await instance.logSecurityEvent(firebaseUser.uid, 'google_signup', true, undefined, 'low');
        return userData;
      } else {
        // Update existing user
        const userData = userDoc.data();
        await instance.updateUserSession(firebaseUser.uid, firebaseUser.email!);
        
        await instance.logSecurityEvent(firebaseUser.uid, 'google_login', true, undefined, 'low');
        
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: userData.displayName || firebaseUser.displayName || 'User',
          phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || undefined,
          photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
          role: userData.role || 'customer',
          isActive: userData.isActive !== false,
          emailVerified: firebaseUser.emailVerified,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          preferences: userData.preferences || {
            language: 'ar' as 'ar' | 'en',
            currency: 'EGP' as 'EGP' | 'USD',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };
      }
    } catch (error: any) {
      await instance.logSecurityEvent('unknown', 'google_login_failed', false, error.message, 'high');
      throw new Error(instance.getEnhancedAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced auth state listener with security monitoring
  static onEnhancedAuthStateChange(callback: (user: any | null) => void) {
    const instance = EnhancedSecurityAuthService.getInstance();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Verify user document exists and is active
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!userDoc.exists()) {
            console.warn('User document missing, signing out for security');
            await firebaseSignOut(auth);
            callback(null);
            return;
          }

          const userData = userDoc.data();
          
          // Check if user is active
          if (!userData.isActive) {
            console.warn('User account is deactivated');
            await firebaseSignOut(auth);
            callback(null);
            return;
          }

          // Check for suspicious activity
          if (instance.securitySettings.enableSuspiciousActivityDetection) {
            await instance.detectSuspiciousActivity(firebaseUser.uid);
          }

          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: userData.displayName || firebaseUser.displayName || 'User',
            phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || undefined,
            photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
            role: userData.role || 'customer',
            isActive: userData.isActive !== false,
            emailVerified: firebaseUser.emailVerified,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
            preferences: userData.preferences || {
              language: 'ar' as 'ar' | 'en',
              currency: 'EGP' as 'EGP' | 'USD',
              notifications: {
                email: true,
                sms: false,
                push: true,
              },
            },
          };

          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Enhanced auth state change error:', error);
        callback(null);
      }
    });

    return unsubscribe;
  }

  // Private helper methods

  private async validateSignUpData(
    email: string,
    password: string,
    displayName: string,
    role: string
  ): Promise<void> {
    // Email validation
    const emailValidation = InputSanitizationService.validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.errors[0]);
    }

    // Password validation
    const passwordValidation = InputSanitizationService.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Display name validation
    const nameValidation = InputSanitizationService.validateInput(displayName, {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\u0600-\u06FF\s]+$/
    });
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.errors[0]);
    }

    // Role validation
    if (!['customer', 'vendor', 'admin'].includes(role)) {
      throw new Error('Invalid user role');
    }
  }

  private async checkExistingUser(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking existing user:', error);
      return false;
    }
  }

  private async createSecureUserDocument(
    firebaseUser: FirebaseUser,
    displayName: string,
    role: string,
    additionalData?: Record<string, any>
  ): Promise<any> {
    const userData = {
      email: firebaseUser.email!,
      displayName,
      phoneNumber: firebaseUser.phoneNumber || null,
      photoURL: firebaseUser.photoURL || null,
      role,
      isActive: true,
      emailVerified: firebaseUser.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      loginCount: 1,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      securitySettings: {
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: [],
        trustedDevices: [],
        securityQuestions: []
      },
      preferences: {
        language: 'ar' as 'ar' | 'en',
        currency: 'EGP' as 'EGP' | 'USD',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
      ...additionalData
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      id: firebaseUser.uid,
      ...userData,
      preferences: {
        ...userData.preferences,
        language: userData.preferences.language as 'ar' | 'en',
        currency: userData.preferences.currency as 'EGP' | 'USD',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async checkAccountLockout(email: string): Promise<void> {
    const failedAttempt = this.failedAttempts.get(email);
    if (failedAttempt) {
      const now = new Date();
      const timeSinceLastAttempt = now.getTime() - failedAttempt.lastAttempt.getTime();
      
      if (failedAttempt.lockoutUntil && now < failedAttempt.lockoutUntil) {
        const remainingTime = Math.ceil((failedAttempt.lockoutUntil.getTime() - now.getTime()) / 60000);
        throw new Error(`Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`);
      }
      
      if (failedAttempt.count >= this.securitySettings.maxLoginAttempts && 
          timeSinceLastAttempt < this.securitySettings.lockoutDuration * 60 * 1000) {
        const remainingTime = Math.ceil((this.securitySettings.lockoutDuration * 60 * 1000 - timeSinceLastAttempt) / 60000);
        throw new Error(`Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`);
      }
    }
  }

  private async handleFailedLogin(email: string): Promise<void> {
    const failedAttempt = this.failedAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    failedAttempt.count += 1;
    failedAttempt.lastAttempt = new Date();
    
    if (failedAttempt.count >= this.securitySettings.maxLoginAttempts) {
      failedAttempt.lockoutUntil = new Date(Date.now() + this.securitySettings.lockoutDuration * 60 * 1000);
    }
    
    this.failedAttempts.set(email, failedAttempt);
  }

  private async updateUserSession(userId: string, email: string): Promise<void> {
    const now = new Date();
    const ipAddress = await this.getClientIP();
    
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      lastLoginAt: serverTimestamp(),
      loginCount: increment(1),
      lastIPAddress: ipAddress,
      lastUserAgent: navigator.userAgent,
      updatedAt: serverTimestamp()
    });

    // Update active sessions
    this.activeSessions.set(userId, {
      userId,
      lastActivity: now,
      ipAddress
    });

    // Store session in Realtime Database
    const sessionRef = ref(realtimeDb, `activeSessions/${userId}`);
    await set(sessionRef, {
      userId,
      email,
      lastActivity: now.toISOString(),
      ipAddress,
      userAgent: navigator.userAgent
    });
  }

  private async checkSuspiciousActivity(email: string, action: string): Promise<void> {
    // Check for rapid successive attempts
    const recentAttempts = this.securityAuditLogs.filter(log => 
      log.userId === email && 
      log.action === action &&
      Date.now() - log.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentAttempts.length > 10) {
      await this.logSecurityEvent(email, 'suspicious_activity', false, 'Too many rapid attempts', 'critical');
      throw new Error('Suspicious activity detected. Please try again later.');
    }
  }

  private async detectSuspiciousActivity(userId: string): Promise<void> {
    // Check for unusual login patterns
    const recentLogins = this.securityAuditLogs.filter(log => 
      log.userId === userId && 
      log.action === 'login' &&
      Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    if (recentLogins.length > 20) {
      await this.logSecurityEvent(userId, 'suspicious_login_pattern', false, 'Unusual login frequency', 'high');
    }
  }

  private async setupMFA(firebaseUser: FirebaseUser): Promise<void> {
    // Setup Multi-Factor Authentication
    // This would integrate with Firebase MFA
    console.log('MFA setup for user:', firebaseUser.uid);
  }

  private async logSecurityEvent(
    userId: string,
    action: string,
    success: boolean,
    errorMessage?: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    const log: SecurityAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      timestamp: new Date(),
      success,
      errorMessage,
      riskLevel,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      metadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }
    };

    this.securityAuditLogs.push(log);

    // Store in Firestore for admin review
    try {
      await setDoc(doc(db, 'securityAuditLogs', log.id), {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }

    // Store in Realtime Database for real-time monitoring
    try {
      const realTimeRef = ref(realtimeDb, `securityLogs/${log.id}`);
      await set(realTimeRef, log);
    } catch (error) {
      console.error('Failed to log security event to Realtime Database:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private async setupSecurityMonitoring(): Promise<void> {
    // Monitor for suspicious activity
    setInterval(() => {
      this.cleanupExpiredTokens();
      this.cleanupOldFailedAttempts();
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [userId, token] of this.tokenCache.entries()) {
      if (token.expiresAt <= now) {
        this.tokenCache.delete(userId);
      }
    }
  }

  private cleanupOldFailedAttempts(): void {
    const now = new Date();
    for (const [email, attempt] of this.failedAttempts.entries()) {
      if (attempt.lockoutUntil && now > attempt.lockoutUntil) {
        this.failedAttempts.delete(email);
      }
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    for (const [userId, session] of this.activeSessions.entries()) {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceActivity > 24 * 60 * 60 * 1000) { // 24 hours
        expiredSessions.push(userId);
      }
    }
    
    for (const userId of expiredSessions) {
      this.activeSessions.delete(userId);
    }
  }

  private getEnhancedAuthErrorMessage(code: string, message: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account already exists with this email',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/requires-recent-login': 'Please sign in again to complete this action',
      'auth/invalid-credential': 'Invalid credentials. Please check and try again',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email',
      'auth/operation-not-allowed': 'This sign-in method is not enabled',
    };

    return errorMessages[code] || 'Authentication failed. Please try again.';
  }
}

// Initialize enhanced security auth
EnhancedSecurityAuthService.initializeEnhancedAuth().catch(console.error);

export default EnhancedSecurityAuthService;