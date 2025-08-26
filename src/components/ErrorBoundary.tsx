import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-6">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">عذراً، حدث خطأ</h1>
                <p className="text-gray-600 mb-4">
                  تعذر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  إعادة تحميل الصفحة
                </button>
                
                <button
                  onClick={this.handleHome}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  العودة للصفحة الرئيسية
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    تفاصيل الخطأ (للمطورين)
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 rounded border text-xs font-mono text-red-800 overflow-auto max-h-40">
                    <div className="font-semibold">Error:</div>
                    <div className="mb-2">{this.state.error.toString()}</div>
                    {this.state.errorInfo && (
                      <>
                        <div className="font-semibold">Component Stack:</div>
                        <div>{this.state.errorInfo.componentStack}</div>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;