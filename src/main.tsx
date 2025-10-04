import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './index.css';
import './registerSW'; // PWA Service Worker
import Providers from '@/components/common/Providers';
import { supabase } from '@/config/supabase.config';

// 🚀 PROFESSIONAL SUPABASE INITIALIZATION
console.log('🚀 Starting Souk El-Sayarat Marketplace with Supabase...');

// Initialize Supabase safely
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing Supabase backend...');
    
    // Test Supabase connection with auth (don't query non-existent tables)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Supabase is configured and ready');
      console.log('👤 Active session found:', session.user.email);
    } else {
      console.log('✅ Supabase is configured and ready (no active session)');
    }
  } catch (error) {
    console.error('❌ Supabase initialization error:', error);
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
