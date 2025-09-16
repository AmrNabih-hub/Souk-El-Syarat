import { FirebaseError } from 'firebase/app';
// Simple logger utility for development
const logger = {
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  info: (...args: any[]) => console.info('[INFO]', ...args),
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export interface ErrorContext {
  operation: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackEnabled: boolean;
  reportErrors: boolean;
}

export interface FirebaseErrorMap {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  fallbackAction?: () => any;
}

export class EnhancedErrorHandlerService {
  private static instance: EnhancedErrorHandlerService;
  private config: ErrorHandlerConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackEnabled: true,
    reportErrors: true,
  };

  private firebaseErrorMap: Record<string, FirebaseErrorMap> = {
    'permission-denied': {
      code: 'permission-denied',
      message: 'Insufficient permissions',
      userMessage: 'يرجى تسجيل الدخول للوصول إلى هذه الميزة',
      severity: 'high',
      retryable: false,
      fallbackAction: () => this.handlePermissionDenied(),
    },
    'unavailable': {
      code: 'unavailable',
      message: 'Service unavailable',
      userMessage: 'الخدمة غير متاحة حالياً، جاري استخدام البيانات المحلية',
      severity: 'medium',
      retryable: true,
      fallbackAction: () => this.handleServiceUnavailable(),
    },
    'not-found': {
      code: 'not-found',
      message: 'Document not found',
      userMessage: 'العنصر المطلوب غير موجود',
      severity: 'low',
      retryable: false,
    },
    'already-exists': {
      code: 'already-exists',
      message: 'Document already exists',
      userMessage: 'هذا العنصر موجود بالفعل',
      severity: 'low',
      retryable: false,
    },
    'resource-exhausted': {
      code: 'resource-exhausted',
      message: 'Quota exceeded',
      userMessage: 'تم تجاوز الحد المسموح به، يرجى المحاولة لاحقاً',
      severity: 'medium',
      retryable: true,
    },
    'unauthenticated': {
      code: 'unauthenticated',
      message: 'User not authenticated',
      userMessage: 'يرجى تسجيل الدخول للمتابعة',
      severity: 'high',
      retryable: false,
      fallbackAction: () => this.handleUnauthenticated(),
    },
  };

  static getInstance(): EnhancedErrorHandlerService {
    if (!EnhancedErrorHandlerService.instance) {
      EnhancedErrorHandlerService.instance = new EnhancedErrorHandlerService();
    }
    return EnhancedErrorHandlerService.instance;
  }

  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async handleError(
    error: Error | FirebaseError | any,
    context: ErrorContext
  ): Promise<{
    handled: boolean;
    userMessage: string;
    fallbackData?: any;
    shouldRetry: boolean;
  }> {
    const errorInfo = this.categorizeError(error);
    const mappedError = this.mapFirebaseError(error);

    logger.error('Error occurred', {
      error: errorInfo,
      context,
      mappedError,
    });

    // Handle Firebase-specific errors
    if (this.isFirebaseError(error)) {
      return this.handleFirebaseError(error, context);
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, context);
    }

    // Handle image loading errors
    if (this.isImageError(error)) {
      return this.handleImageError(error, context);
    }

    // Default error handling
    return {
      handled: true,
      userMessage: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',
      fallbackData: null,
      shouldRetry: false,
    };
  }

  private isFirebaseError(error: any): error is FirebaseError {
    return error?.code?.startsWith('firestore/') || error?.code?.startsWith('auth/');
  }

  private isNetworkError(error: any): boolean {
    return error?.name === 'TypeError' && error?.message?.includes('fetch');
  }

  private isImageError(error: any): boolean {
    return error?.target?.tagName === 'IMG' || error?.message?.includes('image');
  }

  private mapFirebaseError(error: FirebaseError): FirebaseErrorMap | null {
    const errorCode = error.code.replace('firestore/', '').replace('auth/', '');
    return this.firebaseErrorMap[errorCode] || null;
  }

  private async handleFirebaseError(
    error: FirebaseError,
    context: ErrorContext
  ): Promise<{
    handled: boolean;
    userMessage: string;
    fallbackData?: any;
    shouldRetry: boolean;
  }> {
    const mapped = this.mapFirebaseError(error);

    if (!mapped) {
      return {
        handled: true,
        userMessage: 'حدث خطأ في قاعدة البيانات',
        fallbackData: null,
        shouldRetry: false,
      };
    }

    let fallbackData = null;
    if (mapped.fallbackAction && this.config.fallbackEnabled) {
      try {
        fallbackData = await mapped.fallbackAction();
      } catch (fallbackError) {
        logger.error('Fallback action failed', fallbackError);
      }
    }

    return {
      handled: true,
      userMessage: mapped.userMessage,
      fallbackData,
      shouldRetry: mapped.retryable,
    };
  }

  private async handleNetworkError(
    error: any,
    context: ErrorContext
  ): Promise<{
    handled: boolean;
    userMessage: string;
    fallbackData?: any;
    shouldRetry: boolean;
  }> {
    return {
      handled: true,
      userMessage: 'مشكلة في الاتصال بالإنترنت، جاري استخدام البيانات المحلية',
      fallbackData: await this.getOfflineFallback(context.operation),
      shouldRetry: true,
    };
  }

  private async handleImageError(
    error: any,
    context: ErrorContext
  ): Promise<{
    handled: boolean;
    userMessage: string;
    fallbackData?: any;
    shouldRetry: boolean;
  }> {
    return {
      handled: true,
      userMessage: 'فشل تحميل الصورة',
      fallbackData: this.getImageFallback(),
      shouldRetry: false,
    };
  }

  private categorizeError(error: any): {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  } {
    if (this.isFirebaseError(error)) {
      const mapped = this.mapFirebaseError(error);
      return {
        type: 'firebase',
        severity: mapped?.severity || 'medium',
        message: mapped?.message || error.message,
      };
    }

    if (this.isNetworkError(error)) {
      return {
        type: 'network',
        severity: 'medium',
        message: 'Network connectivity issue',
      };
    }

    if (error?.message?.includes('timeout')) {
      return {
        type: 'timeout',
        severity: 'medium',
        message: 'Request timeout',
      };
    }

    return {
      type: 'unknown',
      severity: 'high',
      message: error.message || 'Unknown error',
    };
  }

  private async handlePermissionDenied(): Promise<any> {
    // Return empty array for permission denied scenarios
    return [];
  }

  private async handleServiceUnavailable(): Promise<any> {
    // Return sample data when service is unavailable
    const { sampleProducts } = await import('@/data/sample-products');
    return sampleProducts;
  }

  private async handleUnauthenticated(): Promise<any> {
    // Return empty data for unauthenticated users
    return [];
  }

  private async getOfflineFallback(operation: string): Promise<any> {
    switch (operation) {
      case 'getProducts':
        const { sampleProducts } = await import('@/data/sample-products');
        return sampleProducts;
      case 'getVendors':
        const { sampleVendors } = await import('@/data/sample-vendors');
        return sampleVendors;
      default:
        return [];
    }
  }

  private getImageFallback(): string {
    return '/placeholder-image.jpg';
  }

  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retries = this.config.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const result = await this.handleError(error, context);

      if (result.shouldRetry && retries > 0) {
        const delay = this.config.retryDelay * (this.config.maxRetries - retries + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, context, retries - 1);
      }

      if (result.fallbackData !== null) {
        return result.fallbackData;
      }

      throw new Error(result.userMessage);
    }
  }

  logError(error: Error, context: ErrorContext): void {
    if (this.config.reportErrors) {
      logger.error('Application error', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const errorHandler = EnhancedErrorHandlerService.getInstance();