import { create } from 'zustand';
import { User } from '@/types';
import { AdminAuthService } from '@/services/admin-auth.service';
import { VendorManagementService } from '@/services/vendor-management.service';
import EnhancedAuthService from '@/services/auth.service.enhanced';
import ErrorHandlerService from '@/services/error-handler.service';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  authChecked: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
  resetPassword: (email: string) => Promise<void>;
}

export const useEnhancedAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  isLoading: false,
  error: null,
  authChecked: false,

  // Initialize authentication listener
  initializeAuth: () => {
    console.log('🚀 Initializing Enhanced Auth System...');
    
    const unsubscribe = EnhancedAuthService.onAuthStateChange((user) => {
      console.log('Auth state changed:', user ? `${user.displayName} (${user.role})` : 'No user');
      set({ user, authChecked: true, isLoading: false });
    });

    // Store unsubscribe function (you might want to call this on app cleanup)
    (window as any).__authUnsubscribe = unsubscribe;
  },

  // Enhanced sign in with intelligent routing
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('🔐 Starting enhanced sign in process for:', email);

      // Step 1: Check for admin credentials (highest priority)
      try {
        console.log('🛡️ Checking admin credentials...');
        const adminUser = await AdminAuthService.authenticateAdmin(email, password);
        if (adminUser) {
          console.log('✅ Admin authentication successful!');
          
          const user: User = {
            id: adminUser.id,
            email: adminUser.email,
            displayName: adminUser.displayName,
            role: 'admin',
            isActive: adminUser.isActive,
            createdAt: adminUser.createdAt,
            updatedAt: new Date(),
            lastLoginAt: adminUser.lastLogin,
            preferences: {
              language: 'ar',
              currency: 'EGP',
              theme: 'light',
              notifications: {
                email: true,
                sms: false,
                push: true,
              },
            },
          };
          
          set({ user, isLoading: false, error: null });
          
          toast.success('🎉 مرحباً بك، مدير النظام!');
          
          // Redirect to admin dashboard after short delay
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/dashboard';
            }
          }, 500);
          
          return;
        }
      } catch (adminError) {
        console.log('ℹ️ Admin authentication failed, checking vendor credentials...');
      }

      // Step 2: Check for vendor credentials
      try {
        console.log('🏪 Checking vendor credentials...');
        const vendorUser = await VendorManagementService.authenticateVendor(email, password);
        if (vendorUser) {
          console.log('✅ Vendor authentication successful!');
          
          const user: User = {
            id: vendorUser.id,
            email: vendorUser.email,
            displayName: vendorUser.displayName,
            role: 'vendor',
            isActive: vendorUser.isActive,
            createdAt: vendorUser.createdAt,
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
            },
          };
          
          set({ user, isLoading: false, error: null });
          
          toast.success(`🏪 مرحباً بك، ${vendorUser.displayName}!`);
          
          // Redirect to vendor dashboard
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/vendor/dashboard';
            }
          }, 500);
          
          return;
        }
      } catch (vendorError) {
        console.log('ℹ️ Vendor authentication failed, trying Firebase auth...');
      }

      // Step 3: Try Firebase Authentication for regular customers
      try {
        console.log('👤 Attempting Firebase authentication for customer...');
        const user = await EnhancedAuthService.signIn(email, password);
        console.log('✅ Customer authentication successful!');
        
        set({ user, isLoading: false, error: null });
        
        const welcomeMessage = user.role === 'customer' 
          ? `🎉 مرحباً بك، ${user.displayName}!`
          : `✨ تم تسجيل الدخول بنجاح!`;
          
        toast.success(welcomeMessage);
        
        // Redirect based on user role
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const redirectPath = user.role === 'customer' ? '/customer/dashboard' : '/';
            window.location.href = redirectPath;
          }
        }, 500);
        
      } catch (firebaseError) {
        console.error('❌ All authentication methods failed:', firebaseError);
        const appError = ErrorHandlerService.handleError(
          firebaseError,
          'sign_in_firebase',
          undefined,
          true,
          'ar'
        );
        set({ error: appError.messageAr, isLoading: false });
      }

    } catch (error) {
      console.error('💥 Unexpected error during sign in:', error);
      const appError = ErrorHandlerService.handleError(
        error,
        'sign_in_general',
        undefined,
        true,
        'ar'
      );
      set({ error: appError.messageAr, isLoading: false });
    }
  },

  // Enhanced sign up
  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('📝 Starting sign up process for:', email);
      
      const user = await EnhancedAuthService.signUp(email, password, displayName, 'customer');
      
      console.log('✅ Sign up successful for:', user.displayName);
      
      set({ user, isLoading: false, error: null });
      
      toast.success(`🎉 مرحباً بك في سوق السيارات، ${user.displayName}!`);
      
      // Redirect to customer dashboard
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/customer/dashboard';
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Sign up error:', error);
      const appError = ErrorHandlerService.handleError(
        error,
        'sign_up',
        undefined,
        true,
        'ar'
      );
      set({ error: appError.messageAr, isLoading: false });
    }
  },

  // Enhanced sign out
  signOut: async () => {
    try {
      set({ isLoading: true });
      
      console.log('🚪 Signing out user...');
      
      await EnhancedAuthService.signOut();
      
      set({ user: null, isLoading: false, error: null });
      
      toast.success('تم تسجيل الخروج بنجاح');
      
      // Redirect to home page
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      const appError = ErrorHandlerService.handleError(
        error,
        'sign_out',
        undefined,
        true,
        'ar'
      );
      set({ error: appError.messageAr, isLoading: false });
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await EnhancedAuthService.resetPassword(email);
      
      set({ isLoading: false });
      toast.success('تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      
    } catch (error) {
      console.error('Reset password error:', error);
      const appError = ErrorHandlerService.handleError(
        error,
        'reset_password',
        undefined,
        true,
        'ar'
      );
      set({ error: appError.messageAr, isLoading: false });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useEnhancedAuthStore;