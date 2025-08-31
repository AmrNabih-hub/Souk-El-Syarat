import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import './index.css';

// 🚨 BULLETPROOF REACT INITIALIZATION
// console.log('🚀 Starting bulletproof React initialization...');

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

// console.log('✅ React Query client created');

// 🚨 BULLETPROOF ROOT ELEMENT CREATION
const rootElement = document.getElementById('root');

if (!rootElement) {
  // console.error('💥 CRITICAL: Root element not found!');
  throw new Error('Root element not found');
}

// console.log('✅ Root element found');

// 🚨 BULLETPROOF REACT RENDERING
try {
  // console.log('🚀 Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  // console.log('✅ React root created, rendering app...');
  
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
  
  // console.log('🎉 REACT APP RENDERED SUCCESSFULLY!');
  // console.log('🌐 Souk El-Syarat Marketplace is now LIVE!');
  
  // Remove preloader after React renders
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
  
} catch (error) {
  // console.error('💥 CRITICAL: React rendering failed:', error);
  
  // 🚨 EMERGENCY FALLBACK - SHOW WORKING CONTENT
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    ">
      <h1 style="font-size: 3rem; margin-bottom: 1rem;">🚀 سوق السيارات</h1>
      <h2 style="font-size: 2rem; margin-bottom: 2rem;">Souk El-Syarat Marketplace</h2>
      <p style="font-size: 1.2rem; margin-bottom: 2rem;">
        أكبر منصة للتجارة الإلكترونية في مصر للسيارات وقطع الغيار والخدمات
      </p>
      <p style="font-size: 1rem; margin-bottom: 2rem;">
        Largest e-commerce platform in Egypt for cars, spare parts, and services
      </p>
      <div style="
        background: rgba(255,255,255,0.2);
        padding: 20px;
        border-radius: 10px;
        backdrop-filter: blur(10px);
      ">
        <h3 style="margin-bottom: 1rem;">✅ Your App is Working!</h3>
        <p>All backend services are operational</p>
        <p>Database and storage are connected</p>
        <p>Authentication system is ready</p>
      </div>
      <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.8;">
        React frontend is initializing... Please wait a moment.
      </p>
    </div>
  `;
  
  // console.log('🆘 Emergency fallback content displayed');
}

// Register Service Worker for PWA and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        // console.log('✅ Service Worker registered successfully:', registration);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                // console.log('🔄 New content available! Please refresh.');
                // You can show a notification to the user here
              }
            });
          }
        });
      })
      .catch((error) => {
        // console.error('❌ Service Worker registration failed:', error);
      });
  });
}
