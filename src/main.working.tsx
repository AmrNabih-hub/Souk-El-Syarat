/**
 * WORKING MAIN - Professional Debug Version
 * This will show us what's actually happening
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Add global error handler to catch issues
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:20px;z-index:9999';
  errorDiv.innerHTML = `Error: ${event.error?.message || event.message}`;
  document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('1. Main.tsx loaded');

// Simple query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false
    }
  }
});

console.log('2. QueryClient created');

// Get root element
const rootElement = document.getElementById('root');
console.log('3. Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
  // Show error visually
  document.body.style.background = '#ff0000';
  document.body.innerHTML = '<h1 style="color:white;text-align:center;padding:50px">Root element not found!</h1>';
} else {
  console.log('4. Creating React root...');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('5. React root created');
    
    // Simple wrapper to catch render errors
    const AppWrapper = () => {
      const [error, setError] = React.useState<Error | null>(null);
      
      React.useEffect(() => {
        console.log('6. App mounted');
      }, []);
      
      if (error) {
        return (
          <div style={{ padding: '50px', background: '#fee', color: '#c00', textAlign: 'center' }}>
            <h1>Render Error</h1>
            <p>{error.message}</p>
            <pre>{error.stack}</pre>
          </div>
        );
      }
      
      try {
        return (
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <React.Suspense fallback={
                <div style={{ padding: '50px', textAlign: 'center' }}>
                  <h1>Loading...</h1>
                </div>
              }>
                <App />
              </React.Suspense>
            </BrowserRouter>
          </QueryClientProvider>
        );
      } catch (err: any) {
        console.error('Error rendering app:', err);
        setError(err);
        return null;
      }
    };
    
    console.log('7. Rendering app...');
    root.render(
      <React.StrictMode>
        <AppWrapper />
      </React.StrictMode>
    );
    
    console.log('8. Render complete');
    
    // Hide preloader after render
    setTimeout(() => {
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.style.display = 'none';
        console.log('9. Preloader hidden');
      }
    }, 100);
    
  } catch (error) {
    console.error('Failed to render:', error);
    document.body.innerHTML = `
      <div style="padding: 50px; background: #fee; color: #c00;">
        <h1>Failed to render app</h1>
        <p>${error}</p>
      </div>
    `;
  }
}