import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Simple components
const HomePage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">سوق السيارات</h1>
      <h2 className="text-2xl text-gray-700 mb-6">Souk El-Syarat</h2>
      <p className="text-gray-600 mb-8">مرحباً بكم في سوق السيارات</p>
      <div className="space-y-4">
        <a 
          href="/login" 
          className="block w-full max-w-xs mx-auto bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          تسجيل الدخول
        </a>
        <a 
          href="/marketplace" 
          className="block w-full max-w-xs mx-auto bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          السوق
        </a>
      </div>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6">تسجيل الدخول</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
          <input 
            type="email" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin@souk-el-syarat.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
          <input 
            type="password" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Admin123456!"
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          دخول
        </button>
      </form>
      <div className="mt-6 text-center">
        <a href="/" className="text-blue-500 hover:text-blue-600">العودة للصفحة الرئيسية</a>
      </div>
    </div>
  </div>
);

const MarketplacePage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">السوق</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white p-6 rounded-lg shadow-md">
            <div className="bg-gray-200 h-48 rounded-md mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">منتج {item}</h3>
            <p className="text-gray-600 mb-4">وصف المنتج هنا</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">$999</span>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                اشتري الآن
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a href="/" className="text-blue-500 hover:text-blue-600">العودة للصفحة الرئيسية</a>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
};

export default App;