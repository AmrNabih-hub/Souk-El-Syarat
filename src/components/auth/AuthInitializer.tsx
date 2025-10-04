/**
 * 🔐 Auth Initializer Component
 * Initializes authentication state and listens to Supabase auth changes
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/config/supabase.config';
import { authService } from '@/services/supabase-auth.service';

export const AuthInitializer: React.FC = () => {
  const { initialize, setUser, setSession, setLoading } = useAuthStore();
  const initializeCalledRef = useRef(false);

  useEffect(() => {
    // Initialize auth state on mount (only once)
    if (!initializeCalledRef.current) {
      initializeCalledRef.current = true;
      console.log('🔐 Initializing auth state...');
      initialize();
    }

    // Listen to auth state changes from Supabase
    console.log('🔐 Setting up auth state change listener...');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.id);

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            console.log('✅ User signed in/refreshed:', session.user.email);
            setLoading(true);
            
            try {
              console.log('🔍 Fetching user profile for:', session.user.id);
              const userProfile = await authService.getUserProfile(session.user.id);
              
              if (userProfile) {
                console.log('✅ Profile fetched:', {
                  email: userProfile.email,
                  role: userProfile.role,
                  id: userProfile.id
                });
                setSession(session);
                setUser(userProfile);
                console.log('✅ Auth state fully updated');
              } else {
                console.error('❌ Profile returned null - user may not exist in database');
                console.log('🔧 Creating basic user profile from auth data...');
                
                // Fallback: use auth session data
                const fallbackUser = {
                  id: session.user.id,
                  email: session.user.email,
                  phone: session.user.phone,
                  role: (session.user.user_metadata?.role || 'customer') as 'customer' | 'vendor' | 'admin',
                  isActive: true,
                  emailVerified: !!session.user.email_confirmed_at,
                  phoneVerified: false,
                  createdAt: new Date(session.user.created_at),
                  updatedAt: new Date(),
                  metadata: session.user.user_metadata,
                };
                
                console.log('✅ Using fallback profile:', fallbackUser);
                setSession(session);
                setUser(fallbackUser);
              }
            } catch (error) {
              console.error('❌ Error in auth state change handler:', error);
            } finally {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
          break;

        case 'SIGNED_OUT':
          console.log('🚪 User signed out');
          setSession(null);
          setUser(null);
          break;

        case 'USER_UPDATED':
          if (session?.user) {
            console.log('🔄 User updated, refreshing profile...');
            try {
              const userProfile = await authService.getUserProfile(session.user.id);
              setUser(userProfile);
            } catch (error) {
              console.error('❌ Error updating user profile:', error);
            }
          }
          break;

        case 'PASSWORD_RECOVERY':
          console.log('🔑 Password recovery initiated');
          break;

        default:
          console.log('🔐 Auth event:', event);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔐 Cleaning up auth listener...');
      subscription.unsubscribe();
    };
  }, [initialize, setUser, setSession, setLoading]);

  // This component doesn't render anything
  return null;
};

export default AuthInitializer;
