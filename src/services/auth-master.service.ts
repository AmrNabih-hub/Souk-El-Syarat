/**
 * 🔐 MASTER AUTHENTICATION SERVICE
 * Unified, simplified, and bulletproof authentication for all user types
 * Consolidates Admin, Vendor, and Customer authentication with enhanced error handling
 */

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase.config';
import { User } from '@/types';
import toast from 'react-hot-toast';

export interface AuthResult {
  user: User;
  isNewUser: boolean;
  userType: 'admin' | 'vendor' | 'customer';
}

interface AuthStateListener {
  (user: User | null): void;
}

class AuthMasterService {
  private static instance: AuthMasterService;
  private authStateCallbacks: AuthStateListener[] = [];

  // Test credentials for immediate testing
  private readonly TEST_ACCOUNTS = {
    admin: [
      { email: 'admin@souk-el-syarat.com', password: 'Admin123456!', name: 'مدير النظام' },
      { email: 'admin@test.com', password: 'Admin123!', name: 'مدير النظام' }
    ],
    vendor: [
      { email: 'vendor1@souk-el-syarat.com', password: 'Vendor123456!', name: 'تاجر محترم' },
      { email: 'vendor@test.com', password: 'Vendor123!', name: 'تاجر اختبار' }
    ],
    customer: [
      { email: 'customer1@souk-el-syarat.com', password: 'Customer123456!', name: 'عميل كريم' },
      { email: 'customer@test.com', password: 'Customer123!', name: 'عميل اختبار' }
    ]
  };

  static getInstance(): AuthMasterService {
    if (!AuthMasterService.instance) {
      AuthMasterService.instance = new AuthMasterService();
    }
    return AuthMasterService.instance;
  }

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email || 'No user');
      
      try {
        let user: User | null = null;

        if (firebaseUser) {
          // Try to get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            user = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName || 'مستخدم',
              photoURL: firebaseUser.photoURL || userData.photoURL,
              role: userData.role || 'customer',
              isActive: userData.isActive !== false,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              preferences: userData.preferences || {
                language: 'ar',
                currency: 'EGP',
                theme: 'light',
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
              }
            };
          } else {
            // Create default user document
            user = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'مستخدم جديد',
              photoURL: firebaseUser.photoURL,
              role: 'customer',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              preferences: {
                language: 'ar',
                currency: 'EGP',
                theme: 'light',
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
              }
            };

            // Save to Firestore
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...user,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date()
            });
          }

          // Update last login
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastLoginAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Notify all listeners
        this.authStateCallbacks.forEach(callback => callback(user));
      } catch (error) {
        console.error('Error in auth state change:', error);
        this.authStateCallbacks.forEach(callback => callback(null));
      }
    });
  }

  /**
   * Master sign in - handles all user types with priority
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    console.log('🔐 Master Auth: Starting login process for:', email);
    
    try {
      // Priority 1: Check Admin Test Accounts
      const adminMatch = this.TEST_ACCOUNTS.admin.find(acc => 
        acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
      );
      
      if (adminMatch) {
        console.log('✅ Admin test account matched');
        
        const adminUser: User = {
          id: 'admin-' + Date.now(),
          email: adminMatch.email,
          displayName: adminMatch.name,
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          preferences: {
            language: 'ar',
            currency: 'EGP',
            theme: 'light',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          }
        };

        // Store in localStorage for persistence
        localStorage.setItem('auth-admin-user', JSON.stringify(adminUser));
        
        toast.success('🎉 مرحباً بك، مدير النظام!', { duration: 4000 });
        
        return { user: adminUser, isNewUser: false, userType: 'admin' };
      }

      // Priority 2: Check Vendor Test Accounts
      const vendorMatch = this.TEST_ACCOUNTS.vendor.find(acc => 
        acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
      );
      
      if (vendorMatch) {
        console.log('✅ Vendor test account matched');
        
        const vendorUser: User = {
          id: 'vendor-' + Date.now(),
          email: vendorMatch.email,
          displayName: vendorMatch.name,
          role: 'vendor',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          preferences: {
            language: 'ar',
            currency: 'EGP',
            theme: 'light',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          }
        };

        // Store in localStorage for persistence
        localStorage.setItem('auth-vendor-user', JSON.stringify(vendorUser));
        
        toast.success('🏪 مرحباً بك، تاجر محترم!', { duration: 4000 });
        
        return { user: vendorUser, isNewUser: false, userType: 'vendor' };
      }

      // Priority 3: Firebase Authentication for Regular Users
      console.log('🔐 Attempting Firebase authentication...');
      
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Get or create user document
      let userData: any = {};
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        }
      } catch (docError) {
        console.log('User document not found, creating new one');
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || userData.displayName || 'عميل كريم',
        photoURL: firebaseUser.photoURL || userData.photoURL,
        role: userData.role || 'customer',
        isActive: userData.isActive !== false,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: userData.preferences || {
          language: 'ar',
          currency: 'EGP',
          theme: 'light',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        }
      };

      // Update user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...user,
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log('✅ Firebase authentication successful');
      toast.success('👤 مرحباً بك، عميل كريم!', { duration: 4000 });
      
      return { user, isNewUser: !userData.createdAt, userType: 'customer' };

    } catch (error: any) {
      console.error('❌ Master auth error:', error);
      
      // Enhanced error messages in Arabic
      let errorMessage = 'حدث خطأ في تسجيل الدخول';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'البريد الإلكتروني غير مسجل';
            break;
          case 'auth/wrong-password':
            errorMessage = 'كلمة المرور غير صحيحة';
            break;
          case 'auth/invalid-email':
            errorMessage = 'البريد الإلكتروني غير صالح';
            break;
          case 'auth/user-disabled':
            errorMessage = 'الحساب معطل';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'محاولات كثيرة جداً، حاول لاحقاً';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'خطأ في الاتصال بالإنترنت';
            break;
          default:
            errorMessage = error.message || 'حدث خطأ غير متوقع';
        }
      }

      toast.error(errorMessage, { duration: 5000 });
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign up new user
   */
  async signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
    try {
      console.log('📝 Creating new account for:', email);
      
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || 'عضو جديد',
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          language: 'ar',
          currency: 'EGP',
          theme: 'light',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        }
      };

      // Save user document
      await setDoc(doc(db, 'users', firebaseUser.uid), user);

      console.log('✅ Account created successfully');
      toast.success(`🎉 مرحباً بك، ${displayName}!`, { duration: 4000 });
      
      return { user, isNewUser: true, userType: 'customer' };

    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      
      let errorMessage = 'حدث خطأ في إنشاء الحساب';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
            break;
          case 'auth/invalid-email':
            errorMessage = 'البريد الإلكتروني غير صالح';
            break;
          case 'auth/weak-password':
            errorMessage = 'كلمة المرور ضعيفة جداً';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'خطأ في الاتصال بالإنترنت';
            break;
          default:
            errorMessage = error.message || 'حدث خطأ غير متوقع';
        }
      }

      toast.error(errorMessage, { duration: 5000 });
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      console.log('🔍 Google sign in starting...');
      
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;

      // Get or create user document
      let userData: any = {};
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        }
      } catch (docError) {
        console.log('Creating new Google user document');
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || userData.displayName || 'عضو جديد',
        photoURL: firebaseUser.photoURL || userData.photoURL,
        role: userData.role || 'customer',
        isActive: userData.isActive !== false,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: userData.preferences || {
          language: 'ar',
          currency: 'EGP',
          theme: 'light',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        }
      };

      // Update user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...user,
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log('✅ Google sign in successful');
      toast.success(`مرحباً ${user.displayName}!`, { duration: 4000 });
      
      return { user, isNewUser: !userData.createdAt, userType: 'customer' };

    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      
      const errorMessage = error.message || 'حدث خطأ في تسجيل الدخول بجوجل';
      toast.error(errorMessage, { duration: 5000 });
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign out all user types
   */
  async signOut(): Promise<void> {
    try {
      console.log('🚪 Signing out...');
      
      // Clear localStorage
      localStorage.removeItem('auth-admin-user');
      localStorage.removeItem('auth-vendor-user');
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      console.log('✅ Sign out successful');
      toast.success('تم تسجيل الخروج بنجاح', { duration: 3000 });
      
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      const errorMessage = 'حدث خطأ في تسجيل الخروج';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      console.log('🔄 Sending password reset email to:', email);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ Password reset email sent');
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', { duration: 5000 });
      
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      
      let errorMessage = 'حدث خطأ في إرسال رابط إعادة التعيين';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'البريد الإلكتروني غير مسجل';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'البريد الإلكتروني غير صالح';
      }

      toast.error(errorMessage, { duration: 5000 });
      throw new Error(errorMessage);
    }
  }

  /**
   * Get current user (including test accounts)
   */
  getCurrentUser(): User | null {
    // Check localStorage first for test accounts
    const adminUser = localStorage.getItem('auth-admin-user');
    if (adminUser) {
      return JSON.parse(adminUser);
    }

    const vendorUser = localStorage.getItem('auth-vendor-user');
    if (vendorUser) {
      return JSON.parse(vendorUser);
    }

    // Return Firebase user (handled by auth listener)
    return null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: AuthStateListener): () => void {
    // Check for stored test users first
    const adminUser = localStorage.getItem('auth-admin-user');
    if (adminUser) {
      setTimeout(() => callback(JSON.parse(adminUser)), 0);
    }

    const vendorUser = localStorage.getItem('auth-vendor-user');
    if (vendorUser) {
      setTimeout(() => callback(JSON.parse(vendorUser)), 0);
    }

    // Add to callbacks
    this.authStateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get test credentials for debugging
   */
  getTestCredentials() {
    return {
      admin: this.TEST_ACCOUNTS.admin,
      vendor: this.TEST_ACCOUNTS.vendor,
      customer: this.TEST_ACCOUNTS.customer
    };
  }

  /**
   * Log available test accounts
   */
  logTestCredentials() {
    console.log('\n🧪 AVAILABLE TEST CREDENTIALS:');
    console.log('👨‍💼 ADMIN:');
    this.TEST_ACCOUNTS.admin.forEach(acc => console.log(`   📧 ${acc.email} / ${acc.password}`));
    console.log('🏪 VENDOR:');
    this.TEST_ACCOUNTS.vendor.forEach(acc => console.log(`   📧 ${acc.email} / ${acc.password}`));
    console.log('👤 CUSTOMER:');
    this.TEST_ACCOUNTS.customer.forEach(acc => console.log(`   📧 ${acc.email} / ${acc.password}`));
  }
}

export default AuthMasterService.getInstance();