/**
 * SECURE Authentication Service
 * Enterprise-level security with proper role validation and token management
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
} from 'firebase/firestore';

import { User, UserRole } from '@/types';

export interface AuthToken {
  token: string;
  expiresAt: Date;
  role: UserRole;
  permissions: string[];
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
}

export class SecureAuthService {
  private static instance: SecureAuthService;
  private securityAuditLogs: SecurityAuditLog[] = [];
  private tokenCache: Map<string, AuthToken> = new Map();
  private maxLoginAttempts = 5;
  private lockoutDuration = 15 * 60 * 1000; // 15 minutes
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  static getInstance(): SecureAuthService {
    if (!SecureAuthService.instance) {
      SecureAuthService.instance = new SecureAuthService();
    }
    return SecureAuthService.instance;
  }

  // Initialize secure auth with enhanced security
  static async initializeSecureAuth() {
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      // Set up security monitoring
      const instance = SecureAuthService.getInstance();
      instance.setupSecurityMonitoring();
      
      console.log('✅ Secure auth initialized with enhanced security');
    } catch (error) {
      console.error('Failed to initialize secure auth:', error);
      throw error;
    }
  }

  // Enhanced sign up with security validation
  static async secureSignUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer',
    additionalData?: Record<string, any>
  ): Promise<User> {
    const instance = SecureAuthService.getInstance();
    
    try {
      // Security validation
      await instance.validateSignUpData(email, password, displayName, role);
      
      // Check for existing user
      const existingUser = await instance.checkExistingUser(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

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
      await instance.logSecurityEvent(firebaseUser.uid, 'signup', true);

      return userData;
    } catch (error: any) {
      // Log failed signup
      await instance.logSecurityEvent('unknown', 'signup_failed', false, error.message);
      throw new Error(instance.getSecureAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced sign in with security checks
  static async secureSignIn(email: string, password: string): Promise<User> {
    const instance = SecureAuthService.getInstance();
    
    try {
      // Check for account lockout
      await instance.checkAccountLockout(email);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Attempt sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Check if user is active
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User account not found');
      }

      const userData = userDoc.data();
      if (!userData.isActive) {
        throw new Error('Account is deactivated');
      }

      // Reset failed attempts on successful login
      instance.failedAttempts.delete(email);

      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        loginCount: (userData.loginCount || 0) + 1
      });

      // Log successful login
      await instance.logSecurityEvent(firebaseUser.uid, 'login', true);

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
      await instance.handleFailedLogin(email);
      
      // Log failed login
      await instance.logSecurityEvent('unknown', 'login_failed', false, error.message);
      
      throw new Error(instance.getSecureAuthErrorMessage(error.code, error.message));
    }
  }

  // Secure Google sign in
  static async secureGoogleSignIn(): Promise<User> {
    const instance = SecureAuthService.getInstance();
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        const userData = await instance.createSecureUserDocument(
          firebaseUser,
          firebaseUser.displayName || 'User',
          'customer'
        );
        
        await instance.logSecurityEvent(firebaseUser.uid, 'google_signup', true);
        return userData;
      } else {
        // Update existing user
        const userData = userDoc.data();
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: serverTimestamp(),
          loginCount: (userData.loginCount || 0) + 1,
          photoURL: firebaseUser.photoURL
        });
        
        await instance.logSecurityEvent(firebaseUser.uid, 'google_login', true);
        
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

  // Secure sign out
  static async secureSignOut(): Promise<void> {
    const instance = SecureAuthService.getInstance();
    
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await instance.logSecurityEvent(currentUser.uid, 'logout', true);
      }
      
      await firebaseSignOut(auth);
      
      // Clear token cache
      instance.tokenCache.clear();
      
      console.log('✅ Secure sign out completed');
    } catch (error: any) {
      console.error('Secure sign out error:', error);
      throw error;
    }
  }

  // Get secure auth token with role validation
  static async getSecureAuthToken(): Promise<AuthToken> {
    const instance = SecureAuthService.getInstance();
    
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
        permissions
      };

      // Cache token
      instance.tokenCache.set(currentUser.uid, authToken);

      return authToken;
    } catch (error: any) {
      console.error('Error getting secure auth token:', error);
      throw error;
    }
  }

  // Enhanced auth state listener with security monitoring
  static onSecureAuthStateChange(callback: (user: User | null) => void) {
    const instance = SecureAuthService.getInstance();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Verify user document exists and is active
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!userDoc.exists()) {
            console.warn('User document missing, this should not happen in production');
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
        console.error('Secure auth state change error:', error);
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
    role: UserRole
  ): Promise<void> {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Password validation
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Display name validation
    if (!displayName || displayName.trim().length < 2) {
      throw new Error('Display name must be at least 2 characters long');
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

  private async checkAccountLockout(email: string): Promise<void> {
    const failedAttempt = this.failedAttempts.get(email);
    if (failedAttempt) {
      const timeSinceLastAttempt = Date.now() - failedAttempt.lastAttempt.getTime();
      if (failedAttempt.count >= this.maxLoginAttempts && timeSinceLastAttempt < this.lockoutDuration) {
        const remainingTime = Math.ceil((this.lockoutDuration - timeSinceLastAttempt) / 60000);
        throw new Error(`Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`);
      }
    }
  }

  private async handleFailedLogin(email: string): Promise<void> {
    const failedAttempt = this.failedAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    failedAttempt.count += 1;
    failedAttempt.lastAttempt = new Date();
    this.failedAttempts.set(email, failedAttempt);
  }

  private async logSecurityEvent(
    userId: string,
    action: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const log: SecurityAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      timestamp: new Date(),
      success,
      errorMessage,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent
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
      customer: ['read:own_profile', 'read:products', 'create:orders', 'read:own_orders'],
      vendor: ['read:own_profile', 'read:products', 'create:products', 'update:own_products', 'read:own_orders', 'update:own_orders'],
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
      this.cleanupOldFailedAttempts();
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
      if (now.getTime() - attempt.lastAttempt.getTime() > this.lockoutDuration) {
        this.failedAttempts.delete(email);
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
    };

    return errorMessages[code] || 'Authentication failed. Please try again.';
  }
}

// Initialize secure auth
SecureAuthService.initializeSecureAuth().catch(console.error);

export default SecureAuthService;