/**
 * Enterprise Error Boundary System
 * Advanced error handling with monitoring, recovery, and user experience
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  BugAntIcon,
  ShieldExclamationIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// Advanced Error Types
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  RENDERING = 'rendering',
  PERFORMANCE = 'performance',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown',
}

export interface EnhancedError extends Error {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  componentStack?: string;
  errorBoundary?: string;
  retryable?: boolean;
  metadata?: Record<string, any>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: EnhancedError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
  isRecovering: boolean;
  showDetails: boolean;
}

interface EnterpriseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
  name?: string;
  onError?: (error: EnhancedError, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  autoRecovery?: boolean;
  showErrorDetails?: boolean;
  enableTelemetry?: boolean;
}

// Error Analytics Service
class ErrorAnalyticsService {
  private static instance: ErrorAnalyticsService;
  private errorQueue: EnhancedError[] = [];
  private telemetryEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): ErrorAnalyticsService {
    if (!ErrorAnalyticsService.instance) {
      ErrorAnalyticsService.instance = new ErrorAnalyticsService();
    }
    return ErrorAnalyticsService.instance;
  }

  public reportError(error: EnhancedError): void {
    if (!this.telemetryEnabled) return;

    // Enhance error with additional context
    const enhancedError: EnhancedError = {
      ...error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
    };

    // Add to queue for batch processing
    this.errorQueue.push(enhancedError);

    // Immediate reporting for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.flushErrors();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Enhanced Error:', enhancedError);
      console.groupEnd();
    }

    // Send to monitoring service (Firebase Analytics, Sentry, etc.)
    this.sendToMonitoring(enhancedError);
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-session-id', sessionId);
    }
    return sessionId;
  }

  private async sendToMonitoring(error: EnhancedError): Promise<void> {
    try {
      // Send to Firebase Analytics (if available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: error.severity === ErrorSeverity.CRITICAL,
          error_category: error.category,
          error_boundary: error.errorBoundary,
        });
      }

      // Send to custom error tracking service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      }).catch(() => {
        // Silently fail - don't cause more errors
      });
    } catch (monitoringError) {
      console.warn('Failed to send error to monitoring service:', monitoringError);
    }
  }

  private flushErrors(): void {
    if (this.errorQueue.length === 0) return;

    // Process error queue
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    // Send batch to monitoring service
    errors.forEach(error => this.sendToMonitoring(error));
  }
}

// Error Recovery Strategies
class ErrorRecoveryService {
  public static canRecover(error: EnhancedError): boolean {
    // Network errors are usually recoverable
    if (error.category === ErrorCategory.NETWORK) return true;
    
    // External service errors might be temporary
    if (error.category === ErrorCategory.EXTERNAL_SERVICE) return true;
    
    // Performance errors might resolve with retry
    if (error.category === ErrorCategory.PERFORMANCE) return true;
    
    // Check if error is explicitly marked as retryable
    if (error.retryable) return true;
    
    return false;
  }

  public static getRecoveryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  public static async attemptRecovery(error: EnhancedError): Promise<boolean> {
    try {
      switch (error.category) {
        case ErrorCategory.NETWORK:
          // Check network connectivity
          if (navigator.onLine) {
            return true; // Network is back, safe to retry
          }
          return false;

        case ErrorCategory.EXTERNAL_SERVICE:
          // Ping external service
          const response = await fetch('/api/health-check', { method: 'HEAD' });
          return response.ok;

        default:
          return true; // Assume recovery is possible
      }
    } catch {
      return false;
    }
  }
}

// Main Error Boundary Component
export class EnterpriseErrorBoundary extends Component<
  EnterpriseErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimer: NodeJS.Timeout | null = null;
  private errorAnalytics = ErrorAnalyticsService.getInstance();

  constructor(props: EnterpriseErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
      isRecovering: false,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const enhancedError: EnhancedError = {
      ...error,
      category: this.categorizeError(error),
      severity: this.assessSeverity(error),
      errorBoundary: this.props.name || 'UnnamedBoundary',
      componentStack: errorInfo.componentStack,
      retryable: ErrorRecoveryService.canRecover(error as EnhancedError),
    };

    this.setState({
      error: enhancedError,
      errorInfo,
    });

    // Report error to analytics
    this.errorAnalytics.reportError(enhancedError);

    // Call custom error handler
    this.props.onError?.(enhancedError, errorInfo);

    // Attempt auto-recovery if enabled
    if (this.props.autoRecovery && ErrorRecoveryService.canRecover(enhancedError)) {
      this.scheduleRetry();
    }
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('auth') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (stack.includes('render') || message.includes('render')) {
      return ErrorCategory.RENDERING;
    }

    return ErrorCategory.UNKNOWN;
  }

  private assessSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    // Critical errors that break core functionality
    if (message.includes('chunk') || message.includes('module')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity for authentication/authorization
    if (message.includes('auth') || message.includes('security')) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium for network and external services
    if (message.includes('network') || message.includes('api')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private scheduleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return; // Max retries reached
    }

    const delay = ErrorRecoveryService.getRecoveryDelay(retryCount);

    this.setState({ isRecovering: true });

    this.retryTimer = setTimeout(async () => {
      const { error } = this.state;
      
      if (error && await ErrorRecoveryService.attemptRecovery(error)) {
        this.handleRetry();
      } else {
        this.setState({ 
          isRecovering: false,
          retryCount: retryCount + 1 
        });
      }
    }, delay);
  };

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      isRecovering: false,
    });
  };

  private toggleDetails = (): void => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  public componentWillUnmount(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  private renderErrorUI(): ReactNode {
    const { error, errorInfo, retryCount, isRecovering, showDetails } = this.state;
    const { level = 'component', maxRetries = 3, showErrorDetails = false } = this.props;

    if (!error) return null;

    const canRetry = ErrorRecoveryService.canRecover(error) && retryCount < maxRetries;
    const severityColors = {
      [ErrorSeverity.LOW]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      [ErrorSeverity.MEDIUM]: 'text-orange-600 bg-orange-50 border-orange-200',
      [ErrorSeverity.HIGH]: 'text-red-600 bg-red-50 border-red-200',
      [ErrorSeverity.CRITICAL]: 'text-red-800 bg-red-100 border-red-300',
    };

    const levelStyles = {
      page: 'min-h-screen flex items-center justify-center p-8',
      section: 'min-h-[400px] flex items-center justify-center p-6',
      component: 'min-h-[200px] flex items-center justify-center p-4',
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={levelStyles[level]}
      >
        <div className={clsx(
          'max-w-lg w-full rounded-2xl border-2 p-6 shadow-lg',
          severityColors[error.severity || ErrorSeverity.MEDIUM]
        )}>
          {/* Error Header */}
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              {error.severity === ErrorSeverity.CRITICAL ? (
                <ShieldExclamationIcon className="h-8 w-8" />
              ) : (
                <ExclamationTriangleIcon className="h-8 w-8" />
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold">
                {level === 'page' ? 'حدث خطأ في التطبيق' : 'حدث خطأ في هذا القسم'}
              </h3>
              <p className="text-sm opacity-75">
                {error.category === ErrorCategory.NETWORK 
                  ? 'مشكلة في الاتصال بالإنترنت'
                  : 'خطأ تقني مؤقت'
                }
              </p>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-6">
            <p className="text-sm">
              نعتذر عن هذا الإزعاج. نحن نعمل على حل هذه المشكلة.
            </p>
            
            {retryCount > 0 && (
              <p className="text-xs mt-2 opacity-75">
                المحاولة {retryCount} من {maxRetries}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={isRecovering}
                className="flex items-center justify-center px-4 py-2 bg-white text-current border border-current rounded-lg hover:bg-opacity-10 transition-colors disabled:opacity-50"
              >
                {isRecovering ? (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                    جاري المحاولة...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    إعادة المحاولة
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-4 py-2 bg-current text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              إعادة تحميل الصفحة
            </button>
          </div>

          {/* Error Details (Development/Debug) */}
          {(showErrorDetails || process.env.NODE_ENV === 'development') && (
            <div className="mt-6 pt-4 border-t border-current border-opacity-20">
              <button
                onClick={this.toggleDetails}
                className="flex items-center text-xs opacity-75 hover:opacity-100 transition-opacity"
              >
                <BugAntIcon className="h-4 w-4 mr-1" />
                {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل التقنية'}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 p-3 bg-black bg-opacity-10 rounded-lg text-xs font-mono overflow-auto"
                  >
                    <div className="mb-2">
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div className="mb-2">
                      <strong>Message:</strong> {error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Category:</strong> {error.category}
                    </div>
                    <div className="mb-2">
                      <strong>Severity:</strong> {error.severity}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Higher-Order Component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<EnterpriseErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <EnterpriseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnterpriseErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Export error boundary configurations
export const ErrorBoundaryConfigs = {
  page: {
    level: 'page' as const,
    maxRetries: 3,
    autoRecovery: true,
    enableTelemetry: true,
  },
  
  section: {
    level: 'section' as const,
    maxRetries: 2,
    autoRecovery: true,
    enableTelemetry: true,
  },
  
  component: {
    level: 'component' as const,
    maxRetries: 1,
    autoRecovery: false,
    enableTelemetry: false,
  },
} as const;

export default EnterpriseErrorBoundary;