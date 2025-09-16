/**
 * 🚀 PROFESSIONAL DATA SERVICE
 * Optimized CRUD operations following Firebase best practices
 * Implements efficient data modeling and error handling
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  writeBatch, 
  runTransaction,
  onSnapshot,
  Unsubscribe,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  WriteResult,
  Transaction
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// Types for better type safety
export interface BaseDocument {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User extends BaseDocument {
  email: string;
  displayName: string;
  role: 'customer' | 'vendor' | 'admin';
  profileImage?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    governorate: string;
    postalCode: string;
  };
  isActive: boolean;
  lastActive?: Date;
}

export interface Product extends BaseDocument {
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  vendorId: string;
  vendorName: string;
  images: string[];
  specifications: Record<string, any>;
  status: 'draft' | 'pending_approval' | 'published' | 'rejected' | 'archived';
  stock: number;
  tags: string[];
  featured: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface Order extends BaseDocument {
  customerId: string;
  customerName: string;
  customerEmail: string;
  vendorId: string;
  vendorName: string;
  items: {
    productId: string;
    productTitle: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'cod' | 'card' | 'bank_transfer';
  shippingAddress: {
    street: string;
    city: string;
    governorate: string;
    postalCode: string;
    phone: string;
  };
  trackingNumber?: string;
  notes?: string;
}

export interface Review extends BaseDocument {
  customerId: string;
  customerName: string;
  productId: string;
  productTitle: string;
  rating: number;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
}

/**
 * Generic CRUD Service Class
 * Implements professional data operations with error handling
 */
export class DataService<T extends BaseDocument> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Create a new document with validation
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<T> {
    try {
      const now = new Date();
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      } as T;

      const docRef = id ? doc(db, this.collectionName, id) : doc(collection(db, this.collectionName));
      
      await setDoc(docRef, docData);
      
      return {
        ...docData,
        id: docRef.id,
      };
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw new Error(`Failed to create ${this.collectionName} document: ${error}`);
    }
  }

  /**
   * Read a single document by ID
   */
  async read(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as T;
      }
      
      return null;
    } catch (error) {
      console.error(`Error reading document from ${this.collectionName}:`, error);
      throw new Error(`Failed to read ${this.collectionName} document: ${error}`);
    }
  }

  /**
   * Read multiple documents with query constraints
   */
  async readMany(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Error reading documents from ${this.collectionName}:`, error);
      throw new Error(`Failed to read ${this.collectionName} documents: ${error}`);
    }
  }

  /**
   * Update a document with validation
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updateData);
      
      // Return updated document
      const updatedDoc = await this.read(id);
      if (!updatedDoc) {
        throw new Error('Document not found after update');
      }
      
      return updatedDoc;
    } catch (error) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      throw new Error(`Failed to update ${this.collectionName} document: ${error}`);
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      throw new Error(`Failed to delete ${this.collectionName} document: ${error}`);
    }
  }

  /**
   * Batch operations for multiple documents
   */
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const operation of operations) {
        switch (operation.type) {
          case 'create':
            if (!operation.id || !operation.data) {
              throw new Error('Create operation requires id and data');
            }
            const docRef = doc(db, this.collectionName, operation.id);
            batch.set(docRef, {
              ...operation.data,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            break;
            
          case 'update':
            if (!operation.id || !operation.data) {
              throw new Error('Update operation requires id and data');
            }
            const updateRef = doc(db, this.collectionName, operation.id);
            batch.update(updateRef, {
              ...operation.data,
              updatedAt: new Date(),
            });
            break;
            
          case 'delete':
            if (!operation.id) {
              throw new Error('Delete operation requires id');
            }
            const deleteRef = doc(db, this.collectionName, operation.id);
            batch.delete(deleteRef);
            break;
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error(`Error in batch write for ${this.collectionName}:`, error);
      throw new Error(`Failed batch write for ${this.collectionName}: ${error}`);
    }
  }

  /**
   * Transaction-based operations
   */
  async transactionWrite(transactionFn: (transaction: Transaction) => Promise<void>): Promise<void> {
    try {
      await runTransaction(db, transactionFn);
    } catch (error) {
      console.error(`Error in transaction for ${this.collectionName}:`, error);
      throw new Error(`Failed transaction for ${this.collectionName}: ${error}`);
    }
  }

  /**
   * Real-time listener for document changes
   */
  subscribe(
    constraints: QueryConstraint[] = [],
    callback: (docs: T[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, this.collectionName), ...constraints);
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        callback(docs);
      },
      (error) => {
        console.error(`Error in subscription for ${this.collectionName}:`, error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Paginated queries
   */
  async paginatedRead(
    constraints: QueryConstraint[] = [],
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{
    docs: T[];
    lastDoc: QueryDocumentSnapshot | null;
    hasMore: boolean;
  }> {
    try {
      let q = query(collection(db, this.collectionName), ...constraints);
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      q = query(q, limit(pageSize + 1));
      
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.slice(0, pageSize);
      const hasMore = querySnapshot.docs.length > pageSize;
      const newLastDoc = hasMore ? docs[docs.length - 1] : null;
      
      return {
        docs: docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[],
        lastDoc: newLastDoc,
        hasMore,
      };
    } catch (error) {
      console.error(`Error in paginated read for ${this.collectionName}:`, error);
      throw new Error(`Failed paginated read for ${this.collectionName}: ${error}`);
    }
  }
}

// Specialized service classes for different collections
export class UserService extends DataService<User> {
  constructor() {
    super('users');
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.readMany([where('email', '==', email)]);
    return users[0] || null;
  }

  async getByRole(role: User['role']): Promise<User[]> {
    return this.readMany([where('role', '==', role)]);
  }

  async getActiveUsers(): Promise<User[]> {
    return this.readMany([
      where('isActive', '==', true),
      orderBy('lastActive', 'desc')
    ]);
  }
}

export class ProductService extends DataService<Product> {
  constructor() {
    super('products');
  }

  async getPublished(): Promise<Product[]> {
    return this.readMany([
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getByCategory(category: string): Promise<Product[]> {
    return this.readMany([
      where('category', '==', category),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getByVendor(vendorId: string): Promise<Product[]> {
    return this.readMany([
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getFeatured(): Promise<Product[]> {
    return this.readMany([
      where('featured', '==', true),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    ]);
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or Elasticsearch
    return this.readMany([
      where('status', '==', 'published'),
      orderBy('title')
    ]);
  }
}

export class OrderService extends DataService<Order> {
  constructor() {
    super('orders');
  }

  async getByCustomer(customerId: string): Promise<Order[]> {
    return this.readMany([
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getByVendor(vendorId: string): Promise<Order[]> {
    return this.readMany([
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getByStatus(status: Order['status']): Promise<Order[]> {
    return this.readMany([
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    ]);
  }

  async updateStatus(orderId: string, status: Order['status'], trackingNumber?: string): Promise<Order> {
    const updateData: any = { status };
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    return this.update(orderId, updateData);
  }
}

export class ReviewService extends DataService<Review> {
  constructor() {
    super('reviews');
  }

  async getByProduct(productId: string): Promise<Review[]> {
    return this.readMany([
      where('productId', '==', productId),
      where('verified', '==', true),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getByCustomer(customerId: string): Promise<Review[]> {
    return this.readMany([
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getAverageRating(productId: string): Promise<number> {
    const reviews = await this.getByProduct(productId);
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }
}

// Export service instances
export const userService = new UserService();
export const productService = new ProductService();
export const orderService = new OrderService();
export const reviewService = new ReviewService();

// Export all services
export const services = {
  user: userService,
  product: productService,
  order: orderService,
  review: reviewService,
};

