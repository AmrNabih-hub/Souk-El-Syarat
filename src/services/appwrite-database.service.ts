/**
 * 🗄️ Appwrite Database Service
 * Professional database service for Souk El-Sayarat
 * Replaces Firebase Firestore with Appwrite Database
 */

import { ID, Models, Query } from 'appwrite';
import { databases, appwriteConfig } from '@/config/appwrite.config';

export class AppwriteDatabaseService {
  /**
   * Create a new document
   */
  static async createDocument<T = any>(
    collectionId: string,
    data: any,
    documentId?: string
  ): Promise<T> {
    try {
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId || ID.unique(),
        {
          ...data,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      return doc as unknown as T;
    } catch (error: any) {
      console.error('❌ Create document error:', error);
      throw new Error(error.message || 'Failed to create document');
    }
  }

  /**
   * Get a document by ID
   */
  static async getDocument<T = any>(
    collectionId: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const doc = await databases.getDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId
      );

      return doc as unknown as T;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error('❌ Get document error:', error);
      throw new Error(error.message || 'Failed to get document');
    }
  }

  /**
   * Update a document
   */
  static async updateDocument<T = any>(
    collectionId: string,
    documentId: string,
    data: Partial<any>
  ): Promise<T> {
    try {
      const doc = await databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId,
        {
          ...data,
          updatedAt: new Date().toISOString(),
        }
      );

      return doc as unknown as T;
    } catch (error: any) {
      console.error('❌ Update document error:', error);
      throw new Error(error.message || 'Failed to update document');
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    collectionId: string,
    documentId: string
  ): Promise<void> {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId
      );
    } catch (error: any) {
      console.error('❌ Delete document error:', error);
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  /**
   * List documents with queries
   */
  static async listDocuments<T = any>(
    collectionId: string,
    queries?: string[],
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  ): Promise<{ documents: T[]; total: number }> {
    try {
      const allQueries = queries || [];

      // Add ordering if specified
      if (orderBy) {
        if (orderDirection === 'desc') {
          allQueries.push(Query.orderDesc(orderBy));
        } else {
          allQueries.push(Query.orderAsc(orderBy));
        }
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        allQueries
      );

      return {
        documents: response.documents as unknown as T[],
        total: response.total,
      };
    } catch (error: any) {
      console.error('❌ List documents error:', error);
      return { documents: [], total: 0 };
    }
  }

  /**
   * Query documents with filters
   */
  static async queryDocuments<T = any>(
    collectionId: string,
    filters: {
      equal?: { [key: string]: any };
      notEqual?: { [key: string]: any };
      lessThan?: { [key: string]: number };
      greaterThan?: { [key: string]: number };
      search?: { key: string; value: string };
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<{ documents: T[]; total: number }> {
    try {
      const queries: string[] = [];

      // Equal filters
      if (filters.equal) {
        Object.entries(filters.equal).forEach(([key, value]) => {
          queries.push(Query.equal(key, value));
        });
      }

      // Not equal filters
      if (filters.notEqual) {
        Object.entries(filters.notEqual).forEach(([key, value]) => {
          queries.push(Query.notEqual(key, value));
        });
      }

      // Less than filters
      if (filters.lessThan) {
        Object.entries(filters.lessThan).forEach(([key, value]) => {
          queries.push(Query.lessThan(key, value));
        });
      }

      // Greater than filters
      if (filters.greaterThan) {
        Object.entries(filters.greaterThan).forEach(([key, value]) => {
          queries.push(Query.greaterThan(key, value));
        });
      }

      // Search
      if (filters.search) {
        queries.push(Query.search(filters.search.key, filters.search.value));
      }

      // Pagination
      if (filters.limit) {
        queries.push(Query.limit(filters.limit));
      }

      if (filters.offset) {
        queries.push(Query.offset(filters.offset));
      }

      // Ordering
      if (filters.orderBy) {
        if (filters.orderDirection === 'desc') {
          queries.push(Query.orderDesc(filters.orderBy));
        } else {
          queries.push(Query.orderAsc(filters.orderBy));
        }
      }

      return await this.listDocuments<T>(collectionId, queries);
    } catch (error: any) {
      console.error('❌ Query documents error:', error);
      return { documents: [], total: 0 };
    }
  }

  /**
   * Batch update documents
   */
  static async batchUpdate(
    collectionId: string,
    updates: Array<{ id: string; data: Partial<any> }>
  ): Promise<void> {
    try {
      // Appwrite doesn't have native batch operations
      // Execute updates sequentially
      const promises = updates.map(update =>
        this.updateDocument(collectionId, update.id, update.data)
      );

      await Promise.all(promises);
    } catch (error: any) {
      console.error('❌ Batch update error:', error);
      throw new Error(error.message || 'Failed to batch update documents');
    }
  }

  /**
   * Batch delete documents
   */
  static async batchDelete(
    collectionId: string,
    documentIds: string[]
  ): Promise<void> {
    try {
      const promises = documentIds.map(id =>
        this.deleteDocument(collectionId, id)
      );

      await Promise.all(promises);
    } catch (error: any) {
      console.error('❌ Batch delete error:', error);
      throw new Error(error.message || 'Failed to batch delete documents');
    }
  }

  /**
   * Count documents with filter
   */
  static async countDocuments(
    collectionId: string,
    filters?: { equal?: { [key: string]: any } }
  ): Promise<number> {
    try {
      const queries: string[] = [];

      if (filters?.equal) {
        Object.entries(filters.equal).forEach(([key, value]) => {
          queries.push(Query.equal(key, value));
        });
      }

      // Just get the total without fetching documents
      queries.push(Query.limit(1));

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );

      return response.total;
    } catch (error: any) {
      console.error('❌ Count documents error:', error);
      return 0;
    }
  }

  /**
   * Subscribe to document changes (real-time)
   */
  static subscribeToDocument(
    collectionId: string,
    documentId: string,
    callback: (document: Models.Document) => void
  ): () => void {
    try {
      // Appwrite real-time requires the Realtime API
      // For now, we'll use polling
      let intervalId: NodeJS.Timeout;

      const poll = async () => {
        try {
          const doc = await this.getDocument(collectionId, documentId);
          if (doc) {
            callback(doc as Models.Document);
          }
        } catch (error) {
          console.error('❌ Real-time poll error:', error);
        }
      };

      // Initial fetch
      poll();

      // Poll every 3 seconds
      intervalId = setInterval(poll, 3000);

      // Return unsubscribe function
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    } catch (error: any) {
      console.error('❌ Subscribe to document error:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to collection changes (real-time)
   */
  static subscribeToCollection(
    collectionId: string,
    callback: (documents: Models.Document[]) => void,
    queries?: string[]
  ): () => void {
    try {
      let intervalId: NodeJS.Timeout;

      const poll = async () => {
        try {
          const result = await this.listDocuments(collectionId, queries);
          callback(result.documents as Models.Document[]);
        } catch (error) {
          console.error('❌ Real-time poll error:', error);
        }
      };

      // Initial fetch
      poll();

      // Poll every 5 seconds
      intervalId = setInterval(poll, 5000);

      // Return unsubscribe function
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    } catch (error: any) {
      console.error('❌ Subscribe to collection error:', error);
      return () => {};
    }
  }
}

// Export convenience functions for compatibility with old Firebase code
export const db = {
  collection: (collectionId: string) => ({
    doc: (documentId: string) => ({
      get: () => AppwriteDatabaseService.getDocument(collectionId, documentId),
      set: (data: any) => AppwriteDatabaseService.updateDocument(collectionId, documentId, data),
      update: (data: any) => AppwriteDatabaseService.updateDocument(collectionId, documentId, data),
      delete: () => AppwriteDatabaseService.deleteDocument(collectionId, documentId),
    }),
    add: (data: any) => AppwriteDatabaseService.createDocument(collectionId, data),
    get: (queries?: string[]) => AppwriteDatabaseService.listDocuments(collectionId, queries),
  }),
};

export default AppwriteDatabaseService;
