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
import { errorHandler } from './enhanced-error-handler.service';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'javascript' | 'promise' | 'network' | 'firebase' | 'auth' | 'image' | 'unknown';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  metadata: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  resourceLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  errorRate: number;
  userSessions: number;
}

export interface UserSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  pageViews: string[];
  errors: ErrorReport[];
  userId?: string;
}

export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errors: ErrorReport[] = [];
  private sessions: UserSession[] = [];
  private currentSession: UserSession | null = null;
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    resourceLoadTimes: {},
    apiResponseTimes: {},
    errorRate: 0,
    userSessions: 0,
  };

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  static initialize(): void {
    ErrorMonitoringService.getInstance();
  }

  static cleanup(): void {
    const instance = ErrorMonitoringService.instance;
    if (instance) {
      // Cleanup logic
      instance.errors = [];
      instance.sessions = [];
      instance.currentSession = null;
    }
  }

  private initializeMonitoring() {
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
    this.startSession();
  }

  private setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        metadata: {
          line: event.lineno,
          column: event.colno,
        },
        severity: 'high',
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        metadata: {
          reason: event.reason,
        },
        severity: 'high',
      });
    });

    // Network error handler
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.recordApiResponse(args[0].toString(), duration, response.status);
        
        if (!response.ok) {
          this.reportError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            metadata: {
              url: args[0].toString(),
              status: response.status,
              duration,
            },
            severity: response.status >= 500 ? 'high' : 'medium',
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.reportError({
          type: 'network',
          message: error instanceof Error ? error.message : 'Network request failed',
          stack: error instanceof Error ? error.stack : undefined,
          metadata: {
            url: args[0].toString(),
            duration,
          },
          severity: 'high',
        });
        throw error;
      }
    };
  }

  private setupPerformanceMonitoring() {
    // Page load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.metrics.pageLoadTime = loadTime;
    });

    // Resource load monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.metrics.resourceLoadTimes[entry.name] = entry.duration;
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private startSession() {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      pageViews: [],
      errors: [],
    };
    
    this.sessions.push(this.currentSession);
    this.metrics.userSessions++;

    // Track page views
    this.trackPageView(window.location.pathname);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  reportError(error: Omit<ErrorReport, 'id' | 'timestamp' | 'resolved'>): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      resolved: false,
      ...error,
    };

    this.errors.push(errorReport);
    
    if (this.currentSession) {
      this.currentSession.errors.push(errorReport);
    }

    // Update error rate
    this.updateErrorRate();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Monitoring]', errorReport);
    }

    // Send to external service if configured
    this.sendToExternalService(errorReport);
  }

  private updateErrorRate() {
    const recentErrors = this.errors.filter(
      (error) => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    this.metrics.errorRate = recentErrors.length / Math.max(this.metrics.userSessions, 1);
  }

  private sendToExternalService(errorReport: ErrorReport) {
    // Send to external error tracking service (e.g., Sentry, LogRocket)
    // This is a placeholder for external service integration
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: errorReport.message,
        fatal: errorReport.severity === 'critical',
      });
    }
  }

  trackPageView(path: string): void {
    if (this.currentSession) {
      this.currentSession.pageViews.push(path);
    }
  }

  recordApiResponse(url: string, duration: number, status: number): void {
    this.metrics.apiResponseTimes[url] = duration;
  }

  setUser(userId: string): void {
    if (this.currentSession) {
      this.currentSession.userId = userId;
    }
    
    // Update all errors with user ID
    this.errors.forEach((error) => {
      if (!error.userId) {
        error.userId = userId;
      }
    });
  }

  getErrorSummary(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
    errorRate: number;
  } {
    const now = new Date();
    const recentErrors = this.errors.filter(
      (error) => now.getTime() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors,
      errorRate: this.metrics.errorRate,
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  static getMetrics(): PerformanceMetrics {
    return ErrorMonitoringService.getInstance().getMetricsInternal();
  }

  static logError(error: Error, context?: string): void {
    ErrorMonitoringService.getInstance().reportError({
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      severity: 'high',
      metadata: { context }
    });
  }

  static clearErrors(): void {
    ErrorMonitoringService.getInstance().clearErrors();
  }

  getMetricsInternal(): PerformanceMetrics {
    return {
      ...this.metrics,
      errorRate: this.errors.length / Math.max(this.sessions.length, 1),
    };
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getSessionErrors(sessionId?: string): ErrorReport[] {
    const targetSession = sessionId 
      ? this.sessions.find(s => s.id === sessionId)
      : this.currentSession;
    
    return targetSession?.errors || [];
  }

  clearErrors(): void {
    this.errors = [];
    if (this.currentSession) {
      this.currentSession.errors = [];
    }
    this.updateErrorRate();
  }

  exportErrors(): string {
    return JSON.stringify({
      errors: this.errors,
      sessions: this.sessions,
      metrics: this.metrics,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  resolveError(errorId: string): boolean {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  getSessionData(): UserSession | null {
    return this.currentSession;
  }

  endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
    }
  }

  // Real-time monitoring dashboard
  createDashboard(): {
    getSummary: () => ReturnType<ErrorMonitoringService['getErrorSummary']>;
    getMetrics: () => PerformanceMetrics;
    subscribe: (callback: (data: any) => void) => () => void;
  } {
    let subscribers: Array<(data: any) => void> = [];

    const notifySubscribers = () => {
      const data = {
        summary: this.getErrorSummary(),
        metrics: this.getPerformanceMetrics(),
        timestamp: new Date(),
      };
      subscribers.forEach((callback) => callback(data));
    };

    // Notify on every error
    const originalReportError = this.reportError.bind(this);
    this.reportError = (error: Omit<ErrorReport, 'id' | 'timestamp' | 'resolved'>) => {
      originalReportError(error);
      notifySubscribers();
    };

    return {
      getSummary: () => this.getErrorSummary(),
      getMetrics: () => this.getPerformanceMetrics(),
      subscribe: (callback: (data: any) => void) => {
        subscribers.push(callback);
        return () => {
          subscribers = subscribers.filter((cb) => cb !== callback);
        };
      },
    };
  }
}

// Hook for using error monitoring in components
export const useErrorMonitoring = () => {
  const monitoring = ErrorMonitoringService.getInstance();

  return {
    reportError: monitoring.reportError.bind(monitoring),
    trackPageView: monitoring.trackPageView.bind(monitoring),
    setUser: monitoring.setUser.bind(monitoring),
    getErrorSummary: monitoring.getErrorSummary.bind(monitoring),
    getPerformanceMetrics: monitoring.getPerformanceMetrics.bind(monitoring),
  };
};

// Global error monitoring instance
export const errorMonitoring = ErrorMonitoringService.getInstance();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  (window as any).errorMonitoring = errorMonitoring;
}

// Type augmentation for window
declare global {
  interface Window {
    errorMonitoring: ErrorMonitoringService;
    gtag?: (...args: any[]) => void;
  }
}