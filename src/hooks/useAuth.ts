/**
 * Enhanced Authentication Hook
 * Provides comprehensive auth state management with error handling and persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { User, UserRole } from '@/types';
import toast from 'react-hot-toast';

export interface UseAuthReturn {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  hasRole: (role: UserRole) => boolean;
  canAccess: (requiredRoles: UserRole[]) => boolean;
  isAdmin: boolean;
  isVendor: boolean;
  isCustomer: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const { 
    user, 
    setUser, 
    loading: storeLoading, 
    error: storeError,
    signIn: storeSignIn,
    signUp: storeSignUp,
    signOut: storeSignOut,
    resetPassword: storeResetPassword,
    updateProfile: storeUpdateProfile,
    clearError: storeClearError
  } = useAuthStore();

  const [localError, setLocalError] = useState<string | null>(null);

  // Sign in with enhanced error handling
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await storeSignIn(email, password);
      toast.success('تم تسجيل الدخول بنجاح', { duration: 3000 });
    } catch (error: any) {
      const errorMessage = error.message || 'فشل في تسجيل الدخول';
      toast.error(errorMessage, { duration: 5000 });
      throw error;
    }
  }, [storeSignIn]);

  // Sign up with enhanced validation
  const signUp = useCallback(async (email: string, password: string, userData: Partial<User>) => {
    try {
      await storeSignUp(email, password, userData.displayName || '');
      toast.success('تم إنشاء الحساب بنجاح! يرجى تأكيد البريد الإلكتروني', { duration: 5000 });
    } catch (error: any) {
      const errorMessage = error.message || 'فشل في إنشاء الحساب';
      toast.error(errorMessage, { duration: 5000 });
      throw error;
    }
  }, [storeSignUp]);

  // Sign out with cleanup
  const signOut = useCallback(async () => {
    try {
      await storeSignOut();
      toast.success('تم تسجيل الخروج بنجاح', { duration: 2000 });
    } catch (error: any) {
      toast.error('حدث خطأ في تسجيل الخروج', { duration: 3000 });
      throw error;
    }
  }, [storeSignOut]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      await storeResetPassword(email);
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', { duration: 5000 });
    } catch (error: any) {
      const errorMessage = error.message || 'فشل في إرسال رابط إعادة التعيين';
      toast.error(errorMessage, { duration: 5000 });
      throw error;
    }
  }, [storeResetPassword]);

  // Update user profile
  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      await storeUpdateProfile(userData);
      toast.success('تم تحديث الملف الشخصي بنجاح', { duration: 3000 });
    } catch (error: any) {
      const errorMessage = error.message || 'فشل في تحديث الملف الشخصي';
      toast.error(errorMessage, { duration: 5000 });
      throw error;
    }
  }, [storeUpdateProfile]);

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    try {
      // For now, just clear any errors
      storeClearError();
    } catch (error) {
      console.error('Failed to refresh auth state:', error);
    }
  }, [storeClearError]);

  // Clear error state
  const clearError = useCallback(() => {
    storeClearError();
    setLocalError(null);
  }, [storeClearError]);

  // Role-based access control utilities
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const canAccess = useCallback((requiredRoles: UserRole[]): boolean => {
    return user ? requiredRoles.includes(user.role) : false;
  }, [user]);

  // Computed properties
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const isVendor = useMemo(() => hasRole('vendor'), [hasRole]);
  const isCustomer = useMemo(() => hasRole('customer'), [hasRole]);
  const isAuthenticated = useMemo(() => !!user, [user]);

  return {
    // State
    user,
    isLoading: storeLoading,
    isAuthenticated,
    error: storeError || localError,
    
    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshAuth,
    clearError,
    
    // Utilities
    hasRole,
    canAccess,
    isAdmin,
    isVendor,
    isCustomer,
  };
};

export default useAuth;