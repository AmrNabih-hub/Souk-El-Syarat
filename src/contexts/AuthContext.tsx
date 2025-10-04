import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/config/supabase.config';

// 🚀 MODERN SUPABASE AUTH CONTEXT
interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for demo user in localStorage
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      setUser(JSON.parse(demoUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<any> => {
    setLoading(true);
    
    try {
      // Admin check - demo users
      const adminCredentials = [
        { email: 'admin@soukel-sayarat.com', password: 'SoukAdmin2024!@#', role: 'admin' },
        { email: 'vendor@soukel-sayarat.com', password: 'VendorDemo2024!', role: 'vendor' },
        { email: 'customer@soukel-sayarat.com', password: 'CustomerDemo2024!', role: 'customer' }
      ];

      const adminUser = adminCredentials.find(
        admin => admin.email === email && admin.password === password
      );

      if (adminUser) {
        const demoUser = {
          id: `demo-${adminUser.role}-${Date.now()}`,
          email: adminUser.email,
          displayName: `Demo ${adminUser.role.charAt(0).toUpperCase() + adminUser.role.slice(1)}`,
          role: adminUser.role,
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: {
            language: 'ar',
            currency: 'EGP',
            notifications: { email: true, sms: false, push: true }
          }
        };
        
        setUser(demoUser);
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        setLoading(false);
        return demoUser;
      }

      // For now, we'll use demo mode - Supabase auth can be added later
      throw new Error('Invalid credentials');
      
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear demo user
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;