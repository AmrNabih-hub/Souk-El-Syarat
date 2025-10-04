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
    
    // Maximum initialization time: 10 seconds
    const maxInitTimeout = setTimeout(() => {
      if (mounted && isInitializing) {
        console.warn('⚠️ [AuthProvider] Initialization timeout after 10 seconds, forcing completion');
        setIsInitializing(false);
        setLoading(false);
      }
    }, 10000);

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
          console.log('📋 [AuthProvider] User metadata:', session.user.user_metadata);
          
          if (mounted) {
            // SIMPLIFIED: Use session data directly (no database query)
            console.log('🚀 [AuthProvider] Creating user from session data (SIMPLIFIED)');
            
            const user = {
              id: session.user.id,
              email: session.user.email!,
              phone: session.user.phone,
              role: (session.user.user_metadata?.role || session.user.user_metadata?.display_role || 'customer') as 'customer' | 'vendor' | 'admin',
              isActive: true,
              emailVerified: !!session.user.email_confirmed_at,
              phoneVerified: !!session.user.phone_confirmed_at,
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date(),
              metadata: session.user.user_metadata,
              displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
              photoURL: session.user.user_metadata?.avatar_url,
            };
            
            console.log('✅ [AuthProvider] User created:', {
              email: user.email,
              role: user.role,
              emailVerified: user.emailVerified
            });
            
            setSession(session);
            setUser(user);
            console.log('✅ [AuthProvider] Auth state updated - READY');
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
          if (session?.user && mounted) {
            console.log('🔐 [AuthProvider] Processing SIGNED_IN event for:', session.user.email);
            
            // SIMPLIFIED: Use session data directly
            const user = {
              id: session.user.id,
              email: session.user.email!,
              phone: session.user.phone,
              role: (session.user.user_metadata?.role || session.user.user_metadata?.display_role || 'customer') as 'customer' | 'vendor' | 'admin',
              isActive: true,
              emailVerified: !!session.user.email_confirmed_at,
              phoneVerified: !!session.user.phone_confirmed_at,
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date(),
              metadata: session.user.user_metadata,
              displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
              photoURL: session.user.user_metadata?.avatar_url,
            };
            
            console.log('✅ [AuthProvider] User set:', user.role);
            setSession(session);
            setUser(user);
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
      clearTimeout(maxInitTimeout);
      subscription.unsubscribe();
      console.log('🔐 [AuthProvider] Cleanup complete');
    };
  }, [setUser, setSession, setLoading, isInitializing]);

  // Show loading only during initial mount
  if (isInitializing) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export default AuthProvider;
