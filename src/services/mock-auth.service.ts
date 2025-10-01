/**
 * 🧪 MOCK AUTHENTICATION SERVICE
 * Development & Testing Authentication
 * 
 * This service provides authentication for test accounts without requiring AWS Amplify.
 * In production, this will delegate to the real AuthService after checking test accounts.
 */

import { User, UserRole } from '@/types';
import { TEST_ACCOUNTS, validateTestAccount, PRODUCTION_ADMIN_ACCOUNT } from '@/config/test-accounts.config';

export class MockAuthService {
  /**
   * 🔐 SIGN IN with test accounts or AWS Amplify
   */
  static async signIn(email: string, password: string): Promise<User> {
    console.log('🔍 Checking test accounts for:', email);

    // First, check if this is a test account
    const testAccount = validateTestAccount(email, password);
    
    if (testAccount) {
      console.log('✅ Test account found:', testAccount.role);
      
      // Create user object from test account
      const user: User = {
        id: testAccount.id,
        email: testAccount.email,
        displayName: testAccount.displayName,
        phoneNumber: testAccount.phoneNumber,
        photoURL: undefined,
        role: testAccount.role,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          language: 'ar',
          currency: 'EGP',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      };

      // Store in localStorage
      localStorage.setItem('mock_auth_user', JSON.stringify(user));
      localStorage.setItem('mock_auth_session', JSON.stringify({
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString(),
      }));

      console.log('🎉 Mock authentication successful!');
      return user;
    }

    // If not a test account, throw error (in dev mode)
    // In production, this would delegate to real AWS Amplify
    console.warn('❌ Invalid credentials (not a test account)');
    throw new Error('Invalid email or password. In development, use test accounts.');
  }

  /**
   * 🔐 SIGN UP (creates test account in memory)
   */
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<User> {
    console.log('🚀 Creating test account:', email);

    // Check if account already exists
    const existing = Object.values(TEST_ACCOUNTS).find(acc => acc.email === email);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    // Create new test user
    const user: User = {
      id: `test_${role}_${Date.now()}`,
      email,
      displayName,
      phoneNumber: undefined,
      photoURL: undefined,
      role,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
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

    // Store temporarily (in real app, this would go to database)
    const existingUsers = JSON.parse(localStorage.getItem('mock_test_users') || '[]');
    existingUsers.push({ ...user, password }); // Spread user first, then add password
    localStorage.setItem('mock_test_users', JSON.stringify(existingUsers));

    console.log('✅ Test account created successfully');
    return user;
  }

  /**
   * 🔐 SIGN OUT
   */
  static async signOut(): Promise<void> {
    console.log('👋 Signing out...');
    localStorage.removeItem('mock_auth_user');
    localStorage.removeItem('mock_auth_session');
    console.log('✅ Sign out successful');
  }

  /**
   * 🔐 GET CURRENT USER
   */
  static async getCurrentUser(): Promise<User | null> {
    const userJson = localStorage.getItem('mock_auth_user');
    if (!userJson) {
      return null;
    }

    try {
      const user = JSON.parse(userJson);
      
      // Check session validity (24 hours)
      const sessionJson = localStorage.getItem('mock_auth_session');
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
          console.warn('⚠️ Session expired');
          this.signOut();
          return null;
        }
      }

      return user;
    } catch (error) {
      console.error('❌ Error parsing stored user:', error);
      localStorage.removeItem('mock_auth_user');
      return null;
    }
  }

  /**
   * 🔐 RESET PASSWORD
   */
  static async resetPassword(email: string): Promise<void> {
    console.log('📧 Password reset requested for:', email);
    // In development, just log it
    console.log('✅ In production, a reset email would be sent');
  }

  /**
   * 🔐 UPDATE USER PROFILE
   */
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user || user.id !== userId) {
      throw new Error('User not found or unauthorized');
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    localStorage.setItem('mock_auth_user', JSON.stringify(updatedUser));
    console.log('✅ Profile updated successfully');
  }

  /**
   * 📋 GET ALL TEST ACCOUNTS (for documentation)
   */
  static getTestAccountsList(): Array<{ email: string; role: string; purpose: string }> {
    return [
      {
        email: PRODUCTION_ADMIN_ACCOUNT.email,
        role: 'admin',
        purpose: 'Production admin - receives vendor applications'
      },
      {
        email: TEST_ACCOUNTS.customer.email,
        role: 'customer',
        purpose: 'Test customer workflows'
      },
      {
        email: TEST_ACCOUNTS.vendor.email,
        role: 'vendor',
        purpose: 'Test vendor workflows'
      },
    ];
  }
}

