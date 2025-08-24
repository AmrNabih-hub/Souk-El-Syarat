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
  FacebookAuthProvider,
  TwitterAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  multiFactor,
  MultiFactorError,
  PhoneMultiFactorGenerator,
  RecaptchaVerifierInstance,
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
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { User, UserRole } from '@/types';

export interface EnhancedAuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isMultiFactorEnabled: boolean;
  lastActivity: Date | null;
  sessionExpiry: Date | null;
}

export interface AdminAuthData {
  email: string;
  password: string;
  adminCode: string;
}

export interface MultiFactorSetupData {
  phoneNumber: string;
  verificationCode: string;
}

export class EnhancedAuthService {
  private static instance: EnhancedAuthService;
  private authStateListeners: Set<(state: EnhancedAuthState) => void> = new Set();
  private sessionTimeout: NodeJS.Timeout | null = null;
  private lastActivityUpdate: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Initialize auth providers with enhanced security
  static googleProvider = new GoogleAuthProvider();
  static facebookProvider = new FacebookAuthProvider();
  static twitterProvider = new TwitterAuthProvider();
  static phoneProvider = new PhoneAuthProvider(auth);

  // Configure Google provider
  static {
    EnhancedAuthService.googleProvider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'offline',
      include_granted_scopes: true,
    });
  }

  private constructor() {
    this.initializeAuthStateListener();
    this.startActivityTracking();
  }

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  /**
   * Initialize real-time auth state listener
   */
  private initializeAuthStateListener(): void {
    onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              ...userData,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
            };

            // Update last login time
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            // Start session timer
            this.startSessionTimer();

            // Notify listeners
            this.notifyAuthStateChange({
              user,
              isLoading: false,
              error: null,
              isAuthenticated: true,
              isEmailVerified: firebaseUser.emailVerified,
              isMultiFactorEnabled: firebaseUser.multiFactor.enrolledFactors.length > 0,
              lastActivity: new Date(),
              sessionExpiry: new Date(Date.now() + this.SESSION_DURATION),
            });
          } else {
            // User document doesn't exist - create it
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'User',
              phoneNumber: firebaseUser.phoneNumber || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              role: 'customer',
              isActive: true,
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              preferences: {
                language: 'ar',
                currency: 'EGP',
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
              },
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });

            this.notifyAuthStateChange({
              user: newUser,
              isLoading: false,
              error: null,
              isAuthenticated: true,
              isEmailVerified: firebaseUser.emailVerified,
              isMultiFactorEnabled: firebaseUser.multiFactor.enrolledFactors.length > 0,
              lastActivity: new Date(),
              sessionExpiry: new Date(Date.now() + this.SESSION_DURATION),
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') console.error('Error getting user data:', error);
          this.notifyAuthStateChange({
            user: null,
            isLoading: false,
            error: 'Failed to get user data',
            isAuthenticated: false,
            isEmailVerified: false,
            isMultiFactorEnabled: false,
            lastActivity: null,
            sessionExpiry: null,
          });
        }
      } else {
        // User signed out
        this.clearSessionTimer();
        this.notifyAuthStateChange({
          user: null,
          isLoading: false,
          error: null,
          isAuthenticated: false,
          isEmailVerified: false,
          isMultiFactorEnabled: false,
          lastActivity: null,
          sessionExpiry: null,
        });
      }
    });
  }

  /**
   * Start activity tracking
   */
  private startActivityTracking(): void {
    this.lastActivityUpdate = setInterval(() => {
      this.updateLastActivity();
    }, this.ACTIVITY_UPDATE_INTERVAL);

    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => this.updateLastActivity(), { passive: true });
    });
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        lastActivity: serverTimestamp(),
      }).catch(console.error);
    }
  }

  /**
   * Start session timer
   */
  private startSessionTimer(): void {
    this.clearSessionTimer();
    this.sessionTimeout = setTimeout(() => {
      this.signOut();
    }, this.SESSION_DURATION);
  }

  /**
   * Clear session timer
   */
  private clearSessionTimer(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Notify auth state change listeners
   */
  private notifyAuthStateChange(state: EnhancedAuthState): void {
    this.authStateListeners.forEach(listener => listener(state));
  }

  /**
   * Subscribe to auth state changes
   */
  subscribeToAuthState(callback: (state: EnhancedAuthState) => void): () => void {
    this.authStateListeners.add(callback);
    return () => this.authStateListeners.delete(callback);
  }

  /**
   * Enhanced sign up with real-time validation
   */
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer',
    phoneNumber?: string
  ): Promise<User> {
    try {
      // Validate admin role creation
      if (role === 'admin') {
        throw new Error('Admin accounts cannot be created through regular signup');
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send email verification
      await sendEmailVerification(firebaseUser, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      // Update Firebase auth profile
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email!,
        displayName,
        phoneNumber: phoneNumber || firebaseUser.phoneNumber || undefined,
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
            email: true,
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

      return { id: firebaseUser.uid, ...userData };
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Admin authentication with enhanced security
   */
  static async adminSignIn(adminData: AdminAuthData): Promise<User> {
    try {
      // Verify admin code (in production, this would be stored securely)
      const validAdminCodes = ['ADMIN_2024', 'SOUK_ADMIN', 'EL_SAYARAT_ADMIN'];
      if (!validAdminCodes.includes(adminData.adminCode)) {
        throw new Error('Invalid admin code');
      }

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        adminData.email,
        adminData.password
      );
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('Admin user not found');
      }

      const userData = userDoc.data();

      // Verify admin role
      if (userData.role !== 'admin') {
        throw new Error('Access denied: Admin privileges required');
      }

      // Check if admin account is active
      if (!userData.isActive) {
        throw new Error('Admin account is deactivated');
      }

      // Update last login time
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: firebaseUser.uid,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
      };
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Enhanced sign in with real-time validation
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();

      // Check if user is active
      if (!userData.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Check if email is verified (for non-admin users)
      if (userData.role !== 'admin' && !firebaseUser.emailVerified) {
        throw new Error('Please verify your email before signing in');
      }

      // Update last login time
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: firebaseUser.uid,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
      };
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Social sign in with enhanced security
   */
  static async signInWithGoogle(): Promise<User> {
    try {
      const userCredential = await signInWithPopup(auth, EnhancedAuthService.googleProvider);
      const firebaseUser = userCredential.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (!userData.isActive) {
          throw new Error('Account is deactivated. Please contact support.');
        }

        // Update last login time
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return {
          id: firebaseUser.uid,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        };
      } else {
        // Create new user from Google sign-in
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || undefined,
          role: 'customer',
          isActive: true,
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          preferences: {
            language: 'ar',
            currency: 'EGP',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        return newUser;
      }
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign out with cleanup
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);

      // Clear session timer
      const instance = EnhancedAuthService.getInstance();
      instance.clearSessionTimer();

      // console.log('User signed out successfully');
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Reset password with enhanced security
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update user profile with real-time sync
   */
  static async updateProfile(updates: Partial<User>): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      // Update Firebase auth profile if displayName or photoURL changed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // Update Firestore document
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update password with enhanced security
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Enable multi-factor authentication
   */
  static async enableMultiFactor(phoneNumber: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      // Send verification code
      const session = await EnhancedAuthService.phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      );

      // Store session for verification
      (window as any).multiFactorSession = session;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Verify multi-factor authentication
   */
  static async verifyMultiFactor(verificationCode: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      const session = (window as any).multiFactorSession;
      if (!session) {
        throw new Error('No verification session found');
      }

      // Create credential
      const credential = PhoneAuthProvider.credential(session, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);

      // Complete multi-factor enrollment
      await multiFactor(auth.currentUser).enroll(multiFactorAssertion, 'Phone Number');

      // Update user document
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        multiFactorEnabled: true,
        updatedAt: serverTimestamp(),
      });

      // Clear session
      delete (window as any).multiFactorSession;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Get enhanced auth error messages
   */
  private static getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/weak-password': 'Password is too weak. Use at least 8 characters',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/multi-factor-auth-required': 'Multi-factor authentication required',
      'auth/requires-recent-login': 'Please sign in again to perform this action',
      'auth/operation-not-allowed': 'This operation is not allowed',
      'auth/account-exists-with-different-credential': 'An account already exists with this email',
      'auth/credential-already-in-use':
        'This credential is already associated with another account',
      'auth/invalid-credential': 'Invalid credentials',
      'auth/user-token-expired': 'Your session has expired. Please sign in again',
      'auth/user-mismatch': 'User mismatch error',
      'auth/invalid-verification-id': 'Invalid verification ID',
      'auth/quota-exceeded': 'Service quota exceeded. Please try again later',
    };

    return errorMessages[errorCode] || 'Authentication failed. Please try again.';
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.lastActivityUpdate) {
      clearInterval(this.lastActivityUpdate);
    }
    this.clearSessionTimer();
    this.authStateListeners.clear();
  }
}
