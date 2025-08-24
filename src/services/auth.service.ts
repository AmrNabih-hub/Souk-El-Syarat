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
import { auth, db } from '../config/firebase.config';
import { User, UserRole } from '@/types';

export class AuthService {
  // Initialize auth providers
  static googleProvider = new GoogleAuthProvider();
  static facebookProvider = new FacebookAuthProvider();
  static twitterProvider = new TwitterAuthProvider();

  // Sign up with email and password
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

      // Send email verification
      await sendEmailVerification(firebaseUser, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      // Update Firebase auth profile
      await updateProfile(firebaseUser, { displayName });

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

      return { id: firebaseUser.uid, ...userData };
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();

      // Check if user is active
      if (!userData.isActive) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });

      return { id: firebaseUser.uid, ...userData } as User;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with Google
  static async signInWithGoogle(role: UserRole = 'customer'): Promise<User> {
    try {
      this.googleProvider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
          throw new Error('Your account has been deactivated. Please contact support.');
        }

        // Update last login
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        });

        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // Create new user document
        const userData: Omit<User, 'id'> = {
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || '',
          phoneNumber: firebaseUser.phoneNumber || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          role,
          isActive: true,
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
        return { id: firebaseUser.uid, ...userData };
      }
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Sign in with Facebook
  static async signInWithFacebook(role: UserRole = 'customer'): Promise<User> {
    try {
      const result = await signInWithPopup(auth, this.facebookProvider);
      return this.handleSocialSignIn(result.user, role);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with Twitter
  static async signInWithTwitter(role: UserRole = 'customer'): Promise<User> {
    try {
      const result = await signInWithPopup(auth, this.twitterProvider);
      return this.handleSocialSignIn(result.user, role);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Handle social sign-in (common logic)
  private static async handleSocialSignIn(
    firebaseUser: FirebaseUser,
    role: UserRole
  ): Promise<User> {
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Check if user is active
      if (!userData.isActive) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Update last login and email verification status
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: new Date(),
        emailVerified: firebaseUser.emailVerified,
        updatedAt: new Date(),
      });

      return { id: firebaseUser.uid, ...userData } as User;
    } else {
      // Create new user document
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || '',
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
      return { id: firebaseUser.uid, ...userData };
    }
  }

  // Send email verification
  static async sendEmailVerification(): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in');
      }

      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Check email verification status
  static async checkEmailVerification(): Promise<boolean> {
    try {
      if (!auth.currentUser) return false;

      await reload(auth.currentUser);

      // Update user document with verification status
      if (auth.currentUser.emailVerified) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return auth.currentUser.emailVerified;
    } catch (error: any) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });

      // Update Firebase auth profile if needed
      if (auth.currentUser && (updates.displayName || updates.photoURL)) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }
    } catch (error: any) {
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  // Update password
  static async updateUserPassword(newPassword: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      await updatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!auth.currentUser) return null;

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));

      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      return { id: auth.currentUser.uid, ...userData } as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user has role
  static async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      return userData.role === role;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  // Check if user is admin
  static async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'admin');
  }

  // Check if user is vendor
  static async isVendor(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'vendor');
  }

  // Delete user account
  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Delete user document from Firestore
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      // Delete Firebase auth user if current user
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await deleteUser(auth.currentUser);
      }
    } catch (error: any) {
      throw new Error('Failed to delete account. Please try again.');
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            callback({ id: firebaseUser.uid, ...userData } as User);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Get users by role (admin only)
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      const users: User[] = [];
      querySnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });

      return users;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Update user role (admin only)
  static async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error('Failed to update user role');
    }
  }

  // Deactivate user (admin only)
  static async deactivateUser(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error('Failed to deactivate user');
    }
  }

  // Reactivate user (admin only)
  static async reactivateUser(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: true,
        reactivatedAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error('Failed to reactivate user');
    }
  }

  // Helper method to get user-friendly error messages
  private static getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Invalid email or password.',
      'auth/email-already-in-use': 'An account with this email address already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'This sign-in method is not allowed.',
      'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/popup-blocked':
        'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
      'auth/requires-recent-login':
        'This operation requires recent authentication. Please sign in again.',
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }
}
