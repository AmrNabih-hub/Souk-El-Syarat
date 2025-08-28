/**
 * MINIMAL TEST - Absolute minimum to test React mounting
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// Log to console AND show on screen
const log = (msg: string) => {
  console.log(msg);
  const div = document.createElement('div');
  div.textContent = msg;
  div.style.padding = '5px';
  div.style.borderBottom = '1px solid #ccc';
  document.body.appendChild(div);
};

log('1. Script started');

// Test React is loaded
if (typeof React === 'undefined') {
  log('ERROR: React is not defined!');
} else {
  log('2. React is loaded');
}

// Test ReactDOM is loaded
if (typeof ReactDOM === 'undefined') {
  log('ERROR: ReactDOM is not defined!');
} else {
  log('3. ReactDOM is loaded');
}

// Simple test component
const TestApp = () => {
  React.useEffect(() => {
    log('5. Component mounted');
  }, []);
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0' }}>
      <h1 style={{ color: '#f59e0b' }}>سوق السيارات</h1>
      <h2 style={{ color: '#0ea5e9' }}>Souk El-Sayarat</h2>
      <p style={{ color: 'green', fontWeight: 'bold' }}>
        ✅ React is working!
      </p>
      <p>If you see this, the app can load.</p>
      <button 
        onClick={() => alert('Button works!')}
        style={{
          padding: '10px 20px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
};

// Wait for DOM
if (document.readyState === 'loading') {
  log('Waiting for DOM...');
  document.addEventListener('DOMContentLoaded', () => {
    log('DOM ready');
    mountApp();
  });
} else {
  log('DOM already ready');
  mountApp();
}

function mountApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    log('ERROR: No root element found!');
    return;
  }
  
  log('4. Root element found');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<TestApp />);
    log('6. App rendered successfully!');
    
    // Hide preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.display = 'none';
    }
  } catch (error: any) {
    log(`ERROR: ${error.message}`);
    console.error(error);
  }
}