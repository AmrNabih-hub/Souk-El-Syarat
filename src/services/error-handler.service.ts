import toast from 'react-hot-toast';

export interface AppError {
  code: string;
  message: string;
  messageAr: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  timestamp: Date;
  userId?: string;
  action?: string;
}

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message: string;
    messageAr: string;
    validator?: (value: any) => boolean;
  }>;
}

export class ErrorHandlerService {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  // Common error codes and messages
  private static errorCodes = {
    // Authentication Errors
    AUTH_INVALID_CREDENTIALS: {
      message: 'Invalid email or password',
      messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    },
    AUTH_USER_NOT_FOUND: {
      message: 'User not found',
      messageAr: 'المستخدم غير موجود'
    },
    AUTH_EMAIL_ALREADY_EXISTS: {
      message: 'Email already exists',
      messageAr: 'البريد الإلكتروني مسجل بالفعل'
    },
    AUTH_WEAK_PASSWORD: {
      message: 'Password is too weak',
      messageAr: 'كلمة المرور ضعيفة جداً'
    },
    AUTH_NETWORK_ERROR: {
      message: 'Network connection failed',
      messageAr: 'فشل في الاتصال بالشبكة'
    },
    AUTH_TOO_MANY_REQUESTS: {
      message: 'Too many attempts. Please try again later',
      messageAr: 'محاولات كثيرة جداً. يرجى المحاولة لاحقاً'
    },

    // Data Validation Errors
    VALIDATION_REQUIRED_FIELD: {
      message: 'This field is required',
      messageAr: 'هذا الحقل مطلوب'
    },
    VALIDATION_INVALID_EMAIL: {
      message: 'Please enter a valid email address',
      messageAr: 'يرجى إدخال بريد إلكتروني صحيح'
    },
    VALIDATION_INVALID_PHONE: {
      message: 'Please enter a valid Egyptian phone number',
      messageAr: 'يرجى إدخال رقم هاتف مصري صحيح'
    },
    VALIDATION_PASSWORD_TOO_SHORT: {
      message: 'Password must be at least 6 characters',
      messageAr: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    },
    VALIDATION_INVALID_FORMAT: {
      message: 'Invalid format',
      messageAr: 'تنسيق غير صحيح'
    },

    // Payment Errors
    PAYMENT_CARD_DECLINED: {
      message: 'Payment was declined',
      messageAr: 'تم رفض الدفعة'
    },
    PAYMENT_INSUFFICIENT_FUNDS: {
      message: 'Insufficient funds',
      messageAr: 'الرصيد غير كافي'
    },
    PAYMENT_NETWORK_ERROR: {
      message: 'Payment network error',
      messageAr: 'خطأ في شبكة الدفع'
    },
    PAYMENT_INVALID_AMOUNT: {
      message: 'Invalid payment amount',
      messageAr: 'مبلغ الدفع غير صحيح'
    },

    // Order Errors
    ORDER_NOT_FOUND: {
      message: 'Order not found',
      messageAr: 'الطلب غير موجود'
    },
    ORDER_ALREADY_CANCELLED: {
      message: 'Order is already cancelled',
      messageAr: 'الطلب مُلغي بالفعل'
    },
    ORDER_CANNOT_MODIFY: {
      message: 'Order cannot be modified',
      messageAr: 'لا يمكن تعديل الطلب'
    },
    ORDER_INVALID_STATUS: {
      message: 'Invalid order status',
      messageAr: 'حالة الطلب غير صحيحة'
    },

    // Car/Product Errors
    CAR_NOT_FOUND: {
      message: 'Car not found',
      messageAr: 'السيارة غير موجودة'
    },
    CAR_NOT_AVAILABLE: {
      message: 'Car is no longer available',
      messageAr: 'السيارة لم تعد متاحة'
    },
    CAR_PRICE_CHANGED: {
      message: 'Car price has changed',
      messageAr: 'تغير سعر السيارة'
    },

    // Upload/File Errors
    UPLOAD_FILE_TOO_LARGE: {
      message: 'File is too large',
      messageAr: 'الملف كبير جداً'
    },
    UPLOAD_INVALID_FORMAT: {
      message: 'Invalid file format',
      messageAr: 'تنسيق الملف غير صحيح'
    },
    UPLOAD_FAILED: {
      message: 'Upload failed',
      messageAr: 'فشل في رفع الملف'
    },

    // Network Errors
    NETWORK_TIMEOUT: {
      message: 'Request timed out',
      messageAr: 'انتهت مهلة الطلب'
    },
    NETWORK_OFFLINE: {
      message: 'No internet connection',
      messageAr: 'لا يوجد اتصال بالإنترنت'
    },
    NETWORK_SERVER_ERROR: {
      message: 'Server error occurred',
      messageAr: 'حدث خطأ في الخادم'
    },

    // Permission Errors
    PERMISSION_DENIED: {
      message: 'Permission denied',
      messageAr: 'ليس لديك الصلاحية'
    },
    PERMISSION_ADMIN_REQUIRED: {
      message: 'Admin access required',
      messageAr: 'مطلوب صلاحية مدير'
    },

    // General Errors
    UNKNOWN_ERROR: {
      message: 'An unexpected error occurred',
      messageAr: 'حدث خطأ غير متوقع'
    },
    SERVICE_UNAVAILABLE: {
      message: 'Service is temporarily unavailable',
      messageAr: 'الخدمة غير متاحة مؤقتاً'
    }
  };

  // Handle and log errors
  static handleError(
    error: any,
    context?: string,
    userId?: string,
    showToast: boolean = true,
    language: 'ar' | 'en' = 'ar'
  ): AppError {
    let appError: AppError;

    if (error instanceof Error) {
      // Handle Firebase errors
      if (error.message.includes('auth/')) {
        appError = this.handleFirebaseAuthError(error, context, userId);
      } else {
        appError = this.createAppError(error.message, context, userId);
      }
    } else if (typeof error === 'string') {
      appError = this.createAppError(error, context, userId);
    } else {
      appError = this.createAppError('UNKNOWN_ERROR', context, userId);
    }

    // Log error
    this.logError(appError);

    // Show toast notification
    if (showToast) {
      const message = language === 'ar' ? appError.messageAr : appError.message;
      
      if (appError.severity === 'critical' || appError.severity === 'high') {
        toast.error(message, { duration: 6000 });
      } else if (appError.severity === 'medium') {
        toast.error(message, { duration: 4000 });
      } else {
        toast(message, { duration: 3000 });
      }
    }

    return appError;
  }

  // Handle Firebase authentication errors
  private static handleFirebaseAuthError(error: Error, context?: string, userId?: string): AppError {
    let code: string;
    let severity: AppError['severity'] = 'medium';

    switch (error.message) {
      case 'auth/user-not-found':
        code = 'AUTH_USER_NOT_FOUND';
        break;
      case 'auth/wrong-password':
        code = 'AUTH_INVALID_CREDENTIALS';
        break;
      case 'auth/email-already-in-use':
        code = 'AUTH_EMAIL_ALREADY_EXISTS';
        break;
      case 'auth/weak-password':
        code = 'AUTH_WEAK_PASSWORD';
        break;
      case 'auth/too-many-requests':
        code = 'AUTH_TOO_MANY_REQUESTS';
        severity = 'high';
        break;
      case 'auth/network-request-failed':
        code = 'AUTH_NETWORK_ERROR';
        severity = 'high';
        break;
      default:
        code = 'AUTH_INVALID_CREDENTIALS';
    }

    const errorInfo = this.errorCodes[code] || this.errorCodes.UNKNOWN_ERROR;

    return {
      code,
      message: errorInfo.message,
      messageAr: errorInfo.messageAr,
      severity,
      context,
      timestamp: new Date(),
      userId,
      action: context
    };
  }

  // Create app error from message or code
  private static createAppError(messageOrCode: string, context?: string, userId?: string): AppError {
    const errorInfo = this.errorCodes[messageOrCode] || {
      message: messageOrCode,
      messageAr: messageOrCode
    };

    return {
      code: messageOrCode in this.errorCodes ? messageOrCode : 'UNKNOWN_ERROR',
      message: errorInfo.message,
      messageAr: errorInfo.messageAr,
      severity: 'medium',
      context,
      timestamp: new Date(),
      userId,
      action: context
    };
  }

  // Log error to console and store
  private static logError(error: AppError): void {
    console.error('App Error:', {
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      userId: error.userId
    });

    // Store error (keep only latest 100 errors)
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // In production, you might want to send errors to a logging service
    // this.sendErrorToLoggingService(error);
  }

  // Validate data using rules
  static validateData(data: any, rules: ValidationRule[], language: 'ar' | 'en' = 'ar'): {
    isValid: boolean;
    errors: { [field: string]: string };
  } {
    const errors: { [field: string]: string } = {};
    let isValid = true;

    rules.forEach(rule => {
      const fieldValue = data[rule.field];

      rule.rules.forEach(validation => {
        if (!isValid && validation.type === 'required') return; // Skip other validations if required fails

        switch (validation.type) {
          case 'required':
            if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
              errors[rule.field] = language === 'ar' ? validation.messageAr : validation.message;
              isValid = false;
            }
            break;

          case 'email':
            if (fieldValue && !this.isValidEmail(fieldValue)) {
              errors[rule.field] = language === 'ar' ? validation.messageAr : validation.message;
              isValid = false;
            }
            break;

          case 'phone':
            if (fieldValue && !this.isValidEgyptianPhone(fieldValue)) {
              errors[rule.field] = language === 'ar' ? validation.messageAr : validation.message;
              isValid = false;
            }
            break;

          case 'min':
            if (fieldValue && fieldValue.length < validation.value) {
              errors[rule.field] = language === 'ar' ? validation.messageAr : validation.message;
              isValid = false;
            }
            break;

          case 'max':
            if (fieldValue && fieldValue.length > validation.value) {
              errors[rule.field] = language === 'ar' ? validation.messageAr : validation.message;
              isValid = false;
            }
            break;

          case 'pattern':
            if (fieldValue && !new RegExp(validation.value).test(fieldValue)) {
              errors[rule.field] = language === 'ar' ? validation.messageAr : validation.message;
              isValid = false;
            }
            break;

          case 'custom':
            if (validation.validator && !validation.validator(fieldValue)) {
              errors[rule.field] = language === 'ar' ? validation.messageAr : validation.message;
              isValid = false;
            }
            break;
        }
      });
    });

    return { isValid, errors };
  }

  // Validation helpers
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidEgyptianPhone(phone: string): boolean {
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s-+]/g, ''));
  }

  // Show success message
  static showSuccess(message: string, messageAr?: string, language: 'ar' | 'en' = 'ar'): void {
    const displayMessage = language === 'ar' && messageAr ? messageAr : message;
    toast.success(displayMessage, { duration: 3000 });
  }

  // Show info message
  static showInfo(message: string, messageAr?: string, language: 'ar' | 'en' = 'ar'): void {
    const displayMessage = language === 'ar' && messageAr ? messageAr : message;
    toast(displayMessage, { duration: 3000 });
  }

  // Show warning message
  static showWarning(message: string, messageAr?: string, language: 'ar' | 'en' = 'ar'): void {
    const displayMessage = language === 'ar' && messageAr ? messageAr : message;
    toast(displayMessage, { 
      duration: 4000,
      icon: '⚠️'
    });
  }

  // Get recent errors for debugging
  static getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(0, limit);
  }

  // Clear error log
  static clearErrors(): void {
    this.errors = [];
  }

  // Get error statistics
  static getErrorStats(): {
    total: number;
    bySeverity: { [key: string]: number };
    byCode: { [key: string]: number };
    recent: AppError[];
  } {
    const bySeverity: { [key: string]: number } = {};
    const byCode: { [key: string]: number } = {};

    this.errors.forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCode[error.code] = (byCode[error.code] || 0) + 1;
    });

    return {
      total: this.errors.length,
      bySeverity,
      byCode,
      recent: this.errors.slice(0, 5)
    };
  }

  // Retry mechanism for failed operations
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed for ${context}:`, error);

        if (attempt === maxRetries) {
          throw this.handleError(error, `${context} (after ${maxRetries} retries)`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }

  // Safe async operation wrapper
  static async safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string,
    showError: boolean = true
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context, undefined, showError);
      return fallback;
    }
  }

  // Network status checker
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // Handle offline scenarios
  static handleOffline(callback?: () => void): void {
    if (!this.isOnline()) {
      this.showWarning(
        'You are currently offline',
        'أنت غير متصل بالإنترنت حالياً'
      );
      callback?.();
    }
  }
}

export default ErrorHandlerService;