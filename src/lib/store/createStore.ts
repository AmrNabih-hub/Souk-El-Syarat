/**
 * Professional Store Factory
 * Type-safe, performant state management with Zustand
 */

import { create, StateCreator } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

import { ErrorHandler, SystemError } from '../errors';

// Store configuration types
export interface StoreConfig {
  name: string;
  version?: number;
  persist?: boolean;
  persistOptions?: Partial<PersistOptions<any, any>>;
  enableDevtools?: boolean;
  enableImmer?: boolean;
  enableSubscriptions?: boolean;
  onError?: (error: Error) => void;
}

// Base store state
export interface BaseStoreState {
  _isLoading: boolean;
  _error: string | null;
  _lastUpdated: Date | null;
}

// Store actions
export interface BaseStoreActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Store with base functionality
export type StoreWithBase<T> = T & BaseStoreState & BaseStoreActions;

// Store creator function
export function createStore<T extends Record<string, any>>(
  storeCreator: StateCreator<
    StoreWithBase<T>,
    [['zustand/immer', never], ['zustand/devtools', never], ['zustand/subscribeWithSelector', never]],
    [],
    StoreWithBase<T>
  >,
  config: StoreConfig
): any {
  const {
    name,
    version = 1,
    persist: shouldPersist = false,
    persistOptions = {},
    enableDevtools = process.env.NODE_ENV === 'development',
    enableImmer = true,
    enableSubscriptions = true,
    onError,
  } = config;

  // Error boundary wrapper
  const errorBoundaryWrapper = (fn: any) => (...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      const storeError = new SystemError(
        'STORE_ERROR',
        `Error in store ${name}: ${(error as Error).message}`,
        'حدث خطأ في النظام',
        { store: name, action: fn.name }
      );
      
      ErrorHandler.handle(storeError);
      onError?.(error as Error);
      
      // Return safe fallback
      return undefined;
    }
  };

  // Enhanced store creator with base functionality
  const enhancedStoreCreator: StateCreator<
    StoreWithBase<T>,
    [['zustand/immer', never], ['zustand/devtools', never], ['zustand/subscribeWithSelector', never]],
    [],
    StoreWithBase<T>
  > = (set, get, api) => {
    const originalStore = storeCreator(set, get, api);

    return {
      ...originalStore,
      
      // Base state
      _isLoading: false,
      _error: null,
      _lastUpdated: null,

      // Base actions
      setLoading: errorBoundaryWrapper((loading: boolean) => {
        set((state) => {
          state._isLoading = loading;
        });
      }),

      setError: errorBoundaryWrapper((error: string | null) => {
        set((state) => {
          state._error = error;
          state._isLoading = false;
        });
      }),

      clearError: errorBoundaryWrapper(() => {
        set((state) => {
          state._error = null;
        });
      }),

      reset: errorBoundaryWrapper(() => {
        const initialState = storeCreator(set, get, api);
        set((state) => {
          Object.keys(state).forEach(key => {
            if (key in initialState) {
              (state as any)[key] = (initialState as any)[key];
            }
          });
          state._isLoading = false;
          state._error = null;
          state._lastUpdated = null;
        });
      }),
    };
  };

  // Apply middleware
  let middlewares = enhancedStoreCreator;

  // Immer middleware for immutable updates
  if (enableImmer) {
    middlewares = immer(middlewares);
  }

  // DevTools middleware
  if (enableDevtools) {
    middlewares = devtools(middlewares, {
      name: `${name}-store`,
      serialize: true,
    });
  }

  // Subscription middleware
  if (enableSubscriptions) {
    middlewares = subscribeWithSelector(middlewares);
  }

  // Persistence middleware
  if (shouldPersist) {
    const persistConfig: PersistOptions<StoreWithBase<T>, StoreWithBase<T>> = {
      name: `${name}-storage`,
      version,
      partialize: (state) => {
        // Don't persist loading states and errors
        const { _isLoading, _error, ...persistedState } = state;
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._isLoading = false;
          state._error = null;
          state._lastUpdated = new Date();
        }
      },
      ...persistOptions,
    };

    middlewares = persist(middlewares, persistConfig);
  }

  // Create the store
  const store = create(middlewares);

  // Add store metadata
  (store as any).storeName = name;
  (store as any).storeVersion = version;

  return store;
}

// Async action wrapper
export function createAsyncAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  options: {
    onStart?: () => void;
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
  } = {}
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      options.onStart?.();
      const result = await action(...args);
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      options.onFinally?.();
    }
  };
}

// Store composition utilities
export function composeStores<T extends Record<string, any>>(
  stores: T
): T {
  return new Proxy(stores, {
    get(target, prop) {
      if (prop === 'reset') {
        return () => {
          Object.values(target).forEach((store: any) => {
            if (store.getState && typeof store.getState().reset === 'function') {
              store.getState().reset();
            }
          });
        };
      }
      
      if (prop === 'subscribe') {
        return (callback: (state: any) => void) => {
          const unsubscribers = Object.values(target).map((store: any) => {
            if (store.subscribe) {
              return store.subscribe(callback);
            }
            return () => {};
          });
          
          return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
          };
        };
      }

      return target[prop as keyof T];
    },
  });
}

// Store performance monitoring
export function monitorStorePerformance<T>(store: T, storeName: string): T {
  if (process.env.NODE_ENV !== 'development') {
    return store;
  }

  return new Proxy(store, {
    get(target, prop) {
      const value = target[prop as keyof T];
      
      if (typeof value === 'function') {
        return (...args: any[]) => {
          const start = performance.now();
          const result = (value as any).apply(target, args);
          const end = performance.now();
          
          if (end - start > 16) { // More than one frame (16ms)
            console.warn(
              `🐌 Slow store operation in ${storeName}.${String(prop)}: ${(end - start).toFixed(2)}ms`
            );
          }
          
          return result;
        };
      }
      
      return value;
    },
  });
}

// Store debugging utilities
export const storeDebugger = {
  logStateChanges: <T>(store: any, storeName: string) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    let previousState = store.getState();
    
    store.subscribe((state: T) => {
      console.group(`🔄 ${storeName} State Change`);
      console.log('Previous:', previousState);
      console.log('Current:', state);
      console.log('Diff:', diff(previousState, state));
      console.groupEnd();
      
      previousState = state;
    });
  },
  
  trackPerformance: <T>(store: any, storeName: string) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const originalGetState = store.getState;
    let getStateCallCount = 0;
    
    store.getState = () => {
      getStateCallCount++;
      if (getStateCallCount % 100 === 0) {
        console.warn(`⚡ ${storeName} getState called ${getStateCallCount} times`);
      }
      return originalGetState();
    };
  },
};

// Simple diff utility for debugging
function diff(obj1: any, obj2: any): any {
  const result: any = {};
  
  for (const key in obj2) {
    if (obj1[key] !== obj2[key]) {
      result[key] = { from: obj1[key], to: obj2[key] };
    }
  }
  
  return result;
}

export default createStore;