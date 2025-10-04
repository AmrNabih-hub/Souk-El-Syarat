/**
 * 🔧 Centralized Error Handler
 * Professional error handling and logging
 */

import toast from 'react-hot-toast';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  AUTH = 'authentication',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown',
}

interface ErrorDetails {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: Record<string, any>;
  userMessage?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorDetails[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log error
   */
  handle(error: any, context?: Record<string, any>): ErrorDetails {
    const errorDetails = this.parseError(error, context);
    this.logError(errorDetails);
    this.showUserFeedback(errorDetails);
    return errorDetails;
  }

  /**
   * Parse error into structured format
   */
  private parseError(error: any, context?: Record<string, any>): ErrorDetails {
    let message = 'An unexpected error occurred';
    let code: string | undefined;
    let severity = ErrorSeverity.MEDIUM;
    let category = ErrorCategory.UNKNOWN;
    let userMessage: string | undefined;

    // Parse different error types
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = error.message || error.error_description || JSON.stringify(error);
      code = error.code || error.status;
    }

    // Categorize error
    category = this.categorizeError(message, code);
    severity = this.determineSeverity(category, code);
    userMessage = this.generateUserMessage(category, message);

    return {
      message,
      code,
      severity,
      category,
      context,
      userMessage,
    };
  }

  /**
   * Categorize error based on message and code
   */
  private categorizeError(message: string, code?: string): ErrorCategory {
    const msgLower = message.toLowerCase();

    if (msgLower.includes('auth') || msgLower.includes('token') || msgLower.includes('session')) {
      return ErrorCategory.AUTH;
    }
    if (msgLower.includes('permission') || msgLower.includes('access denied') || msgLower.includes('forbidden')) {
      return ErrorCategory.PERMISSION;
    }
    if (msgLower.includes('network') || msgLower.includes('fetch') || msgLower.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    if (msgLower.includes('validation') || msgLower.includes('invalid') || msgLower.includes('required')) {
      return ErrorCategory.VALIDATION;
    }
    if (msgLower.includes('database') || msgLower.includes('query') || msgLower.includes('relation')) {
      return ErrorCategory.DATABASE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(category: ErrorCategory, code?: string): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.DATABASE || code === '500') {
      return ErrorSeverity.CRITICAL;
    }

    // High severity
    if (category === ErrorCategory.AUTH || category === ErrorCategory.PERMISSION) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity
    if (category === ErrorCategory.NETWORK) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity
    if (category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(category: ErrorCategory, originalMessage: string): string {
    const messages: Record<ErrorCategory, string> = {
      [ErrorCategory.AUTH]: 'مشكلة في المصادقة. يرجى تسجيل الدخول مرة أخرى.',
      [ErrorCategory.DATABASE]: 'حدث خطأ في النظام. يرجى المحاولة لاحقاً.',
      [ErrorCategory.NETWORK]: 'مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك.',
      [ErrorCategory.VALIDATION]: 'البيانات المدخلة غير صحيحة. يرجى المراجعة.',
      [ErrorCategory.PERMISSION]: 'ليس لديك صلاحية للوصول إلى هذا المورد.',
      [ErrorCategory.UNKNOWN]: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    };

    return messages[category] || originalMessage;
  }

  /**
   * Log error (can be extended to send to monitoring service)
   */
  private logError(error: ErrorDetails): void {
    this.errorLog.push(error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`❌ Error [${error.severity}] - ${error.category}`);
      console.error('Message:', error.message);
      if (error.code) console.error('Code:', error.code);
      if (error.context) console.error('Context:', error.context);
      console.groupEnd();
    }

    // In production, send to monitoring service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }
  }

  /**
   * Show user feedback based on severity
   */
  private showUserFeedback(error: ErrorDetails): void {
    const message = error.userMessage || error.message;

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(message, { duration: 8000, icon: '🚨' });
        break;
      case ErrorSeverity.HIGH:
        toast.error(message, { duration: 6000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(message, { duration: 4000 });
        break;
      case ErrorSeverity.LOW:
        toast(message, { duration: 3000, icon: '⚠️' });
        break;
    }
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(error: ErrorDetails): void {
    // TODO: Integrate with Sentry or similar service
    // Example:
    // Sentry.captureException(error);
  }

  /**
   * Get error log
   */
  getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorDetails[] {
    return this.errorLog.filter(e => e.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorDetails[] {
    return this.errorLog.filter(e => e.severity === severity);
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience function
export function handleError(error: any, context?: Record<string, any>): ErrorDetails {
  return errorHandler.handle(error, context);
}

export default errorHandler;
