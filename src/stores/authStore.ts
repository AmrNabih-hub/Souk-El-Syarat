import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types';
import { SimpleAppwriteAuthService } from '@/services/simple-auth.service';
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
      
      // Use simplified Appwrite authentication
      console.log('🔐 Attempting simplified Appwrite authentication...');
      const user = await SimpleAppwriteAuthService.signIn(email, password);
      set({ user, isLoading: false, loading: false });
      console.log('✅ Appwrite login successful');
      return;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      set({ 
        error: error.message || 'Authentication failed', 
        isLoading: false, 
        loading: false 
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, loading: true, error: null });
      
      // Use simplified Appwrite for registration
      console.log('🔐 Registering user with simplified Appwrite...');
      const user = await SimpleAppwriteAuthService.signUp(email, password, displayName);
      set({ user, isLoading: false, loading: false });
      console.log('✅ Registration successful');
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      set({ error: error.message, isLoading: false, loading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, loading: true, error: null });
      
      // Appwrite supports OAuth providers
      // For now, throw a message that it needs to be configured
      throw new Error('Google Sign-In requires OAuth configuration in Appwrite Console. Please set up OAuth providers.');
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      set({ error: error.message, isLoading: false, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, loading: true, error: null });
      
      // Use simplified Appwrite sign out
      try {
        await SimpleAppwriteAuthService.signOut();
        console.log('✅ Appwrite sign out successful');
      } catch (appwriteError) {
        console.warn('⚠️ Appwrite sign out failed (non-blocking):', appwriteError);
      }
      
      // Clear all storage
      localStorage.removeItem('demo_user');
      
      set({ user: null, isLoading: false, loading: false });
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      set({ error: error.message, isLoading: false, loading: false });
      // Force logout even on error
      set({ user: null });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, loading: true, error: null });
      
      // Use Appwrite for password reset
      await AppwriteAuthService.resetPassword(email);
      set({ isLoading: false, loading: false });
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      set({ error: error.message, isLoading: false, loading: false });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      const { user } = get();
      if (!user) throw new Error('No user signed in');

      set({ isLoading: true, loading: true, error: null });
      
      // For now, just update locally
      // TODO: Implement Appwrite profile update when database is set up
      set({
        user: { ...user, ...updates },
        isLoading: false,
        loading: false,
      });
      
      console.log('✅ Profile updated');
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      set({ error: error.message, isLoading: false, loading: false });
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
      
      // 1. Try to get current Appwrite user
      try {
        console.log('🔍 Checking Appwrite session...');
        const appwriteUser = await SimpleAppwriteAuthService.getCurrentUser();
        if (appwriteUser) {
          console.log('✅ Restored Appwrite user:', appwriteUser.email);
          set({ user: appwriteUser, isLoading: false, loading: false });
          return;
        }
      } catch (appwriteError) {
        console.debug('No Appwrite session found, checking fallbacks...');
      }
      
      // 2. Check for mock user in localStorage
      const storedMockUser = localStorage.getItem('mock_current_user');
      if (storedMockUser) {
        const user = JSON.parse(storedMockUser);
        console.log('✅ Restored mock user from localStorage:', user.email);
        set({ user, isLoading: false, loading: false });
        
        // Also sync to demo_user for AuthContext compatibility
        localStorage.setItem('demo_user', JSON.stringify(user));
        return;
      }
      
      // 3. Check for demo user (legacy support)
      const storedDemoUser = localStorage.getItem('demo_user');
      if (storedDemoUser) {
        const user = JSON.parse(storedDemoUser);
        console.log('✅ Restored demo user from localStorage:', user.email);
        set({ user, isLoading: false, loading: false });
        return;
      }
      
      // 4. Check if admin is logged in
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
      
      console.log('ℹ️ No stored user found - starting as guest');
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
