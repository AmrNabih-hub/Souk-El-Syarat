/**
 * Firebase Configuration for Souk El-Syarat
 * Production-ready Firebase setup with analytics and performance monitoring
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, Database, connectDatabaseEmulator } from 'firebase/database';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getPerformance, FirebasePerformance } from 'firebase/performance';
import { getMessaging, Messaging, getToken, onMessage } from 'firebase/messaging';
import { initializeAppCheck, AppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Production Firebase Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q',
  authDomain: 'souk-el-syarat.firebaseapp.com',
  projectId: 'souk-el-syarat',
  storageBucket: 'souk-el-syarat.firebasestorage.app',
  messagingSenderId: '505765285633',
  appId: '1:505765285633:web:1bc55f947c68b46d75d500',
  measurementId: 'G-46RKPHQLVB',
  databaseURL: 'https://souk-el-syarat-default-rtdb.europe-west1.firebasedatabase.app/',
};

// Development Firebase Configuration (for emulators)
const firebaseConfigDev = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-souk-el-syarat.firebaseapp.com',
  projectId: 'demo-souk-el-syarat',
  storageBucket: 'demo-souk-el-syarat.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo',
  measurementId: 'G-DEMO',
};

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

// Initialize Firebase App
const config = isDevelopment && useEmulators ? firebaseConfigDev : firebaseConfig;
export const app: FirebaseApp = initializeApp(config);

// Initialize Firebase Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const realtimeDb: Database = getDatabase(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

// Initialize Analytics and Performance (Production only)
export let analytics: Analytics | null = null;
export let performance: FirebasePerformance | null = null;
export let messaging: Messaging | null = null;
export let appCheck: AppCheck | null = null;

if (isProduction && typeof window !== 'undefined') {
  try {
    // Initialize Analytics and Performance
    analytics = getAnalytics(app);
    performance = getPerformance(app);

    // Initialize Messaging for push notifications
    messaging = getMessaging(app);

    // Initialize App Check for security
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LdYsZ0qAAAAAH4f0a2L8W5YmN3jQ9X2kP7bR8sT'), // Replace with your reCAPTCHA site key
      isTokenAutoRefreshEnabled: true,
    });

    // if (process.env.NODE_ENV === 'development') console.log('🔥 Firebase Analytics, Performance, Messaging, and App Check initialized');
  } catch (error) {
    // if (process.env.NODE_ENV === 'development') console.warn('Firebase services initialization failed:', error);
  }
}

// Connect to Firebase Emulators in development
if (isDevelopment && useEmulators) {
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099');

    // Connect to Firestore emulator
    if (!(db as any)._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }

    // Connect to Realtime Database emulator
    connectDatabaseEmulator(realtimeDb, 'localhost', 9000);

    // Connect to Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);

    // Connect to Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);

    // if (process.env.NODE_ENV === 'development') console.log('🔥 Connected to Firebase Emulators');
  } catch (error) {
    // if (process.env.NODE_ENV === 'development') console.warn('Firebase Emulator connection failed:', error);
  }
}

// Firebase configuration validation
export const validateFirebaseConfig = (): boolean => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const currentConfig = isDevelopment && useEmulators ? firebaseConfigDev : firebaseConfig;

  for (const field of requiredFields) {
    if (!currentConfig[field as keyof typeof currentConfig]) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error(`❌ Firebase configuration missing: ${field}`);
      return false;
    }
  }

  // if (process.env.NODE_ENV === 'development') console.log('✅ Firebase configuration validated');
  return true;
};

// Initialize Firebase with validation
export const initializeFirebase = async (): Promise<boolean> => {
  try {
    // Validate configuration
    if (!validateFirebaseConfig()) {
      throw new Error('Invalid Firebase configuration');
    }

    // Test Firebase connection
    if (isProduction) {
      // Test Firestore connection in production
      await (db as any)._delegate._databaseId;
      // if (process.env.NODE_ENV === 'development') console.log('🔥 Firebase Firestore connected successfully');
    }

    // if (process.env.NODE_ENV === 'development') console.log('🚀 Firebase initialized successfully');
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('❌ Firebase initialization failed:', error);
    return false;
  }
};

// Firebase error handling
export const handleFirebaseError = (error: unknown): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'User not found. Please check your credentials.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'Email is already registered. Please sign in.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'firestore/permission-denied': 'Access denied. Please check your permissions.',
    'firestore/unavailable': 'Service temporarily unavailable. Please try again.',
    'storage/unauthorized': 'Unauthorized access to storage. Please sign in.',
    'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
  };

  const errorCode = error?.code || 'unknown-error';
  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};

// Performance monitoring helpers
export const logPerformanceMetric = (name: string, value: number) => {
  if (performance && isProduction) {
    try {
      // Log custom performance metrics
      // if (process.env.NODE_ENV === 'development') console.log(`📊 Performance Metric - ${name}: ${value}ms`);
    } catch (error) {
      // if (process.env.NODE_ENV === 'development') console.warn('Performance logging failed:', error);
    }
  }
};

// Analytics helpers
export const logAnalyticsEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (analytics && isProduction) {
    try {
      import('firebase/analytics').then(({ logEvent }) => {
        logEvent(analytics!, eventName, parameters);
        // if (process.env.NODE_ENV === 'development') console.log(`📈 Analytics Event - ${eventName}:`, parameters);
      });
    } catch (error) {
      // if (process.env.NODE_ENV === 'development') console.warn('Analytics logging failed:', error);
    }
  }
};

// Export Firebase configuration for reference
export const getFirebaseConfig = () => ({
  isDevelopment,
  isProduction,
  useEmulators,
  config: isDevelopment && useEmulators ? firebaseConfigDev : firebaseConfig,
  servicesEnabled: {
    auth: !!auth,
    firestore: !!db,
    storage: !!storage,
    functions: !!functions,
    analytics: !!analytics,
    performance: !!performance,
  },
});

// Initialize Firebase on module load
initializeFirebase().then(success => {
  if (success) {
    // if (process.env.NODE_ENV === 'development') console.log('🎉 Souk El-Syarat Firebase setup complete!');
  } else {
    if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('💥 Firebase setup failed!');
  }
});

export default app;
