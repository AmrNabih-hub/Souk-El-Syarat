/**
 * Comprehensive Error Handling System
 * Bulletproof error management with logging and recovery
 */

import { ERROR_CONFIG } from '../constants';

// Error Types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Base Error Class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly context?: Record<string, any>;
  public readonly recoverable: boolean;

  constructor(
    type: ErrorType,
    code: string,
    technicalMessage: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true,
    context?: Record<string, any>
  ) {
    super(technicalMessage);
    this.name = this.constructor.name;
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.timestamp = new Date();
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage;
    this.context = context;
    this.recoverable = recoverable;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      context: this.context,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }
}

// Specific Error Classes
export class NetworkError extends AppError {
  constructor(
    code: string,
    technicalMessage: string,
    userMessage: string = 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
    context?: Record<string, any>
  ) {
    super(
      ErrorType.NETWORK,
      code,
      technicalMessage,
      userMessage,
      ErrorSeverity.MEDIUM,
      true,
      context
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(
    code: string,
    technicalMessage: string,
    userMessage: string = 'يرجى تسجيل الدخول للمتابعة.',
    context?: Record<string, any>
  ) {
    super(
      ErrorType.AUTHENTICATION,
      code,
      technicalMessage,
      userMessage,
      ErrorSeverity.HIGH,
      true,
      context
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(
    code: string,
    technicalMessage: string,
    userMessage: string = 'ليس لديك صلاحية للوصول إلى هذا المحتوى.',
    context?: Record<string, any>
  ) {
    super(
      ErrorType.AUTHORIZATION,
      code,
      technicalMessage,
      userMessage,
      ErrorSeverity.HIGH,
      false,
      context
    );
  }
}

export class ValidationError extends AppError {
  constructor(
    code: string,
    technicalMessage: string,
    userMessage: string = 'البيانات المدخلة غير صحيحة.',
    context?: Record<string, any>
  ) {
    super(
      ErrorType.VALIDATION,
      code,
      technicalMessage,
      userMessage,
      ErrorSeverity.LOW,
      true,
      context
    );
  }
}

export class BusinessLogicError extends AppError {
  constructor(
    code: string,
    technicalMessage: string,
    userMessage: string,
    context?: Record<string, any>
  ) {
    super(
      ErrorType.BUSINESS_LOGIC,
      code,
      technicalMessage,
      userMessage,
      ErrorSeverity.MEDIUM,
      true,
      context
    );
  }
}

export class SystemError extends AppError {
  constructor(
    code: string,
    technicalMessage: string,
    userMessage: string = 'حدث خطأ في النظام. فريقنا التقني تم إشعاره وسيتم الإصلاح قريباً.',
    context?: Record<string, any>
  ) {
    super(
      ErrorType.SYSTEM,
      code,
      technicalMessage,
      userMessage,
      ErrorSeverity.CRITICAL,
      false,
      context
    );
  }
}

// Error Logger
export class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public log(error: AppError | Error, context?: Record<string, any>) {
    const errorData = this.formatError(error, context);

    // Console logging (development)
    if (ERROR_CONFIG.logLevel === 'debug') {
      console.group(`🚨 ${errorData.severity} Error`);
      console.error('Error:', errorData);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // Production error reporting
    if (ERROR_CONFIG.enableErrorReporting) {
      this.reportError(errorData);
    }

    // Store in local storage for debugging
    this.storeError(errorData);
  }

  private formatError(error: AppError | Error, context?: Record<string, any>) {
    if (error instanceof AppError) {
      return {
        ...error.toJSON(),
        context: { ...error.context, ...context },
      };
    }

    return {
      name: error.name,
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      userMessage: 'حدث خطأ غير متوقع.',
      technicalMessage: error.message,
      context,
      recoverable: true,
      stack: error.stack,
    };
  }

  private async reportError(errorData: any) {
    try {
      // Send to error reporting service (Sentry, LogRocket, etc.)
      if (ERROR_CONFIG.errorReportingUrl) {
        await fetch(ERROR_CONFIG.errorReportingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private storeError(errorData: any) {
    try {
      const errors = this.getStoredErrors();
      errors.push(errorData);

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (storageError) {
      console.error('Failed to store error:', storageError);
    }
  }

  public getStoredErrors(): any[] {
    try {
      const errors = localStorage.getItem('app_errors');
      return errors ? JSON.parse(errors) : [];
    } catch {
      return [];
    }
  }

  public clearStoredErrors() {
    localStorage.removeItem('app_errors');
  }
}

// Error Handler Utility
export class ErrorHandler {
  private static logger = ErrorLogger.getInstance();

  public static handle(error: AppError | Error, context?: Record<string, any>) {
    this.logger.log(error, context);

    // Return user-friendly error for UI
    if (error instanceof AppError) {
      return {
        message: error.userMessage,
        type: error.type,
        severity: error.severity,
        recoverable: error.recoverable,
        code: error.code,
      };
    }

    return {
      message: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      code: 'UNKNOWN_ERROR',
    };
  }

  public static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = ERROR_CONFIG.maxRetries,
    delay: number = ERROR_CONFIG.retryDelay
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Don't retry certain errors
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          break;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  public static createErrorBoundary() {
    return (error: Error, errorInfo: any) => {
      const appError = new SystemError(
        'REACT_ERROR_BOUNDARY',
        error.message,
        'حدث خطأ في عرض هذا الجزء من التطبيق.',
        {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        }
      );

      this.handle(appError);
    };
  }
}

// Global Error Handler
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new SystemError(
      'UNHANDLED_PROMISE_REJECTION',
      event.reason?.message || 'Unhandled promise rejection',
      'حدث خطأ غير متوقع في النظام.',
      {
        reason: event.reason,
        promise: event.promise,
      }
    );

    ErrorHandler.handle(error);
    event.preventDefault(); // Prevent console error
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const error = new SystemError(
      'UNCAUGHT_ERROR',
      event.error?.message || event.message,
      'حدث خطأ غير متوقع في النظام.',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      }
    );

    ErrorHandler.handle(error);
  });
};

// Error Recovery Strategies
export const ErrorRecovery = {
  // Retry with exponential backoff
  retry: ErrorHandler.withRetry,

  // Fallback to cached data
  fallbackToCache: async <T>(
    operation: () => Promise<T>,
    cacheKey: string,
    fallbackValue?: T
  ): Promise<T> => {
    try {
      const result = await operation();
      // Cache successful result
      localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(result));
      return result;
    } catch (error) {
      // Try to get cached data
      const cached = localStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Use fallback value
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }

      throw error;
    }
  },

  // Graceful degradation
  gracefulDegrade: async <T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T> => {
    try {
      return await primaryOperation();
    } catch (error) {
      ErrorHandler.handle(error as Error);
      return await fallbackOperation();
    }
  },
};

export default ErrorHandler;