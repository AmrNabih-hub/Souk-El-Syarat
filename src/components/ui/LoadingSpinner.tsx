import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'neutral';
  className?: string;
  text?: string;
}

interface EgyptianLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'border-amber-500 border-t-transparent',
    secondary: 'border-orange-500 border-t-transparent',
    neutral: 'border-gray-500 border-t-transparent',
  };

  return (
    <div className={clsx('flex flex-col items-center space-y-2', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-2',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {text && <p className='text-sm text-gray-600 dark:text-gray-400'>{text}</p>}
    </div>
  );
};

export const PulseLoader: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const colorClasses = {
    primary: 'bg-amber-500',
    secondary: 'bg-orange-500',
    neutral: 'bg-gray-500',
  };

  return (
    <div className={clsx('flex space-x-1', className)}>
      {[0, 1, 2].map(index => (
        <motion.div
          key={index}
          className={clsx('rounded-full', sizeClasses[size], colorClasses[color])}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};

export const EgyptianLoader: React.FC<EgyptianLoaderProps> = ({ text, size = 'md' }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Professional automotive marketplace images with high-quality, relevant photos
  const automotiveImages = [
    {
      url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=300&fit=crop&crop=center&q=80',
      title: 'Luxury Sports Cars',
      category: 'Cars',
      description: 'Premium sports and luxury vehicles',
    },
    {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop&crop=center&q=80',
      title: 'Performance Brake Systems',
      category: 'Parts',
      description: 'High-performance automotive parts',
    },
    {
      url: 'https://images.unsplash.com/photo-1632823469190-6596598f8582?w=600&h=300&fit=crop&crop=center&q=80',
      title: 'Professional Auto Service',
      category: 'Services',
      description: 'Expert automotive maintenance',
    },
    {
      url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&h=300&fit=crop&crop=center&q=80',
      title: 'Engine Performance Kits',
      category: 'Kits',
      description: 'Complete performance upgrade packages',
    },
    {
      url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=300&fit=crop&crop=center&q=80',
      title: 'Quality Spare Parts',
      category: 'Spares',
      description: 'OEM and aftermarket components',
    },
    {
      url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=300&fit=crop&crop=center&q=80',
      title: 'Executive Sedans',
      category: 'Cars',
      description: 'Business and family vehicles',
    },
  ];

  // Auto-advance images every 3 seconds with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % automotiveImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [automotiveImages.length]);

  return (
    <div className='flex flex-col items-center justify-center space-y-6 p-6'>
      {/* Professional Auto-Sliding Image Carousel */}
      <div className='relative w-[500px] h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl border border-slate-700/50'>
        {/* Image Slider Container */}
        <div className='relative w-full h-full'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentImageIndex}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: '0%', opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1],
                type: 'tween',
              }}
              className='absolute inset-0 w-full h-full'
            >
              <img
                src={automotiveImages[currentImageIndex].url}
                alt={automotiveImages[currentImageIndex].title}
                className='w-full h-full object-cover'
                loading='lazy'
              />

              {/* Professional gradient overlay */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

              {/* Category Badge */}
              <div className='absolute top-4 right-4'>
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className='px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg'
                >
                  {automotiveImages[currentImageIndex].category}
                </motion.span>
              </div>

              {/* Content Overlay */}
              <div className='absolute bottom-0 left-0 right-0 p-6'>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <h3 className='text-white font-bold text-2xl mb-2 drop-shadow-lg'>
                    {automotiveImages[currentImageIndex].title}
                  </h3>
                  <p className='text-amber-200 text-sm opacity-90'>
                    {automotiveImages[currentImageIndex].description}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Smooth Progress Indicator */}
        <div className='absolute bottom-0 left-0 right-0 h-1 bg-black/30'>
          <motion.div
            className='h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500'
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Subtle border glow effect */}
        <div className='absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-sm -z-10' />
      </div>

      {/* Loading Status */}
      <div className='text-center space-y-2'>
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className='text-slate-300 font-semibold text-lg'
        >
          {text || 'جاري التحميل...'}
        </motion.p>
        <p className='text-slate-500 text-sm'>Loading Premium Automotive Experience</p>
      </div>

      {/* Clean Navigation Dots */}
      <div className='flex space-x-3'>
        {automotiveImages.map((_, index) => (
          <motion.div
            key={index}
            className={clsx(
              'w-2.5 h-2.5 rounded-full transition-all duration-500',
              index === currentImageIndex
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 scale-125 shadow-lg'
                : 'bg-slate-600/60 hover:bg-slate-500/80'
            )}
            whileHover={{ scale: 1.2 }}
            animate={
              index === currentImageIndex
                ? {
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
                  }
                : {}
            }
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;
