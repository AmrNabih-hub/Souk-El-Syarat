/**
 * 🔄 REAL-TIME CRUD OPERATIONS HOOK
 * Ensures ALL database operations are real-time synchronized
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { errorHandler } from '@/services/error-handler.service';

interface CRUDOptions {
  collection: string;
  orderBy?: string;
  limit?: number;
  where?: { field: string; operator: any; value: any }[];
  realtime?: boolean;
}

interface CRUDResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  create: (data: Partial<T>) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => void;
}

export function useRealtimeCRUD<T extends DocumentData>(
  options: CRUDOptions
): CRUDResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useRealtimeStore();

  // Setup real-time listener
  useEffect(() => {
    if (!options.realtime && options.realtime !== false) {
      options.realtime = true; // Default to real-time
    }

    if (!options.realtime) {
      return;
    }

    const constraints: QueryConstraint[] = [];

    // Add where clauses
    if (options.where) {
      options.where.forEach(w => {
        constraints.push(where(w.field, w.operator, w.value));
      });
    }

    // Add ordering
    if (options.orderBy) {
      constraints.push(orderBy(options.orderBy, 'desc'));
    }

    // Add limit
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    // Create query
    const q = query(collection(db, options.collection), ...constraints);

    // Setup real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data()
          } as T);
        });

        setData(items);
        setLoading(false);
        setError(null);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Real-time update: ${options.collection}`, items.length, 'items');
        }
      },
      (err) => {
        console.error('Real-time listener error:', err);
        setError(err.message);
        setLoading(false);
        
        errorHandler.logError({
          type: 'error',
          message: `Real-time CRUD error: ${err.message}`,
          context: { collection: options.collection, error: err }
        });
      }
    );

    return () => unsubscribe();
  }, [options.collection, options.realtime, JSON.stringify(options.where), options.orderBy, options.limit]);

  // CREATE operation with real-time sync
  const create = useCallback(async (data: Partial<T>): Promise<string> => {
    if (!isConnected) {
      throw new Error('No connection available');
    }

    try {
      const docId = `${options.collection}_${Date.now()}`;
      const docRef = doc(db, options.collection, docId);
      
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Real-time listener will automatically update the data
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Created: ${options.collection}/${docId}`);
      }

      return docId;
    } catch (err: any) {
      console.error('Create error:', err);
      setError(err.message);
      
      await errorHandler.logError({
        type: 'error',
        message: `Failed to create in ${options.collection}`,
        context: { data, error: err.message }
      });
      
      throw err;
    }
  }, [options.collection, isConnected]);

  // UPDATE operation with real-time sync
  const update = useCallback(async (id: string, data: Partial<T>): Promise<void> => {
    if (!isConnected) {
      throw new Error('No connection available');
    }

    try {
      const docRef = doc(db, options.collection, id);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      // Real-time listener will automatically update the data
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Updated: ${options.collection}/${id}`);
      }
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message);
      
      await errorHandler.logError({
        type: 'error',
        message: `Failed to update ${options.collection}/${id}`,
        context: { id, data, error: err.message }
      });
      
      throw err;
    }
  }, [options.collection, isConnected]);

  // DELETE operation with real-time sync
  const remove = useCallback(async (id: string): Promise<void> => {
    if (!isConnected) {
      throw new Error('No connection available');
    }

    try {
      const docRef = doc(db, options.collection, id);
      await deleteDoc(docRef);

      // Real-time listener will automatically update the data
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Deleted: ${options.collection}/${id}`);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message);
      
      await errorHandler.logError({
        type: 'error',
        message: `Failed to delete ${options.collection}/${id}`,
        context: { id, error: err.message }
      });
      
      throw err;
    }
  }, [options.collection, isConnected]);

  // Manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    // The useEffect will handle re-fetching
  }, []);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    refresh
  };
}

/**
 * Specialized hooks for common entities
 */

// Products CRUD with real-time
export function useRealtimeProducts(vendorId?: string) {
  const whereClause = vendorId 
    ? [{ field: 'vendorId', operator: '==', value: vendorId }]
    : [];

  return useRealtimeCRUD<Product>({
    collection: 'products',
    where: whereClause,
    orderBy: 'createdAt',
    realtime: true
  });
}

// Orders CRUD with real-time
export function useRealtimeOrders(userId: string, role: 'customer' | 'vendor') {
  const whereClause = role === 'customer'
    ? [{ field: 'customerId', operator: '==', value: userId }]
    : [{ field: 'vendorId', operator: '==', value: userId }];

  return useRealtimeCRUD<Order>({
    collection: 'orders',
    where: whereClause,
    orderBy: 'createdAt',
    realtime: true
  });
}

// Users CRUD with real-time (admin only)
export function useRealtimeUsers() {
  return useRealtimeCRUD<User>({
    collection: 'users',
    orderBy: 'createdAt',
    limit: 100,
    realtime: true
  });
}

// Notifications with real-time
export function useRealtimeNotifications(userId: string) {
  return useRealtimeCRUD<Notification>({
    collection: 'notifications',
    where: [{ field: 'userId', operator: '==', value: userId }],
    orderBy: 'createdAt',
    limit: 50,
    realtime: true
  });
}

// Messages with real-time
export function useRealtimeMessages(chatId: string) {
  return useRealtimeCRUD<ChatMessage>({
    collection: 'messages',
    where: [{ field: 'chatId', operator: '==', value: chatId }],
    orderBy: 'timestamp',
    realtime: true
  });
}

// Import types
import { Product, Order, User, Notification, ChatMessage } from '@/types';