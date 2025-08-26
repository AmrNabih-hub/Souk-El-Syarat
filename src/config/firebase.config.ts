/**
 * 🚨 SIMPLE FIREBASE CONFIGURATION
 * Souk El-Syarat Marketplace - Simple Setup
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';
import { getFunctions, Functions } from 'firebase/functions';

// Simple Firebase config
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

console.log('🚀 Initializing Firebase...');

// Initialize Firebase App
export const app: FirebaseApp = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

// Initialize Firebase Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const realtimeDb: Database = getDatabase(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

console.log('✅ Firebase services initialized');

// Export everything for immediate use
export default app;
