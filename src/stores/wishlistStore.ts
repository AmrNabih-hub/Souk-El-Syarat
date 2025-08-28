import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface WishlistStore {
  items: Product[];
  isLoading: boolean;
  
  // Actions
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addToWishlist: (product: Product) => {
        const exists = get().items.some(item => item.id === product.id);
        
        if (exists) {
          toast.error('Already in wishlist');
          return;
        }
        
        set(state => ({
          items: [...state.items, product],
        }));
        
        toast.success('Added to wishlist');
      },

      removeFromWishlist: (productId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId),
        }));
        
        toast.success('Removed from wishlist');
      },

      isInWishlist: (productId: string) => {
        return get().items.some(item => item.id === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);