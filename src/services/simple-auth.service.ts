/**
 * 🔐 SIMPLE APPWRITE AUTHENTICATION SERVICE
 * For deployment - only using existing database attributes
 */

import { account, databases, appwriteConfig } from '@/config/appwrite.config';
import { ID, Models } from 'appwrite';
import { User, UserRole } from '@/types';

export class SimpleAppwriteAuthService {
  /**
   * 🔐 SIGN UP - Create new user account (deployment safe)
   */
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<User> {
    try {
      console.log('🚀 Starting simple Appwrite user registration...');

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

      // Create basic user profile in database (only basic fields)
      const userProfile = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        ID.unique(),
        {
          name: displayName,
          email: email,
          role: role,
          isVerified: false
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
      throw new Error(error?.message || 'Registration failed');
    }
  }

  /**
   * 🔑 SIGN IN - Authenticate existing user
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🔑 Starting Appwrite sign in...');

      // Create session
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Session created');

      // Get current user
      const authAccount = await account.get();
      console.log('✅ User account retrieved');

      const user: User = {
        id: authAccount.$id,
        email: authAccount.email,
        displayName: authAccount.name,
        phoneNumber: authAccount.phone || null,
        photoURL: null,
        role: 'customer', // Default role
        isActive: true,
        emailVerified: authAccount.emailVerification,
        createdAt: new Date(authAccount.$createdAt),
        updatedAt: new Date(authAccount.$updatedAt),
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
      throw new Error(error?.message || 'Authentication failed');
    }
  }

  /**
   * 🚪 SIGN OUT - End user session
   */
  static async signOut(): Promise<void> {
    try {
      await account.deleteSession('current');
      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('💥 Sign out failed:', error);
      throw new Error(error?.message || 'Sign out failed');
    }
  }

  /**
   * 👤 GET CURRENT USER - Check if user is authenticated
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const authAccount = await account.get();
      
      return {
        id: authAccount.$id,
        email: authAccount.email,
        displayName: authAccount.name,
        phoneNumber: authAccount.phone || null,
        photoURL: null,
        role: 'customer',
        isActive: true,
        emailVerified: authAccount.emailVerification,
        createdAt: new Date(authAccount.$createdAt),
        updatedAt: new Date(authAccount.$updatedAt),
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
    } catch (error) {
      console.log('👤 No user authenticated (guest mode)');
      return null;
    }
  }
}