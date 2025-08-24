import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  // These will be replaced with actual values when you set up Firebase
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'souk-el-syarat.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'souk-el-syarat',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'souk-el-syarat.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize Messaging (only in browsers that support it)
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(() => {
    // Messaging not supported in this browser
    messaging = null;
  });
}
export { messaging };

// Initialize Analytics (only in production)
export const analytics =
  typeof window !== 'undefined' && import.meta.env.PROD ? getAnalytics(app) : null;

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Development emulators (only in development)
if (import.meta.env.DEV) {
  const connectToEmulators = () => {
    try {
      // Auth emulator
      if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }

      // Firestore emulator
      if (!(db as any)._delegate._settings?.host?.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }

      // Storage emulator
      if (!(storage as any)._delegate._host?.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }

      // Functions emulator
      if (!(functions as any)._delegate._url?.includes('localhost')) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
    } catch (error) {
      // Emulators might already be connected, ignore error
      // if (process.env.NODE_ENV === 'development') console.log('Emulators connection info:', error);
    }
  };

  connectToEmulators();
}

export default app;
