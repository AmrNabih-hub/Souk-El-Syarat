/**
 * 🔐 Auth Store
 * Professional authentication state management using Supabase
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type AuthUser } from '@/services/supabase-auth.service';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  // State
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: 'customer' | 'vendor') => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string; metadata?: Record<string, any> }) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  
  // Internal actions
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      error: null,
      isInitialized: true, // Changed to true - AuthProvider handles initialization

      // Sign in with email and password
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.signIn({ email, password });
          
          if (response.error) {
            throw new Error(response.error.message);
          }

          if (response.data.session && response.data.user) {
            const userProfile = await authService.getUserProfile(response.data.user.id);
            set({ 
              session: response.data.session,
              user: userProfile,
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('❌ Sign in error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Sign up with email and password
      signUp: async (email: string, password: string, name: string, role: 'customer' | 'vendor' = 'customer') => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.signUp({
            email,
            password,
            name,
            role,
          });
          
          if (response.error) {
            throw new Error(response.error.message);
          }

          // Don't set user/session here as email confirmation is required
          set({ isLoading: false });
          
        } catch (error) {
          console.error('❌ Sign up error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await authService.signOut();
          
          if (error) {
            throw error;
          }

          set({ 
            user: null,
            session: null,
            isLoading: false 
          });
          
        } catch (error) {
          console.error('❌ Sign out error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Sign out failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Reset password
      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await authService.resetPassword({ email });
          
          if (error) {
            throw error;
          }

          set({ isLoading: false });
          
        } catch (error) {
          console.error('❌ Reset password error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Reset password failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Sign in with OAuth provider (Google or GitHub)
      signInWithProvider: async (provider: 'google' | 'github') => {
        try {
          set({ isLoading: true, error: null });
          await authService.signInWithProvider(provider);
        } catch (error) {
          console.error(`❌ ${provider} sign in error:`, error);
          set({ 
            error: error instanceof Error ? error.message : `${provider} sign in failed`,
            isLoading: false 
          });
          throw error;
        }
      },

      // Update profile
      updateProfile: async (updates: { name?: string; phone?: string; metadata?: Record<string, any> }) => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await authService.updateProfile(updates);
          
          if (error) {
            throw error;
          }

          // Refresh user profile
          const currentUser = get().user;
          if (currentUser) {
            const updatedProfile = await authService.getUserProfile(currentUser.id);
            set({ user: updatedProfile, isLoading: false });
          } else {
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.error('❌ Update profile error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Update profile failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Verify OTP
      verifyOtp: async (email: string, token: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authService.verifyOtp(email, token);
          
          if (response.error) {
            throw new Error(response.error.message);
          }

          if (response.data.session && response.data.user) {
            const userProfile = await authService.getUserProfile(response.data.user.id);
            set({ 
              session: response.data.session,
              user: userProfile,
              isLoading: false 
            });
          }
          
        } catch (error) {
          console.error('❌ Verify OTP error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'OTP verification failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Resend confirmation email
      resendConfirmation: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await authService.resendConfirmation(email);
          
          if (error) {
            throw error;
          }

          set({ isLoading: false });
          
        } catch (error) {
          console.error('❌ Resend confirmation error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Resend confirmation failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Set user (internal)
      setUser: (user: AuthUser | null) => {
        set({ user });
      },

      // Set session (internal)
      setSession: (session: Session | null) => {
        set({ session });
      },

      // Set loading state
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Initialize auth state
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          const session = await authService.getSession();
          
          if (session?.user) {
            const userProfile = await authService.getUserProfile(session.user.id);
            set({ 
              session,
              user: userProfile,
              isInitialized: true,
              isLoading: false 
            });
          } else {
            set({ 
              session: null,
              user: null,
              isInitialized: true,
              isLoading: false 
            });
          }
          
        } catch (error) {
          console.error('❌ Initialize auth error:', error);
          set({ 
            session: null,
            user: null,
            isInitialized: true,
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);

// Helper hooks
export const useAuth = () => useAuthStore();
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

export default useAuthStore;