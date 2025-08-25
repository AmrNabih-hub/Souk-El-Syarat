import { vi } from "vitest";

// Mock Firebase services that cause test failures
vi.mock('@/config/firebase.config', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn()
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn()
  },
  messaging: null, // Disable messaging in tests to prevent browser errors
  analytics: null,
  storage: {
    ref: vi.fn()
  }
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000
    }
  }
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn(() => Promise.resolve('granted'))
  }
});

export default {};
