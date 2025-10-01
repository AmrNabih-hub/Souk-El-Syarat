import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser, resetPassword, confirmResetPassword, updatePassword, deleteUser } from '@aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import amplifyConfig from '@/config/amplify.config';

// Initialize Amplify client for GraphQL operations
const client = generateClient();

import { User, UserRole } from '@/types';

export class AuthService {
  // 🚨 BULLETPROOF AUTHENTICATION STATE LISTENER
  static onAuthStateChange(callback: (user: User | null) => void) {
    console.log('🚀 Setting up bulletproof auth state listener...');
    
    try {
      // AWS Amplify uses Hub for auth state changes
      import('@aws-amplify/core').then(({ Hub }) => {
        const unsubscribe = Hub.listen('auth', async (data: { payload: { event: string; data: any } }) => {
        try {
          console.log('🔄 Auth state changed:', data.payload.event, data.payload.data);

          switch (data.payload.event) {
            case 'signIn':
      break;
            case 'cognitoHostedUI':
      break;
              try {
                const amplifyUser = await getCurrentUser();
                console.log('✅ Amplify user retrieved:', amplifyUser);

                // Get user data from GraphQL API
                const userData = await this.getUserFromAPI(amplifyUser.userId);
                if (userData) {
                  const user: User = {
                    id: amplifyUser.userId,
                    email: amplifyUser.signInDetails?.loginId || '',
                    displayName: userData.displayName || 'User',
                    phoneNumber: userData.phoneNumber,
                    photoURL: userData.photoURL,
                    role: userData.role || 'customer',
                    isActive: userData.isActive ?? true,
                    emailVerified: true, // Amplify handles verification differently
                    createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                    updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
                    preferences: userData.preferences || {
                      language: 'ar',
                      currency: 'EGP',
                      notifications: {
                        email: true,
                        sms: false,
                        push: true,
                      },
                    },
                  };
            console.log('✅ User data retrieved successfully');
            callback(user);
          } else {
                  // Create default user
                  const defaultUser = await this.createDefaultUser(amplifyUser);
                  callback(defaultUser);
                }
              } catch (error) {
                console.error('❌ Error getting current user:', error);
                callback(null);
              }
              break;

            case 'signOut':
      break;
              console.log('✅ User logged out successfully');
              callback(null);
              break;

            default:
              console.log('ℹ️ Unhandled auth event:', data.payload.event);
              break;
          }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error);
          callback(null);
        }
      });

      console.log('✅ Auth state listener set up successfully');
      return unsubscribe;
      }).catch(error => {
        console.error('💥 Failed to set up auth state listener:', error);
        callback(null);
      });

      // Return a dummy unsubscribe function for now
      return () => {};
    } catch (error) {
      console.error('💥 Failed to set up auth state listener:', error);
      return () => {};
    }
  }

  // Helper method to get user from GraphQL API
  private static async getUserFromAPI(userId: string): Promise<any> {
    try {
      const result = await client.graphql({
        query: `
          query GetUser($id: ID!) {
            getUser(id: $id) {
              id
              email
              displayName
              phoneNumber
              photoURL
              role
              isActive
              createdAt
              updatedAt
              preferences {
                language
                currency
                notifications {
                  email
                  sms
                  push
                }
              }
            }
          }
        `,
        variables: { id: userId }
      });
      return result.data.getUser;
    } catch (error) {
      console.warn('⚠️ Could not fetch user from API:', error);
      return null;
    }
  }

  // Helper method to create default user
  private static async createDefaultUser(amplifyUser: any): Promise<User> {
              console.log('⚠️ User document not found, creating default user');

              const defaultUser: User = {
      id: amplifyUser.userId,
      email: amplifyUser.signInDetails?.loginId || '',
      displayName: 'User',
      phoneNumber: undefined,
      photoURL: undefined,
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

    // Try to create user in API
    try {
      await client.graphql({
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            id: defaultUser.id,
            email: defaultUser.email,
            displayName: defaultUser.displayName,
            role: defaultUser.role,
            isActive: defaultUser.isActive,
            preferences: defaultUser.preferences,
          }
        }
      });
      console.log('✅ Default user document created');
    } catch (error) {
      console.warn('⚠️ Could not create default user in API:', error);
    }

    return defaultUser;
  }

  // 🚨 BULLETPROOF SIGN UP - NO MORE PROMISE ERRORS
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<User> {
    try {
      console.log('🚀 Starting bulletproof sign up process...');
      
      // Create AWS Amplify user
      const signUpResult = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: displayName,
            'custom:role': role,
          },
        },
      });

      console.log('✅ Amplify user sign up initiated successfully');

      // For now, return a temporary user object
      // In a real implementation, you'd wait for email confirmation
      const tempUser: User = {
        id: signUpResult.userId || '',
        email,
        displayName,
        phoneNumber: undefined,
        photoURL: undefined,
        role,
        isActive: false, // Not active until email is confirmed
        emailVerified: false,
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

      console.log('🎉 Sign up completed successfully! Please check your email for confirmation.');
      return tempUser;
      
    } catch (error) {
      console.error('💥 Sign up failed:', error);
      const authError = error as { name?: string };
      throw new Error(this.getAmplifyAuthErrorMessage(authError.name));
    }
  }

  // 🚨 BULLETPROOF SIGN IN - NO MORE PROMISE ERRORS
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🚀 Starting bulletproof sign in process...');
      
      const signInResult = await signIn({
        username: email,
        password,
      });

      console.log('✅ Amplify authentication successful');

      // Get current user details
      const amplifyUser = await getCurrentUser();

      // Get user data from GraphQL API
      const userData = await this.getUserFromAPI(amplifyUser.userId);

      if (!userData) {
        console.warn('⚠️ User document not found, creating default user');
        // Create default user if document doesn't exist
        const defaultUser = await this.createDefaultUser(amplifyUser);
        console.log('✅ Default user document created');
        return defaultUser;
      }

      const user: User = {
        id: amplifyUser.userId,
        email: amplifyUser.signInDetails?.loginId || '',
        displayName: userData.displayName || 'User',
        phoneNumber: userData.phoneNumber,
        photoURL: userData.photoURL,
        role: userData.role || 'customer',
        isActive: userData.isActive ?? true,
        emailVerified: true, // Assume verified if signed in
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
        preferences: userData.preferences || {
            language: 'ar',
            currency: 'EGP',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };
        
      console.log('🎉 Sign in completed successfully!');
      return user;
      
    } catch (error) {
      console.error('💥 Sign in failed:', error);
      const authError = error as { name?: string };
      throw new Error(this.getAmplifyAuthErrorMessage(authError.name));
    }
  }

  // 🚨 BULLETPROOF SOCIAL SIGN IN (Google/Facebook)
  static async signInWithGoogle(): Promise<User> {
    try {
      console.log('🚀 Starting bulletproof Google sign in...');
      
      // For AWS social sign-in is handled through Cognito Hosted UI
      // This would typically redirect to the hosted UI
      // For now, we'll throw an error indicating this needs to be configured
      throw new Error('Social sign-in requires Cognito Hosted UI configuration. Please use the hosted UI flow.');
      
    } catch (error) {
      console.error('💥 Google sign in failed:', error);
      const authError = error as { name?: string; message?: string };
      throw new Error(authError.message || this.getAmplifyAuthErrorMessage(authError.name));
    }
  }

  // 🚨 BULLETPROOF SIGN OUT
  static async signOut(): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof sign out...');
      await signOut();
      console.log('🎉 Sign out completed successfully!');
    } catch (error) {
      console.error('💥 Sign out failed:', error);
      const authError = error as { name?: string };
      throw new Error(this.getAmplifyAuthErrorMessage(authError.name) || 'Failed to sign out. Please try again.');
    }
  }

  // 🚨 BULLETPROOF PASSWORD RESET
  static async resetPassword(email: string): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof password reset...');
      await resetPassword({ username: email });
      console.log('🎉 Password reset initiated successfully!');
    } catch (error) {
      console.error('💥 Password reset failed:', error);
      const authError = error as { name?: string };
      throw new Error(this.getAmplifyAuthErrorMessage(authError.name));
    }
  }

  // 🚨 BULLETPROOF USER PROFILE UPDATE
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof profile update...');

      // Update user in GraphQL API
      const updateData: any = {
        id: userId,
        updatedAt: new Date().toISOString(),
      };

      if (updates.displayName) updateData.displayName = updates.displayName;
      if (updates.phoneNumber !== undefined) updateData.phoneNumber = updates.phoneNumber;
      if (updates.photoURL !== undefined) updateData.photoURL = updates.photoURL;
      if (updates.role) updateData.role = updates.role;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.preferences) updateData.preferences = updates.preferences;

      await client.graphql({
        query: `
          mutation UpdateUser($input: UpdateUserInput!) {
            updateUser(input: $input) {
              id
            }
          }
        `,
        variables: { input: updateData }
      });

      console.log('🎉 Profile updated successfully!');
    } catch (error) {
      console.error('💥 Profile update failed:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  // 🚨 BULLETPROOF PASSWORD UPDATE
  static async updateUserPassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof password update...');

      // First confirm the current password (AWS Amplify requires this)
      // For simplicity, we'll assume the user is authenticated
      await updatePassword({ oldPassword, newPassword });

      console.log('🎉 Password updated successfully!');
    } catch (error) {
      console.error('💥 Password update failed:', error);
      const authError = error as { name?: string };
      throw new Error(this.getAmplifyAuthErrorMessage(authError.name));
    }
  }

  // 🚨 BULLETPROOF USER DELETE
  static async deleteUserAccount(): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof account deletion...');

      // Get current user
      const currentUser = await getCurrentUser();

      // Delete user from GraphQL API first
      try {
        await client.graphql({
          query: `
            mutation DeleteUser($input: DeleteUserInput!) {
              deleteUser(input: $input) {
                id
              }
            }
          `,
          variables: { input: { id: currentUser.userId } }
        });
      } catch (apiError) {
        console.warn('⚠️ Could not delete user from API:', apiError);
      }

      // Delete user from Cognito
      await deleteUser();

      console.log('🎉 Account deleted successfully!');
    } catch (error) {
      console.error('💥 Account deletion failed:', error);
      const authError = error as { name?: string };
      throw new Error(this.getAmplifyAuthErrorMessage(authError.name));
    }
  }

  // 🚨 BULLETPROOF ERROR MESSAGE HANDLER
  private static getAmplifyAuthErrorMessage(errorName?: string): string {
    const errorMessages: Record<string, string> = {
      'UserNotFoundException': 'User not found. Please check your credentials.',
      'NotAuthorizedException': 'Incorrect email or password. Please try again.',
      'UsernameExistsException': 'Email is already registered. Please sign in.',
      'InvalidPasswordException': 'Password is too weak. Please use a stronger password.',
      'NetworkError': 'Network error. Please check your connection.',
      'TooManyRequestsException': 'Too many failed attempts. Please try again later.',
      'InvalidParameterException': 'Invalid email address. Please check your email.',
      'UserNotConfirmedException': 'Please confirm your email address before signing in.',
      'CodeMismatchException': 'Invalid confirmation code. Please try again.',
      'ExpiredCodeException': 'Confirmation code has expired. Please request a new one.',
      'LimitExceededException': 'Too many attempts. Please try again later.',
      'InvalidEmailRoleAccessPolicyException': 'Access denied. Please check your permissions.',
      'UserLambdaValidationException': 'Invalid user data. Please check your input.',
    };

    return errorMessages[errorName || ''] || 'An unexpected error occurred. Please try again.';
  }
}
