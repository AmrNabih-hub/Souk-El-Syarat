/**
 * RUNTIME ERROR DETECTOR & HANDLER
 * Staff Engineer Implementation for Production Error Monitoring
 */

interface ErrorReport {
  type: 'error' | 'warning' | 'network' | 'performance';
  message: string;
  stack?: string;
  url?: string;
  timestamp: Date;
  userAgent: string;
  resolved: boolean;
  resolution?: string;
}

class RuntimeErrorDetector {
  private errors: ErrorReport[] = [];
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.initialize();
  }

  private initialize() {
    // Override console methods
    this.overrideConsole();
    
    // Setup global error handlers
    this.setupErrorHandlers();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Auto-fix common errors
    this.setupAutoFixes();
  }

  private overrideConsole() {
    // Override console.error
    console.error = (...args: any[]) => {
      const error = this.createErrorReport('error', args.join(' '));
      this.handleError(error);
      this.originalConsoleError.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const error = this.createErrorReport('warning', args.join(' '));
      this.handleError(error);
      this.originalConsoleWarn.apply(console, args);
    };
  }

  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event: ErrorEvent) => {
      const error = this.createErrorReport('error', event.message, event.error?.stack, event.filename);
      this.handleError(error);
      
      // Prevent default error handling for known issues
      if (this.canAutoFix(error)) {
        event.preventDefault();
        this.autoFix(error);
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const error = this.createErrorReport('error', `Unhandled Promise Rejection: ${event.reason}`);
      this.handleError(error);
      
      // Prevent default for known issues
      if (this.canAutoFix(error)) {
        event.preventDefault();
        this.autoFix(error);
      }
    });
  }

  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        // Monitor long tasks
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              const error = this.createErrorReport(
                'performance',
                `Long task detected: ${entry.duration.toFixed(2)}ms`
              );
              this.handleError(error);
            }
          }
        });
        
        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Silently fail if longtask is not supported
      }
    }
  }

  private setupNetworkMonitoring() {
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        // Log slow requests
        if (duration > 3000) {
          const error = this.createErrorReport(
            'performance',
            `Slow API request: ${args[0]} took ${duration.toFixed(2)}ms`
          );
          this.handleError(error);
        }
        
        // Log failed requests
        if (!response.ok) {
          const error = this.createErrorReport(
            'network',
            `HTTP ${response.status}: ${args[0]}`
          );
          this.handleError(error);
        }
        
        return response;
      } catch (error: any) {
        const errorReport = this.createErrorReport(
          'network',
          `Network request failed: ${args[0]} - ${error.message}`
        );
        this.handleError(errorReport);
        throw error;
      }
    };
  }

  private setupAutoFixes() {
    // Fix common Firebase errors
    this.addAutoFix(
      /Firebase.*not.*initialized/i,
      () => {
        console.log('🔧 Auto-fixing: Reinitializing Firebase...');
        // Trigger Firebase reinitialization
        window.location.reload();
      }
    );

    // Fix service worker errors
    this.addAutoFix(
      /Service.*Worker.*registration.*failed/i,
      () => {
        console.log('🔧 Auto-fixing: Clearing service worker cache...');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => reg.unregister());
          });
        }
      }
    );

    // Fix cache errors
    this.addAutoFix(
      /Failed.*to.*fetch|cache.*error/i,
      () => {
        console.log('🔧 Auto-fixing: Clearing browser cache...');
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      }
    );

    // Fix memory issues
    this.addAutoFix(
      /out.*of.*memory|memory.*leak/i,
      () => {
        console.log('🔧 Auto-fixing: Clearing memory...');
        // Clear unused references
        if (window.gc) {
          window.gc();
        }
        // Clear large data structures
        localStorage.clear();
        sessionStorage.clear();
      }
    );
  }

  private autoFixes: Array<{ pattern: RegExp; fix: () => void }> = [];

  private addAutoFix(pattern: RegExp, fix: () => void) {
    this.autoFixes.push({ pattern, fix });
  }

  private canAutoFix(error: ErrorReport): boolean {
    return this.autoFixes.some(af => af.pattern.test(error.message));
  }

  private autoFix(error: ErrorReport) {
    const autoFix = this.autoFixes.find(af => af.pattern.test(error.message));
    if (autoFix) {
      try {
        autoFix.fix();
        error.resolved = true;
        error.resolution = 'Auto-fixed';
      } catch (e) {
        console.error('Auto-fix failed:', e);
      }
    }
  }

  private createErrorReport(
    type: ErrorReport['type'],
    message: string,
    stack?: string,
    url?: string
  ): ErrorReport {
    return {
      type,
      message,
      stack,
      url,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      resolved: false
    };
  }

  private handleError(error: ErrorReport) {
    // Store error
    this.errors.push(error);
    
    // Log to monitoring service (if configured)
    this.logToMonitoring(error);
    
    // Show user-friendly message for critical errors
    if (error.type === 'error' && !error.resolved) {
      this.showUserNotification(error);
    }
  }

  private logToMonitoring(error: ErrorReport) {
    // Send to monitoring service
    // This would typically send to Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // In production, send to monitoring service
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    }
  }

  private showUserNotification(error: ErrorReport) {
    // Don't show technical errors to users
    const userFriendlyMessages: Record<string, string> = {
      'Network request failed': 'Connection error. Please check your internet.',
      'Firebase': 'Service temporarily unavailable. Please refresh the page.',
      'Out of memory': 'Performance issue detected. Please refresh the page.',
      'Unauthorized': 'Please log in to continue.',
    };

    const friendlyMessage = Object.entries(userFriendlyMessages).find(([key]) => 
      error.message.includes(key)
    )?.[1] || 'Something went wrong. Please try again.';

    // Show toast notification if available
    if (window.showToast) {
      window.showToast(friendlyMessage, 'error');
    }
  }

  public getErrors(): ErrorReport[] {
    return this.errors;
  }

  public clearErrors() {
    this.errors = [];
  }

  public generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      errorsByType: this.errors.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      resolvedCount: this.errors.filter(e => e.resolved).length,
      unresolvedErrors: this.errors.filter(e => !e.resolved).map(e => ({
        type: e.type,
        message: e.message,
        timestamp: e.timestamp
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  public destroy() {
    // Restore original console methods
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    
    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Export singleton instance
export const errorDetector = new RuntimeErrorDetector();

// Extend window interface
declare global {
  interface Window {
    errorDetector: RuntimeErrorDetector;
    showToast: (message: string, type: string) => void;
    gc: () => void;
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.errorDetector = errorDetector;
}