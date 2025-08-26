import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CarsPage } from './pages/CarsPage';
import { SellCarPage } from './pages/SellCarPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Simplified App for testing
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">🚗 سوق السيارات</h1>
            <nav className="flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-gray-900">الرئيسية</a>
              <a href="/cars" className="text-gray-700 hover:text-gray-900">السيارات</a>
              <a href="/sell" className="text-gray-700 hover:text-gray-900">بيع سيارة</a>
              <a href="/login" className="text-gray-700 hover:text-gray-900">تسجيل دخول</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/sell" element={<SellCarPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>

      {/* Simple Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2024 سوق السيارات - منصة بيع وشراء السيارات المستعملة في مصر</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
