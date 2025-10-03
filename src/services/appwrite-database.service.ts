/**
 * 💾 APPWRITE DATABASE SERVICE
 * Complete CRUD operations for all collections
 * Real-time ready with proper error handling
 */

import { databases, appwriteConfig } from '@/config/appwrite.config';
import { ID, Query } from 'appwrite';

/**
 * Base Database Service Class
 * Provides generic CRUD operations for any collection
 */
export class AppwriteDatabaseService {
  /**
   * 📄 CREATE DOCUMENT
   */
  static async createDocument<T>(
    collectionId: string,
    data: any,
    documentId: string = ID.unique()
  ): Promise<T> {
    try {
      console.log(`📄 Creating document in ${collectionId}...`);
      
      const document = await databases.createDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId,
        data
      );
      
      console.log(`✅ Document created:`, document.$id);
      return document as T;
    } catch (error: any) {
      console.error(`❌ Failed to create document in ${collectionId}:`, error);
      throw new Error(error.message || 'Failed to create document');
    }
  }

  /**
   * 📖 GET DOCUMENT BY ID
   */
  static async getDocument<T>(
    collectionId: string,
    documentId: string
  ): Promise<T> {
    try {
      console.log(`📖 Getting document ${documentId} from ${collectionId}...`);
      
      const document = await databases.getDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId
      );
      
      console.log(`✅ Document retrieved:`, document.$id);
      return document as T;
    } catch (error: any) {
      console.error(`❌ Failed to get document:`, error);
      throw new Error(error.message || 'Document not found');
    }
  }

  /**
   * 📋 LIST DOCUMENTS WITH QUERIES
   */
  static async listDocuments<T>(
    collectionId: string,
    queries: string[] = [],
    limit: number = 25
  ): Promise<{ documents: T[]; total: number }> {
    try {
      console.log(`📋 Listing documents from ${collectionId}...`);
      
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [...queries, Query.limit(limit)]
      );
      
      console.log(`✅ Retrieved ${response.documents.length} documents`);
      return {
        documents: response.documents as T[],
        total: response.total
      };
    } catch (error: any) {
      console.error(`❌ Failed to list documents:`, error);
      throw new Error(error.message || 'Failed to list documents');
    }
  }

  /**
   * 🔄 UPDATE DOCUMENT
   */
  static async updateDocument<T>(
    collectionId: string,
    documentId: string,
    data: any
  ): Promise<T> {
    try {
      console.log(`🔄 Updating document ${documentId} in ${collectionId}...`);
      
      const document = await databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId,
        data
      );
      
      console.log(`✅ Document updated:`, document.$id);
      return document as T;
    } catch (error: any) {
      console.error(`❌ Failed to update document:`, error);
      throw new Error(error.message || 'Failed to update document');
    }
  }

  /**
   * 🗑️ DELETE DOCUMENT
   */
  static async deleteDocument(
    collectionId: string,
    documentId: string
  ): Promise<void> {
    try {
      console.log(`🗑️ Deleting document ${documentId} from ${collectionId}...`);
      
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId
      );
      
      console.log(`✅ Document deleted`);
    } catch (error: any) {
      console.error(`❌ Failed to delete document:`, error);
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  /**
   * 🔍 SEARCH DOCUMENTS
   */
  static async searchDocuments<T>(
    collectionId: string,
    searchAttribute: string,
    searchValue: string
  ): Promise<T[]> {
    try {
      console.log(`🔍 Searching ${collectionId} for ${searchAttribute}=${searchValue}...`);
      
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [Query.search(searchAttribute, searchValue)]
      );
      
      console.log(`✅ Found ${response.documents.length} results`);
      return response.documents as T[];
    } catch (error: any) {
      console.error(`❌ Search failed:`, error);
      throw new Error(error.message || 'Search failed');
    }
  }

  /**
   * 📊 COUNT DOCUMENTS
   */
  static async countDocuments(
    collectionId: string,
    queries: string[] = []
  ): Promise<number> {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [...queries, Query.limit(1)]
      );
      
      return response.total;
    } catch (error: any) {
      console.error(`❌ Count failed:`, error);
      return 0;
    }
  }
}

/**
 * 🎯 SPECIFIC SERVICE METHODS FOR EACH COLLECTION
 */

/**
 * 👤 USER PROFILE SERVICE
 */
export class UserProfileService extends AppwriteDatabaseService {
  static collectionId = appwriteConfig.collections.users;

  static async createUserProfile(userId: string, data: any) {
    return this.createDocument(this.collectionId, {
      userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async getUserProfile(userId: string) {
    const results = await this.listDocuments(
      this.collectionId,
      [Query.equal('userId', userId)]
    );
    return results.documents[0] || null;
  }

  static async updateUserProfile(userId: string, data: any) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');
    
    return this.updateDocument(this.collectionId, (profile as any).$id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  static async getUsersByRole(role: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('role', role)]
    );
  }
}

/**
 * 🚗 PRODUCT SERVICE
 */
export class ProductService extends AppwriteDatabaseService {
  static collectionId = appwriteConfig.collections.products;

  static async createProduct(vendorId: string, productData: any) {
    return this.createDocument(this.collectionId, {
      ...productData,
      vendorId,
      status: 'active',
      featured: false,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async getProduct(productId: string) {
    return this.getDocument(this.collectionId, productId);
  }

  static async listProducts(filters: {
    vendorId?: string;
    category?: string;
    status?: string;
    limit?: number;
  } = {}) {
    const queries: string[] = [];
    
    if (filters.vendorId) {
      queries.push(Query.equal('vendorId', filters.vendorId));
    }
    if (filters.category) {
      queries.push(Query.equal('category', filters.category));
    }
    if (filters.status) {
      queries.push(Query.equal('status', filters.status));
    }
    
    queries.push(Query.orderDesc('$createdAt'));
    
    return this.listDocuments(
      this.collectionId,
      queries,
      filters.limit || 25
    );
  }

  static async searchProducts(searchTerm: string) {
    return this.searchDocuments(this.collectionId, 'title', searchTerm);
  }

  static async updateProduct(productId: string, data: any) {
    return this.updateDocument(this.collectionId, productId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteProduct(productId: string) {
    return this.deleteDocument(this.collectionId, productId);
  }

  static async incrementViews(productId: string, currentViews: number) {
    return this.updateDocument(this.collectionId, productId, {
      views: currentViews + 1,
    });
  }

  static async getFeaturedProducts() {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('featured', true), Query.equal('status', 'active')]
    );
  }
}

/**
 * 🛒 ORDER SERVICE
 */
export class OrderService extends AppwriteDatabaseService {
  static collectionId = appwriteConfig.collections.orders;

  static async createOrder(orderData: any) {
    return this.createDocument(this.collectionId, {
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async getOrder(orderId: string) {
    return this.getDocument(this.collectionId, orderId);
  }

  static async listOrdersByCustomer(customerId: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('customerId', customerId), Query.orderDesc('$createdAt')]
    );
  }

  static async listOrdersByVendor(vendorId: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('vendorId', vendorId), Query.orderDesc('$createdAt')]
    );
  }

  static async updateOrderStatus(orderId: string, status: string) {
    return this.updateDocument(this.collectionId, orderId, {
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  static async updatePaymentStatus(orderId: string, paymentStatus: string) {
    return this.updateDocument(this.collectionId, orderId, {
      paymentStatus,
      updatedAt: new Date().toISOString(),
    });
  }

  static async getOrdersByStatus(status: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('status', status)]
    );
  }
}

/**
 * 📝 VENDOR APPLICATION SERVICE
 */
export class VendorApplicationService extends AppwriteDatabaseService {
  static collectionId = appwriteConfig.collections.vendorApplications;

  static async submitApplication(userId: string, applicationData: any) {
    return this.createDocument(this.collectionId, {
      userId,
      ...applicationData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async getApplicationByUser(userId: string) {
    const results = await this.listDocuments(
      this.collectionId,
      [Query.equal('userId', userId)]
    );
    return results.documents[0] || null;
  }

  static async listPendingApplications() {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('status', 'pending'), Query.orderDesc('$createdAt')]
    );
  }

  static async approveApplication(applicationId: string, reviewedBy: string, notes?: string) {
    return this.updateDocument(this.collectionId, applicationId, {
      status: 'approved',
      reviewedBy,
      reviewNotes: notes || '',
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async rejectApplication(applicationId: string, reviewedBy: string, notes: string) {
    return this.updateDocument(this.collectionId, applicationId, {
      status: 'rejected',
      reviewedBy,
      reviewNotes: notes,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * 🚙 CAR LISTING SERVICE (Customer Selling Cars)
 */
export class CarListingService extends AppwriteDatabaseService {
  static collectionId = appwriteConfig.collections.carListings;

  static async submitCarListing(userId: string, carData: any) {
    return this.createDocument(this.collectionId, {
      userId,
      ...carData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async getCarListingsByUser(userId: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
    );
  }

  static async listPendingCarListings() {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('status', 'pending'), Query.orderDesc('$createdAt')]
    );
  }

  static async approveCarListing(listingId: string) {
    return this.updateDocument(this.collectionId, listingId, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async rejectCarListing(listingId: string, reason: string) {
    return this.updateDocument(this.collectionId, listingId, {
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    });
  }

  static async getApprovedCarListings() {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('status', 'approved'), Query.orderDesc('$createdAt')]
    );
  }
}

/**
 * 💬 MESSAGE SERVICE
 */
export class MessageService extends AppwriteDatabaseService {
  static collectionId = appwriteConfig.collections.messages;

  static async sendMessage(senderId: string, receiverId: string, content: string, chatId?: string) {
    const finalChatId = chatId || `${senderId}_${receiverId}`;
    
    return this.createDocument(this.collectionId, {
      chatId: finalChatId,
      senderId,
      receiverId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  static async getMessagesByChatId(chatId: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('chatId', chatId), Query.orderAsc('$createdAt')],
      100
    );
  }

  static async markMessageAsRead(messageId: string) {
    return this.updateDocument(this.collectionId, messageId, {
      read: true,
    });
  }

  static async getUnreadMessages(userId: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('receiverId', userId), Query.equal('read', false)]
    );
  }
}

/**
 * 🔔 NOTIFICATION SERVICE
 */
export class NotificationService extends AppwriteDatabaseService {
  static collectionId = appwriteConfig.collections.notifications;

  static async createNotification(userId: string, notificationData: any) {
    return this.createDocument(this.collectionId, {
      userId,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  static async getUserNotifications(userId: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('userId', userId), Query.orderDesc('$createdAt')],
      50
    );
  }

  static async markNotificationAsRead(notificationId: string) {
    return this.updateDocument(this.collectionId, notificationId, {
      read: true,
    });
  }

  static async getUnreadNotifications(userId: string) {
    return this.listDocuments(
      this.collectionId,
      [Query.equal('userId', userId), Query.equal('read', false)]
    );
  }

  static async markAllAsRead(userId: string) {
    const unread = await this.getUnreadNotifications(userId);
    
    const promises = unread.documents.map((notification: any) =>
      this.markNotificationAsRead(notification.$id)
    );
    
    return Promise.all(promises);
  }

  static async deleteNotification(notificationId: string) {
    return this.deleteDocument(this.collectionId, notificationId);
  }
}

export default AppwriteDatabaseService;

