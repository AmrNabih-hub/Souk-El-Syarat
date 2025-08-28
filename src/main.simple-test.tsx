/**
 * SIMPLE TEST MAIN - To verify app can load
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const SimpleTestApp = () => {
  const [status, setStatus] = React.useState('Loading...');
  
  React.useEffect(() => {
    console.log('✅ React app mounted');
    setStatus('App is working!');
    
    // Test Firebase import
    import('./config/firebase.config').then(module => {
      console.log('✅ Firebase module loaded', module);
      setStatus('App is working! Firebase loaded.');
    }).catch(err => {
      console.error('❌ Firebase load error:', err);
      setStatus('App working but Firebase error: ' + err.message);
    });
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-cyan-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          سوق السيارات
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Souk El-Sayarat
        </p>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-green-700 font-medium">{status}</p>
        </div>
        <div className="mt-6 text-sm text-gray-500">
          <p>✅ React: Working</p>
          <p>✅ Styles: Loaded</p>
          <p>🔄 Testing Firebase...</p>
        </div>
      </div>
    </div>
  );
};

// Mount app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<SimpleTestApp />);
  console.log('✅ Simple test app mounted');
} else {
  console.error('❌ No root element');
}