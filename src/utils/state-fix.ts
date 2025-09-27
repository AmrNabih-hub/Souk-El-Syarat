// Lightweight state manager initializer to prevent duplicate state instances
// Exports an idempotent initializeStateManager function used during app bootstrap

let initialized = false;

export function initializeStateManager() {
  if (initialized) return;
  initialized = true;
  // If using Zustand or other client-side stores that can be duplicated in HMR / micro-frontend setups,
  // normalize or rehydrate here. For now, keep as a no-op safe initializer.
  if (process.env.NODE_ENV === 'development') {
    console.debug('[state-fix] State manager initialized (no-op)');
  }
}

export default initializeStateManager;
