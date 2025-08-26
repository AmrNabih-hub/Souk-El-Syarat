import { create } from 'zustand';
import { User } from '@/types';
import AuthDebugService from '@/services/auth.debug.service';
import UnifiedAuthService, { AuthResult } from '@/services/unified-auth.service';
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
  debugLogin: (email: string, password: string) => Promise<void>;
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
  isInitialized: false,

  // Initialize authentication listener with enhanced error handling
  initializeAuth: () => {
    console.log('🚀 Initializing Enhanced Unified Auth System...');
    AuthDebugService.logTestCredentials();
    
    try {
      const unsubscribe = UnifiedAuthService.onAuthStateChange((user) => {
        console.log('📡 Auth state changed:', user ? `${user.displayName} (${user.role})` : 'No user');
        
        set({ 
          user, 
          authChecked: true, 
          isLoading: false, 
          error: null,
          isInitialized: true
        });

        // Smart routing with enhanced logic
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
            }, 1000);
          }
        }
      });

      // Store unsubscribe function for cleanup
      (window as any).__unifiedAuthUnsubscribe = unsubscribe;
      
      set({ isInitialized: true });
      console.log('✅ Enhanced Auth System initialized successfully');
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      set({ error: 'Failed to initialize authentication system', isInitialized: true });
    }
  },

  // Enhanced sign in with debug integration
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔐 Enhanced Sign In Process Starting...');
      
      // Test Firebase connection first
      const connectionOk = await AuthDebugService.testFirebaseConnection();
      if (!connectionOk) {
        throw new Error('Firebase connection failed');
      }

      const result: AuthResult = await UnifiedAuthService.signIn(email, password);
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Enhanced sign in successful:', result.user.displayName, `(${result.user.role})`);
      
      // Enhanced redirect with role-based routing and success messages
      if (typeof window !== 'undefined') {
        const roleMessages = {
          admin: '🎉 مرحباً بك، مدير النظام!',
          vendor: '🏪 مرحباً بك، تاجر محترم!',
          customer: '👤 مرحباً بك، عضو كريم!'
        };
        
        toast.success(roleMessages[result.user.role] || 'مرحباً بك!', {
          duration: 4000,
          style: { fontSize: '16px', fontWeight: '600' }
        });

        setTimeout(() => {
          switch (result.user.role) {
            case 'admin':
              console.log('🔀 Enhanced redirect to admin dashboard...');
              window.location.href = '/admin/dashboard';
              break;
            case 'vendor':
              console.log('🔀 Enhanced redirect to vendor dashboard...');
              window.location.href = '/vendor/dashboard';
              break;
            case 'customer':
            default:
              console.log('🔀 Enhanced redirect to customer dashboard...');
              window.location.href = '/dashboard';
              break;
          }
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('❌ Enhanced sign in failed:', error);
      
      const errorMessage = error.message || 'حدث خطأ في تسجيل الدخول';
      set({ 
        user: null, 
        isLoading: false, 
        error: errorMessage,
        authChecked: true
      });
      
      toast.error(errorMessage, {
        duration: 5000,
        style: { fontSize: '14px' }
      });
      
      throw error;
    }
  },

  // Debug login function for troubleshooting
  debugLogin: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const debugResult = await AuthDebugService.debugLogin(email, password);
      
      if (debugResult.success) {
        // Convert debug result to User format
        const user: User = {
          id: debugResult.user.id,
          email: debugResult.user.email,
          displayName: debugResult.user.displayName || debugResult.user.businessName || 'User',
          role: debugResult.userType as 'admin' | 'vendor' | 'customer',
          isActive: debugResult.user.isActive,
          createdAt: debugResult.user.createdAt,
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
        
        set({ 
          user, 
          isLoading: false, 
          error: null,
          authChecked: true 
        });

        // Redirect based on user type
        setTimeout(() => {
          const redirectMap = {
            admin: '/admin/dashboard',
            vendor: '/vendor/dashboard', 
            customer: '/dashboard'
          };
          window.location.href = redirectMap[debugResult.userType] || '/';
        }, 2000);
        
      } else {
        set({ 
          user: null, 
          isLoading: false, 
          error: debugResult.error || 'Debug login failed',
          authChecked: true
        });
      }
      
    } catch (error: any) {
      console.error('❌ Debug login error:', error);
      set({ 
        user: null, 
        isLoading: false, 
        error: error.message || 'Debug login failed',
        authChecked: true
      });
    }
  },

  // Sign up with enhanced error handling
  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('📝 Enhanced registration process starting...');
      
      const result: AuthResult = await UnifiedAuthService.signUp(email, password, displayName);
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Enhanced registration successful:', result.user.displayName);
      
      toast.success(`🎉 مرحباً بك في سوق السيارات، ${result.user.displayName}!`, {
        duration: 4000,
        style: { fontSize: '16px', fontWeight: '600' }
      });
      
      // Redirect to customer dashboard for new users
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Enhanced registration failed:', error);
      const errorMessage = error.message || 'حدث خطأ في إنشاء الحساب';
      set({ 
        user: null, 
        isLoading: false, 
        error: errorMessage,
        authChecked: true
      });
      toast.error(errorMessage);
      throw error;
    }
  },

  // Sign in with Google with enhanced handling
  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔍 Enhanced Google sign in starting...');
      
      const result: AuthResult = await UnifiedAuthService.signInWithGoogle();
      
      set({ 
        user: result.user, 
        isLoading: false, 
        error: null,
        authChecked: true 
      });

      console.log('✅ Enhanced Google sign in successful:', result.user.displayName);
      
      toast.success(`مرحباً ${result.user.displayName}!`, {
        duration: 4000,
        style: { fontSize: '16px', fontWeight: '600' }
      });
      
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
      console.error('❌ Enhanced Google sign in failed:', error);
      const errorMessage = error.message || 'حدث خطأ في تسجيل الدخول بجوجل';
      set({ 
        user: null, 
        isLoading: false, 
        error: errorMessage,
        authChecked: true
      });
      toast.error(errorMessage);
      throw error;
    }
  },

  // Enhanced sign out
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🚪 Enhanced sign out starting...');
      
      await UnifiedAuthService.signOut();
      
      set({ 
        user: null, 
        isLoading: false, 
        error: null,
        authChecked: true
      });

      console.log('✅ Enhanced sign out successful');
      
      toast.success('تم تسجيل الخروج بنجاح', {
        duration: 3000,
        style: { fontSize: '14px', fontWeight: '600' }
      });
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('❌ Enhanced sign out failed:', error);
      const errorMessage = error.message || 'حدث خطأ في تسجيل الخروج';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      toast.error(errorMessage);
      throw error;
    }
  },

  // Enhanced reset password
  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔄 Enhanced password reset starting...');
      
      await UnifiedAuthService.resetPassword(email);
      
      set({ 
        isLoading: false, 
        error: null 
      });

      console.log('✅ Enhanced password reset email sent');
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      
    } catch (error: any) {
      console.error('❌ Enhanced password reset failed:', error);
      const errorMessage = error.message || 'حدث خطأ في إرسال رابط إعادة التعيين';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      toast.error(errorMessage);
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