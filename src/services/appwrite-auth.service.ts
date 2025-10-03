/**
 * 🔐 Appwrite Authentication Service
 * Professional authentication service using Appwrite Cloud
 * Based on: https://appwrite.io/docs/products/auth/quick-start
 */

import { account, appwriteConfig } from '@/config/appwrite.config';
import { ID, type Models } from 'appwrite';
import type { User, UserRole } from '@/types';

export interface AuthUser extends Models.User<Models.Preferences> {
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  preferences?: {
    language: 'ar' | 'en';
    currency: 'EGP';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  preferences?: {
    language?: 'ar' | 'en';
    currency?: 'EGP';
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
}

export class AppwriteAuthService {
  private static instance: AppwriteAuthService;
  private currentUser: AuthUser | null = null;

  private constructor() {}

  public static getInstance(): AppwriteAuthService {
    if (!AppwriteAuthService.instance) {
      AppwriteAuthService.instance = new AppwriteAuthService();
    }
    return AppwriteAuthService.instance;
  }

  /**
   * Get current authenticated user
   */
  public async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await account.get();
      this.currentUser = this.transformUser(user);
      return this.currentUser;
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Sign up new user
   */
  public async signUp(data: SignUpData): Promise<AuthUser> {
    try {
      const { email, password, name, role = 'customer', phone } = data;

      // Create user account
      const user = await account.create(ID.unique(), email, password, name);
      
      // Update user preferences
      await account.updatePrefs({
        role,
        isActive: true,
        emailVerified: false,
        phone: phone || '',
        preferences: {
          language: 'ar',
          currency: 'EGP',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      });

      // Send email verification
      await this.sendEmailVerification();

      const authUser = this.transformUser(user);
      this.currentUser = authUser;
      
      console.log('✅ User created successfully:', authUser.email);
      return authUser;
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw new Error(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign in user
   */
  public async signIn(data: SignInData): Promise<AuthUser> {
    try {
      const { email, password } = data;

      // Create email session
      await account.createEmailSession(email, password);

      // Get user data
      const user = await account.get();
      const authUser = this.transformUser(user);
      this.currentUser = authUser;

      console.log('✅ User signed in successfully:', authUser.email);
      return authUser;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign out user
   */
  public async signOut(): Promise<void> {
    try {
      await account.deleteSession('current');
      this.currentUser = null;
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(data: UpdateProfileData): Promise<AuthUser> {
    try {
      const { name, phone, preferences } = data;

      // Update name if provided
      if (name) {
        await account.updateName(name);
      }

      // Update preferences if provided
      if (preferences) {
        const currentPrefs = this.currentUser?.preferences || {};
        const updatedPrefs = {
          ...currentPrefs,
          ...preferences,
          notifications: {
            ...currentPrefs.notifications,
            ...preferences.notifications
          }
        };

        await account.updatePrefs(updatedPrefs);
      }

      // Get updated user data
      const user = await account.get();
      const authUser = this.transformUser(user);
      this.currentUser = authUser;

      console.log('✅ Profile updated successfully');
      return authUser;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw new Error(`Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send email verification
   */
  public async sendEmailVerification(): Promise<void> {
    try {
      await account.createVerification('https://soukelsayarat.com/verify-email');
      console.log('✅ Email verification sent');
    } catch (error) {
      console.error('❌ Failed to send email verification:', error);
      throw new Error('Failed to send email verification');
    }
  }

  /**
   * Verify email with token
   */
  public async verifyEmail(userId: string, secret: string): Promise<void> {
    try {
      await account.updateVerification(userId, secret);
      console.log('✅ Email verified successfully');
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      throw new Error('Email verification failed');
    }
  }

  /**
   * Send password reset email
   */
  public async sendPasswordReset(email: string): Promise<void> {
    try {
      await account.createRecovery(email, 'https://soukelsayarat.com/reset-password');
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Failed to send password reset:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(userId: string, secret: string, password: string): Promise<void> {
    try {
      await account.updateRecovery(userId, secret, password);
      console.log('✅ Password reset successfully');
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw new Error('Password reset failed');
    }
  }

  /**
   * Update password
   */
  public async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await account.updatePassword(newPassword, oldPassword);
      console.log('✅ Password updated successfully');
    } catch (error) {
      console.error('❌ Password update failed:', error);
      throw new Error('Password update failed');
    }
  }

  /**
   * Delete user account
   */
  public async deleteAccount(): Promise<void> {
    try {
      await account.delete();
      this.currentUser = null;
      console.log('✅ Account deleted successfully');
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      throw new Error('Account deletion failed');
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Get user role
   */
  public getUserRole(): UserRole | null {
    return this.currentUser?.preferences?.role || null;
  }

  /**
   * Check if user has specific role
   */
  public hasRole(role: UserRole): boolean {
    return this.getUserRole() === role;
  }

  /**
   * Transform Appwrite user to our AuthUser format
   */
  private transformUser(user: Models.User<Models.Preferences>): AuthUser {
    const prefs = user.prefs || {};
    
    return {
      ...user,
      role: prefs.role || 'customer',
      isActive: prefs.isActive !== false,
      emailVerified: user.emailVerification || false,
      preferences: {
        language: prefs.language || 'ar',
        currency: prefs.currency || 'EGP',
        notifications: {
          email: prefs.notifications?.email !== false,
          sms: prefs.notifications?.sms || false,
          push: prefs.notifications?.push !== false
        }
      }
    };
  }

  /**
   * Initialize authentication state
   */
  public async initialize(): Promise<void> {
    try {
      await this.getCurrentUser();
      console.log('✅ Authentication initialized');
    } catch (error) {
      console.log('ℹ️ No active session found');
    }
  }
}

// Export singleton instance
export const appwriteAuthService = AppwriteAuthService.getInstance();