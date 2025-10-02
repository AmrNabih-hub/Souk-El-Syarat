/**
 * 🔐 Appwrite Authentication Service
 * Professional authentication service for Souk El-Sayarat
 * Replaces AWS Amplify Auth with Appwrite Auth
 */

import { ID, Models, Query } from 'appwrite';
import { account, databases, appwriteConfig } from '@/config/appwrite.config';
import { User, UserRole } from '@/types';

export class AppwriteAuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      console.log('🚀 Creating new user account...');

      // Create Appwrite account
      const appwriteUser = await account.create(
        ID.unique(),
        email,
        password,
        displayName
      );

      console.log('✅ Appwrite account created:', appwriteUser.$id);

      // Create user profile in database
      const userProfile = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        appwriteUser.$id,
        {
          email: email,
          displayName: displayName,
          role: 'customer',
          isActive: true,
          preferences: JSON.stringify({
            language: 'ar',
            currency: 'EGP',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('✅ User profile created in database');

      // Create session (auto login after signup)
      await account.createEmailPasswordSession(email, password);

      return this.mapAppwriteUserToUser(appwriteUser, userProfile);
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 Signing in user...');

      // Create session
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Session created:', session.$id);

      // Get current user
      const user = await this.getCurrentUser();

      if (!user) {
        throw new Error('Failed to retrieve user data');
      }

      return user;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      console.log('👋 Signing out user...');
      await account.deleteSession('current');
      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      // Get Appwrite account
      const appwriteUser = await account.get();
      
      if (!appwriteUser) {
        return null;
      }

      // Get user profile from database
      const userProfile = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        appwriteUser.$id
      );

      return this.mapAppwriteUserToUser(appwriteUser, userProfile);
    } catch (error: any) {
      // User not authenticated
      if (error.code === 401) {
        return null;
      }
      console.error('❌ Get current user error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      console.log('📝 Updating user profile...');

      // Update Appwrite account name if provided
      if (updates.displayName) {
        await account.updateName(updates.displayName);
      }

      // Update database profile
      const updatedProfile = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        userId,
        {
          ...(updates.displayName && { displayName: updates.displayName }),
          ...(updates.phoneNumber && { phoneNumber: updates.phoneNumber }),
          ...(updates.photoURL && { photoURL: updates.photoURL }),
          ...(updates.preferences && { preferences: JSON.stringify(updates.preferences) }),
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('✅ Profile updated successfully');

      // Get fresh user data
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Failed to retrieve updated user data');
      }

      return user;
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('🔒 Updating password...');
      await account.updatePassword(newPassword, oldPassword);
      console.log('✅ Password updated successfully');
    } catch (error: any) {
      console.error('❌ Update password error:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    try {
      console.log('📧 Requesting password reset...');
      
      // Create password recovery
      await account.createRecovery(
        email,
        `${window.location.origin}/auth/reset-password`
      );
      
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error('❌ Request password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  /**
   * Complete password reset
   */
  static async confirmPasswordReset(
    userId: string,
    secret: string,
    password: string
  ): Promise<void> {
    try {
      console.log('🔒 Confirming password reset...');
      
      await account.updateRecovery(
        userId,
        secret,
        password
      );
      
      console.log('✅ Password reset successful');
    } catch (error: any) {
      console.error('❌ Confirm password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(): Promise<void> {
    try {
      console.log('📧 Sending email verification...');
      
      await account.createVerification(
        `${window.location.origin}/auth/verify-email`
      );
      
      console.log('✅ Verification email sent');
    } catch (error: any) {
      console.error('❌ Send verification error:', error);
      throw new Error(error.message || 'Failed to send verification email');
    }
  }

  /**
   * Verify email with code
   */
  static async verifyEmail(userId: string, secret: string): Promise<void> {
    try {
      console.log('✅ Verifying email...');
      
      await account.updateVerification(userId, secret);
      
      console.log('✅ Email verified successfully');
    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      throw new Error(error.message || 'Failed to verify email');
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(): Promise<void> {
    try {
      console.log('🗑️ Deleting user account...');

      // Get current user ID
      const currentUser = await account.get();
      
      // Delete user profile from database
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        currentUser.$id
      );

      // Delete Appwrite account
      // Note: This requires special permissions, handled on backend
      console.log('✅ Account deletion initiated');
    } catch (error: any) {
      console.error('❌ Delete account error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  /**
   * Listen to authentication state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    console.log('👂 Setting up auth state listener...');

    let intervalId: NodeJS.Timeout;

    // Check auth state periodically
    const checkAuthState = async () => {
      try {
        const user = await this.getCurrentUser();
        callback(user);
      } catch (error) {
        callback(null);
      }
    };

    // Initial check
    checkAuthState();

    // Poll every 5 seconds (Appwrite doesn't have built-in listeners for web)
    intervalId = setInterval(checkAuthState, 5000);

    // Return unsubscribe function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }

  /**
   * Get user by ID (admin function)
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userProfile = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        userId
      );

      return this.mapDatabaseUserToUser(userProfile);
    } catch (error: any) {
      console.error('❌ Get user by ID error:', error);
      return null;
    }
  }

  /**
   * Update user role (admin function)
   */
  static async updateUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      console.log(`🔑 Updating user role to ${role}...`);

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        userId,
        {
          role: role,
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('✅ User role updated successfully');
    } catch (error: any) {
      console.error('❌ Update user role error:', error);
      throw new Error(error.message || 'Failed to update user role');
    }
  }

  /**
   * List users with filters (admin function)
   */
  static async listUsers(filters?: {
    role?: UserRole;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const queries: string[] = [];

      if (filters?.role) {
        queries.push(Query.equal('role', filters.role));
      }

      if (filters?.isActive !== undefined) {
        queries.push(Query.equal('isActive', filters.isActive));
      }

      if (filters?.limit) {
        queries.push(Query.limit(filters.limit));
      }

      if (filters?.offset) {
        queries.push(Query.offset(filters.offset));
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        queries
      );

      const users = response.documents.map(doc => this.mapDatabaseUserToUser(doc));

      return {
        users,
        total: response.total,
      };
    } catch (error: any) {
      console.error('❌ List users error:', error);
      return { users: [], total: 0 };
    }
  }

  /**
   * Helper: Map Appwrite user to app User type
   */
  private static mapAppwriteUserToUser(
    appwriteUser: Models.User<Models.Preferences>,
    userProfile: Models.Document
  ): User {
    const preferences = typeof userProfile.preferences === 'string' 
      ? JSON.parse(userProfile.preferences) 
      : userProfile.preferences || {};

    return {
      id: appwriteUser.$id,
      email: appwriteUser.email,
      displayName: userProfile.displayName || appwriteUser.name,
      phoneNumber: userProfile.phoneNumber,
      photoURL: userProfile.photoURL,
      role: (userProfile.role || 'customer') as UserRole,
      isActive: userProfile.isActive ?? true,
      emailVerified: appwriteUser.emailVerification,
      createdAt: new Date(userProfile.createdAt || appwriteUser.$createdAt),
      updatedAt: new Date(userProfile.updatedAt || appwriteUser.$updatedAt),
      preferences: preferences,
    };
  }

  /**
   * Helper: Map database document to app User type
   */
  private static mapDatabaseUserToUser(userProfile: Models.Document): User {
    const preferences = typeof userProfile.preferences === 'string'
      ? JSON.parse(userProfile.preferences)
      : userProfile.preferences || {};

    return {
      id: userProfile.$id,
      email: userProfile.email,
      displayName: userProfile.displayName,
      phoneNumber: userProfile.phoneNumber,
      photoURL: userProfile.photoURL,
      role: (userProfile.role || 'customer') as UserRole,
      isActive: userProfile.isActive ?? true,
      emailVerified: true, // Assume verified if in database
      createdAt: new Date(userProfile.createdAt || userProfile.$createdAt),
      updatedAt: new Date(userProfile.updatedAt || userProfile.$updatedAt),
      preferences: preferences,
    };
  }
}

export default AppwriteAuthService;
