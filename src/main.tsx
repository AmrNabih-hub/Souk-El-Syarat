import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './index.css';
import Providers from '@/components/common/Providers';

// 🚀 PROFESSIONAL DEVELOPMENT-READY INITIALIZATION
console.log('🚀 Starting Souk El-Syarat Marketplace...');

// Configure AWS Amplify safely (async)
const initializeApp = async () => {
  try {
    const { Amplify } = await import('aws-amplify');
    const { amplifyConfig } = await import('./config/amplify.config');
    
    // Safe configuration that won't break the app
    Amplify.configure(amplifyConfig);
    console.log('✅ AWS Amplify configured successfully');
  } catch (error) {
    console.warn('⚠️ AWS Amplify configuration skipped (development mode):', error);
  }
};

// Initialize Amplify in the background
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
