import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppwriteAuthService } from '@/services/appwrite-auth.service';
import { MockAuthService } from '@/services/mock-auth.service';
import { adminAuthService } from '@/services/admin-auth.service';
import { envConfig } from '@/config/environment.config';

// 🚀 APPWRITE-POWERED AUTH CONTEXT
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

  // 🚀 APPWRITE AUTH INITIALIZATION
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing Appwrite authentication...');

        // Set up Appwrite auth state listener
        unsubscribe = AppwriteAuthService.onAuthStateChange((currentUser) => {
          if (mounted) {
            setUser(currentUser);
            setLoading(false);
            
            if (currentUser) {
              console.log('✅ User authenticated:', currentUser.email);
            } else {
              console.log('👤 No user authenticated (guest mode)');
            }
          }
        });

      } catch (error) {
        console.warn('⚠️ Appwrite auth initialization error, falling back to mock auth:', error);
        
        // Fallback to mock auth for development
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          console.log('🔄 Using mock auth for development');
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
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login...');
      
      // 1. Check if this is an admin login first
      const adminResult = await adminAuthService.loginAdmin(username, password);
      if (adminResult.success && adminResult.admin) {
        const adminUser = {
          ...adminResult.admin,
          displayName: adminResult.admin.displayName,
        };
        setUser(adminUser);
        localStorage.setItem('demo_user', JSON.stringify(adminUser));
        setLoading(false);
        console.log('✅ Admin login successful');
        return adminUser;
      }

      // 2. Try Appwrite authentication
      try {
        const appwriteUser = await AppwriteAuthService.signIn(username, password);
        setUser(appwriteUser);
        setLoading(false);
        console.log('✅ Appwrite login successful');
        return appwriteUser;
      } catch (appwriteError: any) {
        console.warn('⚠️ Appwrite login failed, trying mock auth...', appwriteError.message);
        
        // 3. Try mock auth service for test accounts (development)
        if (envConfig.get('useMockAuth')) {
          try {
            const mockUser = await MockAuthService.signIn(username, password);
            setUser(mockUser);
            localStorage.setItem('demo_user', JSON.stringify(mockUser));
            setLoading(false);
            console.log('✅ Mock auth login successful');
            return mockUser;
          } catch (mockError) {
            console.warn('⚠️ Mock auth also failed');
          }
        }
        
        // 4. Development mode - create demo user (fallback)
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
              currency: 'EGP',
              notifications: {
                email: true,
                sms: false,
                push: true,
              },
            },
          };
          
          localStorage.setItem('demo_user', JSON.stringify(demoUser));
          setUser(demoUser);
          setLoading(false);
          console.log('✅ Demo login successful (fallback)');
          return demoUser;
        }
        
        // If all methods fail, throw the original Appwrite error
        throw appwriteError;
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Try Appwrite logout
      try {
        await AppwriteAuthService.signOut();
        console.log('✅ Appwrite logout successful');
      } catch (appwriteError) {
        console.warn('⚠️ Appwrite logout failed (non-blocking):', appwriteError);
      }
      
      // Clear local storage (mock auth)
      localStorage.removeItem('demo_user');
      localStorage.removeItem('mock_auth_user');
      localStorage.removeItem('mock_auth_session');
      localStorage.removeItem('admin_session');
      
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout even if there's an error
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
  return context;
};

export default AuthContext;
