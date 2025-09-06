/**
 * 🛡️ Global Error Boundary Component
 * Ultimate error boundary for preventing app crashes
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Global Error Boundary caught an error:', error, errorInfo)
    
    // Log error to monitoring service
    this.logError(error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        retryCount: this.state.retryCount
      }

      // Send to error tracking service
      await this.sendErrorToMonitoring(errorData)
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  private sendErrorToMonitoring = async (errorData: any) => {
    // Implementation would send to Sentry, LogRocket, or similar
    console.log('📊 Error logged to monitoring service:', errorData)
  }

  private getCurrentUserId = (): string | null => {
    try {
      // Get user ID from auth store or localStorage
      const authData = localStorage.getItem('auth_user')
      return authData ? JSON.parse(authData).id : null
    } catch {
      return null
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    } else {
      // Max retries reached, reload the page
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReportBug = () => {
    const errorData = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    }
    
    // Open bug report with pre-filled data
    const bugReportUrl = `/bug-report?data=${encodeURIComponent(JSON.stringify(errorData))}`
    window.open(bugReportUrl, '_blank')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>

              {this.state.retryCount < this.maxRetries && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Retry attempt {this.state.retryCount + 1} of {this.maxRetries}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {this.state.retryCount < this.maxRetries ? (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </button>

                <button
                  onClick={this.handleReportBug}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded-md">
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary