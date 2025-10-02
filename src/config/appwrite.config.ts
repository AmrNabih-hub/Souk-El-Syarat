/**
 * 🚀 Appwrite Configuration for Souk El-Sayarat
 * Professional full-stack configuration using Appwrite Cloud
 */

import { Client, Account, Databases, Storage, Functions, Teams } from 'appwrite';

// Validate environment variables
const validateConfig = () => {
  const requiredVars = {
    VITE_APPWRITE_ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT,
    VITE_APPWRITE_PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn('⚠️ Missing Appwrite configuration:', missing.join(', '));
    console.warn('⚠️ Please run setup-appwrite-mcp.sh to configure Appwrite');
  }

  return missing.length === 0;
};

// Initialize Appwrite Client
const client = new Client();

// Configure client with environment variables
if (validateConfig()) {
  client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

  console.log('✅ Appwrite client configured successfully');
} else {
  console.warn('⚠️ Appwrite client running in fallback mode');
  // Set minimal config to prevent errors
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('development-mode');
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const teams = new Teams(client);

// Export database and collection IDs
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
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
  config: appwriteConfig,
  isConfigured: isAppwriteConfigured,
  getCollectionId,
  getBucketId,
};
