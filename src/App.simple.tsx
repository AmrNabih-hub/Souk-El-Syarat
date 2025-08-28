import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';

const SimpleApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-primary-500 text-white">
        <h1 className="text-2xl font-bold">سوق السيارات - Souk El-Sayarat</h1>
      </div>
      
      <main className="p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold mb-4">404 - Page Not Found</h2>
              <a href="/" className="text-primary-500 hover:underline">Go Home</a>
            </div>
          } />
        </Routes>
      </main>
      
      <div className="p-4 bg-gray-800 text-white text-center">
        <p>© 2025 Souk El-Sayarat. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SimpleApp;