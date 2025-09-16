import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'firebase' | 'network' | 'permission' | 'image' | 'unknown';
  canRetry: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      canRetry: true,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorType = ErrorBoundary.determineErrorType(error);
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorType,
      canRetry: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to console for debugging
    console.group('🔥 Error Details');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({
      errorInfo,
      canRetry: ErrorBoundary.canRetryError(error),
    });
  }

  private static determineErrorType(error: Error): State['errorType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission') || message.includes('denied')) {
      return 'permission';
    }
    if (message.includes('network') || message.includes('offline') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('firebase') || message.includes('firestore')) {
      return 'firebase';
    }
    if (message.includes('image') || message.includes('load')) {
      return 'image';
    }
    
    return 'unknown';
  }

  private static canRetryError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return !message.includes('permission') && !message.includes('denied');
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      canRetry: true,
    });
    
    // Force reload to clear any cached errors
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { error, errorType, canRetry } = this.state;
    
    const errorConfig = {
      firebase: {
        icon: <Shield className="w-12 h-12 text-orange-500" />,
        title: 'مشكلة في الاتصال بقاعدة البيانات',
        description: 'حدثت مشكلة في تحميل البيانات. جاري استخدام البيانات الاحتياطية.',
        color: 'text-orange-600',
      },
      network: {
        icon: <WifiOff className="w-12 h-12 text-blue-500" />,
        title: 'مشكلة في الاتصال بالإنترنت',
        description: 'يبدو أنك غير متصل بالإنترنت. جاري استخدام البيانات المتوفرة محلياً.',
        color: 'text-blue-600',
      },
      permission: {
        icon: <Shield className="w-12 h-12 text-red-500" />,
        title: 'مشكلة في الأذونات',
        description: 'لا تملك الصلاحيات الكافية. جاري استخدام البيانات التجريبية.',
        color: 'text-red-600',
      },
      image: {
        icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
        title: 'مشكلة في تحميل الصور',
        description: 'بعض الصور لم تتمكن من التحميل. جاري استخدام صور بديلة.',
        color: 'text-yellow-600',
      },
      unknown: {
        icon: <AlertTriangle className="w-12 h-12 text-gray-500" />,
        title: 'حدث خطأ غير متوقع',
        description: 'نعتذر عن المشكلة. جاري استخدام البيانات الاحتياطية.',
        color: 'text-gray-600',
      },
    };

    const config = errorConfig[errorType];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4 flex justify-center">
            {config.icon}
          </div>
          
          <h2 className={`text-2xl font-bold mb-2 ${config.color}`}>
            {config.title}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {config.description}
          </p>

          {error && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 font-mono">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            )}
            
            <button
              onClick={this.handleGoHome}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>سيتم استخدام البيانات التجريبية حتى يتم حل المشكلة</p>
          </div>
        </div>
      </div>
    );
  }
}

// Hook for handling async errors
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Log to console with better formatting
    console.group(`🚨 ${context || 'Component'} Error`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.groupEnd();

    // Return error type for handling
    return ErrorBoundary.determineErrorType(error);
  };

  return { handleError };
};

// Image error handler utility
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  img.onerror = null; // Prevent infinite loop
  img.src = '/images/placeholder-car.jpg';
};

// Firebase error handler
export const handleFirebaseError = (error: any): { shouldUseFallback: boolean; message: string } => {
  const message = error?.message || error?.code || 'Unknown Firebase error';
  
  if (error?.code === 'permission-denied') {
    return {
      shouldUseFallback: true,
      message: 'Using sample data due to permission restrictions',
    };
  }
  
  if (error?.code === 'unavailable') {
    return {
      shouldUseFallback: true,
      message: 'Using offline data due to network issues',
    };
  }
  
  return {
    shouldUseFallback: true,
    message: 'Using fallback data',
  };
};