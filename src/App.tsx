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

// Advanced Components (lazy loaded)
const GlobalLiveFeatures = lazy(() => import('@/components/advanced/GlobalLiveFeatures'));

// Loading Components
import LoadingScreen from '@/components/ui/LoadingScreen';
import EgyptianLoader from '@/components/ui/EgyptianLoader';

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
              
              {/* Vendor System */}
              <Route path="/vendor/apply" element={<VendorApplicationPage />} />
              <Route path="/become-vendor" element={<Navigate to="/vendor/apply" replace />} />
              
              {/* Additional Routes */}
              <Route path="/sell-your-car" element={
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 py-20">
                  <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <div className="text-6xl mb-6">🚗</div>
                      <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-6">
                        بيع سيارتك بسهولة
                      </h1>
                      <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl mx-auto">
                        ادخل بيانات سيارتك واحصل على أفضل العروض من تجار معتمدين في جميع أنحاء مصر
                      </p>
                      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-4">
                          🚀 قريباً - خدمة بيع السيارات الفورية
                        </p>
                        <ul className="text-right space-y-3 text-neutral-700 dark:text-neutral-300">
                          <li className="flex items-center gap-3">
                            <span className="text-emerald-500">✓</span>
                            تقييم فوري لسيارتك
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="text-emerald-500">✓</span>
                            عروض من تجار معتمدين
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="text-emerald-500">✓</span>
                            إجراءات آمنة ومضمونة
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="text-emerald-500">✓</span>
                            دعم فني 24/7
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>
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
  );
}

export default App;