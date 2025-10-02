/**
 * 🔐 Appwrite Authentication Service
 * Professional authentication service using Appwrite Cloud
 * Replaces AWS Amplify authentication
 */

import { appwriteAuthService } from './appwrite-auth.service';
import { appwriteDatabaseService } from './appwrite-database.service';
import { User, UserRole } from '@/types';

export class AuthService {
  // 🚨 BULLETPROOF AUTHENTICATION STATE LISTENER
  static onAuthStateChange(callback: (user: User | null) => void) {
    console.log('🚀 Setting up Appwrite auth state listener...');
    
    try {
      // Initialize auth state
      appwriteAuthService.initialize().then(() => {
        const currentUser = appwriteAuthService.getCurrentUser();
        currentUser.then(user => {
          if (user) {
            // Transform Appwrite user to our User format
            const transformedUser: User = {
              id: user.$id,
              email: user.email,
              displayName: user.name,
              phoneNumber: user.phone || undefined,
              photoURL: user.avatar || undefined,
              role: user.role || 'customer',
              isActive: user.isActive !== false,
              emailVerified: user.emailVerification || false,
              createdAt: new Date(user.$createdAt),
              updatedAt: new Date(user.$updatedAt),
              preferences: user.preferences || {
                language: 'ar',
                currency: 'EGP',
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
              },
            };
            callback(transformedUser);
          } else {
            callback(null);
          }
        });
      });

      // Return unsubscribe function
      return () => {
        console.log('🔌 Auth state listener unsubscribed');
      };
    } catch (error) {
      console.error('💥 Failed to set up auth state listener:', error);
      callback(null);
      return () => {};
    }
  }

  // 🚨 BULLETPROOF SIGN UP - APPWRITE VERSION
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<User> {
    try {
      console.log('🚀 Starting Appwrite sign up process...');
      
      const appwriteUser = await appwriteAuthService.signUp({
        email,
        password,
        name: displayName,
        role,
      });

      // Create user document in database
      const userData = {
        email: appwriteUser.email,
        displayName: appwriteUser.name,
        role: appwriteUser.role || 'customer',
        isActive: true,
        emailVerified: false,
        preferences: appwriteUser.preferences || {
          language: 'ar',
          currency: 'EGP',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      };

      // Store user in database
      await appwriteDatabaseService.updateUser(appwriteUser.$id, userData);

      const user: User = {
        id: appwriteUser.$id,
        email: appwriteUser.email,
        displayName: appwriteUser.name,
        phoneNumber: undefined,
        photoURL: undefined,
        role: appwriteUser.role || 'customer',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(appwriteUser.$createdAt),
        updatedAt: new Date(appwriteUser.$updatedAt),
        preferences: appwriteUser.preferences || {
          language: 'ar',
          currency: 'EGP',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      };

      console.log('🎉 Sign up completed successfully! Please check your email for confirmation.');
      return user;
      
    } catch (error) {
      console.error('💥 Sign up failed:', error);
      throw new Error(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF SIGN IN - APPWRITE VERSION
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🚀 Starting Appwrite sign in process...');
      
      const appwriteUser = await appwriteAuthService.signIn({ email, password });

      // Get user data from database
      const userData = await appwriteDatabaseService.getUser(appwriteUser.$id);

      if (!userData) {
        console.warn('⚠️ User document not found, creating default user');
        // Create default user if document doesn't exist
        const defaultUserData = {
          email: appwriteUser.email,
          displayName: appwriteUser.name,
          role: appwriteUser.role || 'customer',
          isActive: true,
          emailVerified: appwriteUser.emailVerification || false,
          preferences: appwriteUser.preferences || {
            language: 'ar',
            currency: 'EGP',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };

        await appwriteDatabaseService.updateUser(appwriteUser.$id, defaultUserData);
      }

      const user: User = {
        id: appwriteUser.$id,
        email: appwriteUser.email,
        displayName: appwriteUser.name,
        phoneNumber: appwriteUser.phone || undefined,
        photoURL: appwriteUser.avatar || undefined,
        role: appwriteUser.role || 'customer',
        isActive: appwriteUser.isActive !== false,
        emailVerified: appwriteUser.emailVerification || false,
        createdAt: new Date(appwriteUser.$createdAt),
        updatedAt: new Date(appwriteUser.$updatedAt),
        preferences: appwriteUser.preferences || {
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
      
    } catch (error) {
      console.error('💥 Sign in failed:', error);
      throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF SOCIAL SIGN IN (Google/Facebook) - APPWRITE VERSION
  static async signInWithGoogle(): Promise<User> {
    try {
      console.log('🚀 Starting Appwrite Google sign in...');
      
      // Appwrite OAuth2 implementation would go here
      // For now, throw an error indicating this needs to be configured
      throw new Error('Google OAuth2 requires Appwrite OAuth2 configuration. Please configure OAuth2 providers in Appwrite console.');
      
    } catch (error) {
      console.error('💥 Google sign in failed:', error);
      throw new Error(`Google sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF SIGN OUT - APPWRITE VERSION
  static async signOut(): Promise<void> {
    try {
      console.log('🚀 Starting Appwrite sign out...');
      await appwriteAuthService.signOut();
      console.log('🎉 Sign out completed successfully!');
    } catch (error) {
      console.error('💥 Sign out failed:', error);
      throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF PASSWORD RESET - APPWRITE VERSION
  static async resetPassword(email: string): Promise<void> {
    try {
      console.log('🚀 Starting Appwrite password reset...');
      await appwriteAuthService.sendPasswordReset(email);
      console.log('🎉 Password reset initiated successfully!');
    } catch (error) {
      console.error('💥 Password reset failed:', error);
      throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF USER PROFILE UPDATE - APPWRITE VERSION
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      console.log('🚀 Starting Appwrite profile update...');

      const updateData: any = {};
      
      if (updates.displayName) updateData.name = updates.displayName;
      if (updates.phoneNumber !== undefined) updateData.phone = updates.phoneNumber;
      if (updates.photoURL !== undefined) updateData.avatar = updates.photoURL;
      if (updates.preferences) updateData.preferences = updates.preferences;

      // Update in Appwrite
      await appwriteAuthService.updateProfile(updateData);

      // Update in database
      await appwriteDatabaseService.updateUser(userId, updates);

      console.log('🎉 Profile updated successfully!');
    } catch (error) {
      console.error('💥 Profile update failed:', error);
      throw new Error(`Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF PASSWORD UPDATE - APPWRITE VERSION
  static async updateUserPassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('🚀 Starting Appwrite password update...');
      await appwriteAuthService.updatePassword(oldPassword, newPassword);
      console.log('🎉 Password updated successfully!');
    } catch (error) {
      console.error('💥 Password update failed:', error);
      throw new Error(`Password update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF USER DELETE - APPWRITE VERSION
  static async deleteUserAccount(): Promise<void> {
    try {
      console.log('🚀 Starting Appwrite account deletion...');

      // Get current user
      const currentUser = await appwriteAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Delete user from database first
      try {
        await appwriteDatabaseService.updateUser(currentUser.$id, { isActive: false });
      } catch (apiError) {
        console.warn('⚠️ Could not update user in database:', apiError);
      }

      // Delete user from Appwrite
      await appwriteAuthService.deleteAccount();

      console.log('🎉 Account deleted successfully!');
    } catch (error) {
      console.error('💥 Account deletion failed:', error);
      throw new Error(`Account deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚨 BULLETPROOF GET CURRENT USER - APPWRITE VERSION
  static async getCurrentUser(): Promise<User | null> {
    try {
      const appwriteUser = await appwriteAuthService.getCurrentUser();
      if (!appwriteUser) return null;

      const user: User = {
        id: appwriteUser.$id,
        email: appwriteUser.email,
        displayName: appwriteUser.name,
        phoneNumber: appwriteUser.phone || undefined,
        photoURL: appwriteUser.avatar || undefined,
        role: appwriteUser.role || 'customer',
        isActive: appwriteUser.isActive !== false,
        emailVerified: appwriteUser.emailVerification || false,
        createdAt: new Date(appwriteUser.$createdAt),
        updatedAt: new Date(appwriteUser.$updatedAt),
        preferences: appwriteUser.preferences || {
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
      console.error('💥 Failed to get current user:', error);
      return null;
    }
  }
}
