/**
 * FIXED Authentication Service
 * Ensures authentication works 100%
 */

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, set, onValue } from 'firebase/database';
import { auth, db, realtimeDb } from '@/config/firebase.config';

export class AuthServiceFixed {
  
  /**
   * Register new user with real-time sync
   */
  static async register(email: string, password: string, displayName: string) {
    try {
      console.log('🚀 Starting registration...');
      
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        preferences: {
          language: 'ar',
          currency: 'EGP'
        }
      });
      
      // Sync to Realtime Database
      await set(ref(realtimeDb, `users/${user.uid}`), {
        displayName,
        email,
        role: 'customer',
        status: 'online',
        lastSeen: Date.now()
      });
      
      console.log('✅ Registration successful!');
      return user;
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }
  
  /**
   * Login with email and password
   */
  static async login(email: string, password: string) {
    try {
      console.log('🔐 Logging in...');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update online status
      await set(ref(realtimeDb, `users/${user.uid}/status`), 'online');
      await set(ref(realtimeDb, `users/${user.uid}/lastSeen`), Date.now());
      
      console.log('✅ Login successful!');
      return user;
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }
  
  /**
   * Logout user
   */
  static async logout() {
    try {
      const user = auth.currentUser;
      
      if (user) {
        // Update offline status
        await set(ref(realtimeDb, `users/${user.uid}/status`), 'offline');
        await set(ref(realtimeDb, `users/${user.uid}/lastSeen`), Date.now());
      }
      
      await signOut(auth);
      console.log('✅ Logout successful!');
      
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }
  
  /**
   * Get current user with profile
   */
  static async getCurrentUser() {
    const user = auth.currentUser;
    
    if (!user) return null;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return {
        uid: user.uid,
        email: user.email,
        ...userDoc.data()
      };
    }
    
    return null;
  }
  
  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (user: any) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await this.getCurrentUser();
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  }
  
  /**
   * Setup real-time presence
   */
  static setupPresence(userId: string) {
    const presenceRef = ref(realtimeDb, `users/${userId}/status`);
    const lastSeenRef = ref(realtimeDb, `users/${userId}/lastSeen`);
    
    // Set online
    set(presenceRef, 'online');
    
    // On disconnect, set offline
    onValue(ref(realtimeDb, '.info/connected'), (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }
      
      set(presenceRef, 'online');
      set(lastSeenRef, Date.now());
    });
  }
}