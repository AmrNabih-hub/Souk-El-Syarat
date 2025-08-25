import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from '@/config/firebase.config';
import { User, UserRole } from '@/types';

export class EnhancedAuthService {
  // Initialize auth providers
  static googleProvider = new GoogleAuthProvider();
  static facebookProvider = new FacebookAuthProvider();
  static twitterProvider = new TwitterAuthProvider();

  // Enhanced error handler with more user-friendly messages
  private static handleError(error: any): never {
    console.error('Enhanced Auth Service Error:', error);
    
    // Comprehensive Firebase Auth error codes with clear messages
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'لا يوجد حساب مسجل بهذا البريد الإلكتروني. يرجى التسجيل أولاً.',
      'auth/wrong-password': 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.',
      'auth/email-already-in-use': 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.',
      'auth/weak-password': 'كلمة المرور ضعيفة. يجب أن تحتوي على 6 أحرف على الأقل.',
      'auth/invalid-email': 'البريد الإلكتروني غير صحيح. يرجى التحقق من الصيغة.',
      'auth/too-many-requests': 'محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
      'auth/network-request-failed': 'مشكلة في الاتصال بالإنترنت. يرجى التحقق من الاتصال.',
      'auth/invalid-credential': 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
      'auth/user-disabled': 'تم تعطيل هذا الحساب. يرجى التواصل مع الدعم الفني.',
      'auth/operation-not-allowed': 'عملية غير مسموحة. يرجى التواصل مع الدعم الفني.',
    };

    const message = errorMessages[error?.code] || error?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
    throw new Error(message);
  }

  // Enhanced auth state listener
  static onAuthStateChange(callback: (user: User | null) => void) {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            console.log('Firebase user detected:', firebaseUser.uid);
            
            // Get user data from Firestore
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data() as Omit<User, 'id'>;
                const user: User = { 
                  id: firebaseUser.uid, 
                  ...userData,
                  emailVerified: firebaseUser.emailVerified 
                };
                
                // Update last login time
                try {
                  await updateDoc(doc(db, 'users', firebaseUser.uid), {
                    lastLoginAt: serverTimestamp(),
                    emailVerified: firebaseUser.emailVerified
                  });
                } catch (updateError) {
                  console.warn('Failed to update last login:', updateError);
                }
                
                callback(user);
              } else {
                // Create user document if doesn't exist
                const newUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  displayName: firebaseUser.displayName || 'مستخدم جديد',
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
                    theme: 'light',
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
                  lastLoginAt: serverTimestamp()
                });
                
                callback(newUser);
              }
            } catch (dbError) {
              console.error('Firestore error:', dbError);
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
                  theme: 'light',
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
            console.log('No Firebase user detected');
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
      return () => {}; 
    }
  }

  // Enhanced sign in with better error handling
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting sign in for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('Firebase sign in successful:', firebaseUser.uid);

      // Get user data from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'id'>;
          const user: User = { 
            id: firebaseUser.uid, 
            ...userData,
            emailVerified: firebaseUser.emailVerified 
          };
          
          // Update last login
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastLoginAt: serverTimestamp(),
            emailVerified: firebaseUser.emailVerified
          });
          
          console.log('User data retrieved successfully:', user.displayName);
          return user;
        } else {
          console.log('User document not found, creating new one');
          // Create user document
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'مستخدم',
            role: 'customer',
            isActive: true,
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            preferences: {
              language: 'ar',
              currency: 'EGP',
              theme: 'light',
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
            lastLoginAt: serverTimestamp()
          });

          return newUser;
        }
      } catch (dbError) {
        console.error('Firestore error during sign in:', dbError);
        // Return minimal user data if Firestore fails
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
            theme: 'light',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          },
        };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      this.handleError(error);
    }
  }

  // Enhanced sign up with validation
  static async signUp(email: string, password: string, displayName: string, role: UserRole = 'customer'): Promise<User> {
    try {
      console.log('Attempting sign up for:', email, 'with role:', role);
      
      // Validate input
      if (!email || !password || !displayName) {
        throw new Error('جميع الحقول مطلوبة');
      }
      
      if (password.length < 6) {
        throw new Error('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('Firebase sign up successful:', firebaseUser.uid);

      // Update Firebase profile
      try {
        await updateProfile(firebaseUser, { displayName });
      } catch (profileError) {
        console.warn('Failed to update Firebase profile:', profileError);
      }

      // Create comprehensive user document
      const newUser: User = {
        id: firebaseUser.uid,
        email: email.toLowerCase().trim(),
        displayName: displayName.trim(),
        role: role,
        isActive: true,
        emailVerified: firebaseUser.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          language: 'ar',
          currency: 'EGP',
          theme: 'light',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      console.log('User document created successfully for:', displayName);
      return newUser;
    } catch (error) {
      console.error('Sign up error:', error);
      this.handleError(error);
    }
  }

  // Enhanced sign out
  static async signOut(): Promise<void> {
    try {
      console.log('Signing out user');
      await signOut(auth);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      this.handleError(error);
    }
  }

  // Password reset
  static async resetPassword(email: string): Promise<void> {
    try {
      console.log('Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Password reset error:', error);
      this.handleError(error);
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    // This is a simplified version - in real usage, you'd want to get from Firestore
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'مستخدم',
      role: 'customer', // Default role
      isActive: true,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        language: 'ar',
        currency: 'EGP',
        theme: 'light',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
    };
  }
}

export default EnhancedAuthService;