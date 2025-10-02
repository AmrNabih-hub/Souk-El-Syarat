import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppwriteAuthService } from '@/services/appwrite-auth.service';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        const currentUser = await AppwriteAuthService.getCurrentUser();
        
        if (mounted) {
          setUser(currentUser);
          console.log('✅ Auth initialized:', currentUser ? 'Logged in' : 'Guest');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener
    const unsubscribe = AppwriteAuthService.onAuthStateChange((newUser) => {
      if (mounted) {
        setUser(newUser);
        console.log('🔄 Auth state changed:', newUser ? 'Logged in' : 'Logged out');
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const user = await AppwriteAuthService.signIn(email, password);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    setLoading(true);
    try {
      const user = await AppwriteAuthService.signUp(email, password, displayName);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await AppwriteAuthService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    setLoading(true);
    try {
      const updatedUser = await AppwriteAuthService.updateProfile(user.id, updates);
      setUser(updatedUser);
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
