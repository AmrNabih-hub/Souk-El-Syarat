/**
 * 🛡️ Advanced Error Recovery Service
 * Souk El-Syarat - Zero-Downtime Error Management
 */

import { auth, db } from '@/config/firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ErrorContext {
  errorType: 'network' | 'auth' | 'database' | 'validation' | 'runtime' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface RecoveryStrategy {
  retry?: {
    attempts: number;
    delay: number;
    backoff: 'linear' | 'exponential';
  };
  fallback?: () => void;
  notification?: {
    user: boolean;
    admin: boolean;
  };
  cache?: boolean;
}

class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];
  private retryQueue: Map<string, { attempts: number; nextRetry: Date }> = new Map();
  private isOnline = navigator.onLine;
  private errorHandlers: Map<string, (error: Error, context: ErrorContext) => RecoveryStrategy> = new Map();

  private constructor() {
    this.initializeErrorHandlers();
    this.setupGlobalErrorHandlers();
    this.monitorNetworkStatus();
  }

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Initialize default error handlers
   */
  private initializeErrorHandlers(): void {
    // Network errors
    this.registerErrorHandler('network', (error, context) => ({
      retry: {
        attempts: 3,
        delay: 1000,
        backoff: 'exponential'
      },
      fallback: () => this.handleOfflineMode(context),
      notification: {
        user: true,
        admin: false
      },
      cache: true
    }));

    // Authentication errors
    this.registerErrorHandler('auth', (error, context) => ({
      retry: {
        attempts: 2,
        delay: 500,
        backoff: 'linear'
      },
      fallback: () => this.redirectToLogin(),
      notification: {
        user: true,
        admin: true
      }
    }));

    // Database errors
    this.registerErrorHandler('database', (error, context) => ({
      retry: {
        attempts: 3,
        delay: 2000,
        backoff: 'exponential'
      },
      fallback: () => this.useLocalCache(context),
      notification: {
        user: false,
        admin: true
      },
      cache: true
    }));

    // Validation errors
    this.registerErrorHandler('validation', (error, context) => ({
      notification: {
        user: true,
        admin: false
      }
    }));

    // Runtime errors
    this.registerErrorHandler('runtime', (error, context) => ({
      retry: {
        attempts: 1,
        delay: 0,
        backoff: 'linear'
      },
      fallback: () => this.reloadComponent(context),
      notification: {
        user: false,
        admin: true
      }
    }));
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      this.handleError(new Error(event.reason), {
        errorType: 'runtime',
        severity: 'high',
        metadata: { reason: event.reason }
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      event.preventDefault();
      this.handleError(event.error || new Error(event.message), {
        errorType: 'runtime',
        severity: 'high',
        component: event.filename,
        metadata: {
          line: event.lineno,
          column: event.colno
        }
      });
    });
  }

  /**
   * Monitor network status
   */
  private monitorNetworkStatus(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('✅ Network connection restored');
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('⚠️ Network connection lost');
    });
  }

  /**
   * Register custom error handler
   */
  public registerErrorHandler(
    errorType: string,
    handler: (error: Error, context: ErrorContext) => RecoveryStrategy
  ): void {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Main error handling method
   */
  public async handleError(error: Error, context: ErrorContext): Promise<void> {
    console.error(`🚨 Error occurred:`, error, context);

    // Add to error queue
    this.errorQueue.push({
      error,
      context,
      timestamp: new Date()
    });

    // Log to Firebase if online
    if (this.isOnline) {
      await this.logErrorToFirebase(error, context);
    }

    // Get recovery strategy
    const handler = this.errorHandlers.get(context.errorType) || this.errorHandlers.get('unknown');
    const strategy = handler ? handler(error, context) : this.getDefaultStrategy();

    // Apply recovery strategy
    await this.applyRecoveryStrategy(error, context, strategy);
  }

  /**
   * Apply recovery strategy
   */
  private async applyRecoveryStrategy(
    error: Error,
    context: ErrorContext,
    strategy: RecoveryStrategy
  ): Promise<void> {
    // Handle retries
    if (strategy.retry) {
      await this.handleRetry(error, context, strategy.retry);
    }

    // Apply fallback
    if (strategy.fallback) {
      try {
        strategy.fallback();
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
      }
    }

    // Send notifications
    if (strategy.notification) {
      await this.sendNotifications(error, context, strategy.notification);
    }

    // Cache data if needed
    if (strategy.cache && context.metadata?.data) {
      this.cacheData(context.metadata.data);
    }
  }

  /**
   * Handle retry logic
   */
  private async handleRetry(
    error: Error,
    context: ErrorContext,
    retryConfig: NonNullable<RecoveryStrategy['retry']>
  ): Promise<void> {
    const retryKey = `${context.errorType}-${context.action || 'unknown'}`;
    const retryInfo = this.retryQueue.get(retryKey) || { attempts: 0, nextRetry: new Date() };

    if (retryInfo.attempts >= retryConfig.attempts) {
      console.error(`Max retry attempts reached for ${retryKey}`);
      this.retryQueue.delete(retryKey);
      return;
    }

    const delay = retryConfig.backoff === 'exponential'
      ? retryConfig.delay * Math.pow(2, retryInfo.attempts)
      : retryConfig.delay;

    retryInfo.attempts++;
    retryInfo.nextRetry = new Date(Date.now() + delay);
    this.retryQueue.set(retryKey, retryInfo);

    console.log(`⏰ Retrying ${retryKey} in ${delay}ms (attempt ${retryInfo.attempts})`);

    setTimeout(() => {
      if (context.metadata?.retryAction) {
        context.metadata.retryAction();
      }
    }, delay);
  }

  /**
   * Send error notifications
   */
  private async sendNotifications(
    error: Error,
    context: ErrorContext,
    notificationConfig: NonNullable<RecoveryStrategy['notification']>
  ): Promise<void> {
    if (notificationConfig.user) {
      this.notifyUser(error, context);
    }

    if (notificationConfig.admin) {
      await this.notifyAdmin(error, context);
    }
  }

  /**
   * Notify user about error
   */
  private notifyUser(error: Error, context: ErrorContext): void {
    const message = this.getUserFriendlyMessage(error, context);
    
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('app:error', {
      detail: { message, severity: context.severity }
    }));
  }

  /**
   * Notify admin about error
   */
  private async notifyAdmin(error: Error, context: ErrorContext): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Log critical errors to Firebase
      if (context.severity === 'critical' || context.severity === 'high') {
        await addDoc(collection(db, 'admin_alerts'), {
          type: 'error',
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          context,
          timestamp: serverTimestamp(),
          resolved: false
        });
      }
    } catch (logError) {
      console.error('Failed to notify admin:', logError);
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: Error, context: ErrorContext): string {
    const messages: Record<string, string> = {
      network: 'يبدو أن هناك مشكلة في الاتصال. يرجى التحقق من اتصالك بالإنترنت.',
      auth: 'حدث خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.',
      database: 'حدث خطأ في قاعدة البيانات. نحن نعمل على حل المشكلة.',
      validation: 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.',
      runtime: 'حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.',
      unknown: 'حدث خطأ. يرجى المحاولة مرة أخرى لاحقاً.'
    };

    return messages[context.errorType] || messages.unknown;
  }

  /**
   * Handle offline mode
   */
  private handleOfflineMode(context: ErrorContext): void {
    console.log('📴 Switching to offline mode');
    
    // Store action for later sync
    if (context.action && context.metadata) {
      const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
      offlineActions.push({
        action: context.action,
        data: context.metadata,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('offlineActions', JSON.stringify(offlineActions));
    }
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    if (window.location.pathname !== '/login') {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/login';
    }
  }

  /**
   * Use local cache as fallback
   */
  private useLocalCache(context: ErrorContext): void {
    console.log('📦 Using local cache');
    
    const cacheKey = context.metadata?.cacheKey;
    if (cacheKey) {
      const cachedData = localStorage.getItem(`cache_${cacheKey}`);
      if (cachedData) {
        context.metadata.onCacheHit?.(JSON.parse(cachedData));
      }
    }
  }

  /**
   * Reload component
   */
  private reloadComponent(context: ErrorContext): void {
    if (context.component) {
      console.log(`🔄 Reloading component: ${context.component}`);
      // Dispatch event for React to handle component reload
      window.dispatchEvent(new CustomEvent('app:reload-component', {
        detail: { component: context.component }
      }));
    }
  }

  /**
   * Cache data locally
   */
  private cacheData(data: any): void {
    try {
      const cacheKey = `cache_${Date.now()}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
      // Clean old cache entries
      this.cleanOldCache();
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Clean old cache entries
   */
  private cleanOldCache(): void {
    const maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        const timestamp = parseInt(key.replace('cache_', ''));
        if (now - timestamp > maxCacheAge) {
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Process error queue when back online
   */
  private async processErrorQueue(): Promise<void> {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    console.log(`📤 Processing ${this.errorQueue.length} queued errors`);
    
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const { error, context, timestamp } of errors) {
      await this.logErrorToFirebase(error, context, timestamp);
    }

    // Process offline actions
    const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
    if (offlineActions.length > 0) {
      console.log(`📤 Processing ${offlineActions.length} offline actions`);
      // Dispatch event for app to handle offline actions
      window.dispatchEvent(new CustomEvent('app:sync-offline-actions', {
        detail: { actions: offlineActions }
      }));
      localStorage.removeItem('offlineActions');
    }
  }

  /**
   * Log error to Firebase
   */
  private async logErrorToFirebase(
    error: Error,
    context: ErrorContext,
    timestamp: Date = new Date()
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'error_logs'), {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || null,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (logError) {
      console.error('Failed to log error to Firebase:', logError);
    }
  }

  /**
   * Get default recovery strategy
   */
  private getDefaultStrategy(): RecoveryStrategy {
    return {
      retry: {
        attempts: 1,
        delay: 1000,
        backoff: 'linear'
      },
      notification: {
        user: true,
        admin: false
      }
    };
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const stats = {
      total: this.errorQueue.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    this.errorQueue.forEach(({ context }) => {
      stats.byType[context.errorType] = (stats.byType[context.errorType] || 0) + 1;
      stats.bySeverity[context.severity] = (stats.bySeverity[context.severity] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const errorRecovery = ErrorRecoveryService.getInstance();