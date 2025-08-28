/**
 * RESTORED ORIGINAL MAIN ENTRY - Stable Working Version
 * Preserves Egyptian Gold (#f59e0b) & Egyptian Blue (#0ea5e9) Theme
 * All original features and components intact
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
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
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #fef3e2 0%, #e0f2fe 100%);
      font-family: 'Cairo', 'Inter', sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        max-width: 500px;
      ">
        <h1 style="
          color: #f59e0b;
          margin-bottom: 16px;
          font-size: 32px;
        ">خطأ في التحميل</h1>
        <p style="
          color: #6b7280;
          margin-bottom: 24px;
          font-size: 18px;
        ">حدث خطأ في تحميل التطبيق. يرجى تحديث الصفحة.</p>
        <button 
          onclick="window.location.reload()"
          style="
            background: linear-gradient(135deg, #f59e0b 0%, #fb923c 100%);
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          "
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          تحديث الصفحة
        </button>
      </div>
    </div>
  `;
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
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
    </React.StrictMode>
  );
  
  // Hide preloader after app initialization
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        if (preloader.parentNode) {
          preloader.parentNode.removeChild(preloader);
        }
      }, 500);
    }
  }, 100);
  
  console.log('✅ App initialization complete');
}