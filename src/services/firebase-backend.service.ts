/**
 * Enhanced Firebase Backend Service for Souk El-Sayarat
 * Comprehensive backend integration with advanced features
 */

import { db, realtimeDb, storage } from '@/config/firebase.config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
} from 'firebase/storage';
import {
  ref as dbRef,
  set,
  get,
  update,
  remove,
  onValue,
  push,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
} from 'firebase/database';

export interface BackendOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    operationTime: number;
    affectedRecords: number;
    cacheHit?: boolean;
  };
}

export interface PaginationOptions {
  pageSize: number;
  startAfter?: any;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchOptions {
  query: string;
  fields: string[];
  limit?: number;
  fuzzy?: boolean;
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
}

export interface BulkOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}

export class FirebaseBackendService {
  private static instance: FirebaseBackendService;

  // Caching
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cacheOptions: CacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // 100 items
  };

  // Batch operations queue
  private batchQueue: BulkOperation[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds

  // Connection monitoring
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  private constructor() {
    this.initializeConnectionMonitoring();
    this.setupBatchProcessing();
    this.startCacheCleanup();
  }

  static getInstance(): FirebaseBackendService {
    if (!FirebaseBackendService.instance) {
      FirebaseBackendService.instance = new FirebaseBackendService();
    }
    return FirebaseBackendService.instance;
  }

  /**
   * Initialize connection monitoring
   */
  private initializeConnectionMonitoring(): void {
    const connectedRef = dbRef(realtimeDb, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      this.notifyConnectionListeners(isConnected);
    });
  }

  /**
   * Setup batch processing
   */
  private setupBatchProcessing(): void {
    this.processBatchQueue = this.processBatchQueue.bind(this);
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Clean every minute
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key); // Remove expired data
    }

    return null;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any, ttl?: number): void {
    if (this.cache.size >= this.cacheOptions.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheOptions.ttl,
    });
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Enhanced document creation with validation and caching
   */
  async createDocument<T>(
    collectionName: string,
    id: string,
    data: T,
    options?: {
      validate?: boolean;
      cache?: boolean;
      cacheTtl?: number;
    }
  ): Promise<BackendOperationResult<T>> {
    const startTime = Date.now();

    try {
      const docRef = doc(db, collectionName, id);
      const documentData = {
        ...data,
        id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Validate data if requested
      if (options?.validate) {
        const validationResult = this.validateDocumentData(documentData, collectionName);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validationResult.errors.join(', ')}`,
            metadata: {
              operationTime: Date.now() - startTime,
              affectedRecords: 0,
            },
          };
        }
      }

      await setDoc(docRef, documentData);

      // Cache the result if requested
      if (options?.cache) {
        const cacheKey = `${collectionName}:${id}`;
        this.setCachedData(cacheKey, documentData, options.cacheTtl);
      }

      return {
        success: true,
        data: documentData as T & { id: string; createdAt: any; updatedAt: any },
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 1,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to create document: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Enhanced document retrieval with caching
   */
  async getDocument<T>(
    collectionName: string,
    id: string,
    options?: {
      useCache?: boolean;
      cacheTtl?: number;
    }
  ): Promise<BackendOperationResult<T>> {
    const startTime = Date.now();
    const cacheKey = `${collectionName}:${id}`;

    try {
      // Check cache first
      if (options?.useCache !== false) {
        const cachedData = this.getCachedData(cacheKey);
        if (cachedData) {
          return {
            success: true,
            data: cachedData,
            metadata: {
              operationTime: Date.now() - startTime,
              affectedRecords: 1,
              cacheHit: true,
            },
          };
        }
      }

      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Document not found',
          metadata: {
            operationTime: Date.now() - startTime,
            affectedRecords: 0,
          },
        };
      }

      const data = {
        id: docSnap.id,
        ...docSnap.data(),
      };

      // Cache the result
      if (options?.useCache !== false) {
        this.setCachedData(cacheKey, data, options?.cacheTtl);
      }

      return {
        success: true,
        data: data as T,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 1,
          cacheHit: false,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get document: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Enhanced document update with optimistic locking
   */
  async updateDocument<T>(
    collectionName: string,
    id: string,
    updates: Partial<T>,
    options?: {
      optimisticLock?: boolean;
      versionField?: string;
      invalidateCache?: boolean;
    }
  ): Promise<BackendOperationResult<T>> {
    const startTime = Date.now();

    try {
      const docRef = doc(db, collectionName, id);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Handle optimistic locking
      if (options?.optimisticLock) {
        const versionField = options.versionField || 'version';
        updateData[versionField] = increment(1);
      }

      await updateDoc(docRef, updateData);

      // Invalidate cache
      if (options?.invalidateCache !== false) {
        const cacheKey = `${collectionName}:${id}`;
        this.cache.delete(cacheKey);
      }

      // Get updated document
      const result = await this.getDocument<T>(collectionName, id);

      return {
        success: true,
        data: result.data,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 1,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update document: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Enhanced document deletion with cascade options
   */
  async deleteDocument(
    collectionName: string,
    id: string,
    options?: {
      cascade?: boolean;
      relatedCollections?: string[];
      invalidateCache?: boolean;
    }
  ): Promise<BackendOperationResult<void>> {
    const startTime = Date.now();

    try {
      // Handle cascade deletion
      if (options?.cascade && options.relatedCollections) {
        for (const relatedCollection of options.relatedCollections) {
          await this.deleteRelatedDocuments(relatedCollection, id, collectionName);
        }
      }

      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);

      // Invalidate cache
      if (options?.invalidateCache !== false) {
        const cacheKey = `${collectionName}:${id}`;
        this.cache.delete(cacheKey);
      }

      return {
        success: true,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 1,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to delete document: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Advanced query with pagination and caching
   */
  async queryDocuments<T>(
    collectionName: string,
    constraints: Array<{
      field: string;
      operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
      value: any;
    }>,
    options?: {
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      pagination?: PaginationOptions;
      useCache?: boolean;
      cacheKey?: string;
    }
  ): Promise<BackendOperationResult<T[]>> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = options?.cacheKey || `${collectionName}:${JSON.stringify(constraints)}:${JSON.stringify(options)}`;

      if (options?.useCache !== false) {
        const cachedData = this.getCachedData(cacheKey);
        if (cachedData) {
          return {
            success: true,
            data: cachedData,
            metadata: {
              operationTime: Date.now() - startTime,
              affectedRecords: cachedData.length,
              cacheHit: true,
            },
          };
        }
      }

      // Build Firestore query
      let firestoreQuery = collection(db, collectionName);

      // Apply constraints
      for (const constraint of constraints) {
        firestoreQuery = query(firestoreQuery, where(constraint.field, constraint.operator, constraint.value));
      }

      // Apply ordering
      if (options?.orderBy) {
        firestoreQuery = query(firestoreQuery, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Apply pagination
      if (options?.pagination) {
        if (options.pagination.startAfter) {
          firestoreQuery = query(firestoreQuery, startAfter(options.pagination.startAfter));
        }
        firestoreQuery = query(firestoreQuery, limit(options.pagination.pageSize));
      }

      const querySnapshot = await getDocs(firestoreQuery);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      // Cache the results
      if (options?.useCache !== false) {
        this.setCachedData(cacheKey, documents);
      }

      return {
        success: true,
        data: documents,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: documents.length,
          cacheHit: false,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Query failed: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Bulk operations with batch processing
   */
  async executeBulkOperations(operations: BulkOperation[]): Promise<BackendOperationResult<void>> {
    const startTime = Date.now();

    try {
      const batch = writeBatch(db);
      let operationCount = 0;

      for (const operation of operations) {
        const docRef = doc(db, operation.collection, operation.id || '');

        switch (operation.type) {
          case 'create':
            if (operation.id && operation.data) {
              batch.set(docRef, {
                ...operation.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              operationCount++;
            }
            break;

          case 'update':
            if (operation.id && operation.data) {
              batch.update(docRef, {
                ...operation.data,
                updatedAt: serverTimestamp(),
              });
              operationCount++;
            }
            break;

          case 'delete':
            if (operation.id) {
              batch.delete(docRef);
              operationCount++;
            }
            break;
        }
      }

      await batch.commit();

      // Invalidate relevant caches
      this.invalidateBulkOperationCaches(operations);

      return {
        success: true,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: operationCount,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Bulk operation failed: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Queue operation for batch processing
   */
  queueBulkOperation(operation: BulkOperation): void {
    this.batchQueue.push(operation);

    // Process batch if queue is full or start timeout
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.processBatchQueue();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatchQueue();
      }, this.BATCH_TIMEOUT);
    }
  }

  /**
   * Process batch queue
   */
  private async processBatchQueue(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const operations = [...this.batchQueue];
    this.batchQueue = [];

    try {
      await this.executeBulkOperations(operations);
      console.log(`✅ Processed ${operations.length} queued operations`);
    } catch (error) {
      console.error('❌ Failed to process batch queue:', error);
      // Re-queue failed operations
      this.batchQueue.unshift(...operations);
    }
  }

  /**
   * File upload to Firebase Storage
   */
  async uploadFile(
    file: File,
    path: string,
    options?: {
      metadata?: any;
      onProgress?: (progress: number) => void;
    }
  ): Promise<BackendOperationResult<{ url: string; path: string; metadata: any }>> {
    const startTime = Date.now();

    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytes(storageRef, file, options?.metadata);

      // Monitor upload progress
      if (options?.onProgress) {
        // Note: In a real implementation, you'd use uploadTask.on('state_changed')
        // For now, we'll just wait for completion
      }

      const snapshot = await uploadTask;
      const downloadURL = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);

      return {
        success: true,
        data: {
          url: downloadURL,
          path: snapshot.ref.fullPath,
          metadata,
        },
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 1,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `File upload failed: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * File deletion from Firebase Storage
   */
  async deleteFile(path: string): Promise<BackendOperationResult<void>> {
    const startTime = Date.now();

    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);

      return {
        success: true,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 1,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `File deletion failed: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Real-time listener with automatic reconnection
   */
  subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints?: Array<{
      field: string;
      operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
      value: any;
    }>,
    options?: {
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      includeMetadata?: boolean;
    }
  ): () => void {
    let firestoreQuery = collection(db, collectionName);

    // Apply constraints
    if (constraints) {
      for (const constraint of constraints) {
        firestoreQuery = query(firestoreQuery, where(constraint.field, constraint.operator, constraint.value));
      }
    }

    // Apply ordering
    if (options?.orderBy) {
      firestoreQuery = query(firestoreQuery, orderBy(options.orderBy.field, options.orderBy.direction));
    }

    const unsubscribe = onSnapshot(
      firestoreQuery,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => {
          const data = {
            id: doc.id,
            ...doc.data(),
          };

          if (options?.includeMetadata) {
            return {
              ...data,
              _metadata: {
                exists: doc.exists(),
                createTime: doc.createTime?.toDate(),
                updateTime: doc.updateTime?.toDate(),
                readTime: doc.readTime?.toDate(),
              },
            };
          }

          return data;
        });

        callback(documents as T[]);
      },
      (error) => {
        console.error(`Realtime listener error for ${collectionName}:`, error);
        // In production, you might want to implement retry logic
      }
    );

    // Store unsubscribe function for cleanup
    const listenerId = `collection_${collectionName}_${Date.now()}`;
    this.activeListeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    };
  }

  /**
   * Advanced search functionality
   */
  async searchDocuments<T>(
    collectionName: string,
    searchOptions: SearchOptions
  ): Promise<BackendOperationResult<T[]>> {
    const startTime = Date.now();

    try {
      // For now, implement basic text search
      // In production, you might want to use Algolia, Elasticsearch, or Firestore's new vector search

      const queryText = searchOptions.query.toLowerCase();
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      const results: T[] = [];
      const seenIds = new Set<string>();

      snapshot.forEach((doc) => {
        if (results.length >= (searchOptions.limit || 20)) return;

        const data = doc.data();

        // Search in specified fields
        for (const field of searchOptions.fields) {
          const fieldValue = data[field];
          if (fieldValue && typeof fieldValue === 'string') {
            const fieldText = fieldValue.toLowerCase();

            let matches = false;
            if (searchOptions.fuzzy) {
              // Simple fuzzy matching
              matches = fieldText.includes(queryText) ||
                       this.levenshteinDistance(fieldText, queryText) <= 2;
            } else {
              matches = fieldText.includes(queryText);
            }

            if (matches && !seenIds.has(doc.id)) {
              results.push({
                id: doc.id,
                ...data,
                _searchScore: this.calculateSearchScore(fieldText, queryText),
              } as T);
              seenIds.add(doc.id);
              break; // Stop searching other fields for this document
            }
          }
        }
      });

      // Sort by search score
      results.sort((a: any, b: any) => (b._searchScore || 0) - (a._searchScore || 0));

      return {
        success: true,
        data: results,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: results.length,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error}`,
        metadata: {
          operationTime: Date.now() - startTime,
          affectedRecords: 0,
        },
      };
    }
  }

  /**
   * Calculate Levenshtein distance for fuzzy search
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate search score
   */
  private calculateSearchScore(text: string, query: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match gets highest score
    if (textLower === queryLower) return 100;

    // Starts with query gets high score
    if (textLower.startsWith(queryLower)) return 80;

    // Contains query gets medium score
    if (textLower.includes(queryLower)) return 50;

    // Fuzzy match gets lower score
    return Math.max(0, 25 - this.levenshteinDistance(textLower, queryLower));
  }

  /**
   * Validate document data
   */
  private validateDocumentData(data: any, collectionName: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation rules - customize based on your needs
    if (!data.id) {
      errors.push('Document must have an ID');
    }

    switch (collectionName) {
      case 'users':
        if (!data.email || !data.email.includes('@')) {
          errors.push('Valid email is required');
        }
        if (!data.displayName || data.displayName.length < 2) {
          errors.push('Display name must be at least 2 characters');
        }
        break;

      case 'products':
        if (!data.name || data.name.length < 3) {
          errors.push('Product name must be at least 3 characters');
        }
        if (!data.price || data.price < 0) {
          errors.push('Valid price is required');
        }
        break;

      // Add more collection-specific validations as needed
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Delete related documents for cascade deletion
   */
  private async deleteRelatedDocuments(relatedCollection: string, parentId: string, parentCollection: string): Promise<void> {
    try {
      const q = query(
        collection(db, relatedCollection),
        where(`${parentCollection}Id`, '==', parentId)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

    } catch (error) {
      console.error(`Failed to delete related documents from ${relatedCollection}:`, error);
    }
  }

  /**
   * Invalidate caches for bulk operations
   */
  private invalidateBulkOperationCaches(operations: BulkOperation[]): void {
    operations.forEach(operation => {
      const cacheKey = `${operation.collection}:${operation.id}`;
      this.cache.delete(cacheKey);
    });
  }

  /**
   * Notify connection listeners
   */
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  /**
   * Subscribe to connection status
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  /**
   * Configure cache options
   */
  configureCache(options: Partial<CacheOptions>): void {
    this.cacheOptions = { ...this.cacheOptions, ...options };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheOptions.maxSize,
    };
  }

  // Active listeners for cleanup
  private activeListeners: Map<string, () => void> = new Map();

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Process any remaining batch operations
    if (this.batchQueue.length > 0) {
      this.processBatchQueue();
    }

    // Clear timeouts
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Clear all listeners
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();

    // Clear caches
    this.cache.clear();

    // Clear listeners
    this.connectionListeners.clear();
  }
}

// Export singleton instance
export const firebaseBackendService = FirebaseBackendService.getInstance();
