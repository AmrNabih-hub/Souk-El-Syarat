import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, WifiOff, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { errorHandler } from '@/services/enhanced-error-handler.service';
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

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'network' | 'firebase' | 'auth' | 'unknown';
  retryCount: number;
  isRecovering: boolean;
  userMessage: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  showRecovery?: boolean;
}

interface RecoveryAction {
  id: string;
  label: string;
  action: () => void;
  icon: ReactNode;
  type: 'primary' | 'secondary';
}

export class AdvancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private static MAX_RETRIES = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRecovering: false,
      userMessage: 'حدث خطأ غير متوقع',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorType = AdvancedErrorBoundary.categorizeError(error);
    const userMessage = AdvancedErrorBoundary.getUserMessage(errorType);
    
    return {
      hasError: true,
      error,
      errorType,
      userMessage,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error with enhanced error handler
    errorHandler.logError(error, {
      operation: 'React Error Boundary',
      metadata: {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
      timestamp: new Date(),
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private static categorizeError(error: Error): ErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('offline') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('firebase') || message.includes('firestore') || message.includes('permission')) {
      return 'firebase';
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('login')) {
      return 'auth';
    }
    
    return 'unknown';
  }

  private static getUserMessage(type: ErrorBoundaryState['errorType']): string {
    const messages = {
      network: 'مشكلة في الاتصال بالإنترنت. جاري استخدام البيانات المحلية...',
      firebase: 'مشكلة في الاتصال بقاعدة البيانات. جاري استخدام البيانات المحلية...',
      auth: 'يرجى تسجيل الدخول للمتابعة...',
      unknown: 'حدث خطأ غير متوقع، جاري استعادة التطبيق...',
    };
    
    return messages[type];
  }

  private handleRetry = async () => {
    const { retryCount } = this.state;
    
    if (retryCount >= AdvancedErrorBoundary.MAX_RETRIES) {
      this.setState({
        userMessage: 'فشل الاستعادة التلقائية. يرجى المحاولة يدوياً.',
        isRecovering: false,
      });
      return;
    }

    this.setState({
      isRecovering: true,
      retryCount: retryCount + 1,
    });

    // Wait for recovery animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Attempt recovery
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    });
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      userMessage: 'حدث خطأ غير متوقع',
    });
    
    this.props.onReset?.();
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getRecoveryActions(): RecoveryAction[] {
    const actions: RecoveryAction[] = [
      {
        id: 'retry',
        label: 'إعادة المحاولة',
        action: this.handleRetry,
        icon: <RefreshCw className="w-4 h-4" />,
        type: 'primary',
      },
      {
        id: 'refresh',
        label: 'تحديث الصفحة',
        action: this.handleRefresh,
        icon: <RefreshCw className="w-4 h-4" />,
        type: 'secondary',
      },
      {
        id: 'home',
        label: 'الصفحة الرئيسية',
        action: this.handleGoHome,
        icon: <Home className="w-4 h-4" />,
        type: 'secondary',
      },
    ];

    return actions;
  }

  private getErrorIcon() {
    const { errorType } = this.state;
    
    const icons = {
      network: <WifiOff className="w-12 h-12 text-blue-500" />,
      firebase: <ShieldAlert className="w-12 h-12 text-orange-500" />,
      auth: <ShieldAlert className="w-12 h-12 text-red-500" />,
      unknown: <AlertTriangle className="w-12 h-12 text-red-500" />,
    };
    
    return icons[errorType];
  }

  private renderFallback() {
    const { error, userMessage, retryCount, isRecovering } = this.state;
    const recoveryActions = this.getRecoveryActions();

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
            <div className="flex items-center justify-center mb-4">
              {this.getErrorIcon()}
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              عذراً، حدث خطأ
            </h2>
            <p className="text-center opacity-90">
              {userMessage}
            </p>
          </div>

          <div className="p-6">
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                <p className="font-mono text-xs text-gray-700">
                  <strong>الخطأ:</strong> {error.message}
                </p>
              </div>
            )}

            {isRecovering && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 text-center"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">جاري الاستعادة...</p>
              </motion.div>
            )}

            {retryCount >= AdvancedErrorBoundary.MAX_RETRIES && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  تم تجاوز عدد محاولات الاستعادة. يرجى المحاولة يدوياً.
                </p>
              </div>
            )}

            {this.props.showRecovery !== false && (
              <div className="space-y-3">
                {recoveryActions.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={action.action}
                    disabled={isRecovering}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      action.type === 'primary'
                        ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50'
                    } disabled:cursor-not-allowed`}
                    whileHover={{ scale: isRecovering ? 1 : 1.02 }}
                    whileTap={{ scale: isRecovering ? 1 : 0.98 }}
                  >
                    {action.icon}
                    {action.label}
                  </motion.button>
                ))}
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                إذا استمرت المشكلة، يرجى التواصل مع الدعم
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  render() {
    const { hasError, isRecovering } = this.state;
    const { children } = this.props;

    return (
      <AnimatePresence mode="wait">
        {hasError && !isRecovering ? (
          <motion.div
            key="error-fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {this.renderFallback()}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
}

// Hook for using error boundary in functional components
export const useErrorBoundary = () => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  const triggerError = React.useCallback((error: Error) => {
    setHasError(true);
    setError(error);
  }, []);

  return {
    hasError,
    error,
    resetError,
    triggerError,
  };
};

// Error boundary with fallback component
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Partial<ErrorBoundaryProps>
) => {
  return (props: P) => (
    <AdvancedErrorBoundary {...options}>
      <Component {...props} />
    </AdvancedErrorBoundary>
  );
};