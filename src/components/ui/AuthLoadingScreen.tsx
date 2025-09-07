import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface AuthLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'جاري التحقق من الصلاحيات...',
  subMessage = 'Verifying permissions...'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white font-bold text-3xl">س</span>
          </div>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full mx-auto"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <SparklesIcon className="w-6 h-6 text-primary-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Messages */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-2"
        >
          <h2 className="text-xl font-semibold text-neutral-900 font-arabic">
            {message}
          </h2>
          <p className="text-neutral-600 text-sm">
            {subMessage}
          </p>
        </motion.div>

        {/* Progress Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex justify-center space-x-2 mt-8"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 bg-primary-500 rounded-full"
            />
          ))}
        </motion.div>

        {/* Loading Tips */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 max-w-sm mx-auto"
        >
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-primary-100">
            <p className="text-sm text-neutral-600">
              <span className="font-semibold text-primary-600">Tip:</span> Make sure you have a stable internet connection for the best experience.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLoadingScreen;