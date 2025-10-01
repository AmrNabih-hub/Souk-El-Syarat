import React, { createContext, useContext, useState, useEffect } from 'react';
import { MockAuthService } from '@/services/mock-auth.service';
import { adminAuthService } from '@/services/admin-auth.service';
import { envConfig } from '@/config/environment.config';

// 🚀 SAFE DEVELOPMENT-FIRST AUTH CONTEXT - NO MORE BLANK PAGES
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

  // 🚀 DEVELOPMENT-SAFE AUTH INITIALIZATION - NO AMPLIFY DEPENDENCY
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Always set loading to false quickly to prevent blocking UI
        setTimeout(() => {
          if (mounted) {
            setLoading(false);
          }
        }, 100);

        // Development mode - use localStorage for demo purposes
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          console.log('🚀 Development mode - Using localStorage auth simulation');
          
          // Check if we have a stored demo user
          const storedUser = localStorage.getItem('demo_user');
          if (storedUser && mounted) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              console.log('✅ Demo user loaded from localStorage');
            } catch (e) {
              console.warn('Invalid stored user data, clearing...');
              localStorage.removeItem('demo_user');
            }
          }
          return;
        }

        // Production mode - try to initialize Amplify auth safely
        try {
          const { getCurrentUser } = await import('aws-amplify/auth');
          const current = await getCurrentUser();
          if (mounted) {
            setUser(current);
            console.log('✅ Production user authenticated');
          }
        } catch (error) {
          console.debug('Auth: No authenticated user, using guest mode');
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.warn('Auth initialization error (gracefully handled):', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // Check if this is an admin login first
      const adminResult = await adminAuthService.loginAdmin(username, password);
      if (adminResult.success && adminResult.admin) {
        const adminUser = {
          ...adminResult.admin,
          displayName: adminResult.admin.displayName,
        };
        setUser(adminUser);
        localStorage.setItem('demo_user', JSON.stringify(adminUser));
        setLoading(false);
        return adminUser;
      }

      // Try mock auth service for test accounts (development)
      if (envConfig.get('useMockAuth')) {
        const mockUser = await MockAuthService.signIn(username, password);
        setUser(mockUser);
        localStorage.setItem('demo_user', JSON.stringify(mockUser));
        setLoading(false);
        return mockUser;
      }

      // Development mode - create demo user (fallback)
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        const demoUser = {
          id: 'demo-user-' + Date.now(),
          email: username,
          displayName: 'Demo User',
          role: 'customer',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: {
            language: 'ar',
            currency: 'USD',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };
        
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        console.log('✅ Demo login successful');
        return demoUser;
      }

      // Production mode - use real Amplify auth
      const { signIn } = await import('aws-amplify/auth');
      const result = await signIn({ username, password });
      setUser(result);
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Development mode - clear localStorage
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        localStorage.removeItem('demo_user');
        setUser(null);
        console.log('✅ Demo logout successful');
        return;
      }

      // Production mode - use real Amplify signout
      const { signOut } = await import('aws-amplify/auth');
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if Amplify fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
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
