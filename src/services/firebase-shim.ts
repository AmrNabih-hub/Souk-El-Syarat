// Minimal shim for Firebase Firestore functions referenced in notification.service.ts
// These stubs allow the frontend build and type-check to proceed; replace with real Firebase integration if needed.

export const db: any = {};
export const collection = (database: any, name: string) => ({ database, name });
export const addDoc = async (col: any, doc: any) => ({ id: 'shim-doc-id', data: () => doc });
export const serverTimestamp = () => new Date();
export const query = (...args: any[]) => ({ args });
export const where = (...args: any[]) => ({ args });
export const orderBy = (...args: any[]) => ({ args });
export const getDocs = async (q: any) => ({ docs: [], size: 0 });
export const doc = (database: any, id: string) => ({ database, id });
export const updateDoc = async (docRef: any, data: any) => {};
export const deleteDoc = async (docRef: any) => {};
export const writeBatch = (database: any) => ({ update: (ref: any, data: any) => {}, commit: async () => {} });
export const onSnapshot = (q: any, cb: any) => {
  // Return a function-style unsubscribe for simplicity
  const unsubscribe = () => {};
  // Simulate immediate callback with empty snapshot
  setTimeout(() => cb({ docs: [], size: 0 }), 0);
  return unsubscribe;
};
export const getDoc = async (docRef: any) => ({ exists: () => false, id: 'shim', data: () => ({} as any) });
export const limit = (n: number) => ({ limit: n });
