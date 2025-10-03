/**
 * 🚀 Appwrite Configuration for Souk El-Sayarat
 * Professional full-stack configuration using Appwrite Cloud
 */

import { Client, Account, Databases, Storage, Functions, Teams, Messaging } from 'appwrite';

// Production Appwrite Configuration
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68de87060019a1ca2b8b';

// Validate environment variables
const validateConfig = () => {
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || APPWRITE_ENDPOINT;
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    console.warn('⚠️ Missing critical Appwrite configuration');
    return false;
  }

  return true;
};

// Initialize Appwrite Client
const client = new Client();

// Always configure with production values
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID);

// Log configuration status
if (validateConfig()) {
  console.log('✅ Appwrite client configured successfully');
  console.log('📡 Endpoint:', client.config.endpoint);
  console.log('🏗️ Project:', client.config.project);
} else {
  console.error('❌ Appwrite configuration failed');
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const teams = new Teams(client);
// Realtime will be initialized when needed: new Realtime(client)
export const messaging = new Messaging(client);

// Export database and collection IDs
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'souk_main_db',
  collections: {
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
    products: import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products',
    orders: import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || 'orders',
    vendorApplications: import.meta.env.VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID || 'vendorApplications',
    carListings: import.meta.env.VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID || 'carListings',
  },
  buckets: {
    productImages: import.meta.env.VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID || 'product_images',
    vendorDocuments: import.meta.env.VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID || 'vendor_documents',
    carListingImages: import.meta.env.VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID || 'car_listing_images',
  },
};

// Helper function to check if Appwrite is properly configured
export const isAppwriteConfigured = (): boolean => {
  return !!(appwriteConfig.projectId && appwriteConfig.endpoint);
};

// Helper function to get collection ID by name
export const getCollectionId = (collectionName: keyof typeof appwriteConfig.collections): string => {
  return appwriteConfig.collections[collectionName];
};

// Helper function to get bucket ID by name
export const getBucketId = (bucketName: keyof typeof appwriteConfig.buckets): string => {
  return appwriteConfig.buckets[bucketName];
};

// Export the client for advanced usage
export { client };

// Default export
export default {
  client,
  account,
  databases,
  storage,
  functions,
  teams,
  messaging,
  config: appwriteConfig,
  isConfigured: isAppwriteConfigured,
  getCollectionId,
  getBucketId,
};

