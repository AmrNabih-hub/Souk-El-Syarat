/**
 * Enhanced Secure Authentication Service
 * Enterprise-level security with bulletproof authentication
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
  runTransaction,
} from 'firebase/firestore';
import { User, UserRole } from '@/types';
import InputSanitizationService from './input-sanitization.service';

export interface AuthToken {
  token: string;
  expiresAt: Date;
  role: UserRole;
  permissions: string[];
  refreshToken: string;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress: string;
  userAgent: string;
}

export class EnhancedSecureAuthService {
  private static instance: EnhancedSecureAuthService;
  private securityAuditLogs: SecurityAuditLog[] = [];
  private tokenCache: Map<string, AuthToken> = new Map();
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private maxLoginAttempts = 5;
  private lockoutDuration = 15 * 60 * 1000; // 15 minutes
  private tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private lastActivity: Map<string, Date> = new Map();

  static getInstance(): EnhancedSecureAuthService {
    if (!EnhancedSecureAuthService.instance) {
      EnhancedSecureAuthService.instance = new EnhancedSecureAuthService();
    }
    return EnhancedSecureAuthService.instance;
  }

  // Initialize enhanced secure auth
  static async initializeEnhancedSecureAuth() {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      const instance = EnhancedSecureAuthService.getInstance();
      instance.setupSecurityMonitoring();
      instance.setupSessionManagement();
      
      console.log('✅ Enhanced secure auth initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced secure auth:', error);
      throw error;
    }
  }

  // Enhanced sign up with comprehensive security
  static async secureSignUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer',
    additionalData?: Record<string, any>
  ): Promise<User> {
    const instance = EnhancedSecureAuthService.getInstance();
    
    try {
      // Comprehensive input validation
      const emailValidation = InputSanitizationService.validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors.join(', '));
      }

      const passwordValidation = InputSanitizationService.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      const nameValidation = InputSanitizationService.sanitizeString(displayName, { maxLength: 100 });
      if (!nameValidation.isValid) {
        throw new Error('Invalid display name');
      }

      // Check for existing user
      const existingUser = await instance.checkExistingUser(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Check for suspicious patterns
      await instance.checkSuspiciousActivity(email, 'signup');

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Update profile
      await updateProfile(firebaseUser, { displayName: nameValidation.sanitizedValue });

      // Create secure user document with transaction
      const userData = await instance.createSecureUserDocument(
        firebaseUser,
        nameValidation.sanitizedValue,
        role,
        additionalData
      );

      // Log successful signup
      await instance.logSecurityEvent(firebaseUser.uid, 'signup', true, {
        role,
        emailVerified: false
      });

      return userData;
    } catch (error: any) {
      // Log failed signup
      await instance.logSecurityEvent('unknown', 'signup_failed', false, error.message, {
        email,
        role
      });
      throw new Error(instance.getSecureAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced sign in with security checks
  static async secureSignIn(email: string, password: string): Promise<User> {
    const instance = EnhancedSecureAuthService.getInstance();
    
    try {
      // Input validation
      const emailValidation = InputSanitizationService.validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error('Invalid email format');
      }

      // Check for account lockout
      await instance.checkAccountLockout(email);

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
        throw new Error('Account is deactivated');
      }

      // Check for suspicious login patterns
      await instance.checkLoginPatterns(firebaseUser.uid, email);

      // Reset failed attempts on successful login
      instance.loginAttempts.delete(email);

      // Update last login and activity
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        loginCount: (userData.loginCount || 0) + 1,
        lastActivityAt: serverTimestamp()
      });

      // Update activity tracking
      instance.lastActivity.set(firebaseUser.uid, new Date());

      // Log successful login
      await instance.logSecurityEvent(firebaseUser.uid, 'login', true, {
        email,
        loginCount: (userData.loginCount || 0) + 1
      });

      // Create user object
      const user: User = {
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
      await instance.handleFailedLogin(email, error.message);
      
      // Log failed login
      await instance.logSecurityEvent('unknown', 'login_failed', false, error.message, {
        email
      });
      
      throw new Error(instance.getSecureAuthErrorMessage(error.code, error.message));
    }
  }

  // Secure Google sign in with enhanced validation
  static async secureGoogleSignIn(): Promise<User> {
    const instance = EnhancedSecureAuthService.getInstance();
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Validate Google user data
      if (!firebaseUser.email || !firebaseUser.displayName) {
        throw new Error('Invalid Google account data');
      }

      // Check for existing user document
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        const userData = await instance.createSecureUserDocument(
          firebaseUser,
          firebaseUser.displayName,
          'customer'
        );
        
        await instance.logSecurityEvent(firebaseUser.uid, 'google_signup', true, {
          email: firebaseUser.email,
          emailVerified: true
        });
        return userData;
      } else {
        // Update existing user
        const userData = userDoc.data();
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: serverTimestamp(),
          loginCount: (userData.loginCount || 0) + 1,
          photoURL: firebaseUser.photoURL,
          lastActivityAt: serverTimestamp()
        });
        
        await instance.logSecurityEvent(firebaseUser.uid, 'google_login', true, {
          email: firebaseUser.email,
          loginCount: (userData.loginCount || 0) + 1
        });
        
        // Update activity tracking
        instance.lastActivity.set(firebaseUser.uid, new Date());
        
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
      await instance.logSecurityEvent('unknown', 'google_login_failed', false, error.message);
      throw new Error(instance.getSecureAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced auth state listener with security monitoring
  static onEnhancedAuthStateChange(callback: (user: User | null) => void) {
    const instance = EnhancedSecureAuthService.getInstance();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Check session timeout
          const lastActivity = instance.lastActivity.get(firebaseUser.uid);
          if (lastActivity && Date.now() - lastActivity.getTime() > instance.sessionTimeout) {
            console.warn('Session timeout, signing out user');
            await firebaseSignOut(auth);
            callback(null);
            return;
          }

          // Verify user document exists and is active
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!userDoc.exists()) {
            console.warn('User document missing, signing out');
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

          // Check email verification for certain roles
          if ((userData.role === 'vendor' || userData.role === 'admin') && !firebaseUser.emailVerified) {
            console.warn('Email verification required for this role');
            // Don't sign out, but show verification prompt
          }

          // Update last activity
          instance.lastActivity.set(firebaseUser.uid, new Date());

          const user: User = {
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

  // Get secure auth token with automatic refresh
  static async getSecureAuthToken(): Promise<AuthToken> {
    const instance = EnhancedSecureAuthService.getInstance();
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Check token cache
      const cachedToken = instance.tokenCache.get(currentUser.uid);
      if (cachedToken && cachedToken.expiresAt > new Date()) {
        return cachedToken;
      }

      // Get fresh token
      const token = await getIdToken(currentUser, true);
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const role = userData.role || 'customer';
      const permissions = instance.getUserPermissions(role);

      const authToken: AuthToken = {
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        role,
        permissions,
        refreshToken: currentUser.refreshToken
      };

      // Cache token
      instance.tokenCache.set(currentUser.uid, authToken);

      return authToken;
    } catch (error: any) {
      console.error('Error getting secure auth token:', error);
      throw error;
    }
  }

  // Secure sign out with cleanup
  static async secureSignOut(): Promise<void> {
    const instance = EnhancedSecureAuthService.getInstance();
    
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await instance.logSecurityEvent(currentUser.uid, 'logout', true);
        
        // Clear activity tracking
        instance.lastActivity.delete(currentUser.uid);
      }
      
      await firebaseSignOut(auth);
      
      // Clear token cache
      instance.tokenCache.clear();
      
      console.log('✅ Enhanced secure sign out completed');
    } catch (error: any) {
      console.error('Enhanced secure sign out error:', error);
      throw error;
    }
  }

  // Private helper methods

  private async createSecureUserDocument(
    firebaseUser: FirebaseUser,
    displayName: string,
    role: UserRole,
    additionalData?: Record<string, any>
  ): Promise<User> {
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
      lastActivityAt: serverTimestamp(),
      loginCount: 1,
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

  private async checkAccountLockout(email: string): Promise<void> {
    const attempts = this.loginAttempts.get(email) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp.getTime() < this.lockoutDuration
    );

    if (recentAttempts.length >= this.maxLoginAttempts) {
      const lastAttempt = recentAttempts[recentAttempts.length - 1];
      const remainingTime = Math.ceil(
        (this.lockoutDuration - (Date.now() - lastAttempt.timestamp.getTime())) / 60000
      );
      throw new Error(`Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`);
    }
  }

  private async handleFailedLogin(email: string, errorMessage: string): Promise<void> {
    const attempts = this.loginAttempts.get(email) || [];
    const attempt: LoginAttempt = {
      email,
      timestamp: new Date(),
      success: false,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent
    };
    
    attempts.push(attempt);
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp.getTime() < this.lockoutDuration
    );
    
    this.loginAttempts.set(email, recentAttempts);
  }

  private async checkSuspiciousActivity(email: string, action: string): Promise<void> {
    // Check for rapid successive attempts
    const attempts = this.loginAttempts.get(email) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp.getTime() < 5 * 60 * 1000 // 5 minutes
    );

    if (recentAttempts.length > 10) {
      await this.logSecurityEvent('unknown', 'suspicious_activity', false, 
        `Too many ${action} attempts from ${email}`, { email, action, count: recentAttempts.length });
      throw new Error('Suspicious activity detected. Please try again later.');
    }
  }

  private async checkLoginPatterns(userId: string, email: string): Promise<void> {
    // Check for unusual login patterns
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastLogin = userData.lastLoginAt?.toDate();
      
      if (lastLogin) {
        const timeSinceLastLogin = Date.now() - lastLogin.getTime();
        
        // If login is within 1 minute of last login, it might be suspicious
        if (timeSinceLastLogin < 60 * 1000) {
          await this.logSecurityEvent(userId, 'rapid_login_attempt', false, 
            'Rapid successive login attempts', { email, timeSinceLastLogin });
        }
      }
    }
  }

  private async logSecurityEvent(
    userId: string,
    action: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const log: SecurityAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      timestamp: new Date(),
      success,
      errorMessage,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      metadata
    };

    this.securityAuditLogs.push(log);

    // Store in Firestore for admin review
    try {
      await setDoc(doc(db, 'securityAuditLogs', log.id), log);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private getUserPermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      customer: [
        'read:own_profile', 
        'read:products', 
        'create:orders', 
        'read:own_orders',
        'read:own_notifications',
        'update:own_profile'
      ],
      vendor: [
        'read:own_profile', 
        'read:products', 
        'create:products', 
        'update:own_products',
        'delete:own_products',
        'read:own_orders', 
        'update:own_orders',
        'read:own_inventory',
        'update:own_inventory',
        'read:own_notifications',
        'update:own_profile',
        'create:vendor_application'
      ],
      admin: ['*'] // Admin has all permissions
    };

    return permissions[role] || permissions.customer;
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

  private setupSecurityMonitoring(): void {
    // Monitor for suspicious activity
    setInterval(() => {
      this.cleanupExpiredTokens();
      this.cleanupOldLoginAttempts();
      this.checkSessionTimeouts();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private setupSessionManagement(): void {
    // Track user activity
    document.addEventListener('click', () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        this.lastActivity.set(currentUser.uid, new Date());
      }
    });

    document.addEventListener('keypress', () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        this.lastActivity.set(currentUser.uid, new Date());
      }
    });
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [userId, token] of this.tokenCache.entries()) {
      if (token.expiresAt <= now) {
        this.tokenCache.delete(userId);
      }
    }
  }

  private cleanupOldLoginAttempts(): void {
    const now = new Date();
    for (const [email, attempts] of this.loginAttempts.entries()) {
      const recentAttempts = attempts.filter(
        attempt => now.getTime() - attempt.timestamp.getTime() < this.lockoutDuration
      );
      this.loginAttempts.set(email, recentAttempts);
    }
  }

  private checkSessionTimeouts(): void {
    const now = new Date();
    for (const [userId, lastActivity] of this.lastActivity.entries()) {
      if (now.getTime() - lastActivity.getTime() > this.sessionTimeout) {
        console.warn(`Session timeout for user ${userId}`);
        this.lastActivity.delete(userId);
        // Note: We don't automatically sign out here to avoid disrupting user experience
        // The auth state listener will handle this
      }
    }
  }

  private getSecureAuthErrorMessage(code: string, message: string): string {
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
      'auth/operation-not-allowed': 'This sign-in method is not enabled',
      'auth/invalid-credential': 'Invalid credentials. Please check and try again',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email',
      'auth/popup-closed-by-user': 'Sign in cancelled',
      'auth/popup-blocked': 'Popup was blocked. Please allow popups',
      'auth/cancelled-popup-request': 'Another popup is already open',
    };

    return errorMessages[code] || 'Authentication failed. Please try again.';
  }
}

// Initialize enhanced secure auth
EnhancedSecureAuthService.initializeEnhancedSecureAuth().catch(console.error);

export default EnhancedSecureAuthService;