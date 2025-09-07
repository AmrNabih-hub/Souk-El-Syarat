/**
 * Comprehensive Error Handling and Logging Service
 * Enterprise-level error management with detailed logging and monitoring
 */

import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  push, 
  set 
} from 'firebase/database';
import { db, realtimeDb } from '@/config/firebase.config';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  stack?: string;
  context: ErrorContext;
  userId?: string;
  sessionId?: string;
  userAgent: string;
  url: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface ErrorContext {
  component?: string;
  function?: string;
  action?: string;
  api?: string;
  database?: string;
  network?: boolean;
  userAction?: string;
  browserInfo?: {
    name: string;
    version: string;
    os: string;
  };
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLevel: Record<ErrorLevel, number>;
  errorsByComponent: Record<string, number>;
  errorsByType: Record<string, number>;
  errorRate: number;
  resolutionRate: number;
  averageResolutionTime: number;
  topErrors: Array<{ message: string; count: number }>;
}

export type ErrorLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ErrorHandler {
  handle(error: Error, context?: ErrorContext): Promise<void>;
  log(level: ErrorLevel, message: string, context?: ErrorContext): Promise<void>;
  trackUserAction(action: string, context?: ErrorContext): Promise<void>;
  trackPerformance(metrics: PerformanceMetrics): Promise<void>;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
}

export class ErrorHandlingService implements ErrorHandler {
  private static instance: ErrorHandlingService;
  private errorQueue: ErrorLog[] = [];
  private isOnline = true;
  private sessionId: string;
  private userId?: string;
  private errorCounts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Initialize error handling service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      this.userId = userId;
      this.sessionId = this.generateSessionId();
      
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Set up connection monitoring
      this.setupConnectionMonitoring();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      // Process any queued errors
      await this.processErrorQueue();

      console.log('✅ Error handling service initialized');
    } catch (error) {
      console.error('Failed to initialize error handling service:', error);
    }
  }

  /**
   * Handle error with context
   */
  async handle(error: Error, context: ErrorContext = {}): Promise<void> {
    try {
      const errorLog: ErrorLog = {
        id: this.generateErrorId(),
        timestamp: new Date(),
        level: this.determineErrorLevel(error),
        message: error.message,
        stack: error.stack,
        context: {
          ...context,
          browserInfo: this.getBrowserInfo()
        },
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        resolved: false,
        tags: this.generateTags(error, context),
        metadata: this.extractMetadata(error, context)
      };

      // Add to queue
      this.errorQueue.push(errorLog);

      // Update error counts
      this.updateErrorCounts(errorLog);

      // Process queue if online
      if (this.isOnline) {
        await this.processErrorQueue();
      }

      // Log to console based on level
      this.logToConsole(errorLog);

      // Send to external monitoring if configured
      await this.sendToExternalMonitoring(errorLog);

    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
    }
  }

  /**
   * Log message with level and context
   */
  async log(level: ErrorLevel, message: string, context: ErrorContext = {}): Promise<void> {
    try {
      const errorLog: ErrorLog = {
        id: this.generateErrorId(),
        timestamp: new Date(),
        level,
        message,
        context: {
          ...context,
          browserInfo: this.getBrowserInfo()
        },
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        resolved: false,
        tags: this.generateTags(null, context),
        metadata: context
      };

      // Add to queue
      this.errorQueue.push(errorLog);

      // Process queue if online
      if (this.isOnline) {
        await this.processErrorQueue();
      }

      // Log to console
      this.logToConsole(errorLog);

    } catch (error) {
      console.error('Error in log handler:', error);
    }
  }

  /**
   * Track user action
   */
  async trackUserAction(action: string, context: ErrorContext = {}): Promise<void> {
    await this.log('info', `User action: ${action}`, {
      ...context,
      userAction: action
    });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metrics: PerformanceMetrics): Promise<void> {
    await this.log('info', 'Performance metrics', {
      ...metrics,
      component: 'performance'
    });
  }

  /**
   * Get error metrics
   */
  async getErrorMetrics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<ErrorMetrics> {
    try {
      const now = new Date();
      const startTime = this.getStartTime(now, timeRange);
      
      const errorsRef = collection(db, 'errorLogs');
      const q = query(
        errorsRef,
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const errors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ErrorLog));

      return this.calculateErrorMetrics(errors);
    } catch (error) {
      console.error('Error getting error metrics:', error);
      throw error;
    }
  }

  /**
   * Get unresolved errors
   */
  async getUnresolvedErrors(): Promise<ErrorLog[]> {
    try {
      const errorsRef = collection(db, 'errorLogs');
      const q = query(
        errorsRef,
        where('resolved', '==', false),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ErrorLog));
    } catch (error) {
      console.error('Error getting unresolved errors:', error);
      throw error;
    }
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string, resolvedBy: string): Promise<void> {
    try {
      const errorRef = ref(realtimeDb, `errorLogs/${errorId}`);
      await set(errorRef, {
        resolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy
      });

      // Also update in Firestore
      const errorDoc = doc(db, 'errorLogs', errorId);
      await updateDoc(errorDoc, {
        resolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy
      });

    } catch (error) {
      console.error('Error resolving error:', error);
      throw error;
    }
  }

  /**
   * Get error trends
   */
  async getErrorTrends(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    timeline: Array<{ date: string; count: number }>;
    topErrors: Array<{ message: string; count: number }>;
    errorRate: number;
  }> {
    try {
      const now = new Date();
      const startTime = this.getStartTime(now, timeRange);
      
      const errorsRef = collection(db, 'errorLogs');
      const q = query(
        errorsRef,
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const errors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ErrorLog));

      return this.calculateErrorTrends(errors, timeRange);
    } catch (error) {
      console.error('Error getting error trends:', error);
      throw error;
    }
  }

  // Private helper methods

  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    try {
      const batch = this.errorQueue.splice(0, 10); // Process 10 errors at a time
      
      for (const errorLog of batch) {
        // Store in Firestore
        await addDoc(collection(db, 'errorLogs'), {
          ...errorLog,
          timestamp: serverTimestamp()
        });

        // Store in Realtime Database for real-time monitoring
        const realTimeRef = ref(realtimeDb, `errorLogs/${errorLog.id}`);
        await set(realTimeRef, errorLog);
      }
    } catch (error) {
      console.error('Error processing error queue:', error);
      // Re-add errors to queue for retry
      this.errorQueue.unshift(...batch);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handle(event.error, {
        component: 'global',
        function: 'errorHandler',
        action: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handle(new Error(event.reason), {
        component: 'global',
        function: 'errorHandler',
        action: 'unhandled_rejection'
      });
    });

    // Handle fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.handle(new Error(`HTTP ${response.status}: ${response.statusText}`), {
            component: 'network',
            function: 'fetch',
            action: 'http_error',
            api: args[0]?.toString(),
            network: true
          });
        }
        return response;
      } catch (error) {
        this.handle(error as Error, {
          component: 'network',
          function: 'fetch',
          action: 'network_error',
          api: args[0]?.toString(),
          network: true
        });
        throw error;
      }
    };
  }

  private setupConnectionMonitoring(): void {
    const connectedRef = ref(realtimeDb, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      this.isOnline = snapshot.val() === true;
      
      if (this.isOnline && this.errorQueue.length > 0) {
        this.processErrorQueue();
      }
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.trackPerformance({
        pageLoadTime: loadTime,
        apiResponseTime: 0,
        renderTime: 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        networkLatency: 0,
        errorRate: 0
      });
    });

    // Monitor memory usage
    setInterval(() => {
      if ((performance as any).memory) {
        this.trackPerformance({
          pageLoadTime: 0,
          apiResponseTime: 0,
          renderTime: 0,
          memoryUsage: (performance as any).memory.usedJSHeapSize,
          networkLatency: 0,
          errorRate: 0
        });
      }
    }, 30000); // Every 30 seconds
  }

  private determineErrorLevel(error: Error): ErrorLevel {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'error';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'warn';
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'error';
    }
    return 'error';
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTags(error: Error | null, context: ErrorContext): string[] {
    const tags: string[] = [];
    
    if (error) {
      tags.push(error.name);
      if (error.message.includes('network')) tags.push('network');
      if (error.message.includes('auth')) tags.push('authentication');
      if (error.message.includes('database')) tags.push('database');
    }
    
    if (context.component) tags.push(`component:${context.component}`);
    if (context.function) tags.push(`function:${context.function}`);
    if (context.action) tags.push(`action:${context.action}`);
    if (context.network) tags.push('network-error');
    
    return tags;
  }

  private extractMetadata(error: Error, context: ErrorContext): Record<string, any> {
    return {
      errorName: error.name,
      errorMessage: error.message,
      ...context
    };
  }

  private updateErrorCounts(errorLog: ErrorLog): void {
    const key = `${errorLog.level}:${errorLog.message}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  private logToConsole(errorLog: ErrorLog): void {
    const message = `[${errorLog.level.toUpperCase()}] ${errorLog.message}`;
    
    switch (errorLog.level) {
      case 'debug':
        console.debug(message, errorLog.context);
        break;
      case 'info':
        console.info(message, errorLog.context);
        break;
      case 'warn':
        console.warn(message, errorLog.context);
        break;
      case 'error':
      case 'fatal':
        console.error(message, errorLog.context);
        break;
    }
  }

  private async sendToExternalMonitoring(errorLog: ErrorLog): Promise<void> {
    // This would integrate with external monitoring services like Sentry, LogRocket, etc.
    // For now, we'll just log that we would send it
    if (errorLog.level === 'fatal' || errorLog.level === 'error') {
      console.log('Would send to external monitoring:', errorLog);
    }
  }

  private getBrowserInfo(): { name: string; version: string; os: string } {
    const userAgent = navigator.userAgent;
    
    // Simple browser detection
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    }
    
    // Simple OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return { name: browserName, version: browserVersion, os };
  }

  private getStartTime(now: Date, timeRange: string): Date {
    const start = new Date(now);
    switch (timeRange) {
      case 'hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  private calculateErrorMetrics(errors: ErrorLog[]): ErrorMetrics {
    const errorsByLevel: Record<ErrorLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0
    };

    const errorsByComponent: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};
    const errorMessages: Record<string, number> = {};

    errors.forEach(error => {
      errorsByLevel[error.level]++;
      
      if (error.context.component) {
        errorsByComponent[error.context.component] = (errorsByComponent[error.context.component] || 0) + 1;
      }
      
      if (error.context.action) {
        errorsByType[error.context.action] = (errorsByType[error.context.action] || 0) + 1;
      }
      
      errorMessages[error.message] = (errorMessages[error.message] || 0) + 1;
    });

    const resolvedErrors = errors.filter(e => e.resolved).length;
    const resolutionRate = errors.length > 0 ? (resolvedErrors / errors.length) * 100 : 0;

    const topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return {
      totalErrors: errors.length,
      errorsByLevel,
      errorsByComponent,
      errorsByType,
      errorRate: errors.length, // This would need to be calculated based on total requests
      resolutionRate,
      averageResolutionTime: 0, // This would need additional calculation
      topErrors
    };
  }

  private calculateErrorTrends(errors: ErrorLog[], timeRange: string): {
    timeline: Array<{ date: string; count: number }>;
    topErrors: Array<{ message: string; count: number }>;
    errorRate: number;
  } {
    // Group errors by time period
    const timeline: Record<string, number> = {};
    const errorMessages: Record<string, number> = {};

    errors.forEach(error => {
      const date = this.formatDateForTimeline(error.timestamp, timeRange);
      timeline[date] = (timeline[date] || 0) + 1;
      errorMessages[error.message] = (errorMessages[error.message] || 0) + 1;
    });

    const timelineArray = Object.entries(timeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return {
      timeline: timelineArray,
      topErrors,
      errorRate: errors.length
    };
  }

  private formatDateForTimeline(date: Date, timeRange: string): string {
    switch (timeRange) {
      case 'hour':
        return date.toISOString().slice(0, 13) + ':00:00';
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      case 'month':
        return date.toISOString().slice(0, 7);
      default:
        return date.toISOString().slice(0, 10);
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.errorQueue = [];
    this.errorCounts.clear();
  }
}

export default ErrorHandlingService;