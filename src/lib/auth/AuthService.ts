/**
 * Enhanced Authentication Service
 * Bulletproof authentication with multiple providers and security features
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  sendEmailVerification,
  GoogleAuthProvider,
  User as FirebaseUser,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';

import { auth, db } from '@/config/firebase.config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { AUTH_CONFIG, USER_ROLES } from '../constants';
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError,
  ErrorHandler,
  ErrorRecovery,
} from '../errors';

import type { User, UserRole, CreateUserData, LoginCredentials } from '@/types';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthResult {
  user: User;
  isNewUser: boolean;
  requiresEmailVerification: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private authStateListeners: ((user: User | null) => void)[] = [];
  private currentUser: User | null = null;
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  private constructor() {
    this.initializeAuthListener();
    this.loadStoredUser();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize Firebase Auth State Listener
  private initializeAuthListener(): void {
    onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const user = await this.createUserFromFirebaseUser(firebaseUser);
          this.setCurrentUser(user);
        } else {
          this.setCurrentUser(null);
        }
      } catch (error) {
        ErrorHandler.handle(error as Error, { context: 'auth_state_change' });
        this.setCurrentUser(null);
      }
    });
  }

  // Email/Password Authentication
  public async signInWithEmail(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password, rememberMe } = credentials;

    // Check rate limiting
    this.checkRateLimit(email);

    try {
      // Validate input
      this.validateEmail(email);
      this.validatePassword(password);

      // Sign in with Firebase
      const userCredential = await ErrorRecovery.retry(
        () => signInWithEmailAndPassword(auth, email, password)
      );

      // Clear login attempts on success
      this.loginAttempts.delete(email);

      // Create user object
      const user = await this.createUserFromFirebaseUser(userCredential.user);

      // Handle remember me
      if (rememberMe) {
        this.storeUserData(user);
      }

      // Update last login
      await this.updateLastLogin(user.id);

      return {
        user,
        isNewUser: false,
        requiresEmailVerification: !userCredential.user.emailVerified,
      };

    } catch (error: any) {
      // Track failed attempts
      this.trackFailedLogin(email);

      if (error.code === 'auth/user-not-found') {
        throw new AuthenticationError(
          'USER_NOT_FOUND',
          'User not found',
          'البريد الإلكتروني غير مسجل في النظام'
        );
      }

      if (error.code === 'auth/wrong-password') {
        throw new AuthenticationError(
          'INVALID_PASSWORD',
          'Invalid password',
          'كلمة المرور غير صحيحة'
        );
      }

      if (error.code === 'auth/too-many-requests') {
        throw new AuthenticationError(
          'TOO_MANY_REQUESTS',
          'Too many failed attempts',
          'تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة لاحقاً'
        );
      }

      throw new AuthenticationError(
        'LOGIN_FAILED',
        error.message,
        'فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى'
      );
    }
  }

  // Google OAuth Authentication
  public async signInWithGoogle(): Promise<AuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const userCredential = await ErrorRecovery.retry(
        () => signInWithPopup(auth, provider)
      );

      const firebaseUser = userCredential.user;
      const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;

      // Create or update user profile
      let user: User;
      if (isNewUser) {
        user = await this.createUserProfile({
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          role: USER_ROLES.CUSTOMER as UserRole,
          provider: 'google',
        });
      } else {
        user = await this.createUserFromFirebaseUser(firebaseUser);
        await this.updateLastLogin(user.id);
      }

      return {
        user,
        isNewUser,
        requiresEmailVerification: false, // Google accounts are pre-verified
      };

    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new AuthenticationError(
          'POPUP_CLOSED',
          'Google sign-in popup closed',
          'تم إلغاء تسجيل الدخول بواسطة Google'
        );
      }

      throw new AuthenticationError(
        'GOOGLE_SIGNIN_FAILED',
        error.message,
        'فشل في تسجيل الدخول بواسطة Google'
      );
    }
  }

  // Create Account with Email/Password
  public async createAccount(userData: CreateUserData): Promise<AuthResult> {
    const { email, password, displayName, phoneNumber, role = USER_ROLES.CUSTOMER } = userData;

    try {
      // Validate input
      this.validateEmail(email);
      this.validatePassword(password);
      this.validateDisplayName(displayName);

      // Check if email already exists
      await this.checkEmailAvailability(email);

      // Create Firebase user
      const userCredential = await ErrorRecovery.retry(
        () => createUserWithEmailAndPassword(auth, email, password)
      );

      // Update Firebase profile
      await updateProfile(userCredential.user, {
        displayName,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user profile in Firestore
      const user = await this.createUserProfile({
        email,
        displayName,
        phoneNumber,
        role: role as UserRole,
        provider: 'email',
      });

      return {
        user,
        isNewUser: true,
        requiresEmailVerification: true,
      };

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new ValidationError(
          'EMAIL_IN_USE',
          'Email already in use',
          'البريد الإلكتروني مستخدم بالفعل'
        );
      }

      if (error.code === 'auth/weak-password') {
        throw new ValidationError(
          'WEAK_PASSWORD',
          'Password too weak',
          'كلمة المرور ضعيفة جداً'
        );
      }

      throw new AuthenticationError(
        'ACCOUNT_CREATION_FAILED',
        error.message,
        'فشل في إنشاء الحساب'
      );
    }
  }

  // Sign Out
  public async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      this.clearStoredData();
      this.setCurrentUser(null);
    } catch (error) {
      throw new AuthenticationError(
        'SIGNOUT_FAILED',
        (error as Error).message,
        'فشل في تسجيل الخروج'
      );
    }
  }

  // Reset Password
  public async resetPassword(email: string): Promise<void> {
    try {
      this.validateEmail(email);
      
      await ErrorRecovery.retry(
        () => sendPasswordResetEmail(auth, email)
      );
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new AuthenticationError(
          'USER_NOT_FOUND',
          'User not found',
          'البريد الإلكتروني غير مسجل في النظام'
        );
      }

      throw new AuthenticationError(
        'PASSWORD_RESET_FAILED',
        error.message,
        'فشل في إرسال رابط إعادة تعيين كلمة المرور'
      );
    }
  }

  // Update Password
  public async updateUserPassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) {
      throw new AuthenticationError('NOT_AUTHENTICATED', 'User not authenticated', 'يجب تسجيل الدخول أولاً');
    }

    try {
      this.validatePassword(newPassword);
      await updatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new AuthenticationError(
          'REQUIRES_RECENT_LOGIN',
          'Recent login required',
          'يجب تسجيل الدخول مرة أخرى لتحديث كلمة المرور'
        );
      }

      throw new AuthenticationError(
        'PASSWORD_UPDATE_FAILED',
        error.message,
        'فشل في تحديث كلمة المرور'
      );
    }
  }

  // Check User Permissions
  public hasPermission(requiredRole: UserRole | UserRole[]): boolean {
    if (!this.currentUser) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(this.currentUser.role);
  }

  // Check if user is admin
  public isAdmin(): boolean {
    return this.hasPermission([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] as UserRole[]);
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Subscribe to auth state changes
  public onAuthStateChange(callback: (user: User | null) => void): Unsubscribe {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Private Methods

  private async createUserFromFirebaseUser(firebaseUser: FirebaseUser): Promise<User> {
    try {
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || userData.displayName || '',
          photoURL: firebaseUser.photoURL || userData.photoURL,
          role: userData.role || USER_ROLES.CUSTOMER,
          isActive: userData.isActive ?? true,
          emailVerified: firebaseUser.emailVerified,
          phoneNumber: userData.phoneNumber,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: new Date(),
          preferences: userData.preferences || {
            language: 'ar',
            currency: 'EGP',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };
      } else {
        // Create user profile if it doesn't exist
        return await this.createUserProfile({
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          role: USER_ROLES.CUSTOMER as UserRole,
          provider: 'unknown',
        });
      }
    } catch (error) {
      throw new AuthenticationError(
        'USER_PROFILE_ERROR',
        (error as Error).message,
        'خطأ في تحميل بيانات المستخدم'
      );
    }
  }

  private async createUserProfile(userData: Omit<CreateUserData, 'password'> & { provider: string }): Promise<User> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new AuthenticationError('NO_USER_ID', 'No user ID available', 'خطأ في معرف المستخدم');
    }

    const user: User = {
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: userData.role,
      isActive: true,
      emailVerified: auth.currentUser?.emailVerified || false,
      phoneNumber: userData.phoneNumber,
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

    try {
      await setDoc(doc(db, 'users', userId), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        provider: userData.provider,
      });

      return user;
    } catch (error) {
      throw new AuthenticationError(
        'PROFILE_CREATION_FAILED',
        (error as Error).message,
        'فشل في إنشاء ملف المستخدم'
      );
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      // Non-critical error, log but don't throw
      ErrorHandler.handle(error as Error, { context: 'update_last_login', userId });
    }
  }

  private async checkEmailAvailability(email: string): Promise<void> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        throw new ValidationError(
          'EMAIL_IN_USE',
          'Email already in use',
          'البريد الإلكتروني مستخدم بالفعل'
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      // If we can't check, allow the Firebase auth to handle it
    }
  }

  private checkRateLimit(email: string): void {
    const attempts = this.loginAttempts.get(email);
    
    if (attempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      
      if (attempts.count >= AUTH_CONFIG.maxLoginAttempts && timeSinceLastAttempt < AUTH_CONFIG.lockoutDuration) {
        throw new AuthenticationError(
          'RATE_LIMITED',
          'Too many login attempts',
          `تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة بعد ${Math.ceil(AUTH_CONFIG.lockoutDuration / 60000)} دقيقة`
        );
      }

      // Reset if lockout period has passed
      if (timeSinceLastAttempt >= AUTH_CONFIG.lockoutDuration) {
        this.loginAttempts.delete(email);
      }
    }
  }

  private trackFailedLogin(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.loginAttempts.set(email, attempts);
  }

  private setCurrentUser(user: User | null): void {
    this.currentUser = user;
    
    // Notify all listeners
    this.authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        ErrorHandler.handle(error as Error, { context: 'auth_state_listener' });
      }
    });
  }

  private storeUserData(user: User): void {
    try {
      localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
    } catch (error) {
      ErrorHandler.handle(error as Error, { context: 'store_user_data' });
    }
  }

  private loadStoredUser(): void {
    try {
      const stored = localStorage.getItem(AUTH_CONFIG.userKey);
      if (stored) {
        const user = JSON.parse(stored);
        // Validate stored user is still valid
        if (user.id && Date.now() - new Date(user.lastLoginAt).getTime() < AUTH_CONFIG.sessionTimeout) {
          this.currentUser = user;
        } else {
          this.clearStoredData();
        }
      }
    } catch (error) {
      this.clearStoredData();
    }
  }

  private clearStoredData(): void {
    try {
      localStorage.removeItem(AUTH_CONFIG.userKey);
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
    } catch (error) {
      ErrorHandler.handle(error as Error, { context: 'clear_stored_data' });
    }
  }

  // Validation Methods
  private validateEmail(email: string): void {
    if (!email) {
      throw new ValidationError('EMAIL_REQUIRED', 'Email is required', 'البريد الإلكتروني مطلوب');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('INVALID_EMAIL', 'Invalid email format', 'تنسيق البريد الإلكتروني غير صحيح');
    }
  }

  private validatePassword(password: string): void {
    if (!password) {
      throw new ValidationError('PASSWORD_REQUIRED', 'Password is required', 'كلمة المرور مطلوبة');
    }

    if (password.length < 8) {
      throw new ValidationError('PASSWORD_TOO_SHORT', 'Password too short', 'كلمة المرور قصيرة جداً');
    }

    // Check for complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new ValidationError(
        'PASSWORD_TOO_WEAK',
        'Password too weak',
        'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص'
      );
    }
  }

  private validateDisplayName(displayName: string): void {
    if (!displayName || displayName.trim().length < 2) {
      throw new ValidationError('INVALID_DISPLAY_NAME', 'Display name too short', 'الاسم قصير جداً');
    }

    if (displayName.length > 50) {
      throw new ValidationError('DISPLAY_NAME_TOO_LONG', 'Display name too long', 'الاسم طويل جداً');
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;