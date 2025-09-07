import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholder?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  placeholder,
  className = '',
  priority = false,
  sizes = '100vw',
  quality = 75,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(false);
  };

  // Generate optimized image URL (you can integrate with image optimization services)
  const getOptimizedSrc = (originalSrc: string) => {
    // For now, return the original src
    // In production, you might want to use services like Cloudinary, ImageKit, or Next.js Image Optimization
    return originalSrc;
  };

  const imageSrc = error ? fallbackSrc : getOptimizedSrc(src);

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {/* Placeholder/Skeleton */}
      {!isLoaded && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse"
        >
          {placeholder && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-neutral-400 text-sm">{placeholder}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-neutral-100 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-neutral-500 text-xs">Image failed to load</p>
          </div>
        </motion.div>
      )}

      {/* Actual Image */}
      {isInView && (
        <motion.img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          {...props}
        />
      )}

      {/* Loading Indicator */}
      {isInView && !isLoaded && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </motion.div>
      )}
    </div>
  );
};

export default OptimizedImage;