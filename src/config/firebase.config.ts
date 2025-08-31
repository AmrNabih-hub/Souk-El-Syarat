/**
 * Firebase Configuration for Production
 * Real APIs - No Mocks
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getMessaging } from 'firebase/messaging';

// Your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDyKJOF5XmZPxKlWyTpZGSaYyL8Y-nVVsM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "souk-el-syarat.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "souk-el-syarat",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "souk-el-syarat.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "505765285633",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:505765285633:web:default-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEFAULT-ID",
  databaseURL: "https://souk-el-syarat-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app, 'us-central1');
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Initialize Analytics and Performance (production only)
export const analytics = typeof window !== 'undefined' && import.meta.env.PROD 
  ? getAnalytics(app) 
  : null;

export const performance = typeof window !== 'undefined' && import.meta.env.PROD
  ? getPerformance(app)
  : null;

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Connected to Firebase Emulators');
}

// Export configuration
export const firebaseApp = app;
export default firebaseConfig;

// API Base URL - Using real Firebase Functions
export const API_BASE_URL = import.meta.env.VITE_USE_MOCK_API === 'true'
  ? 'http://localhost:3001/api' // Mock API (not used in production)
  : import.meta.env.VITE_API_URL || 'https://us-central1-souk-el-syarat.cloudfunctions.net/api';

// Feature flags
export const FEATURES = {
  REAL_PAYMENTS: import.meta.env.VITE_ENABLE_REAL_PAYMENTS === 'true',
  REAL_SEARCH: import.meta.env.VITE_ENABLE_REAL_SEARCH === 'true',
  REAL_CHAT: import.meta.env.VITE_ENABLE_REAL_CHAT === 'true',
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

console.log('🚀 Firebase initialized for production:', {
  project: firebaseConfig.projectId,
  apiUrl: API_BASE_URL,
  features: FEATURES
});