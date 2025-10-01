/**
 * Optimized Image Component
 * Lazy loading, WebP support, responsive images
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean; // Load immediately without lazy loading
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  sizes?: string; // Responsive sizes
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  objectFit = 'cover',
  sizes,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    // Generate WebP source with fallback
    const generateOptimizedSrc = (originalSrc: string): string => {
      // If it's an Unsplash image, use their optimization API
      if (originalSrc.includes('unsplash.com')) {
        const url = new URL(originalSrc);
        url.searchParams.set('auto', 'format'); // Auto WebP
        url.searchParams.set('fit', 'crop');
        if (width) url.searchParams.set('w', width.toString());
        if (height) url.searchParams.set('h', height.toString());
        url.searchParams.set('q', '80'); // Quality 80%
        return url.toString();
      }
      
      // For local images, return as-is (can add WebP conversion logic)
      return originalSrc;
    };

    setImageSrc(generateOptimizedSrc(src));
  }, [src, width, height]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageStyles = {
    objectFit,
    ...(width && { width: `${width}px` }),
    ...(height && { height: `${height}px` }),
  };

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 ${className}`}
        style={imageStyles}
      >
        <div className="text-center text-neutral-400 p-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 animate-pulse" />
      )}

      {/* Actual image */}
      <motion.img
        src={imageSrc}
        alt={alt}
        style={imageStyles}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Progressive blur-up effect (optional) */}
      {!isLoaded && imageSrc && (
        <img
          src={`${imageSrc}?w=20&blur=10`} // Tiny blurred placeholder
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default OptimizedImage;
