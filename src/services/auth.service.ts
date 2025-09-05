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
  setPersistence,
  browserLocalPersistence,
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
  serverTimestamp,
} from 'firebase/firestore';

import { User, UserRole } from '@/types';

export class AuthService {
  // Initialize auth providers
  static googleProvider = new GoogleAuthProvider();
  static facebookProvider = new FacebookAuthProvider();
  static twitterProvider = new TwitterAuthProvider();

  // Initialize persistence
  static async initializeAuth() {
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log('✅ Auth persistence initialized');
    } catch (error) {
      console.error('Failed to set persistence:', error);
    }
  }

  // Enhanced auth state listener with better error handling
  static onAuthStateChange(callback: (user: User | null) => void) {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Ensure user document exists
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!userDoc.exists()) {
            console.warn('User document missing, creating...');
            // Create user document if it doesn't exist
            const userData = {
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              phoneNumber: firebaseUser.phoneNumber || null,
              photoURL: firebaseUser.photoURL || null,
              role: 'customer' as UserRole,
              isActive: true,
              emailVerified: firebaseUser.emailVerified,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              preferences: {
                language: 'ar' as 'ar' | 'en',
                currency: 'EGP' as 'EGP' | 'USD',
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
              },
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            
            const user: User = {
              id: firebaseUser.uid,
              ...userData,
              preferences: {
                ...userData.preferences,
                language: userData.preferences.language as 'ar' | 'en',
                currency: userData.preferences.currency as 'EGP' | 'USD',
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            callback(user);
          } else {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: userData.displayName || firebaseUser.displayName || 'User',
              phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || undefined,
              photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
              role: userData.role || 'customer',
              isActive: userData.isActive !== false,
              emailVerified: firebaseUser.emailVerified,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              preferences: userData.preferences || {
                language: 'ar' as 'ar' | 'en',
                currency: 'EGP' as 'EGP' | 'USD',
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
              },
            };
            callback(user);
          }
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Still set user to null on error to prevent stuck states
        callback(null);
      }
    });

    return unsubscribe;
  }

  // Enhanced sign up with better error handling
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<User> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send email verification (non-blocking)
      sendEmailVerification(firebaseUser).catch(console.warn);

      // Update profile
      await updateProfile(firebaseUser, { displayName }).catch(console.warn);

      // Create user document in Firestore with proper role
      const userData = {
        email: firebaseUser.email!,
        displayName,
        phoneNumber: firebaseUser.phoneNumber || null,
        photoURL: firebaseUser.photoURL || null,
        role, // Use the provided role parameter
        isActive: true,
        emailVerified: firebaseUser.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        preferences: {
          language: 'ar' as 'ar' | 'en',
          currency: 'EGP' as 'EGP' | 'USD',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      const user: User = {
        id: firebaseUser.uid,
        ...userData,
        preferences: {
          ...userData.preferences,
          language: userData.preferences.language as 'ar' | 'en',
          currency: userData.preferences.currency as 'EGP' | 'USD',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced sign in with better error handling
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get or create user document
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist (for users created outside the app)
        const userData = {
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          phoneNumber: firebaseUser.phoneNumber || null,
          photoURL: firebaseUser.photoURL || null,
          role: 'customer' as UserRole,
          isActive: true,
          emailVerified: firebaseUser.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            language: 'ar' as 'ar' | 'en',
            currency: 'EGP' as 'EGP' | 'USD',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        return {
          id: firebaseUser.uid,
          ...userData,
          preferences: {
            ...userData.preferences,
            language: userData.preferences.language as 'ar' | 'en',
            currency: userData.preferences.currency as 'EGP' | 'USD',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const userData = userDoc.data();
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: userData.displayName || firebaseUser.displayName || 'User',
        phoneNumber: userData.phoneNumber || undefined,
        photoURL: userData.photoURL || undefined,
        role: userData.role || 'customer',
        isActive: userData.isActive !== false,
        emailVerified: firebaseUser.emailVerified,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
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
      
      return user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced Google sign in
  static async signInWithGoogle(): Promise<User> {
    try {
      // Configure Google provider
      this.googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = userCredential.user;

      // Get or create user document
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        const userData = {
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'Google User',
          phoneNumber: firebaseUser.phoneNumber || null,
          photoURL: firebaseUser.photoURL || null,
          role: 'customer' as UserRole,
          isActive: true,
          emailVerified: true, // Google accounts are pre-verified
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            language: 'ar' as 'ar' | 'en',
            currency: 'EGP' as 'EGP' | 'USD',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        return {
          id: firebaseUser.uid,
          ...userData,
          preferences: {
            ...userData.preferences,
            language: userData.preferences.language as 'ar' | 'en',
            currency: userData.preferences.currency as 'EGP' | 'USD',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: userData.displayName || firebaseUser.displayName || 'Google User',
        phoneNumber: userData.phoneNumber || undefined,
        photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
        role: userData.role || 'customer',
        isActive: userData.isActive !== false,
        emailVerified: true,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
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
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // Handle specific Google sign-in errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another popup is already open. Please close it and try again.');
      }
      
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update Firebase auth profile if displayName or photoURL changed
      const currentUser = auth.currentUser;
      if (currentUser && (updates.displayName || updates.photoURL)) {
        await updateProfile(currentUser, {
          displayName: updates.displayName || currentUser.displayName,
          photoURL: updates.photoURL || currentUser.photoURL,
        });
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }

  // Enhanced error message handler with fallback
  private static getAuthErrorMessage(errorCode?: string, fallbackMessage?: string): string {
    const errorMessages: Record<string, string> = {
      // Auth errors
      'auth/user-not-found': 'No account found with this email. Please sign up first.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/email-already-in-use': 'This email is already registered. Please sign in.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled. Contact support.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/invalid-credential': 'Invalid credentials. Please check and try again.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.',
      'auth/popup-closed-by-user': 'Sign in cancelled.',
      'auth/popup-blocked': 'Popup was blocked. Please allow popups.',
      'auth/cancelled-popup-request': 'Another popup is already open.',
      
      // Firestore errors
      'permission-denied': 'You don\'t have permission to perform this action.',
      'unavailable': 'Service temporarily unavailable. Please try again.',
      'not-found': 'Requested data not found.',
      
      // Storage errors
      'storage/unauthorized': 'Unauthorized access to storage.',
      'storage/quota-exceeded': 'Storage quota exceeded.',
      'storage/invalid-url': 'Invalid storage URL.',
    };

    // Check for Firestore permission errors
    if (errorCode === 'FirebaseError' && fallbackMessage?.includes('Missing or insufficient permissions')) {
      return 'Access denied. Please try logging in again.';
    }

    // Return specific error message or formatted fallback
    if (errorMessages[errorCode || '']) {
      return errorMessages[errorCode || ''];
    }
    
    // If we have a fallback message, use it
    if (fallbackMessage) {
      // Clean up Firebase error messages
      const cleanMessage = fallbackMessage
        .replace('Firebase: ', '')
        .replace('Error ', '')
        .replace(/\(auth\/[^)]+\)/, '')
        .trim();
      
      return cleanMessage || 'An error occurred. Please try again.';
    }
    
    return 'An error occurred. Please try again or contact support.';
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
  // Check if email is verified
  static async checkEmailVerified(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;
    
    await reload(user);
    return user.emailVerified;
  }

  // Update password
  static async updateUserPassword(newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user signed in');
      
      await updatePassword(user, newPassword);
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }

  // Delete account
  static async deleteAccount(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user signed in');
      
      await deleteUser(user);
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(this.getAuthErrorMessage(error.code, error.message));
    }
  }
}

// Initialize auth on load
AuthService.initializeAuth();
