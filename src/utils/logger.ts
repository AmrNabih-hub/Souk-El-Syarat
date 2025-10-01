/**
 * Professional Logger System
 * Environment-aware logging with structured output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): void {
    const { timestamp, level, message, data, context } = entry;
    
    const prefix = context ? `[${context}]` : '';
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    if (this.isDevelopment) {
      // Pretty logging for development
      const style = {
        debug: 'color: #888',
        info: 'color: #0ea5e9',
        warn: 'color: #f59e0b',
        error: 'color: #ef4444; font-weight: bold',
      }[level];

      console.log(
        `%c${emoji} ${prefix} ${message}`,
        style,
        data ? data : ''
      );
    } else {
      // Structured logging for production (can be sent to logging service)
      const logObject = {
        timestamp,
        level,
        message: `${prefix} ${message}`,
        ...(data && { data }),
      };
      
      // Only log errors and warnings in production
      if (level === 'error' || level === 'warn') {
        console[level](JSON.stringify(logObject));
      }
    }
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return;
    this.formatLog({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      data,
      context,
    });
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return;
    this.formatLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data,
      context,
    });
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('warn')) return;
    this.formatLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      data,
      context,
    });
  }

  error(message: string, error?: Error | any, context?: string): void {
    if (!this.shouldLog('error')) return;
    
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;

    this.formatLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      data: errorData,
      context,
    });

    // In production, you could send to error tracking service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Example: Send to Sentry, LogRocket, etc.
      // window.errorTracker?.captureException(error);
    }
  }

  // Convenience methods for common contexts
  auth = {
    debug: (msg: string, data?: any) => this.debug(msg, data, 'AUTH'),
    info: (msg: string, data?: any) => this.info(msg, data, 'AUTH'),
    warn: (msg: string, data?: any) => this.warn(msg, data, 'AUTH'),
    error: (msg: string, error?: any) => this.error(msg, error, 'AUTH'),
  };

  api = {
    debug: (msg: string, data?: any) => this.debug(msg, data, 'API'),
    info: (msg: string, data?: any) => this.info(msg, data, 'API'),
    warn: (msg: string, data?: any) => this.warn(msg, data, 'API'),
    error: (msg: string, error?: any) => this.error(msg, error, 'API'),
  };

  ui = {
    debug: (msg: string, data?: any) => this.debug(msg, data, 'UI'),
    info: (msg: string, data?: any) => this.info(msg, data, 'UI'),
    warn: (msg: string, data?: any) => this.warn(msg, data, 'UI'),
    error: (msg: string, error?: any) => this.error(msg, error, 'UI'),
  };

  performance = {
    debug: (msg: string, data?: any) => this.debug(msg, data, 'PERF'),
    info: (msg: string, data?: any) => this.info(msg, data, 'PERF'),
    warn: (msg: string, data?: any) => this.warn(msg, data, 'PERF'),
    error: (msg: string, error?: any) => this.error(msg, error, 'PERF'),
  };
}

// Export singleton instance
export const logger = new Logger();

// Export for use in components
export default logger;
