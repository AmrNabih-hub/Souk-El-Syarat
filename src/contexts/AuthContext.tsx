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
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('⚠️ Session error:', error.message);
        }

        if (session?.user) {
          // Try to get user profile
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const userData = {
              id: session.user.id,
              email: session.user.email,
              displayName: profile?.display_name || profile?.first_name || session.user.email?.split('@')[0],
              role: profile?.user_role || 'customer',
              isActive: true,
              emailVerified: session.user.email_confirmed_at !== null,
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at,
              profile: profile
            };

            setUser(userData);
          } catch (profileError) {
            console.warn('⚠️ Profile fetch failed:', profileError);
            // Use basic user data without profile
            const basicUserData = {
              id: session.user.id,
              email: session.user.email,
              displayName: session.user.email?.split('@')[0] || 'User',
              role: 'customer',
              isActive: true,
              emailVerified: session.user.email_confirmed_at !== null,
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at,
            };
            setUser(basicUserData);
          }
        } else {
          // Check for demo user in localStorage
          const demoUser = localStorage.getItem('demo_user');
          if (demoUser) {
            setUser(JSON.parse(demoUser));
          }
        }
      } catch (sessionError) {
        console.warn('⚠️ Session initialization failed:', sessionError);
        
        // Check for demo user as fallback
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          setUser(JSON.parse(demoUser));
        }
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userData = {
            id: session.user.id,
            email: session.user.email,
            displayName: profile?.display_name || profile?.first_name || session.user.email?.split('@')[0],
            role: profile?.user_role || 'customer',
            isActive: true,
            emailVerified: session.user.email_confirmed_at !== null,
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at,
            profile: profile
          };

          setUser(userData);
          
          // Redirect to role-based dashboard
          setTimeout(() => {
            redirectToUserDashboard(userData.role);
          }, 1000);
        } catch (error) {
          console.warn('⚠️ Profile fetch failed on sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
        localStorage.removeItem('demo_user');
        localStorage.removeItem('supabase_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const redirectToUserDashboard = (userRole: string) => {
    // Role-based redirect logic
    switch (userRole) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'vendor':
        navigate('/vendor/dashboard');
        break;
      case 'customer':
        navigate('/customer/dashboard');
        break;
      default:
        navigate('/marketplace');
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
        console.log('🔐 Attempting Supabase login...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('❌ Supabase auth error:', error);
          throw error;
        }

        if (data.user) {
          console.log('✅ Supabase login successful');
          // The auth state change listener will handle the user setup
          return data.user;
        }
      } catch (supabaseError: any) {
        console.warn('⚠️ Supabase auth failed:', supabaseError.message);
        throw new Error(supabaseError.message || 'Authentication failed');
      }

      throw new Error('Invalid credentials');
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('⚠️ Supabase sign out warning:', error);
      }
      
      setUser(null);
      
      // Redirect to home page
      navigate('/');
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Force logout even if it fails
      localStorage.removeItem('demo_user');
      localStorage.removeItem('supabase_user');
      setUser(null);
      navigate('/');
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