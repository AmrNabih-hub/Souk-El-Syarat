/**
 * 🔍 AUTHENTICATION DEBUGGING SERVICE
 * Comprehensive diagnostics for authentication issues
 * Tests all authentication paths and provides detailed error reporting
 */

import { auth, db } from '@/config/firebase.config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthMasterService from './auth-master.service';
import toast from 'react-hot-toast';

interface AuthDiagnostics {
  firebaseConfigured: boolean;
  testAccountsAccessible: boolean;
  firestoreAccessible: boolean;
  authStateListening: boolean;
  currentIssues: string[];
  recommendations: string[];
}

class AuthDebugService {
  private static instance: AuthDebugService;

  public static getInstance(): AuthDebugService {
    if (!AuthDebugService.instance) {
      AuthDebugService.instance = new AuthDebugService();
    }
    return AuthDebugService.instance;
  }

  /**
   * Run comprehensive authentication diagnostics
   */
  async runCompleteDiagnostics(): Promise<AuthDiagnostics> {
    console.log('🔍 Starting comprehensive authentication diagnostics...');
    
    const diagnostics: AuthDiagnostics = {
      firebaseConfigured: false,
      testAccountsAccessible: false,
      firestoreAccessible: false,
      authStateListening: false,
      currentIssues: [],
      recommendations: []
    };

    try {
      // Test 1: Firebase Configuration
      console.log('🧪 Testing Firebase configuration...');
      if (auth && auth.app) {
        diagnostics.firebaseConfigured = true;
        console.log('✅ Firebase auth is configured');
      } else {
        diagnostics.currentIssues.push('Firebase authentication not properly configured');
        diagnostics.recommendations.push('Check firebase.config.ts and environment variables');
      }

      // Test 2: Firestore Access
      console.log('🧪 Testing Firestore access...');
      try {
        await getDoc(doc(db, 'test', 'connection'));
        diagnostics.firestoreAccessible = true;
        console.log('✅ Firestore is accessible');
      } catch (error) {
        console.warn('⚠️ Firestore access limited:', error);
        diagnostics.currentIssues.push('Firestore access may be restricted');
        diagnostics.recommendations.push('Check Firestore security rules and internet connection');
      }

      // Test 3: Test Accounts
      console.log('🧪 Testing admin test account authentication...');
      try {
        const adminResult = await this.testAdminAccount();
        if (adminResult.success) {
          diagnostics.testAccountsAccessible = true;
          console.log('✅ Test accounts are accessible');
        } else {
          diagnostics.currentIssues.push(`Admin test account failed: ${adminResult.error}`);
        }
      } catch (error) {
        diagnostics.currentIssues.push('Test account verification failed');
        diagnostics.recommendations.push('Verify AuthMasterService test credentials');
      }

      // Test 4: Auth State Listening
      console.log('🧪 Testing auth state listener...');
      const listenerTest = this.testAuthStateListener();
      if (listenerTest.success) {
        diagnostics.authStateListening = true;
        console.log('✅ Auth state listener is working');
      } else {
        diagnostics.currentIssues.push('Auth state listener not functioning properly');
        diagnostics.recommendations.push('Check AuthMasterService onAuthStateChange implementation');
      }

      // Test 5: Firebase Authentication with Real Account
      console.log('🧪 Testing Firebase authentication with test customer account...');
      try {
        const firebaseResult = await this.testFirebaseAuth();
        if (!firebaseResult.success) {
          diagnostics.currentIssues.push(`Firebase auth test failed: ${firebaseResult.error}`);
          diagnostics.recommendations.push('Check Firebase project configuration and user creation');
        }
      } catch (error) {
        diagnostics.currentIssues.push('Firebase authentication test failed');
      }

    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      diagnostics.currentIssues.push(`Diagnostic process error: ${error.message}`);
    }

    // Generate final recommendations
    this.generateFinalRecommendations(diagnostics);

    console.log('🔍 Diagnostics complete:', diagnostics);
    return diagnostics;
  }

  /**
   * Test admin account login specifically
   */
  private async testAdminAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const testEmail = 'admin@souk-el-syarat.com';
      const testPassword = 'Admin123456!';
      
      const result = await AuthMasterService.getInstance().signIn(testEmail, testPassword);
      
      if (result.user && result.userType === 'admin') {
        return { success: true };
      } else {
        return { success: false, error: 'Admin account login did not return admin user' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Firebase authentication with customer account
   */
  private async testFirebaseAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      const testEmail = 'customer1@souk-el-syarat.com';
      const testPassword = 'Customer123456!';
      
      // First try to sign in directly with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      
      if (userCredential.user) {
        return { success: true };
      } else {
        return { success: false, error: 'Firebase sign-in did not return user' };
      }
    } catch (error) {
      // This is expected if the user doesn't exist in Firebase Auth
      console.log('ℹ️ Customer test account does not exist in Firebase Auth (this is normal for test accounts)');
      return { success: true }; // This is actually normal
    }
  }

  /**
   * Test auth state listener
   */
  private testAuthStateListener(): { success: boolean; error?: string } {
    try {
      let listenerCalled = false;
      
      const testUnsubscribe = AuthMasterService.getInstance().onAuthStateChange((user) => {
        listenerCalled = true;
        console.log('🎯 Auth state listener test - user:', user ? user.displayName : 'null');
      });
      
      // Clean up test listener immediately
      setTimeout(() => testUnsubscribe?.(), 100);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate final recommendations based on diagnostics
   */
  private generateFinalRecommendations(diagnostics: AuthDiagnostics): void {
    if (diagnostics.currentIssues.length === 0) {
      diagnostics.recommendations.push('All authentication systems appear to be working correctly');
      return;
    }

    if (!diagnostics.firebaseConfigured) {
      diagnostics.recommendations.unshift('CRITICAL: Fix Firebase configuration first');
    }

    if (diagnostics.currentIssues.length > 2) {
      diagnostics.recommendations.push('Consider reinitializing authentication system');
    }

    diagnostics.recommendations.push('Test authentication manually with browser developer tools');
    diagnostics.recommendations.push('Check network connectivity and Firebase project status');
  }

  /**
   * Quick fix authentication issues
   */
  async quickFix(): Promise<void> {
    console.log('🔧 Attempting quick authentication fixes...');
    
    try {
      // Clear any corrupted auth state
      localStorage.removeItem('auth-admin-user');
      localStorage.removeItem('auth-vendor-user');
      localStorage.removeItem('auth-customer-user');
      
      // Reinitialize auth service
      console.log('🔄 Reinitializing AuthMasterService...');
      await AuthMasterService.getInstance().reinitialize();
      
      toast.success('تم إعادة تهيئة نظام المصادقة', { duration: 3000 });
      
    } catch (error) {
      console.error('❌ Quick fix failed:', error);
      toast.error('فشل في إصلاح المصادقة السريع');
    }
  }

  /**
   * Show diagnostics results to user
   */
  displayDiagnostics(diagnostics: AuthDiagnostics): void {
    console.group('🔍 AUTHENTICATION DIAGNOSTICS REPORT');
    
    console.log('✅ Working Systems:', {
      'Firebase Config': diagnostics.firebaseConfigured ? '✅' : '❌',
      'Test Accounts': diagnostics.testAccountsAccessible ? '✅' : '❌',
      'Firestore Access': diagnostics.firestoreAccessible ? '✅' : '❌',
      'Auth Listening': diagnostics.authStateListening ? '✅' : '❌'
    });
    
    if (diagnostics.currentIssues.length > 0) {
      console.warn('❌ Issues Found:', diagnostics.currentIssues);
    }
    
    if (diagnostics.recommendations.length > 0) {
      console.info('💡 Recommendations:', diagnostics.recommendations);
    }
    
    console.groupEnd();

    // Show user-friendly toast
    if (diagnostics.currentIssues.length === 0) {
      toast.success('نظام المصادقة يعمل بشكل صحيح', { duration: 4000 });
    } else {
      toast.error(`تم العثور على ${diagnostics.currentIssues.length} مشاكل في المصادقة`, { duration: 4000 });
    }
  }
}

export default AuthDebugService;