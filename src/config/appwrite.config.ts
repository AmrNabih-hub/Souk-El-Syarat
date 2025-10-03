/**
 * 🚀 APPWRITE CONFIGURATION
 * Souk El-Sayarat Marketplace - Appwrite Backend
 */

import { Client, Account, Databases, Storage, Functions, Realtime } from 'appwrite';

// Appwrite configuration from environment variables
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  project: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'souk_main_db',
  
  // Collections
  collections: {
    users: import.meta.env.VITE_APPWRITE_COLLECTION_USERS || 'users',
    products: import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCTS || 'products',
    orders: import.meta.env.VITE_APPWRITE_COLLECTION_ORDERS || 'orders',
    vendors: import.meta.env.VITE_APPWRITE_COLLECTION_VENDORS || 'vendors',
    customers: import.meta.env.VITE_APPWRITE_COLLECTION_CUSTOMERS || 'customers',
    carListings: import.meta.env.VITE_APPWRITE_COLLECTION_CAR_LISTINGS || 'car-listings',
    chats: import.meta.env.VITE_APPWRITE_COLLECTION_CHATS || 'chats',
    messages: import.meta.env.VITE_APPWRITE_COLLECTION_MESSAGES || 'messages',
    notifications: import.meta.env.VITE_APPWRITE_COLLECTION_NOTIFICATIONS || 'notifications',
    vendorApplications: import.meta.env.VITE_APPWRITE_COLLECTION_VENDOR_APPLICATIONS || 'vendor-applications',
  },
  
  // Storage buckets (matching your existing setup)
  buckets: {
    products: import.meta.env.VITE_APPWRITE_BUCKET_PRODUCTS || import.meta.env.VITE_APPWRITE_STORAGE_PRODUCT_IMAGES_BUCKET_ID || 'product_images',
    avatars: import.meta.env.VITE_APPWRITE_BUCKET_AVATARS || import.meta.env.VITE_APPWRITE_STORAGE_VENDOR_DOCUMENTS_BUCKET_ID || 'vendor_documents',
    cars: import.meta.env.VITE_APPWRITE_BUCKET_CARS || import.meta.env.VITE_APPWRITE_STORAGE_CAR_LISTING_IMAGES_BUCKET_ID || 'car_listing_images',
  },
};

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.project);

// Export services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Export client for custom operations
export { client };

// Validation function
export const validateAppwriteConfig = (): boolean => {
  console.log('🔍 Validating Appwrite configuration...');
  
  if (!appwriteConfig.project) {
    console.error('❌ Missing VITE_APPWRITE_PROJECT_ID');
    return false;
  }
  
  console.log('✅ Appwrite configuration validated');
  console.log('📡 Endpoint:', appwriteConfig.endpoint);
  console.log('🆔 Project:', appwriteConfig.project);
  
  return true;
};

// Initialize on import
if (typeof window !== 'undefined') {
  validateAppwriteConfig();
}

export default {
  client,
  account,
  databases,
  storage,
  functions,
  config: appwriteConfig,
};

