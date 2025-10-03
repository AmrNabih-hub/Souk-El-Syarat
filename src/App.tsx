import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { PushNotificationService } from '@/services/push-notification.service';
import { useResourcePreloader } from '@/hooks/usePerformanceOptimization';
import { initializeStateManager } from '@/utils/state-fix';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

// Appwrite Test Component
import AppwriteTest from '@/components/AppwriteTest';
import AppwriteSetup from '@/components/AppwriteSetup';

// Real-time Components - Lazy loaded for better performance
const FloatingChatWidget = React.lazy(() =>
  import('@/components/realtime/FloatingChatWidget').then(module => ({ default: module.FloatingChatWidget }))
);

// Heavy UI Components - Lazy loaded (currently not used, keeping for future use)
// const EnhancedHeroSlider = React.lazy(() => import('@/components/ui/EnhancedHeroSlider'));
// const EVSection = React.lazy(() => import('@/components/ui/EVSection'));
// const EnhancedProductDetailsModal = React.lazy(
//   () => import('@/components/product/EnhancedProductDetailsModal')
// );

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
const OrdersPage = React.lazy(() => import('@/pages/customer/OrdersPage'));
const FavoritesPage = React.lazy(() => import('@/pages/customer/FavoritesPage'));
const UsedCarSellingPage = React.lazy(() => import('@/pages/customer/UsedCarSellingPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
const ChatTestPage = React.lazy(() => import('@/pages/ChatTestPage'));

// Dashboard pages
// const VendorDashboard = React.lazy(() => import('@/pages/vendor/VendorDashboard')); // Using EnhancedVendorDashboard instead
const EnhancedVendorDashboard = React.lazy(() => import('@/pages/vendor/EnhancedVendorDashboard'));
const CustomerDashboard = React.lazy(() => import('@/pages/customer/CustomerDashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminLoginPage = React.lazy(() => import('@/pages/auth/AdminLoginPage'));

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}> = ({ children, roles, redirectTo = '/login' }) => {
  const { user, loading } = useAuth();
  const authStoreUser = useAuthStore(state => state.user);
  const authStoreLoading = useAuthStore(state => state.loading);

  // Use either auth system (prioritize authStore as it's newer)
  const currentUser = authStoreUser || user;
  const isLoading = authStoreLoading || loading;

  if (isLoading) {
    return <LoadingScreen message='جاري التحقق من الصلاحيات...' />;
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && currentUser.role && !roles.includes(currentUser.role)) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const authStoreUser = useAuthStore(state => state.user);

  // Use either auth system
  const currentUser = authStoreUser || user;

  if (currentUser) {
    // Redirect based on user role
    switch (currentUser.role) {
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
const pageEasing = 'easeInOut' as const;

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: pageEasing,
    },
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: pageEasing,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.3,
      ease: pageEasing,
    },
  },
};

function App() {
  const { user } = useAuth();
  const { language } = useAppStore();
  const { subscribeToUpdates, unsubscribeFromUpdates } = useRealtime();
  const { initializeAuth } = useAuthStore();

  // Preload critical resources
  useResourcePreloader([]);

  // Initialize state manager and auth store to prevent state duplication issues
  useEffect(() => {
    initializeStateManager();
    
    // Initialize auth state from storage
    initializeAuth().catch(err => {
      console.error('Failed to initialize auth:', err);
    });
  }, [initializeAuth]);

  // Initialize real-time services when user logs in
  useEffect(() => {
    if (user) {
      // Initialize push notifications
      PushNotificationService.initialize(user.id).catch(error => {
        // Silent handling - service will continue without push notifications
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to initialize push notifications:', error);
        }
      });

      // Subscribe to user-specific topics based on role
      if (user.role === 'vendor') {
        PushNotificationService.subscribeToTopic(user.id, 'vendor-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'order-updates');
        subscribeToUpdates('orders', data => {
          console.log('Order update received:', data);
        });
      } else if (user.role === 'customer') {
        PushNotificationService.subscribeToTopic(user.id, 'customer-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'promotions');
        subscribeToUpdates('products', data => {
          console.log('Product update received:', data);
        });
      } else if (user.role === 'admin') {
        PushNotificationService.subscribeToTopic(user.id, 'admin-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'system-alerts');
      }
    }

    // Cleanup on unmount
    return () => {
      if (user) {
        unsubscribeFromUpdates('orders');
        unsubscribeFromUpdates('products');
      }
    };
  }, [user, subscribeToUpdates, unsubscribeFromUpdates]);

  // Set document direction and theme with ThemeProvider support
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="souk-theme">
        <div className='min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-all duration-300'>
          <Navbar />

          <main id='main-content' className='flex-1'>
            <AnimatePresence mode='wait'>
              <Suspense fallback={<LoadingScreen />}>
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

                <Route
                  path='/about'
                  element={
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <AboutPage />
                    </motion.div>
                  }
                />

                <Route
                  path='/contact'
                  element={
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <ContactPage />
                    </motion.div>
                  }
                />

                {/* Appwrite Connection Test Route */}
                <Route
                  path='/appwrite-test'
                  element={
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <AppwriteTest />
                    </motion.div>
                  }
                />

                {/* Appwrite Setup Route */}
                <Route
                  path='/appwrite-setup'
                  element={
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <AppwriteSetup />
                    </motion.div>
                  }
                />

                {/* Services Route - Redirect to marketplace with services filter */}
                <Route
                  path='/services'
                  element={
                    <Navigate to='/marketplace?category=services' replace />
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

                <Route
                  path='/orders'
                  element={
                    <ProtectedRoute>
                      <motion.div
                        variants={pageVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                      >
                        <OrdersPage />
                      </motion.div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path='/favorites'
                  element={
                    <ProtectedRoute>
                      <motion.div
                        variants={pageVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                      >
                        <FavoritesPage />
                      </motion.div>
                    </ProtectedRoute>
                  }
                />

                {/* Chat Test Page (Development) */}
                <Route
                  path='/chat-test'
                  element={
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <ChatTestPage />
                    </motion.div>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path='/admin/login'
                  element={
                    <PublicRoute>
                      <motion.div
                        variants={pageVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                      >
                        <AdminLoginPage />
                      </motion.div>
                    </PublicRoute>
                  }
                />

                <Route
                  path='/admin/dashboard'
                  element={
                    <ProtectedRoute roles={['admin']} redirectTo='/admin/login'>
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

                {/* Customer Dashboard Routes */}
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

                <Route
                  path='/sell-your-car'
                  element={
                    <ProtectedRoute roles={['customer']}>
                      <motion.div
                        variants={pageVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                      >
                        <UsedCarSellingPage />
                      </motion.div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path='/dashboard/orders'
                  element={
                    <ProtectedRoute roles={['customer']}>
                      <motion.div
                        variants={pageVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                      >
                        <OrdersPage />
                      </motion.div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path='/dashboard/favorites'
                  element={
                    <ProtectedRoute roles={['customer']}>
                      <motion.div
                        variants={pageVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                      >
                        <FavoritesPage />
                      </motion.div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path='/sell-car'
                  element={
                    <ProtectedRoute roles={['customer']}>
                      <motion.div
                        variants={pageVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                      >
                        <UsedCarSellingPage />
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
                        <EnhancedVendorDashboard />
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

          {/* Floating Chat Widget - Always visible for customer support */}
          <Suspense fallback={null}>
            <FloatingChatWidget />
          </Suspense>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
