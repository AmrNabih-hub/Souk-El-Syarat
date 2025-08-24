import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'جاري التحميل...', 
  fullScreen = true 
}) => {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50' 
    : 'w-full h-full min-h-[400px]';

  return (
    <motion.div
      className={`${containerClasses} flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='text-center'>
        {/* Animated Logo */}
        <motion.div
          className='relative w-32 h-32 mx-auto mb-8'
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Outer Ring */}
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full'
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Inner Circle */}
          <div className='absolute inset-2 bg-white rounded-full shadow-inner' />
          
          {/* Center Icon */}
          <motion.div
            className='absolute inset-4 flex items-center justify-center'
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg
              className='w-16 h-16 text-primary-500'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z' />
            </svg>
          </motion.div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className='text-3xl font-bold mb-3'>
            <span className='gradient-text-animated'>سوق السيارات</span>
          </h2>
          <p className='text-lg text-neutral-600 mb-4'>{message}</p>
          
          {/* Loading Dots */}
          <div className='flex justify-center space-x-2 rtl:space-x-reverse'>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className='w-3 h-3 bg-primary-500 rounded-full'
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className='mt-8 w-64 mx-auto'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className='h-1 bg-neutral-200 rounded-full overflow-hidden'>
            <motion.div
              className='h-full bg-gradient-to-r from-primary-500 to-secondary-500'
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;