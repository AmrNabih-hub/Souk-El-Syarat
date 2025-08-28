/**
 * FINAL PROFESSIONAL FIX - Preserving ALL your work
 * Egyptian Gold (#f59e0b) & Egyptian Blue (#0ea5e9) Theme
 * All features and components intact
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Lazy load App to prevent initialization issues
const App = React.lazy(() => import('./App'));

// Professional query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 2,
      retryDelay: 1000
    }
  }
});

// Loading component with your theme
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fef3e2 0%, #e0f2fe 100%)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 20px',
        border: '4px solid rgba(245, 158, 11, 0.3)',
        borderTopColor: '#f59e0b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <h2 style={{
        fontFamily: 'Cairo, Inter, sans-serif',
        fontSize: '28px',
        fontWeight: 'bold',
        background: 'linear-gradient(90deg, #f59e0b, #0ea5e9)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 10px 0'
      }}>سوق السيارات</h2>
      <p style={{
        fontFamily: 'Cairo, Inter, sans-serif',
        color: '#737373',
        margin: 0
      }}>جاري التحميل...</p>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: '#fef2f2'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
              حدث خطأ / An error occurred
            </h2>
            <p style={{ color: '#7f1d1d', marginBottom: '24px' }}>
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              إعادة تحميل / Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize app
console.log('Initializing Souk El-Sayarat...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = `
    <div style="text-align: center; padding: 50px; font-family: sans-serif;">
      <h1>Error: Root element not found</h1>
      <p>Please refresh the page</p>
    </div>
  `;
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <React.Suspense fallback={<LoadingFallback />}>
              <App />
            </React.Suspense>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#1f2937',
                  borderRadius: '12px',
                  border: '2px solid #f59e0b',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  padding: '16px',
                  fontSize: '14px',
                  fontFamily: 'Cairo, Inter, sans-serif'
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                  style: {
                    border: '2px solid #10b981',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                  style: {
                    border: '2px solid #ef4444',
                  },
                },
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  // Hide preloader after app loads
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    }
  }, 100);
  
  console.log('App initialization complete');
}

// Add CSS animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);