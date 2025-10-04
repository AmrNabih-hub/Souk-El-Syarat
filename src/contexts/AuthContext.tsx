import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/config/supabase.config';
import { useNavigate } from 'react-router-dom';

// 🚀 MODERN SUPABASE AUTH CONTEXT WITH ROLE-BASED ROUTING
interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
  redirectToUserDashboard: (userRole: string) => void;
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

  const redirectToUserDashboard = (userRole: string) => {
    // Role-based redirect logic
    switch (userRole) {
      case 'admin':
        window.location.href = '/admin/dashboard';
        break;
      case 'vendor':
        window.location.href = '/vendor/dashboard';
        break;
      case 'customer':
        window.location.href = '/customer/dashboard';
        break;
      default:
        window.location.href = '/marketplace';
        break;
    }
  };

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
        
        // Redirect to role-based dashboard
        setTimeout(() => {
          redirectToUserDashboard(adminUser.role);
        }, 1000);
        
        return demoUser;
      }

      // Try Supabase authentication for real users
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Get user profile from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userData = {
            id: data.user.id,
            email: data.user.email,
            displayName: profile?.display_name || profile?.first_name || 'User',
            role: profile?.role || 'customer',
            isActive: true,
            emailVerified: data.user.email_confirmed_at !== null,
            createdAt: data.user.created_at,
            updatedAt: data.user.updated_at,
            profile: profile
          };

          setUser(userData);
          localStorage.setItem('supabase_user', JSON.stringify(userData));
          setLoading(false);

          // Redirect to role-based dashboard
          setTimeout(() => {
            redirectToUserDashboard(userData.role);
          }, 1000);

          return userData;
        }
      } catch (supabaseError) {
        console.warn('Supabase auth failed, falling back to demo mode:', supabaseError);
      }

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
      localStorage.removeItem('supabase_user');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      setUser(null);
      
      // Redirect to home page
      window.location.href = '/';
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if it fails
      localStorage.removeItem('demo_user');
      localStorage.removeItem('supabase_user');
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, redirectToUserDashboard }}>
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