/**
 * 🔐 Supabase Authentication Service
 * Professional authentication service using Supabase Auth
 * Documentation: https://supabase.com/docs/guides/auth
 */

import { supabase, supabaseAdmin } from '@/config/supabase.config';
import type { 
  AuthError, 
  User, 
  Session, 
  AuthResponse,
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials,
  UserMetadata,
} from '@supabase/supabase-js';
import type { UserRole } from '@/types';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: UserMetadata;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface ResetPasswordData {
  email: string;
  redirectTo?: string;
}

class SupabaseAuthService {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { email, password, name, role = 'customer', phone, metadata = {} } = data;

      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            role,
            phone,
            ...metadata,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (response.error) throw response.error;

      // Create user profile after successful signup
      if (response.data.user) {
        await this.createUserProfile(response.data.user, { name, role, phone });
      }

      return response;
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const response = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (response.error) throw response.error;

      // Update last login timestamp
      if (response.data.user) {
        await this.updateLastLogin(response.data.user.id);
      }

      return response;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign in with OAuth provider (Google or GitHub)
   */
  async signInWithProvider(provider: 'google' | 'github') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ ${provider} sign in error:`, error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const result = await supabase.auth.signOut();
      if (result.error) throw result.error;
      
      console.log('✅ User signed out successfully');
      return result;
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('❌ Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  }

  /**
   * Get user profile with role information
   */
  async getUserProfile(userId?: string): Promise<AuthUser | null> {
    try {
      const user = userId ? { id: userId } : await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          profiles (
            display_name,
            first_name,
            last_name,
            avatar_url,
            bio,
            address,
            preferences
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isActive: data.is_active,
        emailVerified: data.email_verified,
        phoneVerified: data.phone_verified,
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        metadata: data.profiles,
      };
    } catch (error) {
      console.error('❌ Get user profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateProfileData): Promise<{ error: AuthError | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updates.metadata || {},
      });

      if (authError) throw authError;

      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: updates.name,
          updated_at: new Date().toISOString(),
          ...updates.metadata,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update users table if needed
      if (updates.phone) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            phone: updates.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (userError) throw userError;
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Update profile error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordData): Promise<{ error: AuthError | null }> {
    try {
      const result = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: data.redirectTo || `${window.location.origin}/auth/reset-password`,
      });

      if (result.error) throw result.error;
      return result;
    } catch (error) {
      console.error('❌ Reset password error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const result = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (result.error) throw result.error;
      return { error: null };
    } catch (error) {
      console.error('❌ Update password error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (session: Session | null, user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      callback(session, session?.user || null);
    });
  }

  /**
   * Admin: Create user profile
   */
  private async createUserProfile(user: User, data: { name: string; role: UserRole; phone?: string }) {
    try {
      // Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          role: data.role,
          phone: data.phone,
          email_verified: !!user.email_confirmed_at,
          phone_verified: !!user.phone_confirmed_at,
          is_active: true,
        });

      if (userError && userError.code !== '23505') { // Ignore duplicate key error
        console.warn('⚠️ User creation warning:', userError);
      }

      // Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: data.name,
        });

      if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
        console.warn('⚠️ Profile creation warning:', profileError);
      }

      console.log('✅ User profile created successfully');
    } catch (error) {
      console.error('❌ Create user profile error:', error);
    }
  }

  /**
   * Admin: Update last login timestamp
   */
  private async updateLastLogin(userId: string) {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.warn('⚠️ Update last login warning:', error);
    }
  }

  /**
   * Admin: Deactivate user
   */
  async deactivateUser(userId: string): Promise<{ error: Error | null }> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin client not configured');
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('❌ Deactivate user error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Admin: Delete user
   */
  async deleteUser(userId: string): Promise<{ error: Error | null }> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin client not configured');
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('❌ Delete user error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyOtp(email: string, token: string): Promise<AuthResponse> {
    try {
      const response = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (response.error) throw response.error;
      return response;
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      throw error;
    }
  }

  /**
   * Resend email confirmation
   */
  async resendConfirmation(email: string): Promise<{ error: AuthError | null }> {
    try {
      const result = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return result;
    } catch (error) {
      console.error('❌ Resend confirmation error:', error);
      return { error: error as AuthError };
    }
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService();
export default authService;