/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_ENV: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_NODE_ENV: string;
  
  // Appwrite Configuration
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_DATABASE_ID: string;
  readonly VITE_APPWRITE_USERS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_PRODUCTS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_ORDERS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID: string;
  readonly VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID: string;
  readonly VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID: string;
  
  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_REALTIME: string;
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS: string;
  readonly VITE_ENABLE_DARK_MODE: string;
  readonly VITE_ENABLE_ANIMATIONS: string;
  readonly VITE_ENABLE_CONSOLE_LOGS: string;
  readonly VITE_ENABLE_CACHING: string;
  readonly VITE_ENABLE_ERROR_TRACKING: string;
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;
  
  // Development/Testing
  readonly VITE_USE_MOCK_DATA: string;
  readonly VITE_USE_MOCK_AUTH: string;
  readonly VITE_USE_MOCK_PAYMENTS: string;
  readonly VITE_LOG_LEVEL: string;
  
  // Platform Detection
  readonly VITE_APPWRITE_DEPLOYMENT: string;
  readonly VITE_VERCEL_ENV: string;
  readonly VITE_NETLIFY: string;
  
  // Performance Settings
  readonly VITE_SESSION_TIMEOUT: string;
  readonly VITE_MAX_LOGIN_ATTEMPTS: string;
  readonly VITE_CACHE_TTL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_RETRY_COUNT: string;
  readonly VITE_CACHE_DURATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
