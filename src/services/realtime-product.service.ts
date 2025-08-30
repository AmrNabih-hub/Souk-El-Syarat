/**
 * 🚀 REAL-TIME PRODUCT MANAGEMENT SERVICE
 * Souk El-Sayarat - Professional Product Operations
 * 
 * This service handles all real-time product CRUD operations
 * with instant synchronization across all connected clients
 */

import { 
  ref, 
  set, 
  push, 
  update, 
  remove,
  onValue,
  serverTimestamp,
  DataSnapshot,
  Unsubscribe
} from 'firebase/database';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp as firestoreTimestamp
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, realtimeDb, storage } from '@/config/firebase.config';
import { realtimeInfrastructure } from './realtime-infrastructure.service';

// Product interfaces
export interface RealtimeProduct {
  id: string;
  vendorId: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: 'cars' | 'parts' | 'accessories' | 'services';
  subcategory?: string;
  brand: string;
  model?: string;
  year?: number;
  price: number;
  discountPrice?: number;
  currency: 'EGP' | 'USD';
  stock: number;
  images: string[];
  thumbnailUrl?: string;
  specifications: Record<string, any>;
  features: string[];
  condition: 'new' | 'used' | 'refurbished';
  warranty?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  views: number;
  likes: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  location?: {
    city: string;
    region: string;
    coordinates?: { lat: number; lng: number };
  };
  shipping: {
    available: boolean;
    cost: number;
    estimatedDays: number;
    freeShippingMinimum?: number;
  };
  createdAt: number;
  updatedAt: number;
  lastViewedAt?: number;
  metadata?: Record<string, any>;
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  vendorId?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
  tags?: string[];
  location?: string;
}

export interface ProductUpdate {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  images?: string[];
  specifications?: Record<string, any>;
  features?: string[];
  tags?: string[];
}

export interface ProductAnalytics {
  productId: string;
  views: number;
  likes: number;
  addToCartCount: number;
  purchaseCount: number;
  revenue: number;
  conversionRate: number;
  averageRating: number;
  topKeywords: string[];
  viewsByDay: Array<{ date: string; count: number }>;
  salesByDay: Array<{ date: string; count: number; revenue: number }>;
}

/**
 * Real-Time Product Management Service
 */
export class RealtimeProductService {
  private static instance: RealtimeProductService;
  private listeners: Map<string, Unsubscribe> = new Map();
  private productsRef = ref(realtimeDb, 'products');
  private analyticsRef = ref(realtimeDb, 'productAnalytics');

  private constructor() {}

  static getInstance(): RealtimeProductService {
    if (!RealtimeProductService.instance) {
      RealtimeProductService.instance = new RealtimeProductService();
    }
    return RealtimeProductService.instance;
  }

  // ============= PRODUCT CRUD OPERATIONS =============

  /**
   * Create a new product
   */
  async createProduct(product: Omit<RealtimeProduct, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'rating' | 'reviewCount'>): Promise<string> {
    try {
      // Generate product ID
      const productId = doc(collection(db, 'products')).id;
      
      // Prepare product data
      const productData: RealtimeProduct = {
        ...product,
        id: productId,
        views: 0,
        likes: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save to Firestore (primary database)
      await setDoc(doc(db, 'products', productId), {
        ...productData,
        createdAt: firestoreTimestamp(),
        updatedAt: firestoreTimestamp()
      });

      // Save to Realtime Database for instant updates
      await set(ref(realtimeDb, `products/${productId}`), productData);

      // Initialize product analytics
      await this.initializeProductAnalytics(productId);

      // Track activity
      await realtimeInfrastructure.trackUserActivity(
        product.vendorId,
        'product_created',
        { productId, productName: product.name }
      );

      // Send notification to vendor
      await realtimeInfrastructure.sendNotification({
        userId: product.vendorId,
        type: 'system',
        title: 'منتج جديد',
        body: `تم إضافة المنتج "${product.name}" بنجاح`,
        priority: 'normal',
        data: { productId }
      });

      console.log('✅ Product created successfully:', productId);
      return productId;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, updates: ProductUpdate): Promise<void> {
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'products', productId), {
        ...updates,
        updatedAt: firestoreTimestamp()
      });

      // Update in Realtime Database
      await update(ref(realtimeDb, `products/${productId}`), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Get product details for notification
      const productDoc = await getDoc(doc(db, 'products', productId));
      const product = productDoc.data() as RealtimeProduct;

      // Track activity
      await realtimeInfrastructure.trackUserActivity(
        product.vendorId,
        'product_updated',
        { productId, updates }
      );

      // Notify vendor
      await realtimeInfrastructure.sendNotification({
        userId: product.vendorId,
        type: 'system',
        title: 'تحديث المنتج',
        body: `تم تحديث المنتج "${product.name}" بنجاح`,
        priority: 'low',
        data: { productId }
      });

      console.log('✅ Product updated successfully:', productId);
    } catch (error) {
      console.error('❌ Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string, vendorId: string): Promise<void> {
    try {
      // Get product details before deletion
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }
      
      const product = productDoc.data() as RealtimeProduct;
      
      // Verify vendor ownership
      if (product.vendorId !== vendorId) {
        throw new Error('Unauthorized: You can only delete your own products');
      }

      // Delete product images from storage
      for (const imageUrl of product.images) {
        try {
          const imageRef = storageRef(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Failed to delete image:', imageUrl, error);
        }
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'products', productId));

      // Delete from Realtime Database
      await remove(ref(realtimeDb, `products/${productId}`));

      // Delete analytics data
      await remove(ref(realtimeDb, `productAnalytics/${productId}`));

      // Track activity
      await realtimeInfrastructure.trackUserActivity(
        vendorId,
        'product_deleted',
        { productId, productName: product.name }
      );

      // Notify vendor
      await realtimeInfrastructure.sendNotification({
        userId: vendorId,
        type: 'system',
        title: 'حذف المنتج',
        body: `تم حذف المنتج "${product.name}" بنجاح`,
        priority: 'normal',
        data: { productId }
      });

      console.log('✅ Product deleted successfully:', productId);
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Get a single product
   */
  async getProduct(productId: string): Promise<RealtimeProduct | null> {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) {
        return null;
      }

      const product = productDoc.data() as RealtimeProduct;
      
      // Increment view count
      await this.incrementProductView(productId);
      
      return product;
    } catch (error) {
      console.error('❌ Error getting product:', error);
      throw error;
    }
  }

  /**
   * Get products with filters
   */
  async getProducts(filter: ProductFilter = {}, limitCount: number = 20): Promise<RealtimeProduct[]> {
    try {
      let q = query(collection(db, 'products'));

      // Apply filters
      if (filter.category) {
        q = query(q, where('category', '==', filter.category));
      }
      if (filter.vendorId) {
        q = query(q, where('vendorId', '==', filter.vendorId));
      }
      if (filter.isAvailable !== undefined) {
        q = query(q, where('isAvailable', '==', filter.isAvailable));
      }
      if (filter.isFeatured !== undefined) {
        q = query(q, where('isFeatured', '==', filter.isFeatured));
      }
      if (filter.minPrice !== undefined) {
        q = query(q, where('price', '>=', filter.minPrice));
      }
      if (filter.maxPrice !== undefined) {
        q = query(q, where('price', '<=', filter.maxPrice));
      }

      // Add ordering and limit
      q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

      const querySnapshot = await getDocs(q);
      const products: RealtimeProduct[] = [];

      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as RealtimeProduct);
      });

      // Apply client-side filtering for complex queries
      let filteredProducts = products;

      if (filter.searchQuery) {
        const searchLower = filter.searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.nameAr.includes(filter.searchQuery) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredProducts = filteredProducts.filter(p =>
          filter.tags!.some(tag => p.tags.includes(tag))
        );
      }

      if (filter.location) {
        filteredProducts = filteredProducts.filter(p =>
          p.location?.city === filter.location || p.location?.region === filter.location
        );
      }

      return filteredProducts;
    } catch (error) {
      console.error('❌ Error getting products:', error);
      throw error;
    }
  }

  // ============= REAL-TIME SUBSCRIPTIONS =============

  /**
   * Subscribe to a single product updates
   */
  subscribeToProduct(productId: string, callback: (product: RealtimeProduct | null) => void): Unsubscribe {
    const productRef = ref(realtimeDb, `products/${productId}`);
    
    const unsubscribe = onValue(productRef, (snapshot) => {
      const product = snapshot.val() as RealtimeProduct;
      callback(product || null);
    });

    this.listeners.set(`product-${productId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to vendor products
   */
  subscribeToVendorProducts(vendorId: string, callback: (products: RealtimeProduct[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const products = Object.values(data) as RealtimeProduct[];
        const vendorProducts = products
          .filter(p => p.vendorId === vendorId)
          .sort((a, b) => b.createdAt - a.createdAt);
        callback(vendorProducts);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`vendor-products-${vendorId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to category products
   */
  subscribeToCategoryProducts(category: string, callback: (products: RealtimeProduct[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const products = Object.values(data) as RealtimeProduct[];
        const categoryProducts = products
          .filter(p => p.category === category && p.isAvailable)
          .sort((a, b) => b.createdAt - a.createdAt);
        callback(categoryProducts);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`category-products-${category}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to featured products
   */
  subscribeToFeaturedProducts(callback: (products: RealtimeProduct[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const products = Object.values(data) as RealtimeProduct[];
        const featuredProducts = products
          .filter(p => p.isFeatured && p.isAvailable)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 12); // Limit to 12 featured products
        callback(featuredProducts);
      } else {
        callback([]);
      }
    });

    this.listeners.set('featured-products', unsubscribe);
    return unsubscribe;
  }

  // ============= PRODUCT INTERACTIONS =============

  /**
   * Like a product
   */
  async likeProduct(productId: string, userId: string): Promise<void> {
    try {
      // Update like count in Realtime Database
      const productRef = ref(realtimeDb, `products/${productId}`);
      const snapshot = await new Promise<DataSnapshot>((resolve) => {
        onValue(productRef, resolve, { onlyOnce: true });
      });
      
      const product = snapshot.val() as RealtimeProduct;
      if (product) {
        await update(productRef, {
          likes: (product.likes || 0) + 1
        });

        // Track user like
        await set(ref(realtimeDb, `userLikes/${userId}/${productId}`), true);

        // Update analytics
        await this.updateProductAnalytics(productId, { likes: 1 });

        // Track activity
        await realtimeInfrastructure.trackUserActivity(
          userId,
          'product_liked',
          { productId, productName: product.name }
        );
      }
    } catch (error) {
      console.error('❌ Error liking product:', error);
      throw error;
    }
  }

  /**
   * Add product to cart
   */
  async addToCart(productId: string, userId: string, quantity: number = 1): Promise<void> {
    try {
      // Get product details
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      // Add to user's cart in Realtime Database
      await set(ref(realtimeDb, `carts/${userId}/${productId}`), {
        productId,
        quantity,
        price: product.discountPrice || product.price,
        addedAt: serverTimestamp()
      });

      // Update analytics
      await this.updateProductAnalytics(productId, { addToCartCount: 1 });

      // Track activity
      await realtimeInfrastructure.trackUserActivity(
        userId,
        'add_to_cart',
        { productId, productName: product.name, quantity }
      );

      // Send notification
      await realtimeInfrastructure.sendNotification({
        userId,
        type: 'system',
        title: 'تمت الإضافة للسلة',
        body: `تم إضافة "${product.name}" إلى سلة التسوق`,
        priority: 'low',
        data: { productId }
      });

      console.log('✅ Product added to cart:', productId);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    }
  }

  // ============= PRODUCT ANALYTICS =============

  /**
   * Initialize product analytics
   */
  private async initializeProductAnalytics(productId: string): Promise<void> {
    const analytics: ProductAnalytics = {
      productId,
      views: 0,
      likes: 0,
      addToCartCount: 0,
      purchaseCount: 0,
      revenue: 0,
      conversionRate: 0,
      averageRating: 0,
      topKeywords: [],
      viewsByDay: [],
      salesByDay: []
    };

    await set(ref(realtimeDb, `productAnalytics/${productId}`), analytics);
  }

  /**
   * Update product analytics
   */
  private async updateProductAnalytics(productId: string, updates: Partial<ProductAnalytics>): Promise<void> {
    const analyticsRef = ref(realtimeDb, `productAnalytics/${productId}`);
    await update(analyticsRef, updates);
  }

  /**
   * Increment product view
   */
  private async incrementProductView(productId: string): Promise<void> {
    try {
      // Update view count in Realtime Database
      const productRef = ref(realtimeDb, `products/${productId}/views`);
      const snapshot = await new Promise<DataSnapshot>((resolve) => {
        onValue(productRef, resolve, { onlyOnce: true });
      });
      
      const currentViews = snapshot.val() || 0;
      await set(productRef, currentViews + 1);

      // Update last viewed timestamp
      await update(ref(realtimeDb, `products/${productId}`), {
        lastViewedAt: serverTimestamp()
      });

      // Update analytics
      await this.updateProductAnalytics(productId, { views: currentViews + 1 });
    } catch (error) {
      console.error('❌ Error incrementing product view:', error);
    }
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(productId: string): Promise<ProductAnalytics | null> {
    try {
      const analyticsRef = ref(realtimeDb, `productAnalytics/${productId}`);
      const snapshot = await new Promise<DataSnapshot>((resolve) => {
        onValue(analyticsRef, resolve, { onlyOnce: true });
      });
      
      return snapshot.val() as ProductAnalytics;
    } catch (error) {
      console.error('❌ Error getting product analytics:', error);
      return null;
    }
  }

  /**
   * Subscribe to product analytics
   */
  subscribeToProductAnalytics(productId: string, callback: (analytics: ProductAnalytics) => void): Unsubscribe {
    const analyticsRef = ref(realtimeDb, `productAnalytics/${productId}`);
    
    const unsubscribe = onValue(analyticsRef, (snapshot) => {
      const analytics = snapshot.val() as ProductAnalytics;
      if (analytics) {
        callback(analytics);
      }
    });

    this.listeners.set(`analytics-${productId}`, unsubscribe);
    return unsubscribe;
  }

  // ============= IMAGE MANAGEMENT =============

  /**
   * Upload product image
   */
  async uploadProductImage(productId: string, file: File): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `products/${productId}/${timestamp}-${file.name}`;
      const imageRef = storageRef(storage, fileName);
      
      // Upload image
      const snapshot = await uploadBytes(imageRef, file);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Product image uploaded:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('❌ Error uploading product image:', error);
      throw error;
    }
  }

  /**
   * Delete product image
   */
  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = storageRef(storage, imageUrl);
      await deleteObject(imageRef);
      console.log('✅ Product image deleted:', imageUrl);
    } catch (error) {
      console.error('❌ Error deleting product image:', error);
      throw error;
    }
  }

  // ============= SEARCH & RECOMMENDATIONS =============

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 20): Promise<RealtimeProduct[]> {
    try {
      const products = await this.getProducts({ searchQuery: query }, limit);
      
      // Track search query for analytics
      await realtimeInfrastructure.trackUserActivity(
        'anonymous',
        'product_search',
        { query, resultCount: products.length }
      );

      return products;
    } catch (error) {
      console.error('❌ Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get recommended products
   */
  async getRecommendedProducts(productId: string, limit: number = 6): Promise<RealtimeProduct[]> {
    try {
      // Get the current product
      const currentProduct = await this.getProduct(productId);
      if (!currentProduct) {
        return [];
      }

      // Get similar products from the same category
      const products = await this.getProducts({
        category: currentProduct.category,
        isAvailable: true
      }, limit + 1); // Get one extra to exclude current product

      // Filter out the current product and return recommendations
      return products
        .filter(p => p.id !== productId)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting recommended products:', error);
      return [];
    }
  }

  // ============= CLEANUP =============

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    console.log('✅ Real-time product service cleaned up');
  }
}

// Export singleton instance
export const realtimeProductService = RealtimeProductService.getInstance();