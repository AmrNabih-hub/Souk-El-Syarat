import { create } from 'zustand';
import { User, AuthState } from '@/types';
import { AuthService } from '@/services/auth.service.fixed';
import { AdminAuthService } from '@/services/admin-auth.service';
import { useAppStore } from './appStore';
import { useRealtimeStore } from './realtimeStore';

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
          };
          
          set({ user, isLoading: false, authChecked: true });
          
          // Initialize real-time sync for admin
          await useAppStore.getState().initializeRealtimeSync(user.id);
          await useRealtimeStore.getState().initializeRealtimeServices(user.id, 'admin');
          localStorage.setItem('currentUserRole', 'admin');
          localStorage.setItem('currentUserName', user.displayName);
          console.log('✅ Admin signed in with full real-time system initialized');
          return;
        }
      } catch (adminError) {
        console.log('Not admin credentials, trying regular auth...');
      }
      
      // Regular user authentication
      const user = await AuthService.signIn(email, password);
      set({ user, isLoading: false, authChecked: true });
      
      // Initialize complete real-time system for regular user
      await useAppStore.getState().initializeRealtimeSync(user.id);
      await useRealtimeStore.getState().initializeRealtimeServices(user.id, user.role);
      localStorage.setItem('currentUserRole', user.role);
      localStorage.setItem('currentUserName', user.displayName);
      console.log('✅ User signed in with complete real-time system initialized');
      
    } catch (error) {
      console.error('Sign in error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'فشل في تسجيل الدخول', 
        isLoading: false,
        authChecked: true
      });
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signUp(email, password, displayName);
      set({ user, isLoading: false, authChecked: true });
      
      // Initialize complete real-time system for new user
      await useAppStore.getState().initializeRealtimeSync(user.id);
      await useRealtimeStore.getState().initializeRealtimeServices(user.id, user.role);
      localStorage.setItem('currentUserRole', user.role);
      localStorage.setItem('currentUserName', user.displayName);
      console.log('✅ User signed up with complete real-time system initialized');
      
    } catch (error) {
      console.error('Sign up error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'فشل في إنشاء الحساب', 
        isLoading: false,
        authChecked: true
      });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await AuthService.signInWithGoogle();
      set({ user, isLoading: false, authChecked: true });
      
      // Initialize complete real-time system for Google user
      await useAppStore.getState().initializeRealtimeSync(user.id);
      await useRealtimeStore.getState().initializeRealtimeServices(user.id, user.role);
      localStorage.setItem('currentUserRole', user.role);
      localStorage.setItem('currentUserName', user.displayName);
      console.log('✅ Google user signed in with complete real-time system initialized');
      
    } catch (error) {
      console.error('Google sign in error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'فشل في تسجيل الدخول بجوجل', 
        isLoading: false,
        authChecked: true
      });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Disconnect all real-time services before signing out
      useAppStore.getState().disconnectRealtimeSync();
      useRealtimeStore.getState().disconnectAllServices();
      localStorage.removeItem('currentUserRole');
      localStorage.removeItem('currentUserName');
      console.log('🔌 All real-time services disconnected');
      
      await AuthService.signOut();
      set({ user: null, isLoading: false, authChecked: true });
      console.log('✅ User signed out successfully');
      
    } catch (error) {
      console.error('Sign out error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'فشل في تسجيل الخروج', 
        isLoading: false 
      });
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await AuthService.resetPassword(email);
      set({ isLoading: false });
    } catch (error) {
      console.error('Reset password error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'فشل في إرسال رابط إعادة تعيين كلمة المرور', 
        isLoading: false 
      });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      set({ isLoading: true, error: null });
      const { user } = get();
      if (!user) throw new Error('No user logged in');
      
      await AuthService.updateUserProfile(user.id, updates);
      const updatedUser = { ...user, ...updates };
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      console.error('Update profile error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'فشل في تحديث الملف الشخصي', 
        isLoading: false 
      });
    }
  },

  setUser: (user: User | null) => {
    set({ user });
    
    // Handle all real-time services based on user state
    if (user) {
      // Initialize all real-time services for existing user
      useAppStore.getState().initializeRealtimeSync(user.id);
      useRealtimeStore.getState().initializeRealtimeServices(user.id, user.role);
      localStorage.setItem('currentUserRole', user.role);
      localStorage.setItem('currentUserName', user.displayName);
    } else {
      // Disconnect all services when user is cleared
      useAppStore.getState().disconnectRealtimeSync();
      useRealtimeStore.getState().disconnectAllServices();
      localStorage.removeItem('currentUserRole');
      localStorage.removeItem('currentUserName');
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  // Enhanced auth initialization with real-time sync
  initializeAuth: () => {
    console.log('🚀 Initializing Auth System...');
    try {
      AuthService.onAuthStateChange((user) => {
        console.log('📡 Auth state changed:', user ? `${user.displayName} (${user.role})` : 'No user');
        
        const currentUser = get().user;
        const wasAuthenticated = !!currentUser;
        const isNowAuthenticated = !!user;
        
        // Update auth state
        set({ 
          user, 
          isLoading: false, 
          authChecked: true, 
          isInitialized: true 
        });
        
        // Handle all real-time services transitions
        if (!wasAuthenticated && isNowAuthenticated) {
          // User just logged in - initialize all services
          console.log('🔄 User authenticated - initializing complete real-time system');
          useAppStore.getState().initializeRealtimeSync(user!.id);
          useRealtimeStore.getState().initializeRealtimeServices(user!.id, user!.role);
          localStorage.setItem('currentUserRole', user!.role);
          localStorage.setItem('currentUserName', user!.displayName);
        } else if (wasAuthenticated && !isNowAuthenticated) {
          // User just logged out - disconnect all services
          console.log('🔌 User logged out - disconnecting all real-time services');
          useAppStore.getState().disconnectRealtimeSync();
          useRealtimeStore.getState().disconnectAllServices();
          localStorage.removeItem('currentUserRole');
          localStorage.removeItem('currentUserName');
        } else if (isNowAuthenticated && currentUser?.id !== user!.id) {
          // Different user logged in - reinitialize all services
          console.log('🔄 Different user - reinitializing complete real-time system');
          useAppStore.getState().disconnectRealtimeSync();
          useRealtimeStore.getState().disconnectAllServices();
          useAppStore.getState().initializeRealtimeSync(user!.id);
          useRealtimeStore.getState().initializeRealtimeServices(user!.id, user!.role);
          localStorage.setItem('currentUserRole', user!.role);
          localStorage.setItem('currentUserName', user!.displayName);
        }
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
