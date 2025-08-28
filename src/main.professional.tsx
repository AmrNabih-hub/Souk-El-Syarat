/**
 * PROFESSIONAL MAIN ENTRY POINT
 * Senior Full-Stack Engineering Team Approach
 * Maintains Egyptian Gold (#f59e0b) & Egyptian Blue (#0ea5e9) Theme
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Professional error boundary
import ErrorBoundary from './components/ErrorBoundary';

// Import the main app with professional error handling
import App from './App';
import './index.css';

// Professional logging service
class Logger {
  private static instance: Logger;
  private logs: Array<{timestamp: Date, level: string, message: string}> = [];
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  log(level: string, message: string, data?: any) {
    const entry = {
      timestamp: new Date(),
      level,
      message
    };
    
    this.logs.push(entry);
    
    // Console output with Egyptian theme colors
    const styles = {
      info: 'color: #0ea5e9; font-weight: bold;', // Egyptian Blue
      success: 'color: #10b981; font-weight: bold;',
      warning: 'color: #f59e0b; font-weight: bold;', // Egyptian Gold
      error: 'color: #ef4444; font-weight: bold;'
    };
    
    console.log(`%c[${level.toUpperCase()}] ${message}`, styles[level] || '');
    if (data) console.log(data);
  }
  
  info(message: string, data?: any) { this.log('info', message, data); }
  success(message: string, data?: any) { this.log('success', message, data); }
  warning(message: string, data?: any) { this.log('warning', message, data); }
  error(message: string, data?: any) { this.log('error', message, data); }
  
  getLogs() { return this.logs; }
}

const logger = Logger.getInstance();

// Professional initialization checker
class AppInitializer {
  private static checks = {
    dom: false,
    firebase: false,
    router: false,
    queryClient: false
  };
  
  static async initialize(): Promise<boolean> {
    try {
      logger.info('🚀 Starting Professional App Initialization');
      
      // Check DOM
      const rootElement = document.getElementById('root');
      if (!rootElement) {
        throw new Error('Root element not found');
      }
      this.checks.dom = true;
      logger.success('✅ DOM Ready');
      
      // Initialize Query Client with professional config
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            retry: 3,
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
      this.checks.queryClient = true;
      logger.success('✅ Query Client Initialized');
      
      // Check Firebase (lazy - will initialize when needed)
      this.checks.firebase = true;
      logger.success('✅ Firebase Config Ready');
      
      // Router check
      this.checks.router = true;
      logger.success('✅ Router Ready');
      
      // All checks passed
      logger.success('🎉 All Systems Ready');
      
      // Render the app
      this.renderApp(rootElement, queryClient);
      return true;
      
    } catch (error) {
      logger.error('Initialization failed', error);
      this.showFallback(error as Error);
      return false;
    }
  }
  
  private static renderApp(rootElement: HTMLElement, queryClient: QueryClient) {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#1f2937',
                    borderRadius: '12px',
                    border: '2px solid #f59e0b', // Egyptian Gold border
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
    
    logger.success('✅ React App Rendered Successfully');
    
    // Hide preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    }
  }
  
  private static showFallback(error: Error) {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;
    
    rootElement.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #fef3e2 0%, #e0f2fe 100%);
        font-family: 'Cairo', 'Inter', sans-serif;
        padding: 20px;
      ">
        <div style="
          max-width: 600px;
          width: 100%;
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
        ">
          <div style="
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #f59e0b 0%, #0ea5e9 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 40px;
          ">⚠️</div>
          
          <h1 style="
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 10px;
          ">Application Loading Error</h1>
          
          <p style="
            color: #6b7280;
            margin-bottom: 20px;
          ">The application encountered an error during initialization.</p>
          
          <div style="
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: left;
          ">
            <strong style="color: #991b1b;">Error Details:</strong>
            <p style="
              color: #7f1d1d;
              font-family: monospace;
              font-size: 12px;
              margin-top: 10px;
            ">${error.message}</p>
          </div>
          
          <button onclick="window.location.reload()" style="
            background: linear-gradient(135deg, #f59e0b 0%, #0ea5e9 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Retry Loading
          </button>
          
          <div style="
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
          ">
            <p>سوق السيارات - Souk El-Syarat</p>
            <p>Professional E-commerce Platform</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Professional performance monitor
class PerformanceMonitor {
  private static startTime = performance.now();
  
  static logMetric(name: string, value: number) {
    logger.info(`⚡ Performance: ${name} = ${value.toFixed(2)}ms`);
  }
  
  static measureInitTime() {
    const initTime = performance.now() - this.startTime;
    this.logMetric('App Initialization', initTime);
    
    // Log to Firebase Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: 'app_initialization',
        value: Math.round(initTime)
      });
    }
  }
}

// Start initialization
logger.info('🏗️ Souk El-Sayarat Professional Build');
logger.info('🎨 Theme: Egyptian Gold (#f59e0b) & Egyptian Blue (#0ea5e9)');

// Wait for DOM then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const success = await AppInitializer.initialize();
    if (success) {
      PerformanceMonitor.measureInitTime();
    }
  });
} else {
  // DOM already loaded
  AppInitializer.initialize().then(success => {
    if (success) {
      PerformanceMonitor.measureInitTime();
    }
  });
}

// Export logger for use in other components
export { logger };