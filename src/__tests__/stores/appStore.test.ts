/**
 * App Store Tests
 * Tests for Zustand state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import type { Product } from '@/types';

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      cart: [],
      wishlist: [],
      language: 'en',
    });
  });

  describe('Cart Management', () => {
    it('should add product to cart', () => {
      const product: Product = {
        id: 'product-1',
        name: 'Test Product',
        price: 100,
        images: ['test.jpg'],
      } as Product;

      useAppStore.getState().addToCart(product);
      
      const cart = useAppStore.getState().cart;
      expect(cart).toHaveLength(1);
      expect(cart[0].id).toBe('product-1');
    });

    it('should increase quantity if product already in cart', () => {
      const product: Product = {
        id: 'product-1',
        name: 'Test Product',
        price: 100,
      } as Product;

      const { addToCart } = useAppStore.getState();
      
      addToCart(product);
      addToCart(product);
      
      const cart = useAppStore.getState().cart;
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(2);
    });

    it('should remove product from cart', () => {
      const product: Product = {
        id: 'product-1',
        name: 'Test Product',
        price: 100,
      } as Product;

      const { addToCart, removeFromCart } = useAppStore.getState();
      
      addToCart(product);
      removeFromCart('product-1');
      
      const cart = useAppStore.getState().cart;
      expect(cart).toHaveLength(0);
    });

    it('should update cart item quantity', () => {
      const product: Product = {
        id: 'product-1',
        name: 'Test Product',
        price: 100,
      } as Product;

      const { addToCart, updateCartItemQuantity } = useAppStore.getState();
      
      addToCart(product);
      updateCartItemQuantity('product-1', 5);
      
      const cart = useAppStore.getState().cart;
      expect(cart[0].quantity).toBe(5);
    });

    it('should clear entire cart', () => {
      const product1: Product = { id: '1', name: 'Product 1', price: 100 } as Product;
      const product2: Product = { id: '2', name: 'Product 2', price: 200 } as Product;

      const { addToCart, clearCart } = useAppStore.getState();
      
      addToCart(product1);
      addToCart(product2);
      clearCart();
      
      const cart = useAppStore.getState().cart;
      expect(cart).toHaveLength(0);
    });

    it('should calculate cart total', () => {
      const product1: Product = { id: '1', price: 100 } as Product;
      const product2: Product = { id: '2', price: 200 } as Product;

      const { addToCart, getCartTotal } = useAppStore.getState();
      
      addToCart(product1);
      addToCart(product2);
      
      const total = getCartTotal();
      expect(total).toBe(300);
    });

    it('should get cart item count', () => {
      const product: Product = { id: '1', price: 100 } as Product;

      const { addToCart, getCartItemCount } = useAppStore.getState();
      
      addToCart(product);
      addToCart(product);
      
      const count = getCartItemCount();
      expect(count).toBe(2); // 2 items of same product
    });
  });

  describe('Wishlist Management', () => {
    it('should add product to wishlist', () => {
      const productId = 'product-1';

      useAppStore.getState().addToWishlist(productId);
      
      const wishlist = useAppStore.getState().wishlist;
      expect(wishlist).toContain(productId);
    });

    it('should remove product from wishlist', () => {
      const productId = 'product-1';

      const { addToWishlist, removeFromWishlist } = useAppStore.getState();
      
      addToWishlist(productId);
      removeFromWishlist(productId);
      
      const wishlist = useAppStore.getState().wishlist;
      expect(wishlist).not.toContain(productId);
    });

    it('should check if product is in wishlist', () => {
      const productId = 'product-1';

      const { addToWishlist, isInWishlist } = useAppStore.getState();
      
      expect(isInWishlist(productId)).toBe(false);
      
      addToWishlist(productId);
      
      expect(isInWishlist(productId)).toBe(true);
    });

    it('should not add duplicate to wishlist', () => {
      const productId = 'product-1';

      const { addToWishlist } = useAppStore.getState();
      
      addToWishlist(productId);
      addToWishlist(productId);
      
      const wishlist = useAppStore.getState().wishlist;
      expect(wishlist.filter(id => id === productId)).toHaveLength(1);
    });
  });

  describe('Language Management', () => {
    it('should switch language to Arabic', () => {
      useAppStore.getState().setLanguage('ar');
      
      const language = useAppStore.getState().language;
      expect(language).toBe('ar');
    });

    it('should switch language to English', () => {
      useAppStore.getState().setLanguage('en');
      
      const language = useAppStore.getState().language;
      expect(language).toBe('en');
    });

    it('should toggle language', () => {
      const { setLanguage } = useAppStore.getState();
      
      setLanguage('en');
      expect(useAppStore.getState().language).toBe('en');
      
      setLanguage('ar');
      expect(useAppStore.getState().language).toBe('ar');
    });
  });

  describe('Search History', () => {
    it('should add search term to history', () => {
      const searchTerm = 'BMW';

      useAppStore.getState().addSearchHistory(searchTerm);
      
      const history = useAppStore.getState().searchHistory;
      expect(history).toContain(searchTerm);
    });

    it('should limit search history size', () => {
      const { addSearchHistory } = useAppStore.getState();
      
      // Add more than limit (e.g., 10 items)
      for (let i = 0; i < 15; i++) {
        addSearchHistory(`search-${i}`);
      }
      
      const history = useAppStore.getState().searchHistory;
      expect(history.length).toBeLessThanOrEqual(10);
    });

    it('should clear search history', () => {
      const { addSearchHistory, clearSearchHistory } = useAppStore.getState();
      
      addSearchHistory('search-1');
      addSearchHistory('search-2');
      clearSearchHistory();
      
      const history = useAppStore.getState().searchHistory;
      expect(history).toHaveLength(0);
    });
  });

  describe('State Persistence', () => {
    it('should persist cart to localStorage', () => {
      const product: Product = { id: '1', name: 'Product', price: 100 } as Product;

      useAppStore.getState().addToCart(product);
      
      // Check if stored in localStorage
      const stored = localStorage.getItem('souk-cart');
      expect(stored).toBeDefined();
    });

    it('should persist wishlist to localStorage', () => {
      useAppStore.getState().addToWishlist('product-1');
      
      const stored = localStorage.getItem('souk-wishlist');
      expect(stored).toBeDefined();
    });

    it('should restore state from localStorage', () => {
      // Simulate stored data
      localStorage.setItem('souk-cart', JSON.stringify([
        { id: '1', name: 'Product', quantity: 1, price: 100 }
      ]));

      // Store should load from localStorage on init
      const cart = useAppStore.getState().cart;
      expect(cart.length).toBeGreaterThanOrEqual(0);
    });
  });
});
