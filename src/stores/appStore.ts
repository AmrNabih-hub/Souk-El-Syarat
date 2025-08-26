import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, CartItem } from '@/types';

interface AppStore extends AppState {
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'ar' | 'en') => void;
  setCurrency: (currency: 'EGP' | 'USD') => void;

  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;

  // Favorites actions
  addToFavorites: (productId: string) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Recently viewed actions
  addToRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;
}

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
        const root = document.documentElement;
        if (initialTheme === 'dark') {
          root.classList.add('dark');
        }
        root.setAttribute('lang', initialLanguage);
        root.setAttribute('dir', initialLanguage === 'ar' ? 'rtl' : 'ltr');
      }
      
      return {
        // Initial state
        theme: initialTheme,
        language: initialLanguage,
        currency: 'EGP',
        cartItems: [],
        favorites: [],
        recentlyViewed: [],

      // Theme actions with side effects
      setTheme: theme => {
        set({ theme });
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          
          // Store in localStorage for persistence
          localStorage.setItem('souk-theme', theme);
        }
      },
      
      setLanguage: language => {
        set({ language });
        
        // Apply language to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          root.setAttribute('lang', language);
          root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
          
          // Store in localStorage for persistence
          localStorage.setItem('souk-language', language);
        }
      },
      
      setCurrency: currency => set({ currency }),

      // Cart actions
      addToCart: newItem => {
        const { cartItems } = get();
        const existingItemIndex = cartItems.findIndex(item => item.productId === newItem.productId);

        if (existingItemIndex >= 0) {
          // Update quantity if item already exists
          const updatedItems = [...cartItems];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          set({ cartItems: updatedItems });
        } else {
          // Add new item to cart
          set({ cartItems: [...cartItems, newItem] });
        }
      },

      removeFromCart: productId => {
        const { cartItems } = get();
        set({
          cartItems: cartItems.filter(item => item.productId !== productId),
        });
      },

      updateCartItemQuantity: (productId, quantity) => {
        const { cartItems } = get();
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          set({
            cartItems: cartItems.filter(item => item.productId !== productId),
          });
        } else {
          const updatedItems = cartItems.map(item =>
            item.productId === productId ? { ...item, quantity } : item
          );
          set({ cartItems: updatedItems });
        }
      },

      clearCart: () => set({ cartItems: [] }),

      getCartTotal: () => {
        const { cartItems } = get();
        // Note: This is a simplified version for demo purposes
        // In a real app, you'd fetch product prices from the database
        const samplePrices: Record<string, number> = {
          'car-1': 1450000,
          'car-2': 1850000,
          'car-3': 485000,
          'part-1': 850,
          'part-2': 2400,
          'part-3': 320,
          'service-1': 450,
          'service-2': 180,
          'accessory-1': 850,
        };

        return cartItems.reduce((total, item) => {
          const price = samplePrices[item.productId] || 0;
          return total + price * (item as any)?.quantity;
        }, 0);
      },

      getCartItemsCount: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, item) => total + (item as any)?.quantity, 0);
      },

      // Favorites actions
      addToFavorites: productId => {
        const { favorites } = get();
        if (!favorites.includes(productId)) {
          set({ favorites: [...favorites, productId] });
        }
      },

      removeFromFavorites: productId => {
        const { favorites } = get();
        set({
          favorites: favorites.filter(id => id !== productId),
        });
      },

      isFavorite: productId => {
        const { favorites } = get();
        return favorites.includes(productId);
      },

      // Recently viewed actions
      addToRecentlyViewed: productId => {
        const { recentlyViewed } = get();
        const filtered = recentlyViewed.filter(id => id !== productId);
        const updated = [productId, ...filtered].slice(0, 20); // Keep only last 20
        set({ recentlyViewed: updated });
      },

      clearRecentlyViewed: () => set({ recentlyViewed: [] }),
      };
    },
    {
      name: 'souk-app-store',
      partialize: state => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        cartItems: state.cartItems,
        favorites: state.favorites,
        recentlyViewed: state.recentlyViewed,
      }),
    }
  )
);
