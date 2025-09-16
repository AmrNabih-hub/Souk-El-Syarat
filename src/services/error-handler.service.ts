/**
 * 🚨 PROFESSIONAL ERROR HANDLING SERVICE
 * Souk El-Syarat - Comprehensive Error Management
 */

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

export interface ErrorReport {
  id: string;
  type: 'network' | 'firebase' | 'validation' | 'runtime' | 'unknown';
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  createdAt: Date;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Handle and categorize errors
   */
  static handleError(
    error: Error | unknown,
    context: ErrorContext,
    severity: ErrorReport['severity'] = 'medium'
  ): ErrorReport {
    const errorHandler = ErrorHandlerService.getInstance();
    
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: errorHandler.categorizeError(error),
      message: errorHandler.extractMessage(error),
      stack: errorHandler.extractStack(error),
      context,
      severity,
      resolved: false,
      createdAt: new Date(),
    };

    // Add to queue
    errorHandler.addToQueue(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Report:', errorReport);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      errorHandler.sendToMonitoring(errorReport);
    }

    return errorReport;
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: Error | unknown): ErrorReport['type'] {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'network';
    }
    
    if (error instanceof Error) {
      if (error.message.includes('Firebase') || error.message.includes('firebase')) {
        return 'firebase';
      }
      if (error.message.includes('validation') || error.message.includes('required')) {
        return 'validation';
      }
    }

    return 'unknown';
  }

  /**
   * Extract error message
   */
  private extractMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Extract stack trace
   */
  private extractStack(error: Error | unknown): string | undefined {
    if (error instanceof Error && error.stack) {
      return error.stack;
    }
    return undefined;
  }

  /**
   * Add error to queue
   */
  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Send to monitoring service
   */
  private async sendToMonitoring(errorReport: ErrorReport): Promise<void> {
    try {
      // In production, send to your monitoring service
      // Example: Sentry, LogRocket, etc.
      console.log('📊 Sending error to monitoring service:', errorReport.id);
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ErrorReport[];
  } {
    const byType = this.errorQueue.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = this.errorQueue.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = this.errorQueue
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      total: this.errorQueue.length,
      byType,
      bySeverity,
      recent,
    };
  }

  /**
   * Clear resolved errors
   */
  clearResolvedErrors(): void {
    this.errorQueue = this.errorQueue.filter(error => !error.resolved);
  }

  /**
   * Mark error as resolved
   */
  markAsResolved(errorId: string): boolean {
    const error = this.errorQueue.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }
}

// Export convenience functions
export const handleError = ErrorHandlerService.handleError;
export const getErrorStats = () => ErrorHandlerService.getInstance().getErrorStats();
export const clearResolvedErrors = () => ErrorHandlerService.getInstance().clearResolvedErrors();
export const markErrorAsResolved = (errorId: string) => 
  ErrorHandlerService.getInstance().markAsResolved(errorId);

export default ErrorHandlerService;
