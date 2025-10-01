import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types';
import { AuthService } from '@/services/auth.service';
import { MockAuthService } from '@/services/mock-auth.service';
import { adminAuthService } from '@/services/admin-auth.service';
import { envConfig } from '@/config/environment.config';

interface AuthStore extends AuthState {
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
  initializeAuth: () => Promise<void>;
  loading: boolean;  // Add this property for compatibility
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      loading: false,  // Add this for compatibility
      error: null,

  // Actions
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, loading: true, error: null });
      
      // First, check if this is an admin login
      const adminResult = await adminAuthService.loginAdmin(email, password);
      if (adminResult.success && adminResult.admin) {
        const adminUser: User = {
          id: adminResult.admin.id,
          email: adminResult.admin.email,
          displayName: adminResult.admin.displayName,
          role: adminResult.admin.role,
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: {
            language: 'ar',
            currency: 'EGP',
            notifications: { email: true, sms: false, push: true }
          }
        };
        set({ user: adminUser, isLoading: false, loading: false });
        
        // Sync to demo_user for AuthContext compatibility
        localStorage.setItem('demo_user', JSON.stringify(adminUser));
        return;
      }

      // Check if using mock auth (development mode)
      if (envConfig.get('useMockAuth')) {
        console.log('🔐 Using mock authentication for test accounts');
        const user = await MockAuthService.signIn(email, password);
        set({ user, isLoading: false, loading: false });
        
        // Sync to demo_user for AuthContext compatibility
        localStorage.setItem('demo_user', JSON.stringify(user));
        return;
      }

      // Otherwise use real AWS Amplify auth (production)
      console.log('🔐 Using AWS Amplify authentication');
      const user = await AuthService.signIn(email, password);
      set({ user, isLoading: false, loading: false });
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      set({ error: error.message || 'Login failed', isLoading: false, loading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signUp(email, password, displayName);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signInWithGoogle();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, loading: true, error: null });
      
      // Check if admin
      if (adminAuthService.isAdminLoggedIn()) {
        adminAuthService.logoutAdmin();
      }
      
      // Check if using mock auth
      if (envConfig.get('useMockAuth')) {
        await MockAuthService.signOut();
      } else {
        await AuthService.signOut();
      }
      
      // Clear all storage
      localStorage.removeItem('demo_user');
      localStorage.removeItem('mock_current_user');
      
      set({ user: null, isLoading: false, loading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false, loading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await AuthService.resetPassword(email);
      set({ isLoading: false });
    } catch (error: any) {
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
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setUser: (user: User | null) => set({ user }),
  setLoading: (isLoading: boolean) => set({ isLoading, loading: isLoading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Initialize auth state from storage
  initializeAuth: async () => {
    try {
      set({ isLoading: true, loading: true });
      
      // Check for mock user in localStorage first
      const storedMockUser = localStorage.getItem('mock_current_user');
      if (storedMockUser) {
        const user = JSON.parse(storedMockUser);
        console.log('✅ Restored mock user from localStorage:', user.email);
        set({ user, isLoading: false, loading: false });
        
        // Also sync to demo_user for AuthContext compatibility
        localStorage.setItem('demo_user', JSON.stringify(user));
        return;
      }
      
      // Check for demo user (legacy support)
      const storedDemoUser = localStorage.getItem('demo_user');
      if (storedDemoUser) {
        const user = JSON.parse(storedDemoUser);
        console.log('✅ Restored demo user from localStorage:', user.email);
        set({ user, isLoading: false, loading: false });
        return;
      }
      
      // Check if admin is logged in
      if (adminAuthService.isAdminLoggedIn()) {
        const adminUser = adminAuthService.getCurrentAdmin();
        if (adminUser) {
          const user: User = {
            id: adminUser.id,
            email: adminUser.email,
            displayName: adminUser.displayName,
            role: adminUser.role as any,
            isActive: true,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              language: 'ar',
              currency: 'EGP',
              notifications: { email: true, sms: false, push: true }
            }
          };
          console.log('✅ Restored admin user:', user.email);
          set({ user, isLoading: false, loading: false });
          
          // Sync to demo_user for AuthContext compatibility
          localStorage.setItem('demo_user', JSON.stringify(user));
          return;
        }
      }
      
      console.log('ℹ️ No stored user found');
      set({ user: null, isLoading: false, loading: false });
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      set({ user: null, isLoading: false, loading: false });
    }
  },
}),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
