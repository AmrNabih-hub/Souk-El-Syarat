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
import { AdminAuthService } from './admin-auth.service';
import { VendorManagementService } from './vendor-management.service';
import toast from 'react-hot-toast';

export interface AuthResult {
  user: User;
  isNewUser: boolean;
}

class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private authStateCallbacks: ((user: User | null) => void)[] = [];

  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
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
              lastLoginAt: new Date()
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
              lastLoginAt: new Date()
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
   * Smart sign in with priority: Admin -> Vendor -> Regular User
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Starting unified sign in process for:', email);

      // 1. Try Admin Authentication First
      try {
        console.log('🔑 Checking admin credentials...');
        const adminUser = await AdminAuthService.authenticateAdmin(email, password);
        if (adminUser) {
          const user: User = {
            id: adminUser.id,
            email: adminUser.email,
            displayName: adminUser.displayName,
            role: 'admin',
            isActive: adminUser.isActive,
            createdAt: adminUser.createdAt,
            updatedAt: new Date(),
            lastLoginAt: new Date()
          };

          console.log('✅ Admin authentication successful:', user.displayName);
          toast.success(`مرحباً ${user.displayName} - دخول كمدير`);
          
          // Update admin last login
          await AdminAuthService.updateLastLogin(adminUser.id);
          
          // Notify listeners
          this.authStateCallbacks.forEach(callback => callback(user));
          
          return { user, isNewUser: false };
        }
      } catch (error) {
        console.log('❌ Admin auth failed:', error);
      }

      // 2. Try Vendor Authentication
      try {
        console.log('🏪 Checking vendor credentials...');
        const vendorUser = await VendorManagementService.authenticateVendor(email, password);
        if (vendorUser) {
          const user: User = {
            id: vendorUser.id,
            email: vendorUser.email,
            displayName: vendorUser.displayName || vendorUser.businessName,
            role: 'vendor',
            isActive: vendorUser.isActive,
            createdAt: vendorUser.createdAt,
            updatedAt: new Date(),
            lastLoginAt: new Date()
          };

          console.log('✅ Vendor authentication successful:', user.displayName);
          toast.success(`مرحباً ${user.displayName} - دخول كتاجر`);
          
          // Update vendor last login in Firestore
          await updateDoc(doc(db, 'vendorApplications', vendorUser.id), {
            lastLoginAt: new Date(),
            updatedAt: new Date()
          });
          
          // Notify listeners
          this.authStateCallbacks.forEach(callback => callback(user));
          
          return { user, isNewUser: false };
        }
      } catch (error) {
        console.log('❌ Vendor auth failed:', error);
      }

      // 3. Try Regular Firebase Authentication
      console.log('👤 Attempting regular Firebase authentication...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore or create default
      let userData: any = {};
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        }
      } catch (error) {
        console.warn('Could not fetch user data from Firestore:', error);
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || userData.displayName || 'عضو',
        photoURL: firebaseUser.photoURL || userData.photoURL,
        role: userData.role || 'customer',
        isActive: userData.isActive !== false,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      // Update/create user document
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...user,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }, { merge: true });
      } catch (error) {
        console.warn('Could not update user document:', error);
      }

      console.log('✅ Regular user authentication successful:', user.displayName);
      toast.success(`مرحباً ${user.displayName}`);
      
      return { user, isNewUser: !userData.createdAt };

    } catch (error: any) {
      console.error('❌ All authentication methods failed:', error);
      
      // Provide Arabic error messages
      let errorMessage = 'حدث خطأ في تسجيل الدخول';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني';
          break;
        case 'auth/wrong-password':
          errorMessage = 'كلمة المرور غير صحيحة';
          break;
        case 'auth/invalid-email':
          errorMessage = 'البريد الإلكتروني غير صالح';
          break;
        case 'auth/user-disabled':
          errorMessage = 'تم إيقاف هذا الحساب';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'عدد كبير من المحاولات، يرجى المحاولة لاحقاً';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'خطأ في الاتصال، يرجى التحقق من الإنترنت';
          break;
        default:
          errorMessage = error.message || 'حدث خطأ غير متوقع';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign up new user
   */
  async signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
    try {
      console.log('📝 Creating new user account for:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || 'عضو جديد',
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      // Save user data to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      });

      console.log('✅ User registration successful:', user.displayName);
      toast.success(`مرحباً ${user.displayName}! تم إنشاء حسابك بنجاح`);
      
      return { user, isNewUser: true };

    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      let errorMessage = 'حدث خطأ في إنشاء الحساب';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'هذا البريد الإلكتروني مستخدم من قبل';
          break;
        case 'auth/invalid-email':
          errorMessage = 'البريد الإلكتروني غير صالح';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'تم إيقاف تسجيل الحسابات الجديدة';
          break;
        case 'auth/weak-password':
          errorMessage = 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل';
          break;
        default:
          errorMessage = error.message || 'حدث خطأ غير متوقع';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      console.log('🔍 Starting Google sign in...');
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      let userData: any = {};
      let isNewUser = false;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          isNewUser = true;
        }
      } catch (error) {
        console.warn('Could not check existing user:', error);
        isNewUser = true;
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || userData.displayName || 'عضو',
        photoURL: firebaseUser.photoURL || userData.photoURL,
        role: userData.role || 'customer',
        isActive: userData.isActive !== false,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      // Update/create user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...user,
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log('✅ Google authentication successful:', user.displayName);
      toast.success(`مرحباً ${user.displayName}!`);
      
      return { user, isNewUser };

    } catch (error: any) {
      console.error('❌ Google sign in failed:', error);
      
      let errorMessage = 'حدث خطأ في تسجيل الدخول بجوجل';
      
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'تم إلغاء تسجيل الدخول';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('🚪 Signing out user...');
      await firebaseSignOut(auth);
      toast.success('تم تسجيل الخروج بنجاح');
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      toast.error('حدث خطأ في تسجيل الخروج');
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      console.log('🔄 Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email);
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور لبريدك الإلكتروني');
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error('❌ Password reset failed:', error);
      
      let errorMessage = 'حدث خطأ في إرسال رابط إعادة التعيين';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني';
          break;
        case 'auth/invalid-email':
          errorMessage = 'البريد الإلكتروني غير صالح';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'عدد كبير من المحاولات، يرجى المحاولة لاحقاً';
          break;
        default:
          errorMessage = error.message || 'حدث خطأ غير متوقع';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser ? this.mapFirebaseUserToUser(auth.currentUser) : null;
  }

  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'عضو',
      photoURL: firebaseUser.photoURL,
      role: 'customer', // Default role, should be fetched from Firestore
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };
  }
}

export default UnifiedAuthService.getInstance();