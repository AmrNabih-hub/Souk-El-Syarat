/**
 * Application Constants
 * Centralized configuration and constants for the application
 */

// Application Configuration
export const APP_CONFIG = {
  name: 'Souk El-Syarat',
  version: '2.0.0',
  description: 'أكبر منصة للتجارة الإلكترونية في مصر للسيارات وقطع الغيار والخدمات',
  url: 'https://souk-el-syarat.web.app',
  supportEmail: 'support@souk-el-syarat.com',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedLanguages: ['ar', 'en'],
  defaultLanguage: 'ar',
  defaultCurrency: 'EGP',
  itemsPerPage: 20,
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.VITE_API_BASE_URL || 'https://api.souk-el-syarat.com',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  tokenKey: 'souk_auth_token',
  refreshTokenKey: 'souk_refresh_token',
  userKey: 'souk_user_data',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  userProfile: 5 * 60 * 1000, // 5 minutes
  products: 10 * 60 * 1000, // 10 minutes
  categories: 30 * 60 * 1000, // 30 minutes
  vendors: 15 * 60 * 1000, // 15 minutes
  staticData: 60 * 60 * 1000, // 1 hour
} as const;

// Error Configuration
export const ERROR_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  enableErrorReporting: process.env.NODE_ENV === 'production',
  errorReportingUrl: process.env.VITE_ERROR_REPORTING_URL,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enablePWA: true,
  enableOfflineMode: true,
  enablePushNotifications: true,
  enableAnalytics: true,
  enableA11y: true,
  enableDarkMode: true,
  enableRTL: true,
  enableChat: true,
  enableVideoCall: false, // Future feature
  enableAISearch: false, // Future feature
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  MARKETPLACE: '/marketplace',
  PRODUCT: '/product',
  CART: '/cart',
  CHECKOUT: '/checkout',
  VENDORS: '/vendors',
  VENDOR_APPLICATION: '/vendor/apply',
  VENDOR_DASHBOARD: '/vendor/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  NOT_FOUND: '*',
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = {
  CARS: 'cars',
  PARTS: 'parts',
  SERVICES: 'services',
  ACCESSORIES: 'accessories',
  MOTORCYCLES: 'motorcycles',
  TRUCKS: 'trucks',
} as const;

// Order Statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  DIGITAL_WALLET: 'digital_wallet',
  INSTALLMENTS: 'installments',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  VENDOR_APPLICATION: 'vendor_application',
  PRODUCT_APPROVED: 'product_approved',
  PRODUCT_REJECTED: 'product_rejected',
  NEW_REVIEW: 'new_review',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  CHAT_MESSAGE: 'chat_message',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  email: {
    required: 'البريد الإلكتروني مطلوب',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'البريد الإلكتروني غير صحيح',
    },
  },
  password: {
    required: 'كلمة المرور مطلوبة',
    minLength: {
      value: 8,
      message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص',
    },
  },
  phone: {
    required: 'رقم الهاتف مطلوب',
    pattern: {
      value: /^(\+201|01)[0-9]{9}$/,
      message: 'رقم الهاتف غير صحيح',
    },
  },
  price: {
    required: 'السعر مطلوب',
    min: {
      value: 0,
      message: 'السعر يجب أن يكون أكبر من صفر',
    },
  },
} as const;

// Environment Variables
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  
  // Firebase
  FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID,
  
  // External Services
  GOOGLE_ANALYTICS_ID: process.env.VITE_GOOGLE_ANALYTICS_ID,
  SENTRY_DSN: process.env.VITE_SENTRY_DSN,
  STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY,
} as const;

// Security Headers
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;