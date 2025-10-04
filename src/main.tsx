import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './index.css';
// import './registerSW'; // PWA Service Worker - Temporarily disabled for deployment
import Providers from '@/components/common/Providers';

// 🚀 PROFESSIONAL DEVELOPMENT-READY INITIALIZATION
console.log('🚀 Starting Souk El-Syarat Marketplace...');

// 🚀 PROFESSIONAL STABLE AMPLIFY INITIALIZATION - NO MORE BLANK PAGES
const initializeApp = async () => {
  try {
    console.log('🚀 Starting safe app initialization...');
    
    // Skip AWS Amplify entirely in development to prevent parseAWSExports errors
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
      console.log('✅ Development mode - Running without AWS Amplify for stability');
      return;
    }

    // Only configure Amplify in production with proper validation
    try {
      const { Amplify } = await import('aws-amplify');
      
      // Use a minimal, safe configuration that won't cause parseAWSExports errors
      const safeConfig = {
        aws_region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
        aws_cognito_region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
        aws_user_pools_id: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID || '',
        aws_user_pools_web_client_id: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID || '',
        aws_cognito_identity_pool_id: import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID || '',
      };

      // Only configure if we have all required fields
      if (safeConfig.aws_user_pools_id && safeConfig.aws_user_pools_web_client_id) {
        Amplify.configure(safeConfig);
        console.log('✅ AWS Amplify configured safely for production');
      } else {
        console.warn('⚠️ AWS Amplify config incomplete, using guest mode');
      }
    } catch (amplifyError) {
      console.warn('⚠️ AWS Amplify initialization skipped:', amplifyError);
      // App continues normally without Amplify
    }
  } catch (error) {
    console.warn('⚠️ App initialization error (non-blocking):', error);
    // App continues normally
  }
};

// Initialize app safely without blocking render
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
