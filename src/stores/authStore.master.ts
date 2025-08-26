/**
 * 🔐 MASTER AUTHENTICATION STORE
 * Clean, simplified Zustand store for all authentication types
 * Works with AuthMasterService for bulletproof authentication
 */

import { create } from 'zustand';
import { User } from '@/types';
import AuthMasterService, { AuthResult } from '@/services/auth-master.service';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  authChecked: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMasterAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  authChecked: false,
  isInitialized: false,

  // Initialize authentication listener
  initializeAuth: () => {
    console.log('🚀 Initializing Master Auth System...');
    
    // Log available test credentials
    AuthMasterService.logTestCredentials();
    
    try {
      const unsubscribe = AuthMasterService.onAuthStateChange((user) => {
        console.log('📡 Auth state changed:', user ? `${user.displayName} (${user.role})` : 'No user');
        
        set({ 
          user, 
          authChecked: true, 
          isLoading: false, 
          error: null,
          isInitialized: true
        });

        // Smart role-based redirection
        if (user && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isAuthPage = ['/login', '/register', '/forgot-password'].includes(currentPath);
          
          if (isAuthPage) {
            console.log(`🔀 User logged in, redirecting from ${currentPath} based on role: ${user.role}`);
            
            // Redirect to appropriate dashboard based on role
            setTimeout(() => {
              switch (user.role) {
                case 'admin':
                  console.log('🔀 Redirecting to admin dashboard...');
                  window.location.href = '/admin/dashboard';
                  break;
                case 'vendor':
                  console.log('🔀 Redirecting to vendor dashboard...');
                  window.location.href = '/vendor/dashboard';
                  break;
                case 'customer':
                default:
                  console.log('🔀 Redirecting to customer dashboard...');
                  window.location.href = '/dashboard';
                  break;
              }
            }, 1500);
          }
        }
      });

      // Store unsubscribe function for cleanup
      (window as any).__masterAuthUnsubscribe = unsubscribe;
      
      set({ isInitialized: true });
      console.log('✅ Master Auth System initialized successfully');
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      set({ error: 'فشل في تهيئة نظام المصادقة', isInitialized: true });
      toast.error('خطأ في تهيئة نظام تسجيل الدخول');
    }
  },

  // Sign in with master service
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔐 Master Store: Starting sign in process...');
      
      const result: AuthResult = await AuthMasterService.signIn(email, password);
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Master Store: Sign in successful:', result.user.displayName, `(${result.user.role})`);
      
      // Enhanced redirect with role-based routing
      if (typeof window !== 'undefined') {
        const roleMessages = {
          admin: '🎉 مرحباً بك، مدير النظام!',
          vendor: '🏪 مرحباً بك، تاجر محترم!',
          customer: '👤 مرحباً بك، عضو كريم!'
        };
        
        // Toast is already shown by the service, but we can add extra info
        console.log(`🎉 Role: ${result.userType}, Message: ${roleMessages[result.userType]}`);

        setTimeout(() => {
          switch (result.userType) {
            case 'admin':
              console.log('🔀 Master Store: Redirecting to admin dashboard...');
              window.location.href = '/admin/dashboard';
              break;
            case 'vendor':
              console.log('🔀 Master Store: Redirecting to vendor dashboard...');
              window.location.href = '/vendor/dashboard';
              break;
            case 'customer':
            default:
              console.log('🔀 Master Store: Redirecting to customer dashboard...');
              window.location.href = '/dashboard';
              break;
          }
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Master Store: Sign in failed:', error);
      
      const errorMessage = error.message || 'حدث خطأ في تسجيل الدخول';
      set({ 
        user: null, 
        isLoading: false, 
        error: errorMessage,
        authChecked: true
      });
      
      // Error toast is already shown by the service
      throw error;
    }
  },

  // Sign up with master service
  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('📝 Master Store: Starting registration process...');
      
      const result: AuthResult = await AuthMasterService.signUp(email, password, displayName);
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Master Store: Registration successful:', result.user.displayName);
      
      // Success toast is already shown by the service
      
      // Redirect to customer dashboard for new users
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Master Store: Registration failed:', error);
      const errorMessage = error.message || 'حدث خطأ في إنشاء الحساب';
      set({ 
        user: null, 
        isLoading: false, 
        error: errorMessage,
        authChecked: true
      });
      // Error toast is already shown by the service
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔍 Master Store: Starting Google sign in...');
      
      const result: AuthResult = await AuthMasterService.signInWithGoogle();
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Master Store: Google sign in successful:', result.user.displayName);
      
      // Success toast is already shown by the service
      
      // Redirect to appropriate dashboard
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          switch (result.user.role) {
            case 'admin':
              window.location.href = '/admin/dashboard';
              break;
            case 'vendor':
              window.location.href = '/vendor/dashboard';
              break;
            case 'customer':
            default:
              window.location.href = '/dashboard';
              break;
          }
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('❌ Master Store: Google sign in failed:', error);
      const errorMessage = error.message || 'حدث خطأ في تسجيل الدخول بجوجل';
      set({ 
        user: null, 
        isLoading: false, 
        error: errorMessage,
        authChecked: true
      });
      // Error toast is already shown by the service
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🚪 Master Store: Starting sign out...');
      
      await AuthMasterService.signOut();
      
      set({ 
        user: null, 
        isLoading: false, 
        error: null,
        authChecked: true
      });

      console.log('✅ Master Store: Sign out successful');
      
      // Success toast is already shown by the service
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('❌ Master Store: Sign out failed:', error);
      const errorMessage = error.message || 'حدث خطأ في تسجيل الخروج';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      // Error toast is already shown by the service
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔄 Master Store: Starting password reset...');
      
      await AuthMasterService.resetPassword(email);
      
      set({ 
        isLoading: false, 
        error: null 
      });

      console.log('✅ Master Store: Password reset email sent');
      // Success toast is already shown by the service
      
    } catch (error: any) {
      console.error('❌ Master Store: Password reset failed:', error);
      const errorMessage = error.message || 'حدث خطأ في إرسال رابط إعادة التعيين';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      // Error toast is already shown by the service
      throw error;
    }
  },

  // Utility functions
  clearError: () => set({ error: null }),
  
  setUser: (user: User | null) => set({ user }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error })
}));

// Export for easier access
export default useMasterAuthStore;