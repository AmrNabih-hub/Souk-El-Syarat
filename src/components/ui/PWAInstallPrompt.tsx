/**
 * PWA Install Prompt Component
 * Prompts users to install the app on their device
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const { language } = useAppStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom install prompt
      // Only show if user hasn't dismissed it before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', dismissedUntil.toString());
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 rtl:right-auto rtl:left-3 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl mb-4">
            <ArrowDownTrayIcon className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {language === 'ar' ? 'ثبت التطبيق' : 'Install App'}
          </h3>
          
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {language === 'ar'
              ? 'ثبت سوق السيارات على جهازك للوصول السريع والعمل بدون إنترنت'
              : 'Install Souk El-Sayarat on your device for quick access and offline use'
            }
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 transition-all shadow-lg"
            >
              {language === 'ar' ? 'تثبيت' : 'Install'}
            </motion.button>
            
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              {language === 'ar' ? 'لاحقاً' : 'Later'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
