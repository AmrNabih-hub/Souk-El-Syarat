/**
 * 🔧 DEBUG AUTHENTICATION SERVICE
 * Comprehensive logging and error handling for authentication issues
 */

import UnifiedAuthService from './unified-auth.service';
import { AdminAuthService } from './admin-auth.service';
import { VendorManagementService } from './vendor-management.service';
import { auth } from '@/config/firebase.config';
import toast from 'react-hot-toast';

class AuthDebugService {
  private static instance: AuthDebugService;
  
  static getInstance(): AuthDebugService {
    if (!AuthDebugService.instance) {
      AuthDebugService.instance = new AuthDebugService();
    }
    return AuthDebugService.instance;
  }

  async debugLogin(email: string, password: string) {
    console.log('🔍 ===== AUTHENTICATION DEBUG SESSION START =====');
    console.log('📧 Email:', email);
    console.log('🔐 Password length:', password.length);
    console.log('🌍 Current URL:', window.location.href);
    console.log('⚡ Firebase Auth State:', auth.currentUser ? 'Signed In' : 'Not Signed In');
    
    try {
      // Test 1: Admin Authentication
      console.log('\n🔍 TEST 1: ADMIN AUTHENTICATION');
      try {
        const adminResult = await AdminAuthService.authenticateAdmin(email, password);
        if (adminResult) {
          console.log('✅ Admin authentication SUCCESSFUL');
          console.log('👤 Admin User:', adminResult);
          toast.success('🎉 Admin login successful!');
          return { success: true, userType: 'admin', user: adminResult };
        } else {
          console.log('❌ Admin authentication FAILED - Not admin credentials');
        }
      } catch (adminError) {
        console.log('❌ Admin authentication ERROR:', adminError);
      }

      // Test 2: Vendor Authentication  
      console.log('\n🔍 TEST 2: VENDOR AUTHENTICATION');
      try {
        const vendorResult = await VendorManagementService.authenticateVendor(email, password);
        if (vendorResult) {
          console.log('✅ Vendor authentication SUCCESSFUL');
          console.log('👤 Vendor User:', vendorResult);
          toast.success('🏪 Vendor login successful!');
          return { success: true, userType: 'vendor', user: vendorResult };
        } else {
          console.log('❌ Vendor authentication FAILED - Not vendor credentials');
        }
      } catch (vendorError) {
        console.log('❌ Vendor authentication ERROR:', vendorError);
      }

      // Test 3: Firebase Authentication
      console.log('\n🔍 TEST 3: FIREBASE CUSTOMER AUTHENTICATION');
      try {
        const firebaseResult = await UnifiedAuthService.signIn(email, password);
        console.log('✅ Firebase authentication SUCCESSFUL');
        console.log('👤 Firebase User:', firebaseResult);
        toast.success('👤 Customer login successful!');
        return { success: true, userType: 'customer', user: firebaseResult.user };
      } catch (firebaseError) {
        console.log('❌ Firebase authentication ERROR:', firebaseError);
        console.log('❌ Firebase Error Code:', (firebaseError as any)?.code);
        console.log('❌ Firebase Error Message:', (firebaseError as any)?.message);
      }

      // If all authentication methods fail
      console.log('\n💥 ALL AUTHENTICATION METHODS FAILED');
      toast.error('❌ Login failed - Invalid credentials');
      return { success: false, error: 'All authentication methods failed' };

    } catch (error) {
      console.log('\n💥 CRITICAL AUTHENTICATION ERROR:', error);
      toast.error('💥 Critical error during login');
      return { success: false, error: 'Critical authentication error' };
    } finally {
      console.log('🔍 ===== AUTHENTICATION DEBUG SESSION END =====\n');
    }
  }

  async testFirebaseConnection() {
    console.log('\n🧪 TESTING FIREBASE CONNECTION...');
    try {
      console.log('🔥 Auth instance:', !!auth);
      console.log('🔥 Auth app:', !!auth.app);
      console.log('🔥 Current user:', auth.currentUser?.email || 'None');
      console.log('✅ Firebase connection test passed');
      return true;
    } catch (error) {
      console.log('❌ Firebase connection test failed:', error);
      return false;
    }
  }

  logTestCredentials() {
    console.log('\n🧪 AVAILABLE TEST CREDENTIALS:');
    console.log('👨‍💼 ADMIN: admin@souk-el-syarat.com / Admin123456!');
    console.log('🏪 VENDOR: vendor1@souk-el-syarat.com / Vendor123456!');
    console.log('👤 CUSTOMER: customer1@souk-el-syarat.com / Customer123456!');
  }
}

export default AuthDebugService.getInstance();