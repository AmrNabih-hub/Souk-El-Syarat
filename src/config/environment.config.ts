/**
 * Environment Configuration Manager
 * Centralized configuration for all environments: local, Replit, and production
 * 
 * This ensures consistent behavior across different deployment environments
 * and provides clear error messages when configuration is missing.
 */

export type Environment = 'development' | 'production' | 'test';
export type DeploymentPlatform = 'local' | 'replit' | 'aws' | 'vercel' | 'netlify';

interface AppConfig {
  // Core App Settings
  appName: string;
  appVersion: string;
  appEnv: Environment;
  platform: DeploymentPlatform;
  
  // API Configuration
  apiBaseUrl: string;
  
  // Feature Flags
  enableRealTime: boolean;
  enableAnalytics: boolean;
  enablePushNotifications: boolean;
  enableDarkMode: boolean;
  enableAnimations: boolean;
  
  // Mock Data Configuration (for development/testing)
  useMockAuth: boolean;
  useMockData: boolean;
  useMockPayments: boolean;
  
  // AWS Amplify Configuration (optional, for production)
  aws?: {
    region: string;
    userPoolId?: string;
    userPoolWebClientId?: string;
    identityPoolId?: string;
    appSyncGraphqlEndpoint?: string;
  };
  
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
      appName: env.VITE_APP_NAME || 'Souk El-Syarat Marketplace',
      appVersion: env.VITE_APP_VERSION || '1.0.0',
      appEnv,
      platform,
      
      // API Configuration
      apiBaseUrl: env.VITE_API_BASE_URL || this.getDefaultApiUrl(platform),
      
      // Feature Flags
      enableRealTime: this.parseBoolean(env.VITE_ENABLE_REAL_TIME, false),
      enableAnalytics: this.parseBoolean(env.VITE_ENABLE_ANALYTICS, false),
      enablePushNotifications: this.parseBoolean(env.VITE_ENABLE_PUSH_NOTIFICATIONS, false),
      enableDarkMode: this.parseBoolean(env.VITE_ENABLE_DARK_MODE, true),
      enableAnimations: this.parseBoolean(env.VITE_ENABLE_ANIMATIONS, true),
      
      // Mock Data Configuration
      useMockAuth: this.parseBoolean(env.VITE_USE_MOCK_AUTH, appEnv === 'development'),
      useMockData: this.parseBoolean(env.VITE_USE_MOCK_DATA, appEnv === 'development'),
      useMockPayments: this.parseBoolean(env.VITE_USE_MOCK_PAYMENTS, appEnv === 'development'),
      
      // AWS Configuration (optional)
      aws: this.loadAWSConfig(env),
      
      // Logging & Debugging
      logLevel: (env.VITE_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
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
    // Check for Replit environment
    if (import.meta.env.VITE_REPLIT_DEPLOYMENT || 
        typeof window !== 'undefined' && window.location.hostname.includes('replit')) {
      return 'replit';
    }
    
    // Check for other platforms
    if (import.meta.env.VITE_VERCEL_ENV) return 'vercel';
    if (import.meta.env.VITE_NETLIFY) return 'netlify';
    if (import.meta.env.VITE_AWS_REGION) return 'aws';
    
    // Default to local
    return 'local';
  }
  
  /**
   * Get default API URL based on platform
   */
  private getDefaultApiUrl(platform: DeploymentPlatform): string {
    switch (platform) {
      case 'replit':
        // Replit uses the same domain for API
        return typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
      case 'local':
        return 'http://localhost:3001/api';
      default:
        return '/api';
    }
  }
  
  /**
   * Load AWS Amplify configuration if available
   */
  private loadAWSConfig(env: Record<string, any>): AppConfig['aws'] | undefined {
    const region = env.VITE_AWS_REGION;
    
    if (!region) {
      return undefined;
    }
    
    return {
      region,
      userPoolId: env.VITE_AWS_USER_POOLS_ID,
      userPoolWebClientId: env.VITE_AWS_USER_POOLS_WEB_CLIENT_ID,
      identityPoolId: env.VITE_AWS_COGNITO_IDENTITY_POOL_ID,
      appSyncGraphqlEndpoint: env.VITE_AWS_APPSYNC_GRAPHQL_ENDPOINT,
    };
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
    
    // Production-specific validations
    if (this.config.appEnv === 'production') {
      if (!this.config.useMockAuth && !this.config.aws) {
        errors.push('Production environment requires AWS configuration or mock auth must be enabled');
      }
      
      if (this.config.useMockAuth) {
        console.warn('⚠️ WARNING: Mock authentication is enabled in production! This is insecure.');
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
   * Check if feature is enabled
   */
  public isFeatureEnabled(feature: keyof Pick<AppConfig, 'enableRealTime' | 'enableAnalytics' | 'enablePushNotifications' | 'enableDarkMode' | 'enableAnimations'>): boolean {
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
   * Check if running on Replit
   */
  public isReplit(): boolean {
    return this.config.platform === 'replit';
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
    console.log(`   AWS Configured: ${this.config.aws ? '✅' : '❌'}`);
  }
}

// Export singleton instance
export const envConfig = new EnvironmentConfig();

// Export for use in components
export const useEnvConfig = () => envConfig;
