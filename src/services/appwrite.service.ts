/**
 * 🚀 COMPREHENSIVE APPWRITE SERVICE
 * Souk Al-Sayarat Marketplace - Complete Backend Service
 */

import { Client, Account, Databases, Storage, Functions, Query, ID, Permission, Role } from 'appwrite';

// Configuration
const config = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  project: import.meta.env.VITE_APPWRITE_PROJECT_ID || '68e030b8002f5fcaa59c',
  databaseId: 'souk_main_db',
  
  // Collections
  collections: {
    users: 'users',
    vendors: 'vendors',
    customers: 'customers',
    carListings: 'car_listings',
    products: 'products',
    orders: 'orders',
    chats: 'chats',
    messages: 'messages',
    notifications: 'notifications',
    vendorApplications: 'vendor_applications',
    analytics: 'analytics',
    payments: 'payments'
  },
  
  // Storage Buckets
  buckets: {
    carImages: 'car_images',
    // We'll use the one existing bucket for now
  }
};

// Initialize Appwrite Client
const client = new Client();
client
  .setEndpoint(config.endpoint)
  .setProject(config.project);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

class AppwriteService {
  constructor() {
    this.client = client;
    this.account = account;
    this.databases = databases;
    this.storage = storage;
    this.config = config;
  }

  // ===== AUTHENTICATION SERVICES =====
  
  async createAccount(email, password, name) {
    try {
      const user = await this.account.create(ID.unique(), email, password, name);
      console.log('✅ Account created successfully:', user);
      return user;
    } catch (error) {
      console.error('❌ Error creating account:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const session = await this.account.createEmailSession(email, password);
      console.log('✅ Login successful');
      return session;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.account.deleteSession('current');
      console.log('✅ Logout successful');
      return true;
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const user = await this.account.get();
      return user;
    } catch (error) {
      console.log('ℹ️  No current user session');
      return null;
    }
  }

  async updateProfile(name, preferences = {}) {
    try {
      const user = await this.account.updateName(name);
      
      // Update user preferences
      if (Object.keys(preferences).length > 0) {
        await this.account.updatePrefs(preferences);
      }
      
      console.log('✅ Profile updated successfully');
      return user;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  // ===== USER MANAGEMENT =====
  
  async createUserProfile(userId, data, role = 'customer') {
    try {
      const userData = {
        userId,
        email: data.email,
        name: data.name,
        phone: data.phone || '',
        role,
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };

      const userDoc = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.users,
        ID.unique(),
        userData,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );

      // Create role-specific profile
      if (role === 'customer') {
        await this.createCustomerProfile(userId, data);
      } else if (role === 'vendor') {
        await this.createVendorProfile(userId, data);
      }

      console.log('✅ User profile created successfully');
      return userDoc;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  async createCustomerProfile(userId, data) {
    try {
      const customerData = {
        userId,
        firstName: data.firstName || data.name?.split(' ')[0] || '',
        lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
        preferences: [],
        wishlist: [],
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };

      const customerDoc = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.customers,
        ID.unique(),
        customerData,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId))
        ]
      );

      return customerDoc;
    } catch (error) {
      console.error('❌ Error creating customer profile:', error);
      throw error;
    }
  }

  async createVendorProfile(userId, data) {
    try {
      const vendorData = {
        userId,
        businessName: data.businessName || '',
        businessType: data.businessType || 'automotive',
        status: 'pending',
        isVerified: false,
        rating: 0,
        totalSales: 0,
        commission: 0.1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };

      const vendorDoc = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.vendors,
        ID.unique(),
        vendorData,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId))
        ]
      );

      return vendorDoc;
    } catch (error) {
      console.error('❌ Error creating vendor profile:', error);
      throw error;
    }
  }

  // ===== CAR LISTINGS =====
  
  async createCarListing(vendorId, carData) {
    try {
      const listingData = {
        vendorId,
        title: carData.title,
        description: carData.description || '',
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        currency: carData.currency || 'EGP',
        condition: carData.condition,
        mileage: carData.mileage || 0,
        transmission: carData.transmission || '',
        fuelType: carData.fuelType || '',
        bodyType: carData.bodyType || '',
        color: carData.color || '',
        images: carData.images || [],
        features: carData.features || [],
        location: carData.location || '',
        city: carData.city || '',
        governorate: carData.governorate || '',
        status: 'active',
        isFeatured: false,
        views: 0,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const listing = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.carListings,
        ID.unique(),
        listingData,
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(vendorId)),
          Permission.delete(Role.user(vendorId))
        ]
      );

      console.log('✅ Car listing created successfully');
      return listing;
    } catch (error) {
      console.error('❌ Error creating car listing:', error);
      throw error;
    }
  }

  async getCarListings(filters = {}) {
    try {
      const queries = [];
      
      if (filters.make) queries.push(Query.equal('make', filters.make));
      if (filters.model) queries.push(Query.equal('model', filters.model));
      if (filters.minPrice) queries.push(Query.greaterThanEqual('price', filters.minPrice));
      if (filters.maxPrice) queries.push(Query.lessThanEqual('price', filters.maxPrice));
      if (filters.minYear) queries.push(Query.greaterThanEqual('year', filters.minYear));
      if (filters.maxYear) queries.push(Query.lessThanEqual('year', filters.maxYear));
      if (filters.city) queries.push(Query.equal('city', filters.city));
      if (filters.condition) queries.push(Query.equal('condition', filters.condition));
      
      queries.push(Query.equal('status', 'active'));
      queries.push(Query.orderDesc('createdAt'));
      queries.push(Query.limit(filters.limit || 50));

      const listings = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collections.carListings,
        queries
      );

      return listings;
    } catch (error) {
      console.error('❌ Error fetching car listings:', error);
      throw error;
    }
  }

  // ===== ORDERS =====
  
  async createOrder(customerId, vendorId, orderData) {
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const order = {
        customerId,
        vendorId,
        orderNumber,
        type: orderData.type || 'product',
        items: JSON.stringify(orderData.items || []),
        subtotal: orderData.subtotal,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        total: orderData.total,
        currency: orderData.currency || 'EGP',
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: orderData.paymentMethod || '',
        shippingAddress: orderData.shippingAddress || '',
        billingAddress: orderData.billingAddress || '',
        notes: orderData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orderDoc = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.orders,
        ID.unique(),
        order,
        [
          Permission.read(Role.user(customerId)),
          Permission.read(Role.user(vendorId)),
          Permission.update(Role.user(vendorId))
        ]
      );

      console.log('✅ Order created successfully');
      return orderDoc;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  // ===== CHAT & MESSAGING =====
  
  async createChat(participants, subject = '') {
    try {
      const chatData = {
        participants,
        type: 'private',
        subject,
        lastMessage: '',
        isActive: true,
        unreadCount: JSON.stringify({}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const chat = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.chats,
        ID.unique(),
        chatData,
        participants.map(id => Permission.read(Role.user(id))).concat(
          participants.map(id => Permission.update(Role.user(id)))
        )
      );

      console.log('✅ Chat created successfully');
      return chat;
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      throw error;
    }
  }

  async sendMessage(chatId, senderId, content, type = 'text') {
    try {
      const messageData = {
        chatId,
        senderId,
        content,
        type,
        attachments: [],
        isRead: false,
        readBy: [],
        isEdited: false,
        createdAt: new Date().toISOString()
      };

      const message = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.messages,
        ID.unique(),
        messageData
      );

      // Update chat's last message
      await this.databases.updateDocument(
        this.config.databaseId,
        this.config.collections.chats,
        chatId,
        {
          lastMessage: content.substring(0, 100),
          lastMessageAt: new Date().toISOString(),
          lastMessageBy: senderId,
          updatedAt: new Date().toISOString()
        }
      );

      console.log('✅ Message sent successfully');
      return message;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // ===== NOTIFICATIONS =====
  
  async createNotification(userId, title, message, type, metadata = {}) {
    try {
      const notificationData = {
        userId,
        title,
        message,
        type,
        priority: metadata.priority || 'normal',
        actionUrl: metadata.actionUrl || '',
        actionText: metadata.actionText || '',
        metadata: JSON.stringify(metadata),
        isRead: false,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const notification = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.notifications,
        ID.unique(),
        notificationData,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId))
        ]
      );

      console.log('✅ Notification created successfully');
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // ===== FILE STORAGE =====
  
  async uploadFile(file, bucketId = null) {
    try {
      const bucket = bucketId || this.config.buckets.carImages;
      
      const fileDoc = await this.storage.createFile(
        bucket,
        ID.unique(),
        file
      );

      console.log('✅ File uploaded successfully');
      return fileDoc;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  getFileUrl(bucketId, fileId) {
    try {
      return this.storage.getFileView(bucketId, fileId);
    } catch (error) {
      console.error('❌ Error getting file URL:', error);
      return null;
    }
  }

  // ===== ANALYTICS =====
  
  async trackEvent(type, entityType, entityId, action, metadata = {}, userId = null) {
    try {
      const now = new Date();
      const analyticsData = {
        type,
        entityType,
        entityId,
        userId,
        action,
        metadata: JSON.stringify(metadata),
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        hour: now.getHours()
      };

      const analytics = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collections.analytics,
        ID.unique(),
        analyticsData
      );

      return analytics;
    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  // ===== UTILITY FUNCTIONS =====
  
  async testConnection() {
    try {
      const user = await this.getCurrentUser();
      console.log('✅ Appwrite connection successful');
      console.log('📡 Endpoint:', this.config.endpoint);
      console.log('🆔 Project:', this.config.project);
      console.log('👤 Current user:', user ? user.name : 'Not logged in');
      return true;
    } catch (error) {
      console.error('❌ Appwrite connection failed:', error);
      return false;
    }
  }

  // Real-time subscriptions
  subscribe(channels, callback) {
    try {
      return this.client.subscribe(channels, callback);
    } catch (error) {
      console.error('❌ Error subscribing to real-time updates:', error);
      throw error;
    }
  }

  // Search functionality
  async search(collection, query, limit = 25) {
    try {
      const results = await this.databases.listDocuments(
        this.config.databaseId,
        collection,
        [
          Query.search('title', query),
          Query.limit(limit),
          Query.orderDesc('createdAt')
        ]
      );
      
      return results;
    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  }
}

// Create and export service instance
const appwriteService = new AppwriteService();

export default appwriteService;
export { Query, ID, Permission, Role };
export { config as appwriteConfig };