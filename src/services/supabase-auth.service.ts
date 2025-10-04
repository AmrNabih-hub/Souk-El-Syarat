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
  // OAuth properties
  displayName?: string;
  photoURL?: string;
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

      // Step 1: Check if email already exists
      console.log('🔍 Checking if email exists:', email);
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('هذا البريد الإلكتروني مسجل بالفعل / This email is already registered');
      }

      // Step 2: Attempt signup
      console.log('📝 Creating new user:', email);
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

      if (response.error) {
        console.error('❌ Signup error:', response.error);
        throw response.error;
      }

      console.log('✅ Signup response:', response.data);

      // Step 3: Check if email confirmation is required
      if (response.data.user && !response.data.session) {
        console.log('📧 Email confirmation required');
        // User created but needs to confirm email
        // Create profile anyway so user exists in database
        await this.createUserProfile(response.data.user, { name, role, phone });
        
        throw new Error(
          'تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب. / Account created! Please check your email to confirm your account.'
        );
      }

      // Step 4: Create user profile after successful signup
      if (response.data.user) {
        console.log('👤 Creating user profile');
        await this.createUserProfile(response.data.user, { name, role, phone });
      }

      return response;
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      
      // Enhance error messages
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        throw new Error('هذا البريد الإلكتروني مسجل بالفعل / This email is already registered');
      }
      
      if (error.message?.includes('Email confirmation')) {
        // This is our custom message, pass it through
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting sign in for:', data.email);
      
      const response = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('🔐 Sign in response:', response);

      if (response.error) {
        console.error('❌ Sign in error:', response.error);
        
        // Enhance error messages
        if (response.error.message?.includes('Invalid login credentials')) {
          throw new Error(
            'البريد الإلكتروني أو كلمة المرور غير صحيحة. إذا لم تؤكد بريدك الإلكتروني بعد، يرجى التحقق من صندوق الوارد. / Invalid email or password. If you haven\'t confirmed your email yet, please check your inbox.'
          );
        }
        
        if (response.error.message?.includes('Email not confirmed')) {
          throw new Error(
            'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد للحصول على رابط التأكيد. / Please confirm your email first. Check your inbox for the confirmation link.'
          );
        }
        
        throw response.error;
      }

      // Check if user has confirmed email
      if (response.data.user && !response.data.user.email_confirmed_at) {
        console.warn('⚠️ Email not confirmed yet');
        throw new Error(
          'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد. / Please confirm your email first. Check your inbox.'
        );
      }

      // Update last login timestamp
      if (response.data.user) {
        console.log('✅ Sign in successful');
        await this.updateLastLogin(response.data.user.id);
      }

      return response;
    } catch (error: any) {
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
      if (!user) {
        console.error('❌ No user found for getUserProfile');
        return null;
      }

      console.log('🔍 Querying users table for:', user.id);
      
      // Add timeout to prevent hanging queries
      const queryPromise = supabase
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
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Database query error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If user not found, return null (will trigger fallback)
        if (error.code === 'PGRST116') {
          console.error('❌ User not found in users table:', user.id);
          return null;
        }
        
        throw error;
      }

      if (!data) {
        console.error('❌ Query returned no data for user:', user.id);
        return null;
      }

      console.log('✅ User data retrieved from database:', {
        id: data.id,
        email: data.email,
        role: data.role
      });

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
      console.log('👤 Creating user profile for:', user.email);
      
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

      if (userError) {
        if (userError.code === '23505') {
          console.log('ℹ️ User already exists in database');
        } else {
          console.warn('⚠️ User creation warning:', userError);
          // Continue anyway, profile might still be created
        }
      } else {
        console.log('✅ User record created');
      }

      // Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: data.name,
        });

      if (profileError) {
        if (profileError.code === '23505') {
          console.log('ℹ️ Profile already exists');
        } else {
          console.warn('⚠️ Profile creation warning:', profileError);
        }
      } else {
        console.log('✅ Profile record created');
      }

      console.log('✅ User profile created successfully');
    } catch (error) {
      console.error('❌ Create user profile error:', error);
      // Don't throw - we want signup to complete even if profile creation fails
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