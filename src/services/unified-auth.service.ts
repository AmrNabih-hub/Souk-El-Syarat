import { auth, db } from '@/config/firebase.config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { User, UserRole } from '@/types';

export class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private authStateListeners: Set<(user: User | null) => void> = new Set();
  
  // Initialize Google provider
  private static googleProvider = new GoogleAuthProvider();

  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }

  constructor() {
    this.initializeAuthStateListener();
  }

  /**
   * Initialize auth state listener
   */
  private initializeAuthStateListener(): void {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName || 'User',
              phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber,
              photoURL: firebaseUser.photoURL || userData.photoURL,
              role: userData.role || 'customer',
              isActive: userData.isActive ?? true,
              emailVerified: firebaseUser.emailVerified,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
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

            // Update last login time
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            this.notifyAuthStateChange(user);
          } else {
            // Create user document if it doesn't exist
            const newUser: User = {
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
              lastLoginAt: new Date(),
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

            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });

            this.notifyAuthStateChange(newUser);
          }
        } catch (error) {
          console.error('Error in auth state listener:', error);
          this.notifyAuthStateChange(null);
        }
      } else {
        this.notifyAuthStateChange(null);
      }
    });
  }

  /**
   * Notify auth state change listeners
   */
  private notifyAuthStateChange(user: User | null): void {
    this.authStateListeners.forEach(listener => listener(user));
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.add(callback);
    return () => this.authStateListeners.delete(callback);
  }

  /**
   * Sign up with email and password
   */
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'customer'
  ): Promise<User> {
    try {
      console.log('🚀 Starting sign up process...');
      
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
        console.warn('⚠️ Email verification failed:', verificationError);
      }

      // Update Firebase auth profile
      try {
        await updateProfile(firebaseUser, { displayName });
        console.log('✅ Profile updated successfully');
      } catch (profileError) {
        console.warn('⚠️ Profile update failed:', profileError);
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
        lastLoginAt: new Date(),
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

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      console.log('✅ User document created in Firestore');

      const user: User = { id: firebaseUser.uid, ...userData };
      console.log('🎉 Sign up completed successfully!');
      return user;
      
    } catch (error: any) {
      console.error('💥 Sign up failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🚀 Starting sign in process...');
      
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
          lastLoginAt: new Date(),
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
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...defaultUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
        console.log('✅ Default user document created');
        return defaultUser;
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      const user: User = { id: firebaseUser.uid, ...userData };
      console.log('🎉 Sign in completed successfully!');
      return user;
      
    } catch (error: any) {
      console.error('💥 Sign in failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<User> {
    try {
      console.log('🚀 Starting Google sign in...');
      
      const userCredential = await signInWithPopup(auth, UnifiedAuthService.googleProvider);
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
          lastLoginAt: new Date(),
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
        
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
        console.log('✅ New Google user document created');
        return newUser;
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      const user: User = { id: firebaseUser.uid, ...userData };
      console.log('🎉 Google sign in completed successfully!');
      return user;
      
    } catch (error: any) {
      console.error('💥 Google sign in failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      console.log('🚀 Starting sign out...');
      await firebaseSignOut(auth);
      console.log('🎉 Sign out completed successfully!');
    } catch (error: any) {
      console.error('💥 Sign out failed:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      console.log('🚀 Starting password reset...');
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      console.log('🎉 Password reset email sent successfully!');
    } catch (error: any) {
      console.error('💥 Password reset failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      console.log('🚀 Starting profile update...');
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('🎉 Profile updated successfully!');
    } catch (error: any) {
      console.error('💥 Profile update failed:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              resolve({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || userData.displayName || '',
                phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber || undefined,
                photoURL: firebaseUser.photoURL || userData.photoURL || undefined,
                role: userData.role || 'customer',
                isActive: userData.isActive ?? true,
                emailVerified: firebaseUser.emailVerified,
                createdAt: userData.createdAt?.toDate() || new Date(),
                updatedAt: userData.updatedAt?.toDate() || new Date(),
                lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
                preferences: userData.preferences || {
                  language: 'ar',
                  currency: 'EGP',
                  notifications: {
                    email: true,
                    sms: false,
                    push: true,
                  },
                },
              } as User);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Error getting current user:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get enhanced auth error messages
   */
  private static getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/requires-recent-login': 'Please sign in again to perform this action',
      'auth/operation-not-allowed': 'This operation is not allowed',
      'auth/account-exists-with-different-credential': 'An account already exists with this email',
      'auth/credential-already-in-use': 'This credential is already associated with another account',
      'auth/invalid-credential': 'Invalid credentials',
      'auth/user-token-expired': 'Your session has expired. Please sign in again',
      'auth/user-mismatch': 'User mismatch error',
      'auth/invalid-verification-id': 'Invalid verification ID',
      'auth/quota-exceeded': 'Service quota exceeded. Please try again later',
    };

    return errorMessages[errorCode] || 'Authentication failed. Please try again.';
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.authStateListeners.clear();
  }
}

// Export singleton instance
export const unifiedAuthService = UnifiedAuthService.getInstance();