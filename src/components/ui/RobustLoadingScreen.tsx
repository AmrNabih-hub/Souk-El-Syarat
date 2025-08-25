import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RobustLoadingScreenProps {
  message?: string;
  timeout?: number; // milliseconds
  onTimeout?: () => void;
}

const RobustLoadingScreen: React.FC<RobustLoadingScreenProps> = ({
  message = 'جاري التحميل...',
  timeout = 15000, // 15 seconds
  onTimeout
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    // Animated loading dots
    const dotsInterval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    // Timeout handler
    const timeoutTimer = setTimeout(() => {
      setHasTimedOut(true);
      onTimeout?.();
    }, timeout);

    return () => {
      clearInterval(dotsInterval);
      clearTimeout(timeoutTimer);
    };
  }, [timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            التحميل يستغرق وقتاً أطول من المعتاد
          </h2>
          
          <p className="text-neutral-600 mb-6">
            يبدو أن الاتصال بطيء. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
          </p>

          <div className="space-y-3">
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              إعادة تحميل الصفحة
            </motion.button>
            
            <motion.a
              href="/"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 block"
            >
              العودة للرئيسية
            </motion.a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo/Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-8 border-4 border-primary-200 border-t-primary-600 rounded-full"
        />
        
        {/* Company Branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
            سوق السيارات
          </h1>
          <p className="text-lg text-neutral-600 font-medium">
            Souk El-Syarat Marketplace
          </p>
        </motion.div>

        {/* Loading Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-neutral-700 text-lg font-medium"
          >
            {message}{loadingDots}
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: hasTimedOut ? "100%" : "75%" }}
          transition={{ duration: timeout / 1000, ease: "easeInOut" }}
          className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mx-auto mt-6 max-w-xs"
        />
        
        {/* Reassuring Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-neutral-500 mt-4 max-w-sm mx-auto"
        >
          أكبر منصة للتجارة الإلكترونية في مصر للسيارات وقطع الغيار
        </motion.p>
      </div>
    </div>
  );
};

export default RobustLoadingScreen;