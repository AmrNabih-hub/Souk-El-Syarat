/**
 * 🔐 Auth Provider Component
 * Centralized authentication initialization and state management
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/config/supabase.config';
import { authService } from '@/services/supabase-auth.service';
import LoadingScreen from '@/components/ui/LoadingScreen';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser, setSession, setLoading } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 [AuthProvider] Starting initialization...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthProvider] Session error:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setIsInitializing(false);
          }
          return;
        }

        if (session?.user) {
          console.log('✅ [AuthProvider] Session found:', session.user.email);
          
          try {
            // Try to get profile from database
            const userProfile = await authService.getUserProfile(session.user.id);
            
            if (userProfile && mounted) {
              console.log('✅ [AuthProvider] Profile loaded:', {
                email: userProfile.email,
                role: userProfile.role,
                id: userProfile.id
              });
              setSession(session);
              setUser(userProfile);
            } else if (mounted) {
              // Fallback to session data
              console.log('⚠️ [AuthProvider] Using fallback profile from session');
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
              setSession(session);
              setUser(fallbackUser);
            }
          } catch (profileError) {
            console.error('❌ [AuthProvider] Profile fetch failed:', profileError);
            if (mounted) {
              // Still use fallback
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
              setSession(session);
              setUser(fallbackUser);
            }
          }
        } else {
          console.log('ℹ️ [AuthProvider] No active session');
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ [AuthProvider] Initialize error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('✅ [AuthProvider] Initialization complete');
          setIsInitializing(false);
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen to auth changes
    console.log('🔐 [AuthProvider] Setting up auth listener...');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [AuthProvider] Auth event:', event, session?.user?.email);

      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            try {
              const userProfile = await authService.getUserProfile(session.user.id);
              if (userProfile && mounted) {
                console.log('✅ [AuthProvider] User profile updated:', userProfile.role);
                setSession(session);
                setUser(userProfile);
              } else if (mounted) {
                // Fallback
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
                setSession(session);
                setUser(fallbackUser);
              }
            } catch (error) {
              console.error('❌ [AuthProvider] Profile fetch error:', error);
            }
          }
          break;

        case 'SIGNED_OUT':
          if (mounted) {
            console.log('🚪 [AuthProvider] User signed out');
            setSession(null);
            setUser(null);
          }
          break;

        case 'USER_UPDATED':
          if (session?.user && mounted) {
            try {
              const userProfile = await authService.getUserProfile(session.user.id);
              if (userProfile) {
                setUser(userProfile);
              }
            } catch (error) {
              console.error('❌ [AuthProvider] User update error:', error);
            }
          }
          break;
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
      console.log('🔐 [AuthProvider] Cleanup complete');
    };
  }, [setUser, setSession, setLoading]);

  // Show loading only during initial mount
  if (isInitializing) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export default AuthProvider;
