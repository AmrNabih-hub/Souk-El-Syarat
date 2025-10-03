/**
 * Environment Configuration Manager
 * Centralized configuration for Appwrite-powered marketplace
 * 
 * This ensures consistent behavior across different deployment environments
 * and provides clear error messages when configuration is missing.
 */

export type Environment = 'development' | 'production' | 'test';
export type DeploymentPlatform = 'local' | 'appwrite-sites' | 'vercel' | 'netlify';

interface AppConfig {
  // Core App Settings
  appName: string;
  appVersion: string;
  appEnv: Environment;
  platform: DeploymentPlatform;
  
  // Appwrite Configuration
  appwrite: {
    endpoint: string;
    projectId: string;
    databaseId: string;
    buckets: {
      productImages: string;
      vendorDocuments: string;
      carListingImages: string;
    };
    collections: {
      users: string;
      products: string;
      orders: string;
      vendorApplications: string;
      carListings: string;
    };
  };
  
  // Feature Flags
  enableRealTime: boolean;
  enableAnalytics: boolean;
  enablePushNotifications: boolean;
  enableDarkMode: boolean;
  enableAnimations: boolean;
  enablePWA: boolean;
  
  // Mock Data Configuration (for development/testing)
  useMockAuth: boolean;
  useMockData: boolean;
  useMockPayments: boolean;
  
  // Logging & Debugging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableConsoleLogs: boolean;
  
  // Performance & Security
  sessionTimeout: number;
  maxLoginAttempts: number;
  cacheTTL: number;
}

class EnvironmentConfig {
  private config: AppConfig;
  
  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }
  
  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): AppConfig {
    const env = import.meta.env;
    
    // Determine environment
    const appEnv = this.determineEnvironment();
    const platform = this.determinePlatform();
    
    return {
      // Core App Settings
      appName: env.VITE_APP_NAME || 'Souk El-Sayarat',
      appVersion: env.VITE_APP_VERSION || '1.0.0',
      appEnv,
      platform,
      
      // Appwrite Configuration
      appwrite: {
        endpoint: env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
        projectId: env.VITE_APPWRITE_PROJECT_ID || '',
        databaseId: env.VITE_APPWRITE_DATABASE_ID || 'souk_main_db',
        buckets: {
          productImages: env.VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID || 'product_images',
          vendorDocuments: env.VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID || 'vendor_documents',
          carListingImages: env.VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID || 'car_listing_images',
        },
        collections: {
          users: env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
          products: env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products',
          orders: env.VITE_APPWRITE_ORDERS_COLLECTION_ID || 'orders',
          vendorApplications: env.VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID || 'vendorApplications',
          carListings: env.VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID || 'carListings',
        },
      },
      
      // Feature Flags
      enableRealTime: this.parseBoolean(env.VITE_ENABLE_REALTIME, true),
      enableAnalytics: this.parseBoolean(env.VITE_ENABLE_ANALYTICS, appEnv === 'production'),
      enablePushNotifications: this.parseBoolean(env.VITE_ENABLE_PUSH_NOTIFICATIONS, false),
      enableDarkMode: this.parseBoolean(env.VITE_ENABLE_DARK_MODE, true),
      enableAnimations: this.parseBoolean(env.VITE_ENABLE_ANIMATIONS, true),
      enablePWA: this.parseBoolean(env.VITE_ENABLE_PWA, true),
      
      // Mock Data Configuration
      useMockAuth: this.parseBoolean(env.VITE_USE_MOCK_AUTH, appEnv === 'development'),
      useMockData: this.parseBoolean(env.VITE_USE_MOCK_DATA, appEnv === 'development'),
      useMockPayments: this.parseBoolean(env.VITE_USE_MOCK_PAYMENTS, appEnv === 'development'),
      
      // Logging & Debugging
      logLevel: (env.VITE_LOG_LEVEL || (appEnv === 'development' ? 'debug' : 'info')) as 'debug' | 'info' | 'warn' | 'error',
      enableConsoleLogs: this.parseBoolean(env.VITE_ENABLE_CONSOLE_LOGS, appEnv === 'development'),
      
      // Performance & Security
      sessionTimeout: parseInt(env.VITE_SESSION_TIMEOUT || '3600000', 10),
      maxLoginAttempts: parseInt(env.VITE_MAX_LOGIN_ATTEMPTS || '5', 10),
      cacheTTL: parseInt(env.VITE_CACHE_TTL || '300000', 10),
    };
  }
  
  /**
   * Determine current environment
   */
  private determineEnvironment(): Environment {
    const mode = import.meta.env.MODE;
    const nodeEnv = import.meta.env.VITE_NODE_ENV || mode;
    
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'test') return 'test';
    return 'development';
  }
  
  /**
   * Determine deployment platform
   */
  private determinePlatform(): DeploymentPlatform {
    // Check for Appwrite Sites
    if (import.meta.env.VITE_APPWRITE_DEPLOYMENT || 
        typeof window !== 'undefined' && window.location.hostname.includes('appwrite')) {
      return 'appwrite-sites';
    }
    
    // Check for other platforms
    if (import.meta.env.VITE_VERCEL_ENV) return 'vercel';
    if (import.meta.env.VITE_NETLIFY) return 'netlify';
    
    // Default to local
    return 'local';
  }
  
  /**
   * Parse boolean from string or boolean
   */
  private parseBoolean(value: any, defaultValue: boolean): boolean {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return defaultValue;
  }
  
  /**
   * Validate required configuration
   */
  private validateConfiguration(): void {
    const errors: string[] = [];
    
    // Appwrite configuration validation
    if (!this.config.appwrite.endpoint) {
      errors.push('VITE_APPWRITE_ENDPOINT is required');
    }
    
    if (!this.config.appwrite.projectId) {
      errors.push('VITE_APPWRITE_PROJECT_ID is required');
    }
    
    // Production-specific validations
    if (this.config.appEnv === 'production') {
      if (this.config.useMockAuth) {
        console.warn('⚠️ WARNING: Mock authentication is enabled in production! This should be disabled.');
      }
      
      if (this.config.useMockData) {
        console.warn('⚠️ WARNING: Mock data is enabled in production! This should be disabled.');
      }
    }
    
    // Throw errors if any critical validations fail
    if (errors.length > 0) {
      throw new Error(`Environment Configuration Errors:\n${errors.join('\n')}`);
    }
  }
  
  /**
   * Get configuration value
   */
  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }
  
  /**
   * Get all configuration
   */
  public getAll(): Readonly<AppConfig> {
    return Object.freeze({ ...this.config });
  }
  
  /**
   * Get Appwrite configuration
   */
  public getAppwriteConfig() {
    return this.config.appwrite;
  }
  
  /**
   * Check if feature is enabled
   */
  public isFeatureEnabled(feature: keyof Pick<AppConfig, 'enableRealTime' | 'enableAnalytics' | 'enablePushNotifications' | 'enableDarkMode' | 'enableAnimations' | 'enablePWA'>): boolean {
    return this.config[feature];
  }
  
  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.config.appEnv === 'development';
  }
  
  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.config.appEnv === 'production';
  }
  
  /**
   * Check if running on Appwrite Sites
   */
  public isAppwriteSites(): boolean {
    return this.config.platform === 'appwrite-sites';
  }
  
  /**
   * Print configuration summary (safe for logging)
   */
  public printSummary(): void {
    console.log('🔧 Environment Configuration:');
    console.log(`   App: ${this.config.appName} v${this.config.appVersion}`);
    console.log(`   Environment: ${this.config.appEnv}`);
    console.log(`   Platform: ${this.config.platform}`);
    console.log(`   Mock Auth: ${this.config.useMockAuth ? '✅' : '❌'}`);
    console.log(`   Mock Data: ${this.config.useMockData ? '✅' : '❌'}`);
    console.log(`   Real-time: ${this.config.enableRealTime ? '✅' : '❌'}`);
    console.log(`   Appwrite: ${this.config.appwrite.projectId ? '✅' : '❌'}`);
    console.log(`   PWA: ${this.config.enablePWA ? '✅' : '❌'}`);
  }
}

// Export singleton instance
export const envConfig = new EnvironmentConfig();

// Export for use in components
export const useEnvConfig = () => envConfig;
