/**
 * Professional Logging System for Souk El-Sayarat
 * Implements best practices for client-side logging and error handling
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  stackTrace?: string;
  component?: string;
  action?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxLocalLogs: number;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
}

class ProfessionalLogger {
  private config: LoggerConfig;
  private localLogs: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: import.meta.env.DEV,
      enableRemote: import.meta.env.PROD,
      maxLocalLogs: 1000,
      enablePerformanceTracking: true,
      enableUserTracking: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger(): void {
    // Set up global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Set up performance monitoring
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceMonitoring();
    }

    // Log initialization
    this.info('Professional Logger initialized', {
      sessionId: this.sessionId,
      config: this.config,
    });
  }

  private handleGlobalError(event: ErrorEvent): void {
    this.error('Global Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.error('Unhandled Promise Rejection', {
      reason: event.reason,
      stack: event.reason?.stack,
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;
          this.info('Page Performance', {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded:
              navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
            firstContentfulPaint:
              performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
          });
        }, 0);
      });
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      stackTrace: new Error().stack,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private writeLog(entry: LogEntry): void {
    // Add to local storage
    this.localLogs.push(entry);
    if (this.localLogs.length > this.config.maxLocalLogs) {
      this.localLogs.shift();
    }

    // Console output
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const message = `[${entry.timestamp}] ${LogLevel[entry.level]}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
      break;
        console.debug(message, entry.context);
        break;
      case LogLevel.INFO:
      break;
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
      break;
        console.warn(message, entry.context);
        break;
      case LogLevel.ERROR:
      break;
      case LogLevel.CRITICAL:
      break;
        console.error(message, entry.context);
        break;
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  // Public API
  public setUserId(userId: string): void {
    this.userId = userId;
    this.info('User ID set', { userId });
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.writeLog(entry);
    }
  }

  public info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      this.writeLog(entry);
    }
  }

  public warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      this.writeLog(entry);
    }
  }

  public error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context);
      this.writeLog(entry);
    }
  }

  public critical(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context);
    this.writeLog(entry);

    // Always alert for critical errors
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.error('CRITICAL ERROR:', message, context);
    }
  }

  // Performance tracking
  public trackPerformance(
    operationName: string,
    startTime: number,
    context?: Record<string, any>
  ): void {
    const duration = performance.now() - startTime;
    this.info(`Performance: ${operationName}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...context,
    });

    // Warn for slow operations
    if (duration > 1000) {
      this.warn(`Slow operation detected: ${operationName}`, {
        duration: `${duration.toFixed(2)}ms`,
        ...context,
      });
    }
  }

  // Component lifecycle tracking
  public trackComponent(
    componentName: string,
    action: 'mount' | 'unmount' | 'update',
    context?: Record<string, any>
  ): void {
    this.debug(`Component ${action}: ${componentName}`, context);
  }

  // User action tracking
  public trackUserAction(action: string, context?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Get logs for debugging
  public getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.localLogs.filter(log => log.level >= level);
    }
    return [...this.localLogs];
  }

  // Clear logs
  public clearLogs(): void {
    this.localLogs = [];
    this.info('Logs cleared');
  }

  // Export logs for analysis
  public exportLogs(): string {
    return JSON.stringify(this.localLogs, null, 2);
  }
}

// Create singleton instance
export const professionalLogger = new ProfessionalLogger({
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: import.meta.env.PROD,
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
  enablePerformanceTracking: true,
  enableUserTracking: true,
});

// Convenience exports
export const logger = professionalLogger;
export default professionalLogger;
