import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to an external service if configured
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center p-6'>
          <div className='max-w-xl text-center'>
            <h1 className='text-3xl font-bold mb-2'>Something went wrong</h1>
            <p className='text-sm text-neutral-600 mb-4'>
              An unexpected error occurred in the application. Please refresh or contact support.
            </p>
            <pre className='text-xs text-left bg-gray-100 p-3 rounded'>{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
