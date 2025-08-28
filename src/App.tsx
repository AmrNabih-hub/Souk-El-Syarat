import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { PushNotificationService } from '@/services/push-notification.service';
import { AuthService } from '@/services/auth.service';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import ChatSystem from '@/components/realtime/ChatSystem';

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
const WishlistPage = React.lazy(() => import('@/pages/customer/WishlistPage'));
const ProfilePage = React.lazy(() => import('@/pages/customer/ProfilePage'));
const OrdersPage = React.lazy(() => import('@/pages/customer/OrdersPage'));
const CheckoutPage = React.lazy(() => import('@/pages/customer/CheckoutPage'));
const OrderConfirmationPage = React.lazy(() => import('@/pages/customer/OrderConfirmationPage'));

// Dashboard pages
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const VendorDashboard = React.lazy(() => import('@/pages/vendor/VendorDashboard'));
const CustomerDashboard = React.lazy(() => import('@/pages/customer/CustomerDashboard'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));
const TestPage = React.lazy(() => import('@/pages/TestPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
const HelpPage = React.lazy(() => import('@/pages/HelpPage'));
const FAQPage = React.lazy(() => import('@/pages/FAQPage'));
const TermsPage = React.lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('@/pages/PrivacyPage'));

// Protected Route Component
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
  const { setUser, setLoading, user } = useAuthStore();
  const { language, theme } = useAppStore();
  const { initialize: initializeRealtime, cleanup: cleanupRealtime } = useRealtimeStore();

  // Set up authentication state listener
  useEffect(() => {
    setLoading(true);

    const unsubscribe = AuthService.onAuthStateChange(user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Initialize real-time services when user logs in
  useEffect(() => {
    if (user) {
      // Initialize real-time services
      initializeRealtime(user.id).catch(error => {
        // Silent handling - service will continue without real-time features
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to initialize real-time services:', error);
        }
      });

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
      } else if (user.role === 'customer') {
        PushNotificationService.subscribeToTopic(user.id, 'customer-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'promotions');
      } else if (user.role === 'admin') {
        PushNotificationService.subscribeToTopic(user.id, 'admin-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'system-alerts');
      }
    } else {
      // Clean up real-time services when user logs out
      cleanupRealtime();
    }

    // Cleanup on unmount
    return () => {
      if (!user) {
        cleanupRealtime();
      }
    };
  }, [user, initializeRealtime, cleanupRealtime]);

  // Set document direction and theme
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
  }, [language, theme]);

  return (
    <div className='min-h-screen bg-gray-50 transition-all duration-500'>
      <Navbar />

      <main className='flex-1'>
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
                path='/wishlist'
                element={
                  <ProtectedRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <WishlistPage />
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
                path='/checkout'
                element={
                  <ProtectedRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <CheckoutPage />
                    </motion.div>
                  </ProtectedRoute>
                }
              />

              <Route
                path='/order-confirmation/:orderId'
                element={
                  <ProtectedRoute>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <OrderConfirmationPage />
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

              {/* Static Pages */}
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
              
              <Route
                path='/help'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <HelpPage />
                  </motion.div>
                }
              />
              
              <Route
                path='/faq'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <FAQPage />
                  </motion.div>
                }
              />
              
              <Route
                path='/terms'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <TermsPage />
                  </motion.div>
                }
              />
              
              <Route
                path='/privacy'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <PrivacyPage />
                  </motion.div>
                }
              />

              {/* Test Page Route */}
              <Route
                path='/test'
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <motion.div
                      variants={pageVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                    >
                      <TestPage />
                    </motion.div>
                  </Suspense>
                }
              />

              {/* 404 Not Found - Must be last */}
              <Route
                path='*'
                element={
                  <motion.div
                    variants={pageVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <NotFoundPage />
                  </motion.div>
                }
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      <Footer />
      
      {/* Real-time Chat System - Available for logged in users */}
      {user && <ChatSystem />}
    </div>
  );
}

export default App;
