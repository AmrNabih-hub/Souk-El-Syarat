/**
 * 🔐 APPWRITE AUTHENTICATION SERVICE
 * Souk El-Sayarat Marketplace
 */

import { account, databases, appwriteConfig } from '@/config/appwrite.config';
import { ID, Models, Query } from 'appwrite';
import { User, UserRole } from '@/types';

export class AppwriteAuthService {
  /**
   * 🔐 SIGN UP - Create new user account
   */
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<User> {
    try {
      console.log('🚀 Starting Appwrite user registration...');

      // Create authentication account
      const authAccount = await account.create(
        ID.unique(),
        email,
        password,
        displayName
      );

      console.log('✅ Auth account created:', authAccount.$id);

      // Create session (auto-login)
      await account.createEmailPasswordSession(email, password);

      // Create user profile in database
      const userProfile = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        ID.unique(),
        {
          userId: authAccount.$id,
          email: email,
          displayName: displayName,
          role: role,
          phoneNumber: null,
          photoURL: null,
          isActive: true,
          emailVerified: false,
          createdAt: new Date().toISOString()
        }
      );

      console.log('✅ User profile created in database');

      const user: User = {
        id: authAccount.$id,
        email: email,
        displayName: displayName,
        phoneNumber: null,
        photoURL: null,
        role: role,
        isActive: true,
        emailVerified: false,
        createdAt: new Date(authAccount.$createdAt),
        updatedAt: new Date(),
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

      console.log('🎉 Registration completed successfully!');
      return user;
    } catch (error: any) {
      console.error('💥 Sign up failed:', error);
      throw new Error(this.getAppwriteErrorMessage(error));
    }
  }

  /**
   * 🔐 SIGN IN - Login user
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🚀 Starting Appwrite sign in...');

      // Create email session
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Session created:', session.$id);

      // Get current account
      const authAccount = await account.get();
      console.log('✅ Account retrieved:', authAccount.$id);

      // Get user profile from database
      const userProfiles = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        [Query.equal('userId', authAccount.$id)]
      );

      let userProfile;
      if (userProfiles.documents.length === 0) {
        console.warn('⚠️ User profile not found, creating default...');
        userProfile = await this.createDefaultUserProfile(authAccount);
      } else {
        userProfile = userProfiles.documents[0];
      }

      const user: User = {
        id: authAccount.$id,
        email: authAccount.email,
        displayName: userProfile.displayName || authAccount.name || 'User',
        phoneNumber: userProfile.phoneNumber || null,
        photoURL: userProfile.photoURL || null,
        role: userProfile.role || 'customer',
        isActive: userProfile.isActive ?? true,
        emailVerified: userProfile.emailVerified ?? authAccount.emailVerification,
        createdAt: new Date(userProfile.createdAt || authAccount.$createdAt),
        updatedAt: new Date(),
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

      console.log('🎉 Sign in completed successfully!');
      return user;
    } catch (error: any) {
      console.error('💥 Sign in failed:', error);
      throw new Error(this.getAppwriteErrorMessage(error));
    }
  }

  /**
   * 🔐 SIGN OUT - Logout user
   */
  static async signOut(): Promise<void> {
    try {
      console.log('🚀 Signing out...');
      await account.deleteSession('current');
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('💥 Sign out failed:', error);
      throw new Error(this.getAppwriteErrorMessage(error));
    }
  }

  /**
   * 👤 GET CURRENT USER
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const authAccount = await account.get();
      
      const userProfiles = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        [Query.equal('userId', authAccount.$id)]
      );

      if (userProfiles.documents.length === 0) {
        return null;
      }

      const userProfile = userProfiles.documents[0];

      const user: User = {
        id: authAccount.$id,
        email: authAccount.email,
        displayName: userProfile.displayName || authAccount.name,
        phoneNumber: userProfile.phoneNumber || null,
        photoURL: userProfile.photoURL || null,
        role: userProfile.role || 'customer',
        isActive: userProfile.isActive ?? true,
        emailVerified: userProfile.emailVerified ?? authAccount.emailVerification,
        createdAt: new Date(userProfile.createdAt || authAccount.$createdAt),
        updatedAt: new Date(),
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

      return user;
    } catch (error) {
      console.debug('No authenticated user found');
      return null;
    }
  }

  /**
   * 🔄 PASSWORD RESET
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      await account.createRecovery(email, redirectUrl);
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error('💥 Password reset failed:', error);
      throw new Error(this.getAppwriteErrorMessage(error));
    }
  }

  /**
   * ✅ COMPLETE PASSWORD RESET
   */
  static async completePasswordReset(
    userId: string,
    secret: string,
    newPassword: string
  ): Promise<void> {
    try {
      await account.updateRecovery(userId, secret, newPassword);
      console.log('✅ Password updated successfully');
    } catch (error: any) {
      console.error('💥 Password update failed:', error);
      throw new Error(this.getAppwriteErrorMessage(error));
    }
  }

  /**
   * 📧 VERIFY EMAIL
   */
  static async sendVerificationEmail(): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/verify-email`;
      await account.createVerification(redirectUrl);
      console.log('✅ Verification email sent');
    } catch (error: any) {
      console.error('💥 Verification email failed:', error);
      throw new Error(this.getAppwriteErrorMessage(error));
    }
  }

  /**
   * ✅ VERIFY EMAIL CONFIRMATION
   */
  static async verifyEmail(userId: string, secret: string): Promise<void> {
    try {
      await account.updateVerification(userId, secret);
      console.log('✅ Email verified successfully');
    } catch (error: any) {
      console.error('💥 Email verification failed:', error);
      throw new Error(this.getAppwriteErrorMessage(error));
    }
  }

  /**
   * 🆕 CREATE DEFAULT USER PROFILE
   */
  private static async createDefaultUserProfile(
    authAccount: Models.User<Models.Preferences>
  ): Promise<any> {
    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.users,
      ID.unique(),
      {
        userId: authAccount.$id,
        email: authAccount.email,
        displayName: authAccount.name || 'User',
        role: 'customer',
        phoneNumber: null,
        photoURL: null,
        isActive: true,
        emailVerified: authAccount.emailVerification,
        createdAt: new Date().toISOString()
      }
    );
  }

  /**
   * 📋 AUTH STATE LISTENER
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    console.log('🚀 Setting up Appwrite auth state listener...');
    
    // Initial check
    this.getCurrentUser().then(callback);

    // Appwrite doesn't have a direct auth state listener like Firebase
    // We'll poll every 5 seconds or use account.get() when needed
    const interval = setInterval(async () => {
      try {
        const user = await this.getCurrentUser();
        callback(user);
      } catch (error) {
        callback(null);
      }
    }, 5000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }

  /**
   * 🔧 ERROR MESSAGE HELPER
   */
  private static getAppwriteErrorMessage(error: any): string {
    const code = error?.code || error?.type || 'unknown';
    const message = error?.message || 'An error occurred';

    const errorMessages: Record<string, string> = {
      'user_already_exists': 'An account with this email already exists',
      'user_invalid_credentials': 'Invalid email or password',
      'user_blocked': 'This account has been blocked',
      'user_not_found': 'No account found with this email',
      'user_email_already_exists': 'This email is already registered',
      'user_unauthorized': 'You are not authorized to perform this action',
      'general_rate_limit_exceeded': 'Too many requests. Please try again later',
      'user_password_mismatch': 'Incorrect password',
    };

    return errorMessages[code] || message;
  }
}

export default AppwriteAuthService;

