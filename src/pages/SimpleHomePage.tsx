/**
 * 🏠 SIMPLE HOME PAGE
 * Basic landing page for testing
 */

import React from 'react';

export const SimpleHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">🚗 سوق السيارات</span>
            </div>
            <nav className="hidden md:flex space-x-8 space-x-reverse">
              <a href="/" className="text-gray-900 hover:text-blue-600">الرئيسية</a>
              <a href="/appwrite-test" className="text-gray-500 hover:text-blue-600">اختبار النظام</a>
            </nav>
            <div className="flex items-center space-x-4 space-x-reverse">
              <a href="/login" className="text-gray-500 hover:text-blue-600">تسجيل الدخول</a>
              <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                إنشاء حساب
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🚗 سوق السيارات
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              منصة شاملة لبيع وشراء السيارات
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <a 
                href="/appwrite-test" 
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                🧪 اختبار النظام الخلفي
              </a>
              <a 
                href="/login" 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                تسجيل الدخول
              </a>
              <a 
                href="/register" 
                className="bg-yellow-500 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                إنشاء حساب جديد
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Backend Status */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-green-800 mb-6">
              ✅ النظام الخلفي جاهز ومتصل!
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-green-100 rounded-lg">
                <h3 className="font-bold text-green-800">🗄️ قاعدة البيانات</h3>
                <p className="text-green-600 text-sm">8 مجموعات مُنشأة</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-lg">
                <h3 className="font-bold text-blue-800">🔐 التوثيق</h3>
                <p className="text-blue-600 text-sm">نظام جاهز ومفعل</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-lg">
                <h3 className="font-bold text-purple-800">📁 التخزين</h3>
                <p className="text-purple-600 text-sm">رفع الملفات متاح</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">المجموعات المُنشأة:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <span className="bg-gray-100 px-3 py-1 rounded">👥 Users</span>
                <span className="bg-gray-100 px-3 py-1 rounded">🏪 Vendors</span>
                <span className="bg-gray-100 px-3 py-1 rounded">🚗 Car Listings</span>
                <span className="bg-gray-100 px-3 py-1 rounded">💬 Chats</span>
                <span className="bg-gray-100 px-3 py-1 rounded">📨 Messages</span>
                <span className="bg-gray-100 px-3 py-1 rounded">🛒 Orders</span>
                <span className="bg-gray-100 px-3 py-1 rounded">⭐ Reviews</span>
                <span className="bg-gray-100 px-3 py-1 rounded">🔔 Notifications</span>
              </div>
            </div>

            <div className="mt-8">
              <a 
                href="/appwrite-test" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                اختبار جميع الوظائف →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">المزايا المتاحة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-2">نظام التوثيق</h3>
              <p className="text-gray-600">تسجيل دخول آمن للعملاء والتجار</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold mb-2">إدارة السيارات</h3>
              <p className="text-gray-600">إضافة وإدارة قوائم السيارات</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">نظام المحادثة</h3>
              <p className="text-gray-600">تواصل مباشر بين العملاء والتجار</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold mb-2">إدارة الطلبات</h3>
              <p className="text-gray-600">متابعة الطلبات وحالة الدفع</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">التقييمات</h3>
              <p className="text-gray-600">نظام تقييم التجار والخدمات</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">الإشعارات</h3>
              <p className="text-gray-600">تنبيهات فورية للمستخدمين</p>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            الخطوات التالية
          </h2>
          <p className="text-xl mb-8 opacity-90">
            النظام الخلفي جاهز تماماً، يمكنك الآن البدء في تطوير الواجهات
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">✅ تم إنجازه</h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li>• إعداد قاعدة البيانات</li>
                <li>• إنشاء المجموعات</li>
                <li>• تكوين الفهارس</li>
                <li>• اختبار النظام</li>
                <li>• تجهيز التخزين</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">🚀 التالي</h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li>• بناء صفحات التسجيل</li>
                <li>• تطوير لوحات التحكم</li>
                <li>• إضافة البحث والفلترة</li>
                <li>• تطوير نظام المحادثة</li>
                <li>• إضافة الدفع الإلكتروني</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8">
            <a
              href="/appwrite-test"
              className="inline-block bg-yellow-500 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              اختبار النظام الآن
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 سوق السيارات - النظام الخلفي جاهز ومتصل ✅</p>
        </div>
      </footer>
    </div>
  );
};

export default SimpleHomePage;