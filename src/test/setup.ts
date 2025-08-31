/**
 * Enhanced Test Setup for Souk El-Syarat
 * Professional-grade testing environment configuration
 */

import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock Firebase for testing
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  updatePassword: vi.fn(),
  deleteUser: vi.fn(),
  reload: vi.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {
    constructor() {}
    setCustomParameters() {}
  },
  FacebookAuthProvider: class MockFacebookAuthProvider {
    constructor() {}
  },
  TwitterAuthProvider: class MockTwitterAuthProvider {
    constructor() {}
  },
  signInWithPopup: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.VITE_FIREBASE_APP_ID = 'test-app-id';

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock Intersection Observer
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock console methods in tests
const originalConsoleError = // console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  // console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Test cleanup
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});
