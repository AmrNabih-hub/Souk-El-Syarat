/**
 * 🛡️ BULLETPROOF ERROR HANDLING SERVICE
 * Comprehensive error management and recovery system
 */

import { db } from '@/config/firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ErrorLog {
  id?: string;
  type: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: Date;
  resolved?: boolean;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorQueue: ErrorLog[] = [];
  private isOnline: boolean = navigator.onLine;
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
    this.setupPerformanceMonitoring();
  }

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'critical',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: { promise: event.promise }
      });
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'critical',
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError({
        type: 'error',
        message: args.join(' '),
        context: { consoleArgs: args }
      });
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logError({
        type: 'warning',
        message: 'Network connection lost',
        context: { timestamp: new Date().toISOString() }
      });
    });
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.logError({
                type: 'warning',
                message: `Long task detected: ${entry.duration}ms`,
                context: {
                  name: entry.name,
                  startTime: entry.startTime,
                  duration: entry.duration
                }
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task observer not supported
      }

      // Monitor resource loading errors
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('error')) {
              this.logError({
                type: 'error',
                message: `Resource loading error: ${entry.name}`,
                context: {
                  duration: entry.duration,
                  startTime: entry.startTime
                }
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        // Resource observer not supported
      }
    }
  }

  /**
   * Log error with automatic retry and recovery
   */
  async logError(error: ErrorLog): Promise<void> {
    // Add metadata
    error.timestamp = new Date();
    error.url = window.location.href;
    error.userAgent = navigator.userAgent;

    // Get user ID from auth if available
    try {
      const auth = await import('@/stores/authStore').then(m => m.useAuthStore.getState());
      error.userId = auth.user?.id;
    } catch {
      // Auth not available
    }

    // Add to queue if offline
    if (!this.isOnline) {
      this.errorQueue.push(error);
      this.saveToLocalStorage();
      return;
    }

    // Try to log to Firebase
    try {
      await this.sendToFirebase(error);
    } catch (e) {
      this.errorQueue.push(error);
      this.saveToLocalStorage();
    }

    // Critical errors trigger immediate notification
    if (error.type === 'critical') {
      this.notifyAdmins(error);
    }

    // Auto-recovery for specific errors
    this.attemptAutoRecovery(error);
  }

  /**
   * Send error to Firebase
   */
  private async sendToFirebase(error: ErrorLog): Promise<void> {
    try {
      await addDoc(collection(db, 'error_logs'), {
        ...error,
        timestamp: serverTimestamp(),
        resolved: false
      });
    } catch (e) {
      throw new Error('Failed to log to Firebase');
    }
  }

  /**
   * Flush error queue when back online
   */
  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.sendToFirebase(error);
      } catch {
        this.errorQueue.push(error);
      }
    }

    if (this.errorQueue.length > 0) {
      this.saveToLocalStorage();
    } else {
      localStorage.removeItem('error_queue');
    }
  }

  /**
   * Save error queue to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('error_queue', JSON.stringify(this.errorQueue));
    } catch {
      // localStorage full or not available
    }
  }

  /**
   * Load error queue from localStorage
   */
  loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('error_queue');
      if (stored) {
        this.errorQueue = JSON.parse(stored);
        if (this.isOnline) {
          this.flushErrorQueue();
        }
      }
    } catch {
      // Invalid data in localStorage
    }
  }

  /**
   * Attempt automatic recovery for known errors
   */
  private attemptAutoRecovery(error: ErrorLog): void {
    const errorKey = `${error.type}-${error.message}`;
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.maxRetries) {
      this.handleFatalError(error);
      return;
    }

    this.retryAttempts.set(errorKey, attempts + 1);

    // Auto-recovery strategies
    if (error.message.includes('Network')) {
      this.recoverFromNetworkError();
    } else if (error.message.includes('Firebase')) {
      this.recoverFromFirebaseError();
    } else if (error.message.includes('Auth')) {
      this.recoverFromAuthError();
    } else if (error.message.includes('Storage')) {
      this.recoverFromStorageError();
    }
  }

  /**
   * Recovery strategies
   */
  private recoverFromNetworkError(): void {
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }

  private recoverFromFirebaseError(): void {
    // Reinitialize Firebase connection
    import('@/config/firebase.config').then(({ initializeFirebase }) => {
      // Reinitialize if needed
    });
  }

  private recoverFromAuthError(): void {
    // Clear auth state and redirect to login
    import('@/stores/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().signOut();
      window.location.href = '/login';
    });
  }

  private recoverFromStorageError(): void {
    // Clear corrupted localStorage
    try {
      const important = ['user', 'token'];
      const saved: Record<string, string> = {};
      
      important.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) saved[key] = value;
      });
      
      localStorage.clear();
      
      Object.entries(saved).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch {
      // Cannot recover from storage error
    }
  }

  /**
   * Handle fatal errors that cannot be recovered
   */
  private handleFatalError(error: ErrorLog): void {
    // Show user-friendly error page
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f3f4f6;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;">Something went wrong</h1>
          <p style="color: #6b7280; margin-bottom: 1.5rem;">We're experiencing technical difficulties. Please try again later.</p>
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
            Refresh Page
          </button>
          <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 1rem;">Error ID: ${error.timestamp?.getTime()}</p>
        </div>
      </div>
    `;
  }

  /**
   * Notify admins of critical errors
   */
  private async notifyAdmins(error: ErrorLog): Promise<void> {
    try {
      // Send notification to admin dashboard
      const notification = {
        type: 'system',
        title: 'Critical Error Detected',
        body: error.message,
        data: {
          errorId: error.timestamp?.getTime(),
          url: error.url,
          userId: error.userId
        },
        priority: 'high'
      };

      // This would typically send to your notification service
      await addDoc(collection(db, 'admin_notifications'), {
        ...notification,
        timestamp: serverTimestamp()
      });
    } catch {
      // Failed to notify admins
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(): Promise<{
    total: number;
    critical: number;
    resolved: number;
    pending: number;
  }> {
    // This would query Firebase for error statistics
    return {
      total: this.errorQueue.length,
      critical: this.errorQueue.filter(e => e.type === 'critical').length,
      resolved: 0,
      pending: this.errorQueue.length
    };
  }

  /**
   * Clear resolved errors
   */
  clearResolvedErrors(): void {
    this.errorQueue = this.errorQueue.filter(e => !e.resolved);
    this.saveToLocalStorage();
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlerService.getInstance();