import { create } from 'zustand';
import { User, AuthState } from '@/types';
import { AuthService } from '@/services/auth.service.fixed';
import { AdminAuthService } from '@/services/admin-auth.service';

interface AuthStore extends AuthState {
  // Additional state
  authChecked: boolean;
  isInitialized: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  authChecked: false,
  isInitialized: false,

  // Actions
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Check for admin credentials first (bypass Firebase Auth for admin)
      try {
        const adminUser = await AdminAuthService.authenticateAdmin(email, password);
        if (adminUser) {
          // Convert admin user to regular user format for store
          const user: User = {
            id: adminUser.id,
            email: adminUser.email,
            displayName: adminUser.displayName,
            role: 'admin',
            isActive: adminUser.isActive,
            createdAt: adminUser.createdAt,
            updatedAt: new Date(),
            lastLoginAt: adminUser.lastLogin
          };
          set({ user, isLoading: false });
          
          // Redirect to admin dashboard
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/admin/dashboard';
            }, 100);
          }
          return;
        }
      } catch (adminError) {
        console.log('Admin authentication failed, trying regular auth:', adminError);
      }

      // Regular user authentication only if admin auth failed
      try {
        const user = await AuthService.signIn(email, password);
        set({ user, isLoading: false });
      } catch (regularError) {
        // If both admin and regular auth fail, show error
        set({ error: 'بيانات الدخول غير صحيحة', isLoading: false });
        throw regularError;
      }
    } catch (error) {
      set({ error: error.message || 'فشل في تسجيل الدخول', isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signUp(email, password, displayName);
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signInWithGoogle();
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      await AuthService.signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await AuthService.resetPassword(email);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      const { user } = get();
      if (!user) throw new Error('No user signed in');

      set({ isLoading: true, error: null });
      await AuthService.updateUserProfile(user.id, updates);
      set({
        user: { ...user, ...updates },
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setUser: (user: User | null) => set({ user }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  
  initializeAuth: () => {
    console.log('🚀 Initializing Auth System...');
    try {
      // Initialize auth state change listener
      AuthService.onAuthStateChange((user) => {
        console.log('📡 Auth state changed:', user ? `${user.displayName} (${user.role})` : 'No user');
        set({ 
          user, 
          isLoading: false, 
          authChecked: true, 
          isInitialized: true 
        });
      });
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      set({ 
        error: 'فشل في تهيئة نظام المصادقة', 
        isLoading: false, 
        authChecked: true, 
        isInitialized: true 
      });
    }
  },
}));
