/**
 * RESTORED MAIN ENTRY - WITH ALL ORIGINAL ENHANCEMENTS
 * Preserves Egyptian Gold (#f59e0b) & Egyptian Blue (#0ea5e9) Theme
 * Maintains all developed features and components
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Initialize Query Client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
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

// Professional logging
console.log('🚀 Initializing Souk El-Sayarat E-commerce Platform');
console.log('🎨 Theme: Egyptian Gold (#f59e0b) & Egyptian Blue (#0ea5e9)');
console.log('✨ Features: Real-time, AI-powered, Blockchain-ready');

// Initialize the app
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found');
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fef3e2 0%, #e0f2fe 100%);
      font-family: 'Cairo', 'Inter', sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        max-width: 500px;
      ">
        <h1 style="color: #f59e0b; margin-bottom: 20px;">خطأ في التحميل</h1>
        <p style="color: #6b7280;">لم يتم العثور على عنصر الجذر. يرجى إعادة تحميل الصفحة.</p>
        <button onclick="location.reload()" style="
          margin-top: 20px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #f59e0b 0%, #0ea5e9 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
        ">إعادة تحميل</button>
      </div>
    </div>
  `;
} else {
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
  
  console.log('✅ React app mounted successfully');
  console.log('🌐 Souk El-Sayarat is now running');
  
  // Hide preloader if exists
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    }, 100);
  }
}