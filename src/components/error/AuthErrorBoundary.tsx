import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    // You can also log to external services here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full mx-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <ExclamationTriangleIcon className="w-8 h-8 text-accent-600" />
              </motion.div>

              <h1 className="text-2xl font-bold text-neutral-900 mb-4">
                Authentication Error
              </h1>

              <p className="text-neutral-600 mb-6">
                We encountered an issue with the authentication system. This might be a temporary problem.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-neutral-100 rounded-lg text-xs font-mono text-neutral-700 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleRetry}
                  className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Try Again
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="w-full bg-neutral-100 text-neutral-700 py-3 px-6 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                >
                  Reload Page
                </motion.button>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">
                  If the problem persists, please contact support.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;