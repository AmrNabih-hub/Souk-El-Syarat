import { auth, db } from '@/config/firebase.config';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  onAuthStateChanged,
  deleteUser,
  reload,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { User, UserRole } from '@/types';

export class AuthService {
  // Initialize auth providers
  static googleProvider = new GoogleAuthProvider();
  static facebookProvider = new FacebookAuthProvider();
  static twitterProvider = new TwitterAuthProvider();

  // 🚨 BULLETPROOF AUTHENTICATION STATE LISTENER
  static onAuthStateChange(callback: (user: User | null) => void) {
    console.log('🚀 Setting up bulletproof auth state listener...');
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
          
          if (firebaseUser) {
            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<User, 'id'>;
              const user: User = { id: firebaseUser.uid, ...userData };
              console.log('✅ User data retrieved successfully');
              callback(user);
            } else {
              console.log('⚠️ User document not found, creating default user');
              // Create default user if document doesn't exist
              const defaultUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || 'User',
                phoneNumber: firebaseUser.phoneNumber || undefined,
                photoURL: firebaseUser.photoURL || undefined,
                role: 'customer',
                isActive: true,
                emailVerified: firebaseUser.emailVerified,
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
              callback(defaultUser);
            }
          } else {
            console.log('✅ User logged out successfully');
            callback(null);
          }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error);
          // Return null user on error to prevent app crashes
          callback(null);
        }
      });
      
      console.log('✅ Auth state listener set up successfully');
      return unsubscribe;
    } catch (error) {
      console.error('💥 Failed to set up auth state listener:', error);
      // Return a dummy unsubscribe function to prevent errors
      return () => {};
    }
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
      
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase user created successfully');

      // Send email verification
      try {
        await sendEmailVerification(firebaseUser, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        });
        console.log('✅ Email verification sent');
      } catch (verificationError) {
        console.warn('⚠️ Email verification failed, continuing without it:', verificationError);
      }

      // Update Firebase auth profile
      try {
        await updateProfile(firebaseUser, { displayName });
        console.log('✅ Profile updated successfully');
      } catch (profileError) {
        console.warn('⚠️ Profile update failed, continuing without it:', profileError);
      }

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email!,
        displayName,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        role,
        isActive: true,
        emailVerified: firebaseUser.emailVerified,
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

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ User document created in Firestore');

      const user: User = { id: firebaseUser.uid, ...userData };
      console.log('🎉 Sign up completed successfully!');
      return user;
      
    } catch (error) {
      console.error('💥 Sign up failed:', error);
      const authError = error as { code?: string };
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  // 🚨 BULLETPROOF SIGN IN - NO MORE PROMISE ERRORS
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🚀 Starting bulletproof sign in process...');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase authentication successful');

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        console.warn('⚠️ User document not found, creating default user');
        // Create default user if document doesn't exist
        const defaultUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'User',
          phoneNumber: firebaseUser.phoneNumber || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          role: 'customer',
          isActive: true,
          emailVerified: firebaseUser.emailVerified,
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
        
        // Save to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
        console.log('✅ Default user document created');
        return defaultUser;
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      const user: User = { id: firebaseUser.uid, ...userData };
      console.log('🎉 Sign in completed successfully!');
      return user;
      
    } catch (error) {
      console.error('💥 Sign in failed:', error);
      const authError = error as { code?: string };
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  // 🚨 BULLETPROOF GOOGLE SIGN IN
  static async signInWithGoogle(): Promise<User> {
    try {
      console.log('🚀 Starting bulletproof Google sign in...');
      
      const userCredential = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = userCredential.user;
      console.log('✅ Google authentication successful');

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        console.log('🆕 New Google user, creating user document...');
        // Create new user document for Google sign-in
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'Google User',
          phoneNumber: firebaseUser.phoneNumber || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          role: 'customer',
          isActive: true,
          emailVerified: firebaseUser.emailVerified,
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
        
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        console.log('✅ New Google user document created');
        return newUser;
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      const user: User = { id: firebaseUser.uid, ...userData };
      console.log('🎉 Google sign in completed successfully!');
      return user;
      
    } catch (error) {
      console.error('💥 Google sign in failed:', error);
      const authError = error as { code?: string };
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  // 🚨 BULLETPROOF SIGN OUT
  static async getCurrentUser(): Promise<User | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        return {
          id: currentUser.uid,
          ...userDoc.data(),
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async signOut(): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof sign out...');
      await firebaseSignOut(auth);
      console.log('🎉 Sign out completed successfully!');
    } catch (error) {
      console.error('💥 Sign out failed:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // 🚨 BULLETPROOF PASSWORD RESET
  static async resetPassword(email: string): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof password reset...');
      await sendPasswordResetEmail(auth, email);
      console.log('🎉 Password reset email sent successfully!');
    } catch (error) {
      console.error('💥 Password reset failed:', error);
      const authError = error as { code?: string };
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  // 🚨 BULLETPROOF USER PROFILE UPDATE
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof profile update...');
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date(),
      });
      console.log('🎉 Profile updated successfully!');
    } catch (error) {
      console.error('💥 Profile update failed:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  // 🚨 BULLETPROOF PASSWORD UPDATE
  static async updateUserPassword(newPassword: string): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof password update...');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      await updatePassword(currentUser, newPassword);
      console.log('🎉 Password updated successfully!');
    } catch (error) {
      console.error('💥 Password update failed:', error);
      const authError = error as { code?: string };
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  // 🚨 BULLETPROOF USER DELETE
  static async deleteUserAccount(): Promise<void> {
    try {
      console.log('🚀 Starting bulletproof account deletion...');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      await deleteUser(currentUser);
      console.log('🎉 Account deleted successfully!');
    } catch (error) {
      console.error('💥 Account deletion failed:', error);
      const authError = error as { code?: string };
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  // 🚨 BULLETPROOF ERROR MESSAGE HANDLER
  private static getAuthErrorMessage(errorCode?: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'User not found. Please check your credentials.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'Email is already registered. Please sign in.',
      'auth/weak-password': 'Password is too weak. Please use a stronger password.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/invalid-email': 'Invalid email address. Please check your email.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.',
      'firestore/permission-denied': 'Access denied. Please check your permissions.',
      'firestore/unavailable': 'Service temporarily unavailable. Please try again.',
      'storage/unauthorized': 'Unauthorized access to storage. Please sign in.',
      'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
    };

    return errorMessages[errorCode || ''] || 'An unexpected error occurred. Please try again.';
  }
}
