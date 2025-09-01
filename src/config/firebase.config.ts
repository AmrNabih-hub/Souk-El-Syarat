/**
 * Firebase Configuration - FIXED VERSION
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Use environment variables with CORRECT fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "souk-el-syarat.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "souk-el-syarat",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "souk-el-syarat.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "505765285633",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:505765285633:web:1bc55f947c68b46d75d500",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-46RKPHQLVB",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://souk-el-syarat-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app, 'us-central1');

// Only initialize these in browser environment
export const analytics = null; // Disable analytics for now to avoid errors
export const messaging = null; // Disable messaging for now
export const performance = null; // Disable performance for now

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8088); // Updated port
  connectStorageEmulator(storage, 'localhost', 9199);
  connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Connected to Firebase Emulators');
}

// Export configuration
export const firebaseApp = app;
export default firebaseConfig;

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-souk-el-syarat.cloudfunctions.net/api';

// Feature flags
export const FEATURES = {
  REAL_PAYMENTS: false,
  REAL_SEARCH: true,
  REAL_CHAT: true,
  ANALYTICS: false, // Disabled to avoid errors
};

console.log('🚀 Firebase initialized with correct configuration');
