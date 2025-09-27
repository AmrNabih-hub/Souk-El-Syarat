import { Auth, Hub } from 'aws-amplify';
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
  private sessionTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastActivityUpdate: ReturnType<typeof setTimeout> | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
    Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          this.notifyAuthStateChange({
            user: data,
            isLoading: false,
            error: null,
            isAuthenticated: true,
            isEmailVerified: data.attributes.email_verified,
            isMultiFactorEnabled: false, // TODO: Implement MFA
            lastActivity: new Date(),
            sessionExpiry: new Date(Date.now() + this.SESSION_DURATION),
          });
          break;
        case 'signOut':
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
          break;
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
    Auth.currentAuthenticatedUser()
      .then(user => {
        // TODO: Implement with Amplify DataStore
      })
      .catch(() => {
        // Not signed in
      });
  }

  /**
   * Start session timer
   */
  private startSessionTimer(): void {
    this.clearSessionTimer();
    this.sessionTimeout = setTimeout(() => {
      // call the static signOut implementation
      EnhancedAuthService.signOut().catch(() => {});
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
      if (role === 'admin') {
        throw new Error('Admin accounts cannot be created through regular signup');
      }

      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name: displayName,
          phone_number: phoneNumber,
        },
      });

      // TODO: Replace with Amplify DataStore
      const newUser: User = {
        id: user.userId,
        email,
        displayName,
        phoneNumber,
        role,
        isActive: true,
        emailVerified: false,
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

      return newUser;
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

      const user = await Auth.signIn(adminData.email, adminData.password);

      // TODO: Replace with Amplify DataStore
      return {
        id: user.attributes.sub,
        email: user.attributes.email,
        displayName: user.attributes.name,
        role: 'admin',
        isActive: true,
        emailVerified: user.attributes.email_verified,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      } as User;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Enhanced sign in with real-time validation
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const user = await Auth.signIn(email, password);

      // TODO: Replace with Amplify DataStore
      return {
        id: user.attributes.sub,
        email: user.attributes.email,
        displayName: user.attributes.name,
        role: 'customer',
        isActive: true,
        emailVerified: user.attributes.email_verified,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      } as User;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Social sign in with enhanced security
   */
  static async signInWithGoogle(): Promise<User> {
    try {
      await Auth.federatedSignIn({ provider: 'Google' });
      // TODO: Get user data from Amplify
      return {} as User;
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign out with cleanup
   */
  static async signOut(): Promise<void> {
    try {
      await Auth.signOut();
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Reset password with enhanced security
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await Auth.forgotPassword(email);
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update user profile with real-time sync
   */
  static async updateProfile(updates: Partial<User>): Promise<void> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, updates);
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update password with enhanced security
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, '', newPassword);
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Enable multi-factor authentication
   */
  static async enableMultiFactor(phoneNumber: string): Promise<void> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.setPreferredMFA(user, 'SMS');
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Verify multi-factor authentication
   */
  static async verifyMultiFactor(verificationCode: string): Promise<void> {
    try {
      await Auth.verifyCurrentUserAttributeSubmit('phone_number', verificationCode);
    } catch (error) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Get enhanced auth error messages
   */
  private static getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'UserNotFoundException': 'No account found with this email address',
      'NotAuthorizedException': 'Incorrect password',
      'InvalidParameterException': 'Invalid email address',
      'UserNotConfirmedException': 'This account has not been confirmed',
      'TooManyRequestsException': 'Too many failed attempts. Please try again later',
      'NetworkError': 'Network error. Please check your connection',
      'InvalidPasswordException': 'Password is too weak. Use at least 8 characters',
      'UsernameExistsException': 'An account with this email already exists',
      'InvalidPhone_number': 'Invalid phone number format',
      'CodeMismatchException': 'Invalid verification code',
      'ExpiredCodeException': 'Verification code has expired',
      'MFAMethodNotFoundException': 'Multi-factor authentication required',
      'PasswordResetRequiredException': 'Password reset required',
      'UserLambdaValidationException': 'An error occurred during user validation',
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