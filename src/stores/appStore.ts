import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, CartItem } from '@/types';
import { doc, setDoc, onSnapshot, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import toast from 'react-hot-toast';

// Enhanced AppStore with Firebase real-time sync
interface AppStore extends AppState {
  // Existing state
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  currency: 'EGP' | 'USD';
  cartItems: CartItem[];
  favorites: string[];
  
  // New real-time sync state
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: Date | null;
  unsubscribeCallbacks: (() => void)[];

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'ar' | 'en') => void;
  setCurrency: (currency: 'EGP' | 'USD') => void;
  
  // Enhanced cart actions with Firebase sync
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartItemQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemsCount: () => number;
  getCartTotal: () => number;

  // Enhanced favorites actions with Firebase sync
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => Promise<void>;

  // Real-time sync management
  initializeRealtimeSync: (userId: string) => Promise<void>;
  disconnectRealtimeSync: () => void;
  forceSyncToFirebase: () => Promise<void>;
  
  // Offline support
  setOnlineStatus: (isOnline: boolean) => void;
  syncPendingChanges: () => Promise<void>;
}

// Firebase collection names
const COLLECTIONS = {
  USER_CARTS: 'user_carts',
  USER_FAVORITES: 'user_favorites',
  USER_PREFERENCES: 'user_preferences'
} as const;

// Utility function for safe Firebase operations
const safeFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`🔥 Firebase Error: ${errorMessage}`, error);
    toast.error(`خطأ في المزامنة: ${errorMessage}`);
    return fallback;
  }
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      // Initialize theme and language from localStorage on startup
      let initialTheme: 'light' | 'dark' = 'light';
      let initialLanguage: 'ar' | 'en' = 'ar';

      if (typeof window !== 'undefined') {
        initialTheme = (localStorage.getItem('souk-theme') as 'light' | 'dark') || 'light';
        initialLanguage = (localStorage.getItem('souk-language') as 'ar' | 'en') || 'ar';
        
        // Apply initial settings
        document.documentElement.className = initialTheme === 'dark' ? 'dark' : '';
        document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = initialLanguage;
      }

      return {
        // Initial state
        theme: initialTheme,
        language: initialLanguage,
        currency: 'EGP',
        cartItems: [],
        favorites: [],
        
        // Real-time sync state
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        syncStatus: 'idle',
        lastSyncTime: null,
        unsubscribeCallbacks: [],

        // Theme and language actions
        setTheme: theme => {
          set({ theme });
          if (typeof window !== 'undefined') {
            document.documentElement.className = theme === 'dark' ? 'dark' : '';
            localStorage.setItem('souk-theme', theme);
          }
        },

        setLanguage: language => {
          set({ language });
          if (typeof window !== 'undefined') {
            const root = document.documentElement;
            root.setAttribute('lang', language);
            root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
            localStorage.setItem('souk-language', language);
          }
        },
        
        setCurrency: currency => set({ currency }),

        // Enhanced cart actions with Firebase sync
        addToCart: async (newItem: CartItem) => {
          const { cartItems, isOnline } = get();
          const existingItemIndex = cartItems.findIndex(item => item.productId === newItem.productId);

          let updatedItems: CartItem[];
          if (existingItemIndex >= 0) {
            updatedItems = [...cartItems];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
          } else {
            updatedItems = [...cartItems, newItem];
          }

          // Update local state immediately for responsive UI
          set({ cartItems: updatedItems, syncStatus: 'syncing' });

          // Sync to Firebase if online
          if (isOnline) {
            await safeFirebaseOperation(
              async () => {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                  await setDoc(doc(db, COLLECTIONS.USER_CARTS, userId), {
                    items: updatedItems,
                    updatedAt: new Date(),
                    userId
                  }, { merge: true });
                  set({ syncStatus: 'synced', lastSyncTime: new Date() });
                }
              },
              undefined,
              'فشل في مزامنة السلة'
            );
          }
        },

        removeFromCart: async (productId: string) => {
          const { cartItems, isOnline } = get();
          const updatedItems = cartItems.filter(item => item.productId !== productId);
          
          set({ cartItems: updatedItems, syncStatus: 'syncing' });

          if (isOnline) {
            await safeFirebaseOperation(
              async () => {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                  await setDoc(doc(db, COLLECTIONS.USER_CARTS, userId), {
                    items: updatedItems,
                    updatedAt: new Date(),
                    userId
                  }, { merge: true });
                  set({ syncStatus: 'synced', lastSyncTime: new Date() });
                }
              },
              undefined,
              'فشل في مزامنة السلة'
            );
          }
        },

        updateCartItemQuantity: async (productId: string, quantity: number) => {
          const { cartItems, isOnline } = get();
          
          let updatedItems: CartItem[];
          if (quantity <= 0) {
            updatedItems = cartItems.filter(item => item.productId !== productId);
          } else {
            updatedItems = cartItems.map(item =>
              item.productId === productId ? { ...item, quantity } : item
            );
          }

          set({ cartItems: updatedItems, syncStatus: 'syncing' });

          if (isOnline) {
            await safeFirebaseOperation(
              async () => {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                  await setDoc(doc(db, COLLECTIONS.USER_CARTS, userId), {
                    items: updatedItems,
                    updatedAt: new Date(),
                    userId
                  }, { merge: true });
                  set({ syncStatus: 'synced', lastSyncTime: new Date() });
                }
              },
              undefined,
              'فشل في مزامنة السلة'
            );
          }
        },

        clearCart: async () => {
          set({ cartItems: [], syncStatus: 'syncing' });
          
          const { isOnline } = get();
          if (isOnline) {
            await safeFirebaseOperation(
              async () => {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                  await deleteDoc(doc(db, COLLECTIONS.USER_CARTS, userId));
                  set({ syncStatus: 'synced', lastSyncTime: new Date() });
                }
              },
              undefined,
              'فشل في مزامنة السلة'
            );
          }
        },

        getCartItemsCount: () => {
          const { cartItems } = get();
          return cartItems.reduce((total, item) => total + item.quantity, 0);
        },

        getCartTotal: () => {
          const { cartItems } = get();
          return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        },

        // Enhanced favorites actions with Firebase sync
        addToFavorites: async (productId: string) => {
          const { favorites, isOnline } = get();
          if (favorites.includes(productId)) return;

          const updatedFavorites = [...favorites, productId];
          set({ favorites: updatedFavorites, syncStatus: 'syncing' });

          if (isOnline) {
            await safeFirebaseOperation(
              async () => {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                  await setDoc(doc(db, COLLECTIONS.USER_FAVORITES, userId), {
                    favorites: updatedFavorites,
                    updatedAt: new Date(),
                    userId
                  }, { merge: true });
                  set({ syncStatus: 'synced', lastSyncTime: new Date() });
                }
              },
              undefined,
              'فشل في مزامنة المفضلة'
            );
          }
        },

        removeFromFavorites: async (productId: string) => {
          const { favorites, isOnline } = get();
          const updatedFavorites = favorites.filter(id => id !== productId);
          
          set({ favorites: updatedFavorites, syncStatus: 'syncing' });

          if (isOnline) {
            await safeFirebaseOperation(
              async () => {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                  await setDoc(doc(db, COLLECTIONS.USER_FAVORITES, userId), {
                    favorites: updatedFavorites,
                    updatedAt: new Date(),
                    userId
                  }, { merge: true });
                  set({ syncStatus: 'synced', lastSyncTime: new Date() });
                }
              },
              undefined,
              'فشل في مزامنة المفضلة'
            );
          }
        },

        isFavorite: (productId: string) => {
          const { favorites } = get();
          return favorites.includes(productId);
        },

        clearFavorites: async () => {
          set({ favorites: [], syncStatus: 'syncing' });
          
          const { isOnline } = get();
          if (isOnline) {
            await safeFirebaseOperation(
              async () => {
                const userId = localStorage.getItem('currentUserId');
                if (userId) {
                  await deleteDoc(doc(db, COLLECTIONS.USER_FAVORITES, userId));
                  set({ syncStatus: 'synced', lastSyncTime: new Date() });
                }
              },
              undefined,
              'فشل في مزامنة المفضلة'
            );
          }
        },

        // Real-time sync management
        initializeRealtimeSync: async (userId: string) => {
          console.log('🚀 Initializing real-time sync for user:', userId);
          
          try {
            // Store userId for offline operations
            localStorage.setItem('currentUserId', userId);

            // Set up real-time listeners for cart
            const cartUnsubscribe = onSnapshot(
              doc(db, COLLECTIONS.USER_CARTS, userId),
              (doc) => {
                if (doc.exists()) {
                  const data = doc.data();
                  console.log('📡 Cart data synced from Firebase:', data.items?.length || 0, 'items');
                  set({ 
                    cartItems: data.items || [], 
                    syncStatus: 'synced',
                    lastSyncTime: new Date()
                  });
                }
              },
              (error) => {
                console.error('❌ Cart sync error:', error);
                set({ syncStatus: 'error' });
              }
            );

            // Set up real-time listeners for favorites
            const favoritesUnsubscribe = onSnapshot(
              doc(db, COLLECTIONS.USER_FAVORITES, userId),
              (doc) => {
                if (doc.exists()) {
                  const data = doc.data();
                  console.log('📡 Favorites data synced from Firebase:', data.favorites?.length || 0, 'items');
                  set({ 
                    favorites: data.favorites || [], 
                    syncStatus: 'synced',
                    lastSyncTime: new Date()
                  });
                }
              },
              (error) => {
                console.error('❌ Favorites sync error:', error);
                set({ syncStatus: 'error' });
              }
            );

            // Store unsubscribe callbacks
            set({ 
              unsubscribeCallbacks: [cartUnsubscribe, favoritesUnsubscribe],
              syncStatus: 'synced'
            });

            console.log('✅ Real-time sync initialized successfully');
            
          } catch (error) {
            console.error('💥 Failed to initialize real-time sync:', error);
            set({ syncStatus: 'error' });
            toast.error('فشل في تهيئة المزامنة التلقائية');
          }
        },

        disconnectRealtimeSync: () => {
          const { unsubscribeCallbacks } = get();
          unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
          set({ unsubscribeCallbacks: [], syncStatus: 'idle' });
          localStorage.removeItem('currentUserId');
          console.log('🔌 Real-time sync disconnected');
        },

        forceSyncToFirebase: async () => {
          const { cartItems, favorites, isOnline } = get();
          if (!isOnline) return;

          set({ syncStatus: 'syncing' });
          
          await safeFirebaseOperation(
            async () => {
              const userId = localStorage.getItem('currentUserId');
              if (userId) {
                await Promise.all([
                  setDoc(doc(db, COLLECTIONS.USER_CARTS, userId), {
                    items: cartItems,
                    updatedAt: new Date(),
                    userId
                  }),
                  setDoc(doc(db, COLLECTIONS.USER_FAVORITES, userId), {
                    favorites: favorites,
                    updatedAt: new Date(),
                    userId
                  })
                ]);
                set({ syncStatus: 'synced', lastSyncTime: new Date() });
                toast.success('تم تحديث البيانات بنجاح');
              }
            },
            undefined,
            'فشل في المزامنة الإجبارية'
          );
        },

        // Offline support
        setOnlineStatus: (isOnline: boolean) => {
          set({ isOnline });
          if (isOnline) {
            // Auto-sync when coming back online
            const { syncPendingChanges } = get();
            syncPendingChanges();
          }
        },

        syncPendingChanges: async () => {
          const { forceSyncToFirebase } = get();
          await forceSyncToFirebase();
        }
      };
    },
    {
      name: 'souk-app-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        // Don't persist cart/favorites - they come from Firebase
      }),
    }
  )
);

// Online/Offline detection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });
}
