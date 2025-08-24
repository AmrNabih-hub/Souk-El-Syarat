import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';


// Lazy load pages for better performance
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const VendorApplicationPage = React.lazy(() => import('@/pages/VendorApplicationPage'));
const MarketplacePage = React.lazy(() => import('@/pages/customer/MarketplacePage'));
const ProductDetailsPage = React.lazy(() => import('@/pages/customer/ProductDetailsPage'));
const VendorsPage = React.lazy(() => import('@/pages/customer/VendorsPage'));
const CartPage = React.lazy(() => import('@/pages/customer/CartPage'));
const ProfilePage = React.lazy(() => import('@/pages/customer/ProfilePage'));

// Dashboard pages
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const VendorDashboard = React.lazy(() => import('@/pages/vendor/VendorDashboard'));
const CustomerDashboard = React.lazy(() => import('@/pages/customer/CustomerDashboard'));

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}> = ({ children, roles, redirectTo = '/login' }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <motion.div
        className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50'
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <motion.div
          className='text-center'
          animate={{
            x: [-15, 15, -15],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className='text-3xl font-bold text-primary-600 mb-2'>
            🔐 جاري التحقق...
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
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

  return <>{children}</>;
};

// Page transition animations
const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

function App() {
  const { setUser, setLoading, user, initialize } = useAuthStore();
  const { language, theme } = useAppStore();

  // Set up authentication state listener
  useEffect(() => {
    console.log('🚀 Initializing authentication...');
    initialize();
  }, [initialize]);

  // Initialize real-time services when user logs in
  useEffect(() => {
    if (user) {
      // Initialize services without any cleanup calls
      console.log('User logged in, services available');
    }
    
    // No cleanup on unmount to prevent crashes
  }, [user]);

  // Set document direction and theme
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
  }, [language, theme]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100'>
      <Navbar />

      <main className='flex-1'>
        <AnimatePresence mode='wait'>
          <Suspense
            fallback={
              <motion.div
                className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50'
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <motion.div
                  className='text-center'
                  animate={{
                    x: [-20, 20, -20],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <div className='text-4xl font-bold text-primary-600 mb-2'>
                    سوق السيارات
                  </div>
                  <div className='text-lg text-secondary-600'>
                    جاري التحميل...
                  </div>
                </motion.div>
              </motion.div>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route
                path='/'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <HomePage />
                  </motion.div>
                }
              />

              <Route
                path='/marketplace'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <MarketplacePage />
                  </motion.div>
                }
              />

              <Route
                path='/product/:id'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <ProductDetailsPage />
                  </motion.div>
                }
              />

              <Route
                path='/vendors'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <VendorsPage />
                  </motion.div>
                }
              />

              <Route
                path='/vendor/apply'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <VendorApplicationPage />
                  </motion.div>
                }
              />

              {/* Authentication Routes */}
              <Route
                path='/login'
                element={
                  <PublicRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <LoginPage />
                    </motion.div>
                  </PublicRoute>
                }
              />

              <Route
                path='/register'
                element={
                  <PublicRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <RegisterPage />
                    </motion.div>
                  </PublicRoute>
                }
              />

              <Route
                path='/forgot-password'
                element={
                  <PublicRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <ForgotPasswordPage />
                    </motion.div>
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path='/cart'
                element={
                  <ProtectedRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <CartPage />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              <Route
                path='/profile'
                element={
                  <ProtectedRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <ProfilePage />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Customer Dashboard */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute roles={['customer']}>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <CustomerDashboard />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Vendor Dashboard */}
              <Route
                path='/vendor/dashboard/*'
                element={
                  <ProtectedRoute roles={['vendor']}>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <VendorDashboard />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard */}
              <Route
                path='/admin/dashboard/*'
                element={
                  <ProtectedRoute roles={['admin']}>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <AdminDashboard />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route
                path='*'
                element={
                  <motion.div
                    className='min-h-screen flex flex-col items-center justify-center'
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <h1 className='text-6xl font-bold text-primary-500 mb-4'>404</h1>
                    <h2 className='text-2xl font-semibold text-neutral-700 mb-2'>
                      الصفحة غير موجودة
                    </h2>
                    <p className='text-neutral-600 mb-8 text-center'>
                      عذراً، لا يمكن العثور على الصفحة التي تبحث عنها
                    </p>
                    <motion.a
                      href='/'
                      className='btn btn-primary btn-lg'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      العودة للرئيسية
                    </motion.a>
                  </motion.div>
                }
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;
