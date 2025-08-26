import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CarsPage } from './pages/CarsPage';

// Simple test version of App
const TestApp: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold p-4">🚗 Souk El-Sayarat - Full Marketplace</h1>
        
        {/* Test if HomePage works */}
        <div className="p-4">
          <HomePage />
        </div>
      </div>
    </BrowserRouter>
  );
};

export default TestApp;
