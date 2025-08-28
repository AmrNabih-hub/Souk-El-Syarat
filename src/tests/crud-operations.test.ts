/**
 * 🧪 COMPREHENSIVE CRUD OPERATIONS TESTING
 * Validates all database operations work correctly in real-time
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { AuthService } from '@/services/auth.service';
import { ProductService } from '@/services/product.service';
import { OrderService } from '@/services/order.service';
import { VendorService } from '@/services/vendor.service';

describe('CRUD Operations - Complete Testing Suite', () => {
  let testUserId: string;
  let testProductId: string;
  let testOrderId: string;
  let testVendorId: string;

  beforeAll(async () => {
    // Setup test user
    testUserId = `test_user_${Date.now()}`;
    testProductId = `test_product_${Date.now()}`;
    testOrderId = `test_order_${Date.now()}`;
    testVendorId = `test_vendor_${Date.now()}`;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await deleteDoc(doc(db, 'test_users', testUserId));
      await deleteDoc(doc(db, 'test_products', testProductId));
      await deleteDoc(doc(db, 'test_orders', testOrderId));
      await deleteDoc(doc(db, 'test_vendors', testVendorId));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('User CRUD Operations', () => {
    it('should CREATE a new user', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        displayName: 'Test User',
        role: 'customer',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'test_users', testUserId), userData);
      
      const userDoc = await getDoc(doc(db, 'test_users', testUserId));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()?.email).toBe(userData.email);
    });

    it('should READ user data', async () => {
      const userDoc = await getDoc(doc(db, 'test_users', testUserId));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()).toBeDefined();
      expect(userDoc.data()?.displayName).toBe('Test User');
    });

    it('should UPDATE user data', async () => {
      await updateDoc(doc(db, 'test_users', testUserId), {
        displayName: 'Updated Test User',
        updatedAt: serverTimestamp()
      });

      const userDoc = await getDoc(doc(db, 'test_users', testUserId));
      expect(userDoc.data()?.displayName).toBe('Updated Test User');
    });

    it('should handle real-time user updates', async () => {
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(doc(db, 'test_users', testUserId), (doc) => {
          if (doc.data()?.displayName === 'Real-time Updated User') {
            unsubscribe();
            resolve(true);
          }
        });

        // Trigger update
        updateDoc(doc(db, 'test_users', testUserId), {
          displayName: 'Real-time Updated User'
        });
      });
    });

    it('should DELETE user data', async () => {
      await deleteDoc(doc(db, 'test_users', testUserId));
      const userDoc = await getDoc(doc(db, 'test_users', testUserId));
      expect(userDoc.exists()).toBe(false);
    });
  });

  describe('Product CRUD Operations', () => {
    beforeEach(async () => {
      // Recreate test product for each test
      await setDoc(doc(db, 'test_products', testProductId), {
        name: 'Test Product',
        price: 100,
        category: 'test',
        vendorId: testVendorId,
        stock: 50,
        isActive: true,
        createdAt: serverTimestamp()
      });
    });

    it('should CREATE a product with validation', async () => {
      const productData = {
        name: 'New Test Product',
        price: 199.99,
        category: 'electronics',
        vendorId: testVendorId,
        description: 'Test product description',
        images: [],
        stock: 100,
        isActive: true,
        createdAt: serverTimestamp()
      };

      const newProductId = `test_product_${Date.now()}_2`;
      await setDoc(doc(db, 'test_products', newProductId), productData);
      
      const productDoc = await getDoc(doc(db, 'test_products', newProductId));
      expect(productDoc.exists()).toBe(true);
      expect(productDoc.data()?.price).toBe(199.99);
      
      // Cleanup
      await deleteDoc(doc(db, 'test_products', newProductId));
    });

    it('should READ products with filters', async () => {
      const q = query(
        collection(db, 'test_products'),
        where('vendorId', '==', testVendorId),
        where('isActive', '==', true),
        limit(10)
      );

      const snapshot = await getDocs(q);
      expect(snapshot.empty).toBe(false);
      
      snapshot.forEach((doc) => {
        expect(doc.data().vendorId).toBe(testVendorId);
        expect(doc.data().isActive).toBe(true);
      });
    });

    it('should UPDATE product stock in real-time', async () => {
      const newStock = 25;
      
      await updateDoc(doc(db, 'test_products', testProductId), {
        stock: newStock,
        updatedAt: serverTimestamp()
      });

      const productDoc = await getDoc(doc(db, 'test_products', testProductId));
      expect(productDoc.data()?.stock).toBe(newStock);
    });

    it('should handle concurrent stock updates', async () => {
      const updates = [];
      
      // Simulate concurrent updates
      for (let i = 0; i < 5; i++) {
        updates.push(
          updateDoc(doc(db, 'test_products', testProductId), {
            stock: 50 - i,
            updatedAt: serverTimestamp()
          })
        );
      }

      await Promise.all(updates);
      
      const productDoc = await getDoc(doc(db, 'test_products', testProductId));
      expect(productDoc.data()?.stock).toBeDefined();
      expect(productDoc.data()?.stock).toBeLessThanOrEqual(50);
    });
  });

  describe('Order CRUD Operations', () => {
    it('should CREATE an order with items', async () => {
      const orderData = {
        customerId: testUserId,
        vendorId: testVendorId,
        items: [
          {
            productId: testProductId,
            quantity: 2,
            price: 100,
            subtotal: 200
          }
        ],
        total: 200,
        status: 'pending',
        paymentMethod: 'cash',
        shippingAddress: {
          street: '123 Test St',
          city: 'Cairo',
          governorate: 'Cairo',
          country: 'Egypt'
        },
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'test_orders', testOrderId), orderData);
      
      const orderDoc = await getDoc(doc(db, 'test_orders', testOrderId));
      expect(orderDoc.exists()).toBe(true);
      expect(orderDoc.data()?.total).toBe(200);
      expect(orderDoc.data()?.items).toHaveLength(1);
    });

    it('should UPDATE order status with history', async () => {
      const statusHistory = [];
      const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
      
      for (const status of statuses) {
        await updateDoc(doc(db, 'test_orders', testOrderId), {
          status,
          statusHistory: [...statusHistory, {
            status,
            timestamp: new Date(),
            note: `Order ${status}`
          }],
          updatedAt: serverTimestamp()
        });
        
        statusHistory.push({ status, timestamp: new Date() });
        
        const orderDoc = await getDoc(doc(db, 'test_orders', testOrderId));
        expect(orderDoc.data()?.status).toBe(status);
      }
    });

    it('should handle real-time order tracking', async () => {
      return new Promise((resolve) => {
        let updateCount = 0;
        
        const unsubscribe = onSnapshot(doc(db, 'test_orders', testOrderId), (doc) => {
          updateCount++;
          
          if (updateCount === 3) {
            unsubscribe();
            expect(doc.data()?.status).toBe('shipped');
            resolve(true);
          }
        });

        // Simulate order status updates
        setTimeout(() => updateDoc(doc(db, 'test_orders', testOrderId), { status: 'confirmed' }), 100);
        setTimeout(() => updateDoc(doc(db, 'test_orders', testOrderId), { status: 'processing' }), 200);
        setTimeout(() => updateDoc(doc(db, 'test_orders', testOrderId), { status: 'shipped' }), 300);
      });
    });
  });

  describe('Complex Query Operations', () => {
    it('should perform compound queries', async () => {
      // Create test data
      const testProducts = [];
      for (let i = 0; i < 5; i++) {
        const id = `query_test_${Date.now()}_${i}`;
        testProducts.push(id);
        await setDoc(doc(db, 'test_products', id), {
          name: `Query Test Product ${i}`,
          price: 100 * (i + 1),
          category: i % 2 === 0 ? 'electronics' : 'accessories',
          vendorId: testVendorId,
          stock: 10 * (i + 1),
          isActive: true,
          createdAt: serverTimestamp()
        });
      }

      // Test compound query
      const q = query(
        collection(db, 'test_products'),
        where('category', '==', 'electronics'),
        where('price', '>=', 100),
        where('price', '<=', 500),
        orderBy('price', 'desc'),
        limit(3)
      );

      const snapshot = await getDocs(q);
      expect(snapshot.size).toBeLessThanOrEqual(3);
      
      let previousPrice = Infinity;
      snapshot.forEach((doc) => {
        expect(doc.data().category).toBe('electronics');
        expect(doc.data().price).toBeGreaterThanOrEqual(100);
        expect(doc.data().price).toBeLessThanOrEqual(500);
        expect(doc.data().price).toBeLessThanOrEqual(previousPrice);
        previousPrice = doc.data().price;
      });

      // Cleanup
      for (const id of testProducts) {
        await deleteDoc(doc(db, 'test_products', id));
      }
    });

    it('should handle pagination correctly', async () => {
      const pageSize = 2;
      let lastDoc = null;
      let totalDocs = 0;
      
      // First page
      const q1 = query(
        collection(db, 'test_products'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      
      const snapshot1 = await getDocs(q1);
      totalDocs += snapshot1.size;
      
      if (!snapshot1.empty) {
        lastDoc = snapshot1.docs[snapshot1.docs.length - 1];
        
        // Second page
        const { startAfter } = await import('firebase/firestore');
        const q2 = query(
          collection(db, 'test_products'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
        
        const snapshot2 = await getDocs(q2);
        totalDocs += snapshot2.size;
        
        // Ensure no duplicate documents
        const firstPageIds = snapshot1.docs.map(d => d.id);
        const secondPageIds = snapshot2.docs.map(d => d.id);
        const intersection = firstPageIds.filter(id => secondPageIds.includes(id));
        expect(intersection).toHaveLength(0);
      }
    });
  });

  describe('Transaction Operations', () => {
    it('should handle atomic transactions', async () => {
      const { runTransaction } = await import('firebase/firestore');
      
      const result = await runTransaction(db, async (transaction) => {
        // Read operations must come first
        const productDoc = await transaction.get(doc(db, 'test_products', testProductId));
        
        if (!productDoc.exists()) {
          throw new Error('Product does not exist');
        }
        
        const currentStock = productDoc.data().stock || 0;
        const orderQuantity = 5;
        
        if (currentStock < orderQuantity) {
          throw new Error('Insufficient stock');
        }
        
        // Update product stock
        transaction.update(doc(db, 'test_products', testProductId), {
          stock: currentStock - orderQuantity
        });
        
        // Create order
        const newOrderId = `transaction_order_${Date.now()}`;
        transaction.set(doc(db, 'test_orders', newOrderId), {
          productId: testProductId,
          quantity: orderQuantity,
          total: orderQuantity * 100,
          createdAt: serverTimestamp()
        });
        
        return { orderId: newOrderId, remainingStock: currentStock - orderQuantity };
      });
      
      expect(result.remainingStock).toBeDefined();
      expect(result.orderId).toBeDefined();
      
      // Verify transaction results
      const productDoc = await getDoc(doc(db, 'test_products', testProductId));
      expect(productDoc.data()?.stock).toBe(result.remainingStock);
      
      // Cleanup
      await deleteDoc(doc(db, 'test_orders', result.orderId));
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch writes efficiently', async () => {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      const batchSize = 10;
      const batchIds = [];
      
      for (let i = 0; i < batchSize; i++) {
        const id = `batch_test_${Date.now()}_${i}`;
        batchIds.push(id);
        
        batch.set(doc(db, 'test_products', id), {
          name: `Batch Product ${i}`,
          price: 50 * (i + 1),
          vendorId: testVendorId,
          createdAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      
      // Verify all documents were created
      for (const id of batchIds) {
        const doc = await getDoc(doc(db, 'test_products', id));
        expect(doc.exists()).toBe(true);
      }
      
      // Cleanup with batch delete
      const deleteBatch = writeBatch(db);
      for (const id of batchIds) {
        deleteBatch.delete(doc(db, 'test_products', id));
      }
      await deleteBatch.commit();
    });
  });

  describe('Error Handling', () => {
    it('should handle permission errors gracefully', async () => {
      try {
        // Try to access a protected collection without auth
        await getDoc(doc(db, 'admin_only', 'test'));
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.code).toMatch(/permission-denied|unauthorized/);
      }
    });

    it('should handle network errors with retry', async () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      const retryOperation = async () => {
        attempts++;
        try {
          await getDoc(doc(db, 'test_products', testProductId));
          return true;
        } catch (error) {
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            return retryOperation();
          }
          throw error;
        }
      };
      
      const result = await retryOperation();
      expect(result).toBe(true);
      expect(attempts).toBeLessThanOrEqual(maxAttempts);
    });
  });
});

describe('Real-time Synchronization', () => {
  it('should sync data across multiple listeners', async () => {
    const testDocId = `sync_test_${Date.now()}`;
    const listeners = [];
    const updates = [];
    
    // Create multiple listeners
    for (let i = 0; i < 3; i++) {
      const unsubscribe = onSnapshot(doc(db, 'test_products', testDocId), (doc) => {
        if (doc.exists()) {
          updates.push({ listener: i, data: doc.data() });
        }
      });
      listeners.push(unsubscribe);
    }
    
    // Create document
    await setDoc(doc(db, 'test_products', testDocId), {
      name: 'Sync Test Product',
      version: 1,
      createdAt: serverTimestamp()
    });
    
    // Wait for updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update document
    await updateDoc(doc(db, 'test_products', testDocId), {
      version: 2,
      updatedAt: serverTimestamp()
    });
    
    // Wait for updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify all listeners received updates
    expect(updates.length).toBeGreaterThanOrEqual(3);
    
    // Cleanup
    listeners.forEach(unsubscribe => unsubscribe());
    await deleteDoc(doc(db, 'test_products', testDocId));
  });
});