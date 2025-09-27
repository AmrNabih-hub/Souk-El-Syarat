import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 🚀 PROFESSIONAL AUTH LOADING - BULLETPROOF
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        // Only try to get user in production or if Amplify is properly configured
        if (process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost') {
          const current = await getCurrentUser();
          if (mounted) setUser(current);
        } else {
          // Development mode - skip Amplify auth to prevent errors
          console.log('🚀 Development mode - Auth simulation enabled');
          if (mounted) setUser(null);
        }
      } catch (err) {
        // Not authenticated or Amplify not configured — graceful fallback
        console.debug('Auth: Using anonymous mode for stability');
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const result = await signIn({ username, password });
      setUser(result);
      return result;
    } catch (error) {
      console.error('Auth signIn failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Auth signOut failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login: (login as any), logout: (logout as any), loading } as any}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as any;
};

export default AuthContext;
