import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Layout Components (always loaded)
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Core Pages (always loaded)
import HomePage from '@/pages/HomePage';

// Lazy load heavy components and pages
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const MarketplacePage = lazy(() => import('@/pages/customer/MarketplacePage'));
const VendorsPage = lazy(() => import('@/pages/customer/VendorsPage'));
const VendorApplicationPage = lazy(() => import('@/pages/VendorApplicationPage'));

// Authentication Pages (lazy loaded)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// Role-based Dashboard Pages (lazy loaded)
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const VendorDashboard = lazy(() => import('@/pages/vendor/VendorDashboard'));
const CustomerDashboard = lazy(() => import('@/pages/customer/CustomerDashboard'));

// Advanced Components (lazy loaded)
const GlobalLiveFeatures = lazy(() => import('@/components/advanced/GlobalLiveFeatures'));

// Customer Pages (lazy loaded)
const UsedCarSellingPage = lazy(() => import('@/pages/customer/UsedCarSellingPage'));

// Loading Components
import LoadingScreen from '@/components/ui/LoadingScreen';
import EgyptianLoader from '@/components/ui/EgyptianLoader';

// Auth Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AuthProvider from '@/components/auth/AuthProvider';

// Professional Loading Component
const AppLoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
    <div className="text-center">
      <EgyptianLoader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
          سوق السيارات
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          أكبر سوق للسيارات في مصر
        </p>
      </motion.div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
        {/* Global Live Features - Real-time notifications and updates */}
        <Suspense fallback={null}>
          <GlobalLiveFeatures />
        </Suspense>

        {/* Professional Navigation */}
        <Navbar />

        <main className="flex-1">
          <Suspense fallback={<AppLoadingScreen />}>
            <Routes>
              {/* Core Application Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Role-based Dashboard Routes (Protected) */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/vendor/dashboard" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/customer/dashboard" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              } />
              
              {/* Vendor System (Protected) */}
              <Route path="/vendor/apply" element={
                <ProtectedRoute requireAuth={true}>
                  <VendorApplicationPage />
                </ProtectedRoute>
              } />
              <Route path="/become-vendor" element={<Navigate to="/vendor/apply" replace />} />
              
              {/* Sell Your Car - Customer Only (Protected) */}
              <Route path="/sell-your-car" element={
                <ProtectedRoute allowedRoles={['customer']} requireAuth={true}>
                  <UsedCarSellingPage />
                </ProtectedRoute>
              } />
              
              {/* OAuth Callback Route */}
              <Route path="/auth/callback" element={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingScreen />
                </div>
              } />
              
              {/* Fallback Routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

        {/* Professional Footer */}
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;