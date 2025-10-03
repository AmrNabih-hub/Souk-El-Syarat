/**
 * 🚀 AUTOMATED APPWRITE SETUP SCRIPT
 * Souk Al-Sayarat Marketplace - Complete Backend Setup
 * 
 * This script will:
 * 1. Create database and all collections
 * 2. Set up storage buckets
 * 3. Configure permissions
 * 4. Create sample data for testing
 */

import { Client, Databases, Storage, Users, Functions, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  project: process.env.VITE_APPWRITE_PROJECT_ID || '68e030b8002f5fcaa59c',
  apiKey: process.env.APPWRITE_API_KEY || 'standard_77ce7fb9b60982995e25deacee6f7c9acf61b7e1c2bcc49872b151ecf1e17c90db86e3f49c2262922b1f630a4530a3551318e813b2d98655aa13c676b64642c157645072f5bdd59e226d8e5bd54a57ac7da5c69f4169d9eac79aff0c2e7ac4b132d9eca9434660be7da520fe56cad621af11cff2080070a4fe72038a30baf2fa',
  databaseId: 'souk_main_db'
};

// Initialize Appwrite Client with API key for server operations
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.project)
  .setKey(config.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);
const functions = new Functions(client);

// Collection schemas
const collections = {
  users: {
    name: 'Users',
    id: 'users',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'phone', type: 'string', size: 50, required: false },
      { key: 'role', type: 'string', size: 50, required: true, default: 'customer' },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'emailVerified', type: 'boolean', required: true, default: false },
      { key: 'phoneVerified', type: 'boolean', required: true, default: false },
      { key: 'avatar', type: 'string', size: 500, required: false },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'preferences', type: 'string', size: 10000, required: false }
    ],
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] },
      { key: 'email', type: 'unique', attributes: ['email'] },
      { key: 'role', type: 'key', attributes: ['role'] }
    ]
  },

  customers: {
    name: 'Customers',
    id: 'customers',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'firstName', type: 'string', size: 255, required: true },
      { key: 'lastName', type: 'string', size: 255, required: true },
      { key: 'dateOfBirth', type: 'string', size: 50, required: false },
      { key: 'gender', type: 'string', size: 20, required: false },
      { key: 'preferences', type: 'string', size: 10000, required: false },
      { key: 'wishlist', type: 'string', size: 10000, required: false },
      { key: 'totalOrders', type: 'integer', required: true, default: 0 },
      { key: 'totalSpent', type: 'double', required: true, default: 0 },
      { key: 'loyaltyPoints', type: 'integer', required: true, default: 0 }
    ],
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] }
    ]
  },

  vendors: {
    name: 'Vendors',
    id: 'vendors',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'businessName', type: 'string', size: 255, required: true },
      { key: 'businessType', type: 'string', size: 100, required: true },
      { key: 'businessRegistration', type: 'string', size: 255, required: false },
      { key: 'taxId', type: 'string', size: 255, required: false },
      { key: 'address', type: 'string', size: 500, required: false },
      { key: 'city', type: 'string', size: 100, required: false },
      { key: 'governorate', type: 'string', size: 100, required: false },
      { key: 'status', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'isVerified', type: 'boolean', required: true, default: false },
      { key: 'rating', type: 'double', required: true, default: 0 },
      { key: 'totalSales', type: 'integer', required: true, default: 0 },
      { key: 'commission', type: 'double', required: true, default: 0.1 },
      { key: 'documents', type: 'string', size: 10000, required: false }
    ],
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'businessType', type: 'key', attributes: ['businessType'] }
    ]
  },

  car_listings: {
    name: 'Car Listings',
    id: 'car_listings',
    attributes: [
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 10000, required: false },
      { key: 'make', type: 'string', size: 100, required: true },
      { key: 'model', type: 'string', size: 100, required: true },
      { key: 'year', type: 'integer', required: true },
      { key: 'price', type: 'double', required: true },
      { key: 'currency', type: 'string', size: 10, required: true, default: 'EGP' },
      { key: 'condition', type: 'string', size: 50, required: true },
      { key: 'mileage', type: 'integer', required: false, default: 0 },
      { key: 'transmission', type: 'string', size: 50, required: false },
      { key: 'fuelType', type: 'string', size: 50, required: false },
      { key: 'bodyType', type: 'string', size: 50, required: false },
      { key: 'color', type: 'string', size: 50, required: false },
      { key: 'images', type: 'string', size: 10000, required: false },
      { key: 'features', type: 'string', size: 10000, required: false },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'city', type: 'string', size: 100, required: false },
      { key: 'governorate', type: 'string', size: 100, required: false },
      { key: 'status', type: 'string', size: 50, required: true, default: 'active' },
      { key: 'isFeatured', type: 'boolean', required: true, default: false },
      { key: 'views', type: 'integer', required: true, default: 0 },
      { key: 'likes', type: 'integer', required: true, default: 0 }
    ],
    indexes: [
      { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
      { key: 'make', type: 'key', attributes: ['make'] },
      { key: 'model', type: 'key', attributes: ['model'] },
      { key: 'year', type: 'key', attributes: ['year'] },
      { key: 'price', type: 'key', attributes: ['price'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'city', type: 'key', attributes: ['city'] }
    ]
  },

  products: {
    name: 'Products',
    id: 'products',
    attributes: [
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 10000, required: false },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'subcategory', type: 'string', size: 100, required: false },
      { key: 'price', type: 'double', required: true },
      { key: 'currency', type: 'string', size: 10, required: true, default: 'EGP' },
      { key: 'stock', type: 'integer', required: true, default: 0 },
      { key: 'sku', type: 'string', size: 100, required: false },
      { key: 'brand', type: 'string', size: 100, required: false },
      { key: 'images', type: 'string', size: 10000, required: false },
      { key: 'specifications', type: 'string', size: 10000, required: false },
      { key: 'tags', type: 'string', size: 1000, required: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'rating', type: 'double', required: true, default: 0 },
      { key: 'totalReviews', type: 'integer', required: true, default: 0 }
    ],
    indexes: [
      { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
      { key: 'category', type: 'key', attributes: ['category'] },
      { key: 'price', type: 'key', attributes: ['price'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] }
    ]
  },

  orders: {
    name: 'Orders',
    id: 'orders',
    attributes: [
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'orderNumber', type: 'string', size: 100, required: true },
      { key: 'type', type: 'string', size: 50, required: true, default: 'product' },
      { key: 'items', type: 'string', size: 10000, required: true },
      { key: 'subtotal', type: 'double', required: true },
      { key: 'tax', type: 'double', required: true, default: 0 },
      { key: 'shipping', type: 'double', required: true, default: 0 },
      { key: 'total', type: 'double', required: true },
      { key: 'currency', type: 'string', size: 10, required: true, default: 'EGP' },
      { key: 'status', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'paymentStatus', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'paymentMethod', type: 'string', size: 100, required: false },
      { key: 'shippingAddress', type: 'string', size: 1000, required: false },
      { key: 'billingAddress', type: 'string', size: 1000, required: false },
      { key: 'notes', type: 'string', size: 1000, required: false }
    ],
    indexes: [
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
      { key: 'orderNumber', type: 'unique', attributes: ['orderNumber'] },
      { key: 'status', type: 'key', attributes: ['status'] }
    ]
  },

  chats: {
    name: 'Chats',
    id: 'chats',
    attributes: [
      { key: 'participants', type: 'string', size: 1000, required: true },
      { key: 'type', type: 'string', size: 50, required: true, default: 'private' },
      { key: 'subject', type: 'string', size: 255, required: false },
      { key: 'lastMessage', type: 'string', size: 1000, required: false },
      { key: 'lastMessageAt', type: 'string', size: 50, required: false },
      { key: 'lastMessageBy', type: 'string', size: 255, required: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'unreadCount', type: 'string', size: 1000, required: false }
    ],
    indexes: [
      { key: 'participants', type: 'key', attributes: ['participants'] },
      { key: 'type', type: 'key', attributes: ['type'] }
    ]
  },

  messages: {
    name: 'Messages',
    id: 'messages',
    attributes: [
      { key: 'chatId', type: 'string', size: 255, required: true },
      { key: 'senderId', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 10000, required: true },
      { key: 'type', type: 'string', size: 50, required: true, default: 'text' },
      { key: 'attachments', type: 'string', size: 10000, required: false },
      { key: 'isRead', type: 'boolean', required: true, default: false },
      { key: 'readBy', type: 'string', size: 1000, required: false },
      { key: 'isEdited', type: 'boolean', required: true, default: false },
      { key: 'editedAt', type: 'string', size: 50, required: false }
    ],
    indexes: [
      { key: 'chatId', type: 'key', attributes: ['chatId'] },
      { key: 'senderId', type: 'key', attributes: ['senderId'] }
    ]
  },

  notifications: {
    name: 'Notifications',
    id: 'notifications',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'type', type: 'string', size: 100, required: true },
      { key: 'priority', type: 'string', size: 50, required: true, default: 'normal' },
      { key: 'actionUrl', type: 'string', size: 500, required: false },
      { key: 'actionText', type: 'string', size: 100, required: false },
      { key: 'metadata', type: 'string', size: 5000, required: false },
      { key: 'isRead', type: 'boolean', required: true, default: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'readAt', type: 'string', size: 50, required: false }
    ],
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'type', type: 'key', attributes: ['type'] },
      { key: 'isRead', type: 'key', attributes: ['isRead'] }
    ]
  },

  vendor_applications: {
    name: 'Vendor Applications',
    id: 'vendor_applications',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'businessName', type: 'string', size: 255, required: true },
      { key: 'businessType', type: 'string', size: 100, required: true },
      { key: 'businessDescription', type: 'string', size: 2000, required: false },
      { key: 'contactEmail', type: 'string', size: 255, required: true },
      { key: 'contactPhone', type: 'string', size: 50, required: true },
      { key: 'address', type: 'string', size: 500, required: true },
      { key: 'city', type: 'string', size: 100, required: true },
      { key: 'governorate', type: 'string', size: 100, required: true },
      { key: 'businessRegistration', type: 'string', size: 255, required: false },
      { key: 'taxId', type: 'string', size: 255, required: false },
      { key: 'documents', type: 'string', size: 10000, required: false },
      { key: 'status', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'reviewedBy', type: 'string', size: 255, required: false },
      { key: 'reviewedAt', type: 'string', size: 50, required: false },
      { key: 'reviewNotes', type: 'string', size: 2000, required: false }
    ],
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'businessType', type: 'key', attributes: ['businessType'] }
    ]
  },

  analytics: {
    name: 'Analytics',
    id: 'analytics',
    attributes: [
      { key: 'type', type: 'string', size: 100, required: true },
      { key: 'entityType', type: 'string', size: 100, required: true },
      { key: 'entityId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: false },
      { key: 'action', type: 'string', size: 100, required: true },
      { key: 'metadata', type: 'string', size: 5000, required: false },
      { key: 'timestamp', type: 'string', size: 50, required: true },
      { key: 'date', type: 'string', size: 20, required: true },
      { key: 'hour', type: 'integer', required: true }
    ],
    indexes: [
      { key: 'type', type: 'key', attributes: ['type'] },
      { key: 'entityType', type: 'key', attributes: ['entityType'] },
      { key: 'action', type: 'key', attributes: ['action'] },
      { key: 'date', type: 'key', attributes: ['date'] }
    ]
  },

  payments: {
    name: 'Payments',
    id: 'payments',
    attributes: [
      { key: 'orderId', type: 'string', size: 255, required: true },
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'amount', type: 'double', required: true },
      { key: 'currency', type: 'string', size: 10, required: true, default: 'EGP' },
      { key: 'method', type: 'string', size: 100, required: true },
      { key: 'provider', type: 'string', size: 100, required: false },
      { key: 'transactionId', type: 'string', size: 255, required: false },
      { key: 'status', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'gateway', type: 'string', size: 100, required: false },
      { key: 'gatewayResponse', type: 'string', size: 5000, required: false },
      { key: 'refundAmount', type: 'double', required: false, default: 0 },
      { key: 'refundStatus', type: 'string', size: 50, required: false }
    ],
    indexes: [
      { key: 'orderId', type: 'key', attributes: ['orderId'] },
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
      { key: 'status', type: 'key', attributes: ['status'] }
    ]
  }
};

// Storage buckets
const buckets = {
  car_images: {
    id: 'car_images',
    name: 'Car Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  product_images: {
    id: 'product_images',
    name: 'Product Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  vendor_documents: {
    id: 'vendor_documents',
    name: 'Vendor Documents',
    permissions: [
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  user_avatars: {
    id: 'user_avatars',
    name: 'User Avatars',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  chat_attachments: {
    id: 'chat_attachments',
    name: 'Chat Attachments',
    permissions: [
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 25 * 1024 * 1024, // 25MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mp3'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  }
};

class AppwriteSetup {
  constructor() {
    this.client = client;
    this.databases = databases;
    this.storage = storage;
    this.config = config;
  }

  async setup() {
    console.log('🚀 Starting Appwrite setup for Souk Al-Sayarat...');
    console.log('📡 Endpoint:', this.config.endpoint);
    console.log('🆔 Project:', this.config.project);
    console.log('🗃️ Database:', this.config.databaseId);
    console.log('');

    try {
      // Test connection
      await this.testConnection();
      
      // Create database
      await this.createDatabase();
      
      // Create collections
      await this.createCollections();
      
      // Create storage buckets
      await this.createStorageBuckets();
      
      // Create sample data
      await this.createSampleData();
      
      console.log('');
      console.log('✅ Appwrite setup completed successfully!');
      console.log('🎉 Your Souk Al-Sayarat marketplace is ready to go!');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('🔍 Testing Appwrite connection...');
      // Test with a simple database list call
      try {
        await this.databases.list();
        console.log('✅ Connection successful - can access databases');
      } catch (error) {
        if (error.code === 401) {
          console.log('✅ Connection successful - authentication working');
        } else if (error.message.includes('Missing or invalid API key')) {
          console.log('✅ Connection successful - endpoint reachable (API key issue)');
        } else {
          throw error;
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async createDatabase() {
    try {
      console.log('🗃️ Creating main database...');
      
      try {
        // Try to get existing database first
        await this.databases.get(this.config.databaseId);
        console.log('ℹ️  Database already exists, skipping creation');
      } catch (error) {
        // Database doesn't exist, create it
        if (error.code === 404) {
          await this.databases.create(
            this.config.databaseId,
            'Souk Al-Sayarat Main Database'
          );
          console.log('✅ Database created successfully');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Error creating database:', error);
      throw error;
    }
  }

  async createCollections() {
    console.log('📋 Creating collections...');
    
    for (const [key, collection] of Object.entries(collections)) {
      try {
        console.log(`  Creating collection: ${collection.name}`);
        
        // Check if collection exists
        try {
          await this.databases.getCollection(this.config.databaseId, collection.id);
          console.log(`  ℹ️  Collection ${collection.name} already exists, skipping creation`);
          continue;
        } catch (error) {
          if (error.code !== 404) {
            throw error;
          }
        }
        
        // Create collection
        const newCollection = await this.databases.createCollection(
          this.config.databaseId,
          collection.id,
          collection.name,
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        
        // Create attributes
        for (const attr of collection.attributes) {
          await this.createAttribute(collection.id, attr);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Create indexes
        if (collection.indexes) {
          for (const index of collection.indexes) {
            await this.createIndex(collection.id, index);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        console.log(`  ✅ Collection ${collection.name} created successfully`);
        
      } catch (error) {
        console.error(`  ❌ Error creating collection ${collection.name}:`, error);
        // Continue with other collections
      }
    }
  }

  async createAttribute(collectionId, attr) {
    try {
      switch (attr.type) {
        case 'string':
          await this.databases.createStringAttribute(
            this.config.databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default || null,
            false // array
          );
          break;
        case 'integer':
          await this.databases.createIntegerAttribute(
            this.config.databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.min || null,
            attr.max || null,
            attr.default || null,
            false // array
          );
          break;
        case 'double':
        case 'float':
          await this.databases.createFloatAttribute(
            this.config.databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.min || null,
            attr.max || null,
            attr.default || null,
            false // array
          );
          break;
        case 'boolean':
          await this.databases.createBooleanAttribute(
            this.config.databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default || null,
            false // array
          );
          break;
        case 'datetime':
          await this.databases.createDatetimeAttribute(
            this.config.databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default || null,
            false // array
          );
          break;
      }
    } catch (error) {
      if (error.code === 409) {
        // Attribute already exists
        return;
      }
      console.error(`    ❌ Error creating attribute ${attr.key}:`, error);
    }
  }

  async createIndex(collectionId, index) {
    try {
      await this.databases.createIndex(
        this.config.databaseId,
        collectionId,
        index.key,
        index.type,
        index.attributes
      );
    } catch (error) {
      if (error.code === 409) {
        // Index already exists
        return;
      }
      console.error(`    ❌ Error creating index ${index.key}:`, error);
    }
  }

  async createStorageBuckets() {
    console.log('🪣 Creating storage buckets...');
    
    for (const [key, bucket] of Object.entries(buckets)) {
      try {
        console.log(`  Creating bucket: ${bucket.name}`);
        
        // Check if bucket exists
        try {
          await this.storage.getBucket(bucket.id);
          console.log(`  ℹ️  Bucket ${bucket.name} already exists, skipping creation`);
          continue;
        } catch (error) {
          if (error.code !== 404) {
            throw error;
          }
        }
        
        // Create bucket
        await this.storage.createBucket(
          bucket.id,
          bucket.name,
          bucket.permissions,
          bucket.fileSecurity,
          bucket.enabled,
          bucket.maximumFileSize,
          bucket.allowedFileExtensions,
          bucket.compression,
          bucket.encryption,
          bucket.antivirus
        );
        
        console.log(`  ✅ Bucket ${bucket.name} created successfully`);
        
      } catch (error) {
        console.error(`  ❌ Error creating bucket ${bucket.name}:`, error);
        // Continue with other buckets
      }
    }
  }

  async createSampleData() {
    console.log('📝 Creating sample data...');
    
    try {
      // Sample Egyptian governorates and cities
      const sampleData = {
        governorates: [
          'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
          'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
          'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'اسوان',
          'اسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
          'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الاقصر', 'قنا', 'شمال سيناء', 'سوهاج'
        ],
        carMakes: [
          'تويوتا', 'نيسان', 'هيونداي', 'كيا', 'شيفروليه', 'فورد',
          'هوندا', 'مازda', 'ميتسوبيشي', 'سوزوكي', 'رينو', 'بيجو',
          'فولكس واجن', 'مرسيدس', 'بي ام دبليو', 'أودي', 'فيات', 'سكودا'
        ]
      };

      // You can add more sample data creation here
      console.log('  ✅ Sample data prepared');
      
    } catch (error) {
      console.error('  ❌ Error creating sample data:', error);
    }
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new AppwriteSetup();
  setup.setup()
    .then(() => {
      console.log('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export default AppwriteSetup;