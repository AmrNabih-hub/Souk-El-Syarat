import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './index.css';
import './registerSW'; // PWA Service Worker
import Providers from '@/components/common/Providers';
import { connectionService } from '@/services/supabase-connection.service';

// 🚀 PROFESSIONAL SUPABASE INITIALIZATION
console.log('🚀 Starting Souk El-Sayarat Marketplace with Supabase...');

// Initialize Supabase safely
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing Supabase backend...');
    
    // Test Supabase connection with proper error handling
    const healthStatus = await connectionService.getHealthStatus();
    
    if (healthStatus.connected) {
      console.log('✅ Supabase is configured and ready');
      console.log(`⚡ Connection latency: ${healthStatus.latency}ms`);
    } else {
      console.warn('⚠️ Supabase connection issue -', healthStatus.error || 'Please check your configuration');
      console.warn('⚠️ Running in development mode with limited functionality');
    }
  } catch (error: any) {
    console.warn('⚠️ Supabase initialization warning:', error.message);
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
