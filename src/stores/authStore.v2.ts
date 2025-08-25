/**
 * Enhanced Authentication Store
 * Professional state management with comprehensive error handling
 */

import { StateCreator } from 'zustand';
import { createStore, createAsyncAction, StoreWithBase } from '@/lib/store/createStore';
import { authService } from '@/lib/auth/AuthService';
import { ErrorHandler, AuthenticationError } from '@/lib/errors';
import type { User, UserRole, LoginCredentials, CreateUserData } from '@/types';

// Auth store state
export interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  sessionExpiry: Date | null;
  loginAttempts: number;
  lastLoginAttempt: Date | null;
  permissions: string[];
}

// Auth store actions
export interface AuthStoreActions {
  // Authentication actions
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (userData: CreateUserData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // User management
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Session management
  checkSession: () => boolean;
  extendSession: () => void;
  
  // Permissions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  
  // Utility actions
  initialize: () => Promise<void>;
  trackLoginAttempt: () => void;
  resetLoginAttempts: () => void;
}

// Combined store type
type AuthStore = StoreWithBase<AuthStoreState & AuthStoreActions>;

// Initial state
const initialState: AuthStoreState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  sessionExpiry: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
  permissions: [],
};

// Store creator
const authStoreCreator: StateCreator<AuthStore, [], [], AuthStore> = (set, get) => ({
  ...initialState,

  // Authentication Actions
  signIn: createAsyncAction(
    async (credentials: LoginCredentials) => {
      const state = get();
      
      // Check rate limiting
      if (state.loginAttempts >= 5) {
        const timeSinceLastAttempt = state.lastLoginAttempt 
          ? Date.now() - state.lastLoginAttempt.getTime() 
          : Infinity;
        
        if (timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes
          throw new AuthenticationError(
            'RATE_LIMITED',
            'Too many login attempts',
            'تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة بعد 15 دقيقة'
          );
        } else {
          // Reset attempts after cooldown
          set((state) => {
            state.loginAttempts = 0;
            state.lastLoginAttempt = null;
          });
        }
      }

      const result = await authService.signInWithEmail(credentials);
      
      set((state) => {
        state.user = result.user;
        state.isAuthenticated = true;
        state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        state.permissions = getUserPermissions(result.user);
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        state._lastUpdated = new Date();
      });
    },
    {
      onStart: () => {
        set((state) => {
          state.setLoading(true);
          state.clearError();
        });
      },
      onError: (error) => {
        set((state) => {
          state.trackLoginAttempt();
          state.setError(error.message);
        });
        ErrorHandler.handle(error, { context: 'auth_signin' });
      },
      onFinally: () => {
        set((state) => {
          state.setLoading(false);
        });
      },
    }
  ),

  signInWithGoogle: createAsyncAction(
    async () => {
      const result = await authService.signInWithGoogle();
      
      set((state) => {
        state.user = result.user;
        state.isAuthenticated = true;
        state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        state.permissions = getUserPermissions(result.user);
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        state._lastUpdated = new Date();
      });
    },
    {
      onStart: () => {
        set((state) => {
          state.setLoading(true);
          state.clearError();
        });
      },
      onError: (error) => {
        set((state) => {
          state.setError(error.message);
        });
        ErrorHandler.handle(error, { context: 'auth_google_signin' });
      },
      onFinally: () => {
        set((state) => {
          state.setLoading(false);
        });
      },
    }
  ),

  signUp: createAsyncAction(
    async (userData: CreateUserData) => {
      const result = await authService.createAccount(userData);
      
      set((state) => {
        state.user = result.user;
        state.isAuthenticated = true;
        state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        state.permissions = getUserPermissions(result.user);
        state._lastUpdated = new Date();
      });
    },
    {
      onStart: () => {
        set((state) => {
          state.setLoading(true);
          state.clearError();
        });
      },
      onError: (error) => {
        set((state) => {
          state.setError(error.message);
        });
        ErrorHandler.handle(error, { context: 'auth_signup' });
      },
      onFinally: () => {
        set((state) => {
          state.setLoading(false);
        });
      },
    }
  ),

  signOut: createAsyncAction(
    async () => {
      await authService.signOut();
      
      set((state) => {
        Object.assign(state, initialState);
        state._lastUpdated = new Date();
      });
    },
    {
      onStart: () => {
        set((state) => {
          state.setLoading(true);
          state.clearError();
        });
      },
      onError: (error) => {
        set((state) => {
          state.setError(error.message);
        });
        ErrorHandler.handle(error, { context: 'auth_signout' });
      },
      onFinally: () => {
        set((state) => {
          state.setLoading(false);
        });
      },
    }
  ),

  resetPassword: createAsyncAction(
    async (email: string) => {
      await authService.resetPassword(email);
    },
    {
      onStart: () => {
        set((state) => {
          state.setLoading(true);
          state.clearError();
        });
      },
      onError: (error) => {
        set((state) => {
          state.setError(error.message);
        });
        ErrorHandler.handle(error, { context: 'auth_reset_password' });
      },
      onFinally: () => {
        set((state) => {
          state.setLoading(false);
        });
      },
    }
  ),

  // User Management Actions
  updateProfile: createAsyncAction(
    async (updates: Partial<User>) => {
      const state = get();
      if (!state.user) {
        throw new AuthenticationError('NOT_AUTHENTICATED', 'User not authenticated', 'يجب تسجيل الدخول أولاً');
      }

      // Here you would call the user service to update profile
      // const updatedUser = await userService.updateProfile(state.user.id, updates);
      
      set((state) => {
        if (state.user) {
          Object.assign(state.user, updates);
          state._lastUpdated = new Date();
        }
      });
    },
    {
      onStart: () => {
        set((state) => {
          state.setLoading(true);
          state.clearError();
        });
      },
      onError: (error) => {
        set((state) => {
          state.setError(error.message);
        });
        ErrorHandler.handle(error, { context: 'auth_update_profile' });
      },
      onFinally: () => {
        set((state) => {
          state.setLoading(false);
        });
      },
    }
  ),

  updatePassword: createAsyncAction(
    async (newPassword: string) => {
      await authService.updateUserPassword(newPassword);
    },
    {
      onStart: () => {
        set((state) => {
          state.setLoading(true);
          state.clearError();
        });
      },
      onError: (error) => {
        set((state) => {
          state.setError(error.message);
        });
        ErrorHandler.handle(error, { context: 'auth_update_password' });
      },
      onFinally: () => {
        set((state) => {
          state.setLoading(false);
        });
      },
    }
  ),

  refreshUser: createAsyncAction(
    async () => {
      const currentUser = authService.getCurrentUser();
      
      set((state) => {
        state.user = currentUser;
        state.isAuthenticated = !!currentUser;
        state.permissions = currentUser ? getUserPermissions(currentUser) : [];
        state._lastUpdated = new Date();
      });
    },
    {
      onError: (error) => {
        ErrorHandler.handle(error, { context: 'auth_refresh_user' });
      },
    }
  ),

  // Session Management
  checkSession: () => {
    const state = get();
    if (!state.sessionExpiry) return false;
    
    const isExpired = Date.now() > state.sessionExpiry.getTime();
    
    if (isExpired) {
      set((state) => {
        Object.assign(state, initialState);
        state.setError('انتهت جلسة العمل. يرجى تسجيل الدخول مرة أخرى');
      });
      return false;
    }
    
    return true;
  },

  extendSession: () => {
    set((state) => {
      if (state.isAuthenticated) {
        state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        state._lastUpdated = new Date();
      }
    });
  },

  // Permission Management
  hasPermission: (permission: string) => {
    const state = get();
    return state.permissions.includes(permission);
  },

  hasRole: (role: UserRole | UserRole[]) => {
    const state = get();
    if (!state.user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(state.user.role);
  },

  // Utility Actions
  initialize: createAsyncAction(
    async () => {
      // Set up auth state listener
      authService.onAuthStateChange((user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
          state.permissions = user ? getUserPermissions(user) : [];
          state.isInitialized = true;
          state._lastUpdated = new Date();
        });
      });

      // Check current user
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        set((state) => {
          state.user = currentUser;
          state.isAuthenticated = true;
          state.permissions = getUserPermissions(currentUser);
          state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        });
      }

      set((state) => {
        state.isInitialized = true;
      });
    },
    {
      onError: (error) => {
        set((state) => {
          state.isInitialized = true;
          state.setError('فشل في تهيئة نظام المصادقة');
        });
        ErrorHandler.handle(error, { context: 'auth_initialize' });
      },
    }
  ),

  trackLoginAttempt: () => {
    set((state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = new Date();
    });
  },

  resetLoginAttempts: () => {
    set((state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
    });
  },
});

// Helper function to get user permissions
function getUserPermissions(user: User): string[] {
  const basePermissions = ['read_profile', 'update_profile'];
  
  switch (user.role) {
    case 'admin':
      return [
        ...basePermissions,
        'manage_users',
        'manage_vendors',
        'manage_products',
        'view_analytics',
        'manage_system',
      ];
    case 'vendor':
      return [
        ...basePermissions,
        'manage_own_products',
        'view_own_orders',
        'manage_inventory',
      ];
    case 'customer':
      return [
        ...basePermissions,
        'create_orders',
        'view_own_orders',
        'write_reviews',
      ];
    default:
      return basePermissions;
  }
}

// Create the store
export const useAuthStore = createStore(authStoreCreator, {
  name: 'auth',
  version: 2,
  persist: true,
  persistOptions: {
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      sessionExpiry: state.sessionExpiry,
      permissions: state.permissions,
    }),
  },
  enableDevtools: true,
  enableImmer: true,
  enableSubscriptions: true,
  onError: (error) => {
    console.error('Auth store error:', error);
  },
});

// Export store type for type safety
export type AuthStore = ReturnType<typeof useAuthStore.getState>;

export default useAuthStore;