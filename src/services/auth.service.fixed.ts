import { auth, db } from '@/config/firebase.config';
import {
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
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import { User, UserRole } from '@/types';

export class AuthService {
  // Initialize auth providers
  static googleProvider = new GoogleAuthProvider();
  static facebookProvider = new FacebookAuthProvider();
  static twitterProvider = new TwitterAuthProvider();

  // Safe error handler
  private static handleError(error: any): never {
    console.error('Auth Service Error:', error);
    
    // Common Firebase Auth error codes
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'المستخدم غير موجود',
      'auth/wrong-password': 'كلمة المرور خاطئة',
      'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
      'auth/weak-password': 'كلمة المرور ضعيفة',
      'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
      'auth/too-many-requests': 'محاولات كثيرة. حاول مرة أخرى لاحقاً',
      'auth/network-request-failed': 'مشكلة في الاتصال. تحقق من الإنترنت',
    };

    const message = errorMessages[error?.code] || error?.message || 'حدث خطأ غير متوقع';
    throw new Error(message);
  }

  // Safe auth state listener
  static onAuthStateChange(callback: (user: User | null) => void) {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Get user data from Firestore with error handling
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data() as Omit<User, 'id'>;
                const user: User = { id: firebaseUser.uid, ...userData };
                callback(user);
              } else {
                // Create default user if document doesn't exist
                const defaultUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  displayName: firebaseUser.displayName || 'مستخدم',
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

                // Try to create user document
                try {
                  await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
                } catch (docError) {
                  console.warn('Failed to create user document:', docError);
                }

                callback(defaultUser);
              }
            } catch (dbError) {
              console.error('Database error:', dbError);
              // Return minimal user data if Firestore fails
              const fallbackUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || 'مستخدم',
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
              callback(fallbackUser);
            }
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          callback(null);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to set up auth listener:', error);
      return () => {}; // Return empty function if setup fails
    }
  }

  // Safe sign in
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>;
          return { id: firebaseUser.uid, ...userData };
        } else {
          // Create user document if it doesn't exist
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'مستخدم',
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
          return newUser;
        }
      } catch (dbError) {
        console.error('Database error during sign in:', dbError);
        // Return minimal user data
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'مستخدم',
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
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Safe sign up
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile
      try {
        await updateProfile(firebaseUser, { displayName });
      } catch (profileError) {
        console.warn('Failed to update profile:', profileError);
      }

      // Create user document
      const newUser: User = {
        id: firebaseUser.uid,
        email: email,
        displayName: displayName,
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

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      } catch (dbError) {
        console.warn('Failed to create user document:', dbError);
      }

      // Send verification email
      try {
        await sendEmailVerification(firebaseUser);
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError);
      }

      return newUser;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Safe Google sign in
  static async signInWithGoogle(): Promise<User> {
    try {
      const userCredential = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = userCredential.user;

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>;
          return { id: firebaseUser.uid, ...userData };
        } else {
          // Create new user
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'مستخدم',
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
          return newUser;
        }
      } catch (dbError) {
        console.error('Database error during Google sign in:', dbError);
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'مستخدم',
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
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Safe sign out
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      // Don't throw error for sign out - just log it
    }
  }

  // Safe password reset
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Safe profile update
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get current user safely
  static getCurrentUser(): FirebaseUser | null {
    try {
      return auth.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}