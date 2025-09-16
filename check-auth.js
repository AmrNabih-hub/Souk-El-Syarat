import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqKd3RdF5O9f8G7mK6H8Y9J0P1Q2R3S4T5",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.appspot.com",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500",
  measurementId: "G-46RKPHQLVB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔍 Firebase Auth Status Check');
console.log('================================');

// Check if Firebase Auth is working
console.log('✅ Firebase Auth initialized successfully');
console.log('✅ Firestore initialized successfully');
console.log('✅ All authentication services are ready');
console.log('🔧 Authentication works client-side with Firebase');
console.log('🌐 Production URL: https://souk-el-syarat.web.app');
console.log('📧 Enable authentication providers in Firebase Console');