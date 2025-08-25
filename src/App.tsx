import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { AuthService } from '@/services/auth.service.fixed';

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

const LoginPage = React.lazy(() => 
  import('@/pages/auth/LoginPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة تسجيل الدخول غير متاحة</div> 
  }))
);

const RegisterPage = React.lazy(() => 
  import('@/pages/auth/RegisterPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة التسجيل غير متاحة</div> 
  }))
);

const ForgotPasswordPage = React.lazy(() => 
  import('@/pages/auth/ForgotPasswordPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة استعادة كلمة المرور غير متاحة</div> 
  }))
);

const VendorApplicationPage = React.lazy(() => 
  import('@/pages/VendorApplicationPage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة التقديم كتاجر غير متاحة</div> 
  }))
);

const MarketplacePage = React.lazy(() => 
  import('@/pages/customer/MarketplacePage').catch(() => ({ 
    default: () => <div className="p-8 text-center">صفحة السوق غير متاحة حالياً</div> 
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

// Safe Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}> = ({ children, roles, redirectTo = '/login' }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message='جاري التحقق من الصلاحيات...' />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to='/' replace />;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

// Safe Public Route Component
const PublicRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuthStore();

  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to='/admin/dashboard' replace />;
      case 'vendor':
        return <Navigate to='/vendor/dashboard' replace />;
      case 'customer':
        return <Navigate to='/dashboard' replace />;
      default:
        return <Navigate to='/' replace />;
    }
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

// Safe page wrapper
const SafePage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </ErrorBoundary>
  );
};

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

function App() {
  const { setUser, setLoading, user } = useAuthStore();
  const { language, theme } = useAppStore();

  // Safe authentication state listener
  useEffect(() => {
    setLoading(true);

    try {
      const unsubscribe = AuthService.onAuthStateChange((user) => {
        try {
          setUser(user);
          setLoading(false);
        } catch (error) {
          console.error('Error setting user state:', error);
          setLoading(false);
        }
      });

      return () => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth state:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, [setUser, setLoading]);

  // Safe document setup
  useEffect(() => {
    try {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      document.documentElement.className = theme === 'dark' ? 'dark' : '';
    } catch (error) {
      console.error('Error setting document properties:', error);
    }
  }, [language, theme]);

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
                      <MarketplacePage />
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
                    <PublicRoute>
                      <SafePage>
                        <LoginPage />
                      </SafePage>
                    </PublicRoute>
                  }
                />

                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <SafePage>
                        <RegisterPage />
                      </SafePage>
                    </PublicRoute>
                  }
                />

                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <SafePage>
                        <ForgotPasswordPage />
                      </SafePage>
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <SafePage>
                        <CartPage />
                      </SafePage>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <SafePage>
                        <ProfilePage />
                      </SafePage>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/sell-car"
                  element={
                    <ProtectedRoute>
                      <SafePage>
                        <SellCarPage />
                      </SafePage>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <SafePage>
                        <WishlistPage />
                      </SafePage>
                    </ProtectedRoute>
                  }
                />

                {/* Customer Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute roles={['customer']}>
                      <SafePage>
                        <CustomerDashboard />
                      </SafePage>
                    </ProtectedRoute>
                  }
                />

                {/* Vendor Dashboard */}
                <Route
                  path="/vendor/dashboard"
                  element={
                    <ProtectedRoute roles={['vendor']}>
                      <SafePage>
                        <VendorDashboard />
                      </SafePage>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Dashboard */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <SafePage>
                        <AdminDashboard />
                      </SafePage>
                    </ProtectedRoute>
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