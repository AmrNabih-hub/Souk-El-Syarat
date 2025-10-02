import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './index.css';
import './registerSW'; // PWA Service Worker
import Providers from '@/components/common/Providers';
import { isAppwriteConfigured } from '@/config/appwrite.config';

// 🚀 PROFESSIONAL APPWRITE INITIALIZATION
console.log('🚀 Starting Souk El-Sayarat Marketplace with Appwrite...');

// Initialize Appwrite safely
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing Appwrite backend...');
    
    if (isAppwriteConfigured()) {
      console.log('✅ Appwrite is configured and ready');
    } else {
      console.warn('⚠️ Appwrite not configured - Please run setup-appwrite-mcp.sh');
      console.warn('⚠️ Running in development mode with limited functionality');
    }
  } catch (error) {
    console.error('❌ Appwrite initialization error:', error);
    console.warn('⚠️ Continuing with limited functionality...');
  }
};

// Initialize app safely
initializeApp();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: unknown) => {
        const err: any = error;
        if (err?.status === 401 || err?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create and render React app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Providers>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </Providers>
    </QueryClientProvider>
  </React.StrictMode>
);

// Remove preloader
setTimeout(() => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
}, 100);

console.log('🎉 Souk El-Syarat Marketplace loaded successfully!');
