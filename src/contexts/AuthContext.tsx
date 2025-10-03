import React, { createContext, useContext, useState, useEffect } from 'react';
import { appwriteAuthService } from '@/services/appwrite-auth.service';
import { adminAuthService } from '@/services/admin-auth.service';
import { envConfig } from '@/config/environment.config';

// 🚀 SAFE DEVELOPMENT-FIRST AUTH CONTEXT WITH APPWRITE
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

  // 🚀 DEVELOPMENT-SAFE AUTH INITIALIZATION WITH APPWRITE
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

        // Check if we have a stored demo user (for backwards compatibility)
        const storedUser = localStorage.getItem('demo_user');
        if (storedUser && mounted) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('✅ Demo user loaded from localStorage');
            return;
          } catch (e) {
            console.warn('Invalid stored user data, clearing...');
            localStorage.removeItem('demo_user');
          }
        }

        // Try to get current Appwrite user
        try {
          const currentUser = await appwriteAuthService.getCurrentUser();
          if (currentUser && mounted) {
            const user = {
              id: currentUser.$id,
              email: currentUser.email,
              displayName: currentUser.name,
              role: 'customer',
              isActive: true,
              emailVerified: currentUser.emailVerified || false,
              createdAt: new Date(currentUser.$createdAt),
              updatedAt: new Date(currentUser.$updatedAt),
              preferences: {
                language: 'ar',
                currency: 'EGP',
                notifications: { email: true, sms: false, push: true }
              }
            };
            setUser(user);
            console.log('✅ Appwrite user authenticated');
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

      // Use Appwrite authentication
      const session = await appwriteAuthService.login(username, password);
      if (session) {
        const currentUser = await appwriteAuthService.getCurrentUser();
        if (currentUser) {
          const user = {
            id: currentUser.$id,
            email: currentUser.email,
            displayName: currentUser.name,
            role: 'customer',
            isActive: true,
            emailVerified: currentUser.emailVerified || false,
            createdAt: new Date(currentUser.$createdAt),
            updatedAt: new Date(currentUser.$updatedAt),
            preferences: {
              language: 'ar',
              currency: 'EGP',
              notifications: { email: true, sms: false, push: true }
            }
          };
          setUser(user);
          localStorage.setItem('demo_user', JSON.stringify(user));
          setLoading(false);
          return user;
        }
      }

      throw new Error('Login failed');
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Check if admin logout
      if (adminAuthService.isAdminLoggedIn()) {
        adminAuthService.logoutAdmin();
      }
      
      // Appwrite logout
      await appwriteAuthService.logout();
      
      // Clear storage
      localStorage.removeItem('demo_user');
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if it fails
      localStorage.removeItem('demo_user');
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
