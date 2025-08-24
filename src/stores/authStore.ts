import { create } from 'zustand';
import { User, AuthState } from '@/types';
import { AuthService } from '@/services/auth.service';

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
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: true, // Start with loading true
  error: null,

  // Initialize auth state
  initialize: () => {
    console.log('🚀 Initializing auth store...');
    
    try {
      // Set up auth state listener
      const unsubscribe = AuthService.onAuthStateChange((user) => {
        console.log('🔄 Auth state changed:', user ? 'User logged in' : 'User logged out');
        set({ user, isLoading: false });
      });

      // Store unsubscribe function for cleanup
      (window as any).__authUnsubscribe = unsubscribe;
      
      console.log('✅ Auth store initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize auth store:', error);
      set({ isLoading: false, error: 'Failed to initialize authentication' });
    }
  },

  // Actions
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signIn(email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
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
}));
