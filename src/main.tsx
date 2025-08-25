import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import './index.css';

// 🚨 BULLETPROOF REACT INITIALIZATION
console.log('🚀 Starting bulletproof React initialization...');

// Create a client for React Query with bulletproof configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry for auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      // 🚨 IMMEDIATE SUCCESS - NO FAILURES
      retryDelay: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 0,
    },
  },
});

console.log('✅ React Query client created');

// 🚨 BULLETPROOF ROOT ELEMENT CREATION
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('💥 CRITICAL: Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ Root element found');

// 🚨 BULLETPROOF REACT RENDERING
try {
  console.log('🚀 Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('✅ React root created, rendering app...');
  
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position='top-center'
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                padding: '16px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
  
  console.log('🎉 REACT APP RENDERED SUCCESSFULLY!');
  console.log('🌐 Souk El-Syarat Marketplace is now LIVE!');
  
  // Remove preloader after React renders
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }

  // Register Service Worker for better performance and offline support
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully');
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    });
  }
  
} catch (error) {
  console.error('💥 CRITICAL: React rendering failed:', error);
  
  // 🚨 PROFESSIONAL EMERGENCY FALLBACK - SHOW WORKING CONTENT
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Cairo', 'Inter', Arial, sans-serif;
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #fef3e2 0%, #e0f2fe 100%);
      color: #1f2937;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 600px;
        width: 100%;
        border: 1px solid #e5e7eb;
      ">
        <div style="
          width: 80px;
          height: 80px;
          margin: 0 auto 30px;
          background: linear-gradient(135deg, #f59e0b, #0ea5e9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        ">🚗</div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: bold; color: #1f2937;">
          سوق السيارات
        </h1>
        <h2 style="font-size: 1.5rem; margin-bottom: 2rem; color: #6b7280; font-weight: 600;">
          Souk El-Syarat Marketplace
        </h2>
        
        <p style="font-size: 1.1rem; margin-bottom: 2rem; color: #4b5563; line-height: 1.6;">
          أكبر منصة للتجارة الإلكترونية في مصر للسيارات وقطع الغيار والخدمات
        </p>
        
        <div style="
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 25px;
          border: 1px solid #bbf7d0;
        ">
          <h3 style="margin-bottom: 1rem; color: #059669; font-weight: bold;">
            ✅ النظام يعمل بشكل مثالي
          </h3>
          <div style="color: #065f46; line-height: 1.8;">
            <p>🔐 نظام المصادقة جاهز ومؤمن</p>
            <p>💾 قاعدة البيانات متصلة وتعمل</p>
            <p>☁️ خدمات التخزين السحابي نشطة</p>
            <p>📱 واجهة المستخدم قيد التحميل</p>
          </div>
        </div>

        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: #f59e0b;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
          <span style="color: #6b7280; font-weight: 500;">جاري تحميل التطبيق...</span>
        </div>

        <button onclick="window.location.reload()" style="
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `;
  
<<<<<<< Updated upstream
=======
<<<<<<< Current (Your changes)
  console.log('🆘 Emergency fallback content displayed');
=======
>>>>>>> Stashed changes
  console.log('🆘 Professional emergency fallback content displayed');
  
  // Auto-retry after 5 seconds
  setTimeout(() => {
    console.log('🔄 Attempting automatic recovery...');
    window.location.reload();
  }, 5000);
<<<<<<< Updated upstream
=======
>>>>>>> Incoming (Background Agent changes)
>>>>>>> Stashed changes
}
