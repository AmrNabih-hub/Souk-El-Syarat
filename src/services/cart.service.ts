/**
 * 🛒 CART SERVICE
 * Manages shopping cart operations with real-time sync
 */

import { db } from '@/config/firebase.config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

export interface CartItem {
  productId: string;
  quantity: number;
  price?: number;
  product?: any;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CartService {
  private static CART_COLLECTION = 'carts';

  /**
   * Get user's cart
   */
  static async getCart(userId?: string): Promise<Cart> {
    if (!userId) {
      // Return empty cart for anonymous users
      return {
        id: 'anonymous',
        userId: 'anonymous',
        items: [],
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    try {
      const cartRef = doc(db, this.CART_COLLECTION, userId);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        return {
          id: cartSnap.id,
          ...cartSnap.data(),
          createdAt: cartSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: cartSnap.data().updatedAt?.toDate() || new Date()
        } as Cart;
      }

      // Create empty cart if doesn't exist
      const newCart: Cart = {
        id: userId,
        userId,
        items: [],
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(cartRef, {
        ...newCart,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return newCart;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(item: CartItem, userId?: string): Promise<Cart> {
    if (!userId) {
      throw new Error('User must be logged in to add items to cart');
    }

    try {
      const cart = await this.getCart(userId);
      
      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(
        i => i.productId === item.productId
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        cart.items.push(item);
      }

      // Calculate total
      cart.total = cart.items.reduce((sum, i) => 
        sum + (i.price || 0) * i.quantity, 0
      );

      // Update cart in Firestore
      const cartRef = doc(db, this.CART_COLLECTION, userId);
      await updateDoc(cartRef, {
        items: cart.items,
        total: cart.total,
        updatedAt: serverTimestamp()
      });

      return cart;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Update item quantity
   */
  static async updateQuantity(
    productId: string, 
    quantity: number, 
    userId?: string
  ): Promise<Cart> {
    if (!userId) {
      throw new Error('User must be logged in to update cart');
    }

    try {
      const cart = await this.getCart(userId);
      
      const itemIndex = cart.items.findIndex(
        i => i.productId === productId
      );

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item if quantity is 0
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }

        // Recalculate total
        cart.total = cart.items.reduce((sum, i) => 
          sum + (i.price || 0) * i.quantity, 0
        );

        // Update cart in Firestore
        const cartRef = doc(db, this.CART_COLLECTION, userId);
        await updateDoc(cartRef, {
          items: cart.items,
          total: cart.total,
          updatedAt: serverTimestamp()
        });
      }

      return cart;
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(
    productId: string, 
    userId?: string
  ): Promise<Cart> {
    return this.updateQuantity(productId, 0, userId);
  }

  /**
   * Clear cart
   */
  static async clearCart(userId?: string): Promise<void> {
    if (!userId) return;

    try {
      const cartRef = doc(db, this.CART_COLLECTION, userId);
      await updateDoc(cartRef, {
        items: [],
        total: 0,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Sync cart after login
   */
  static async syncCart(
    localCart: CartItem[], 
    userId: string
  ): Promise<Cart> {
    try {
      const serverCart = await this.getCart(userId);
      
      // Merge local and server carts
      localCart.forEach(localItem => {
        const serverItemIndex = serverCart.items.findIndex(
          i => i.productId === localItem.productId
        );

        if (serverItemIndex >= 0) {
          // Take max quantity
          serverCart.items[serverItemIndex].quantity = Math.max(
            serverCart.items[serverItemIndex].quantity,
            localItem.quantity
          );
        } else {
          // Add new item
          serverCart.items.push(localItem);
        }
      });

      // Recalculate total
      serverCart.total = serverCart.items.reduce((sum, i) => 
        sum + (i.price || 0) * i.quantity, 0
      );

      // Update cart in Firestore
      const cartRef = doc(db, this.CART_COLLECTION, userId);
      await updateDoc(cartRef, {
        items: serverCart.items,
        total: serverCart.total,
        updatedAt: serverTimestamp()
      });

      return serverCart;
    } catch (error) {
      console.error('Error syncing cart:', error);
      throw error;
    }
  }
}

export const cartService = new CartService();