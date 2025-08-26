import { create } from 'zustand';
import { User } from '@/types';
import UnifiedAuthService, { AuthResult } from '@/services/unified-auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  authChecked: boolean;
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

export const useUnifiedAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  authChecked: false,

  // Initialize authentication listener
  initializeAuth: () => {
    console.log('🚀 Initializing Unified Auth System...');
    
    const unsubscribe = UnifiedAuthService.onAuthStateChange((user) => {
      console.log('📡 Auth state changed:', user ? `${user.displayName} (${user.role})` : 'No user');
      set({ 
        user, 
        authChecked: true, 
        isLoading: false, 
        error: null 
      });

      // Smart routing based on role
      if (user && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = ['/login', '/register', '/forgot-password'].includes(currentPath);
        
        if (isAuthPage) {
          // Redirect to appropriate dashboard based on role
          setTimeout(() => {
            switch (user.role) {
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
          }, 1000);
        }
      }
    });

    // Store unsubscribe function for cleanup
    (window as any).__unifiedAuthUnsubscribe = unsubscribe;
  },

  // Sign in with smart routing
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔐 Starting sign in process...');
      
      const result: AuthResult = await UnifiedAuthService.signIn(email, password);
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Sign in successful:', result.user.displayName, `(${result.user.role})`);
      
      // Smart redirect based on role
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          switch (result.user.role) {
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
      
    } catch (error: any) {
      console.error('❌ Sign in failed:', error);
      set({ 
        user: null, 
        isLoading: false, 
        error: error.message || 'حدث خطأ في تسجيل الدخول',
        authChecked: true
      });
      throw error;
    }
  },

  // Sign up
  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('📝 Starting registration process...');
      
      const result: AuthResult = await UnifiedAuthService.signUp(email, password, displayName);
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Registration successful:', result.user.displayName);
      
      // Redirect to dashboard for new users
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      set({ 
        user: null, 
        isLoading: false, 
        error: error.message || 'حدث خطأ في إنشاء الحساب',
        authChecked: true
      });
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔍 Starting Google sign in...');
      
      const result: AuthResult = await UnifiedAuthService.signInWithGoogle();
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Google sign in successful:', result.user.displayName);
      
      // Redirect to dashboard
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
      console.error('❌ Google sign in failed:', error);
      set({ 
        user: null, 
        isLoading: false, 
        error: error.message || 'حدث خطأ في تسجيل الدخول بجوجل',
        authChecked: true
      });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🚪 Signing out...');
      
      await UnifiedAuthService.signOut();
      
      set({ 
        user: null, 
        isLoading: false, 
        error: null,
        authChecked: true
      });

      console.log('✅ Sign out successful');
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'حدث خطأ في تسجيل الخروج' 
      });
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔄 Sending password reset...');
      
      await UnifiedAuthService.resetPassword(email);
      
      set({ 
        isLoading: false, 
        error: null 
      });

      console.log('✅ Password reset email sent');
      
    } catch (error: any) {
      console.error('❌ Password reset failed:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'حدث خطأ في إرسال رابط إعادة التعيين' 
      });
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
export default useUnifiedAuthStore;