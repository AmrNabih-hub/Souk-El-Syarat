import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load pages with error boundaries
const HomePage = React.lazy(() => 
  import('@/pages/HomePage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة غير متاحة حالياً</div> 
  }))
);

const SimpleLoginPage = React.lazy(() => 
  import('@/pages/auth/LoginPage.simple').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة تسجيل الدخول غير متاحة</div> 
  }))
);

const RegisterPage = React.lazy(() => 
  import('@/pages/auth/RegisterPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة التسجيل غير متاحة</div> 
  }))
);

const MarketplacePage = React.lazy(() => 
  import('@/pages/customer/MarketplacePage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة السوق غير متاحة حالياً</div> 
  }))
);

const VendorApplicationPage = React.lazy(() => 
  import('@/pages/VendorApplicationPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة التقديم كتاجر غير متاحة</div> 
  }))
);

const ProductDetailsPage = React.lazy(() => 
  import('@/pages/customer/ProductDetailsPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة تفاصيل المنتج غير متاحة</div> 
  }))
);

const VendorsPage = React.lazy(() => 
  import('@/pages/customer/VendorsPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة التجار غير متاحة حالياً</div> 
  }))
);

const CartPage = React.lazy(() => 
  import('@/pages/customer/CartPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة السلة غير متاحة حالياً</div> 
  }))
);

const ProfilePage = React.lazy(() => 
  import('@/pages/customer/ProfilePage').catch(() => ({ 
    default: () => <div className="p-8 text-center">الملف الشخصي غير متاح حالياً</div> 
  }))
);

const SellCarPage = React.lazy(() => 
  import('@/pages/customer/SellCarPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة بيع السيارة غير متاحة حالياً</div> 
  }))
);

const WishlistPage = React.lazy(() => 
  import('@/pages/customer/WishlistPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">قائمة المفضلة غير متاحة حالياً</div> 
  }))
);

const OrdersPage = React.lazy(() => 
  import('@/pages/customer/OrdersPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة الطلبات غير متاحة حالياً</div> 
  }))
);

const MessagesPage = React.lazy(() => 
  import('@/pages/customer/MessagesPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة الرسائل غير متاحة حالياً</div> 
  }))
);

const EnhancedMarketplace = React.lazy(() => 
  import('@/pages/EnhancedMarketplace').catch(() => ({ 
    default: () => <div className="p-8 text-center">السوق المحسن غير متاح حالياً</div> 
  }))
);

const CheckoutPage = React.lazy(() => 
  import('@/pages/CheckoutPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة الدفع غير متاحة حالياً</div> 
  }))
);

const OrderSuccessPage = React.lazy(() => 
  import('@/pages/OrderSuccessPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة تأكيد الطلب غير متاحة حالياً</div> 
  }))
);

const BookingPage = React.lazy(() => 
  import('@/pages/BookingPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة الحجز غير متاحة حالياً</div> 
  }))
);

// Dashboard pages
const AdminDashboard = React.lazy(() => 
  import('@/pages/admin/AdminDashboard').catch(() => ({ 
    default: () => <div className="p-8 text-center">لوحة تحكم المدير غير متاحة</div> 
  }))
);

const VendorDashboard = React.lazy(() => 
  import('@/pages/vendor/VendorDashboard').catch(() => ({ 
    default: () => <div className="p-8 text-center">لوحة تحكم التاجر غير متاحة</div> 
  }))
);

const CustomerDashboard = React.lazy(() => 
  import('@/pages/customer/CustomerDashboard').catch(() => ({ 
    default: () => <div className="p-8 text-center">لوحة تحكم العميل غير متاحة</div> 
  }))
);

// Safe Page Wrapper Component
const SafePage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Page not found component
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
    <div className="text-center p-8">
      <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-neutral-700 mb-4">الصفحة غير موجودة</h2>
      <p className="text-neutral-600 mb-8">عذراً، لا يمكن العثور على الصفحة التي تبحث عنها</p>
      <motion.a
        href="/"
        className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        العودة للصفحة الرئيسية
      </motion.a>
    </div>
  </div>
);

const App: React.FC = () => {
  const { theme, language, syncStatus, isOnline } = useAppStore();
  const { initializeAuth, isInitialized } = useAuthStore();

  // Initialize authentication and real-time services
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 Initializing app with real-time capabilities...');
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  // Safe document setup with enhanced error handling
  useEffect(() => {
    try {
      // Set document direction based on language
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language === 'ar' ? 'ar' : 'en';
      
      // Apply theme
      document.documentElement.className = theme === 'dark' ? 'dark' : '';
      
      console.log('✅ Document properties set successfully:', { 
        direction: document.documentElement.dir, 
        language: document.documentElement.lang,
        theme: document.documentElement.className || 'light',
        syncStatus,
        isOnline
      });
    } catch (error) {
      console.error('❌ Error setting document properties:', error);
    }
  }, [theme, language, syncStatus, isOnline]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 transition-all duration-500">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    <SafePage>
                      <HomePage />
                    </SafePage>
                  }
                />

                <Route
                  path="/marketplace"
                  element={
                    <SafePage>
                      <EnhancedMarketplace />
                    </SafePage>
                  }
                />

                <Route
                  path="/checkout"
                  element={
                    <SafePage>
                      <CheckoutPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/booking"
                  element={
                    <SafePage>
                      <BookingPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/order-success"
                  element={
                    <SafePage>
                      <OrderSuccessPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/booking-success"
                  element={
                    <SafePage>
                      <OrderSuccessPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/product/:id"
                  element={
                    <SafePage>
                      <ProductDetailsPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/vendors"
                  element={
                    <SafePage>
                      <VendorsPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/vendor/apply"
                  element={
                    <SafePage>
                      <VendorApplicationPage />
                    </SafePage>
                  }
                />

                {/* Authentication Routes */}
                <Route
                  path="/login"
                  element={
                    <SafePage>
                      <SimpleLoginPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/register"
                  element={
                    <SafePage>
                      <RegisterPage />
                    </SafePage>
                  }
                />

                {/* Customer Routes */}
                <Route
                  path="/cart"
                  element={
                    <SafePage>
                      <CartPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <SafePage>
                      <ProfilePage />
                    </SafePage>
                  }
                />

                <Route
                  path="/sell-car"
                  element={
                    <SafePage>
                      <SellCarPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/wishlist"
                  element={
                    <SafePage>
                      <WishlistPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/orders"
                  element={
                    <SafePage>
                      <OrdersPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/messages" 
                  element={
                    <SafePage>
                      <MessagesPage />
                    </SafePage>
                  }
                />

                <Route
                  path="/favorites"
                  element={
                    <SafePage>
                      <WishlistPage />
                    </SafePage>
                  }
                />

                {/* Customer Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <SafePage>
                      <CustomerDashboard />
                    </SafePage>
                  }
                />

                {/* Vendor Dashboard */}
                <Route
                  path="/vendor/dashboard"
                  element={
                    <SafePage>
                      <VendorDashboard />
                    </SafePage>
                  }
                />

                {/* Admin Dashboard */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <SafePage>
                      <AdminDashboard />
                    </SafePage>
                  }
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>

        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

export default App;