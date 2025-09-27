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

  // Try to load the current authenticated user via Amplify Auth
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const current = await getCurrentUser();
        if (mounted) setUser(current);
      } catch (err) {
        // Not authenticated or Amplify not configured — fallback to anonymous
        if (process.env.NODE_ENV === 'development') {
          console.debug('Auth: no authenticated user found, using fallback');
          if (mounted) setUser(null);
        }
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
