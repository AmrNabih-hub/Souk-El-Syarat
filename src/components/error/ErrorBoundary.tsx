/**
 * Comprehensive Error Boundary System
 * Catches and handles all application errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  HomeIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// Error types
export type ErrorType = 
  | 'network'
  | 'permission'
  | 'not-found'
  | 'server'
  | 'client'
  | 'unknown';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  errorType: ErrorType;
  errorSeverity: ErrorSeverity;
}

// Main Error Boundary Class
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      errorType: 'unknown',
      errorSeverity: 'medium',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Determine error type and severity
    const errorType = ErrorBoundary.getErrorType(error);
    const errorSeverity = ErrorBoundary.getErrorSeverity(error, errorType);

    return {
      hasError: true,
      error,
      errorType,
      errorSeverity,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught:', error, errorInfo);
    }

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);

    // Auto-reset for non-critical errors
    if (this.state.errorSeverity === 'low') {
      this.scheduleReset(5000);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if configured
    if (hasError && resetOnPropsChange) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  // Determine error type from error object
  static getErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'not-found';
    }
    if (message.includes('server') || message.includes('500')) {
      return 'server';
    }
    if (name.includes('syntax') || name.includes('reference')) {
      return 'client';
    }
    
    return 'unknown';
  }

  // Determine error severity
  static getErrorSeverity(error: Error, type: ErrorType): ErrorSeverity {
    // Network errors are usually recoverable
    if (type === 'network') return 'low';
    
    // Permission errors need user action
    if (type === 'permission') return 'medium';
    
    // Not found errors are medium severity
    if (type === 'not-found') return 'medium';
    
    // Server errors are high severity
    if (type === 'server') return 'high';
    
    // Client errors in production are critical
    if (type === 'client' && process.env.NODE_ENV === 'production') {
      return 'critical';
    }
    
    return 'medium';
  }

  // Log error to monitoring service
  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      
      // For now, just log to console
      console.error('Error logged to service:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Schedule automatic reset
  scheduleReset(delay: number) {
    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  }

  // Reset error boundary
  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      errorSeverity: 'medium',
    });
  };

  // Reload the page
  reloadPage = () => {
    window.location.reload();
  };

  // Navigate to home
  navigateHome = () => {
    window.location.href = '/';
  };

  // Open support chat
  openSupport = () => {
    // Implement support chat opening
    window.open('/support', '_blank');
  };

  render() {
    const { hasError, error, errorInfo, errorType, errorSeverity, errorCount } = this.state;
    const { children, fallback, level = 'component', showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Render appropriate error UI based on level and severity
      if (level === 'page') {
        return <PageErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorType={errorType}
          errorSeverity={errorSeverity}
          errorCount={errorCount}
          onReset={this.resetErrorBoundary}
          onReload={this.reloadPage}
          onHome={this.navigateHome}
          onSupport={this.openSupport}
          showDetails={showDetails}
        />;
      }

      if (level === 'section') {
        return <SectionErrorFallback
          error={error}
          errorType={errorType}
          errorSeverity={errorSeverity}
          onReset={this.resetErrorBoundary}
          showDetails={showDetails}
        />;
      }

      // Component level error
      return <ComponentErrorFallback
        error={error}
        errorType={errorType}
        onReset={this.resetErrorBoundary}
      />;
    }

    return children;
  }
}

// Page-level error fallback
const PageErrorFallback: React.FC<{
  error: Error;
  errorInfo: ErrorInfo | null;
  errorType: ErrorType;
  errorSeverity: ErrorSeverity;
  errorCount: number;
  onReset: () => void;
  onReload: () => void;
  onHome: () => void;
  onSupport: () => void;
  showDetails: boolean;
}> = ({ 
  error, 
  errorInfo, 
  errorType, 
  errorSeverity, 
  errorCount,
  onReset, 
  onReload, 
  onHome, 
  onSupport,
  showDetails 
}) => {
  const [showStack, setShowStack] = React.useState(false);

  const getErrorMessage = () => {
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Problem',
          titleAr: 'مشكلة في الاتصال',
          message: 'Unable to connect to our servers. Please check your internet connection.',
          messageAr: 'غير قادر على الاتصال بخوادمنا. يرجى التحقق من اتصالك بالإنترنت.',
          icon: '🌐',
        };
      case 'permission':
        return {
          title: 'Access Denied',
          titleAr: 'تم رفض الوصول',
          message: 'You don\'t have permission to access this resource.',
          messageAr: 'ليس لديك إذن للوصول إلى هذا المورد.',
          icon: '🔒',
        };
      case 'not-found':
        return {
          title: 'Page Not Found',
          titleAr: 'الصفحة غير موجودة',
          message: 'The page you\'re looking for doesn\'t exist.',
          messageAr: 'الصفحة التي تبحث عنها غير موجودة.',
          icon: '🔍',
        };
      case 'server':
        return {
          title: 'Server Error',
          titleAr: 'خطأ في الخادم',
          message: 'Something went wrong on our servers. We\'re working to fix it.',
          messageAr: 'حدث خطأ في خوادمنا. نحن نعمل على إصلاحه.',
          icon: '🖥️',
        };
      default:
        return {
          title: 'Something Went Wrong',
          titleAr: 'حدث خطأ ما',
          message: 'An unexpected error occurred. Please try again.',
          messageAr: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
          icon: '⚠️',
        };
    }
  };

  const errorContent = getErrorMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Error Header */}
          <div className={`p-8 text-center ${
            errorSeverity === 'critical' ? 'bg-red-500' :
            errorSeverity === 'high' ? 'bg-orange-500' :
            errorSeverity === 'medium' ? 'bg-yellow-500' :
            'bg-blue-500'
          } text-white`}>
            <div className="text-6xl mb-4">{errorContent.icon}</div>
            <h1 className="text-3xl font-bold mb-2">{errorContent.title}</h1>
            <p className="text-lg opacity-90">{errorContent.titleAr}</p>
          </div>

          {/* Error Content */}
          <div className="p-8">
            <p className="text-gray-600 text-center mb-6">
              {errorContent.message}
            </p>
            <p className="text-gray-500 text-center text-sm mb-8" dir="rtl">
              {errorContent.messageAr}
            </p>

            {/* Error Details (Development Only) */}
            {showDetails && process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <button
                  onClick={() => setShowStack(!showStack)}
                  className="text-sm text-blue-600 hover:text-blue-800 mb-2"
                >
                  {showStack ? 'Hide' : 'Show'} Error Details
                </button>
                
                <AnimatePresence>
                  {showStack && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gray-100 rounded-lg p-4 text-xs font-mono">
                        <div className="mb-2">
                          <strong>Error:</strong> {error.message}
                        </div>
                        <div className="mb-2">
                          <strong>Type:</strong> {errorType}
                        </div>
                        <div className="mb-2">
                          <strong>Severity:</strong> {errorSeverity}
                        </div>
                        <div className="mb-2">
                          <strong>Count:</strong> {errorCount}
                        </div>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600">Stack Trace</summary>
                            <pre className="mt-2 text-xs overflow-x-auto">{error.stack}</pre>
                          </details>
                        )}
                        {errorInfo?.componentStack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600">Component Stack</summary>
                            <pre className="mt-2 text-xs overflow-x-auto">{errorInfo.componentStack}</pre>
                          </details>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Try Again
              </button>
              
              <button
                onClick={onHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <HomeIcon className="w-5 h-5" />
                Go Home
              </button>
              
              <button
                onClick={onReload}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Reload Page
              </button>
              
              <button
                onClick={onSupport}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                Get Support
              </button>
            </div>

            {/* Error ID for support */}
            <div className="mt-6 text-center text-xs text-gray-400">
              Error ID: {Date.now().toString(36).toUpperCase()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Section-level error fallback
const SectionErrorFallback: React.FC<{
  error: Error;
  errorType: ErrorType;
  errorSeverity: ErrorSeverity;
  onReset: () => void;
  showDetails: boolean;
}> = ({ error, errorType, errorSeverity, onReset, showDetails }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
      <div className="flex items-start gap-4">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Section Error
          </h3>
          <p className="text-red-600 mb-4">
            This section couldn't load properly. Please try refreshing.
          </p>
          
          {showDetails && process.env.NODE_ENV === 'development' && (
            <div className="bg-white rounded p-3 mb-4">
              <p className="text-sm text-gray-600 font-mono">{error.message}</p>
            </div>
          )}
          
          <button
            onClick={onReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry Loading Section
          </button>
        </div>
      </div>
    </div>
  );
};

// Component-level error fallback
const ComponentErrorFallback: React.FC<{
  error: Error;
  errorType: ErrorType;
  onReset: () => void;
}> = ({ error, errorType, onReset }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 inline-block">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
        <span className="text-yellow-800">Component Error</span>
        <button
          onClick={onReset}
          className="ml-2 text-yellow-600 hover:text-yellow-800 underline text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Export default
export default ErrorBoundary;