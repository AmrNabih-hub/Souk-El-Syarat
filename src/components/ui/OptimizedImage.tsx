/**
 * Optimized Image Component with lazy loading, WebP support, and responsive images
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataURL?: string;
  sizes?: string;
  srcSet?: string;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
}

// Generate optimized image URLs for different sizes
const generateImageSrcSet = (src: string, quality = 80): string => {
  const sizes = [320, 640, 768, 1024, 1280, 1920];
  const baseUrl = src.split('?')[0];
  const extension = baseUrl.split('.').pop();
  
  // If it's an external URL with query params (like Unsplash), handle differently
  if (src.includes('unsplash.com')) {
    return sizes
      .map(size => `${baseUrl}?w=${size}&q=${quality}&fm=webp ${size}w`)
      .join(', ');
  }
  
  // For local images, assume we have different sizes available
  return sizes
    .map(size => {
      const sizeUrl = baseUrl.replace(`.${extension}`, `-${size}.${extension}`);
      return `${sizeUrl} ${size}w`;
    })
    .join(', ');
};

// Generate blur placeholder
const generateBlurPlaceholder = (width = 10, height = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Create a gradient blur effect
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL();
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes = '100vw',
  srcSet,
  onLoad,
  onError,
  objectFit = 'cover',
  quality = 80,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Preload priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setError(true);
    if (onError) onError();
  };

  // Generate responsive srcSet if not provided
  const imageSrcSet = srcSet || generateImageSrcSet(src, quality);
  
  // Generate blur placeholder if not provided
  const placeholderUrl = blurDataURL || generateBlurPlaceholder();

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-hidden', className)}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    >
      {/* Placeholder */}
      {placeholder !== 'none' && !isLoaded && !error && (
        <AnimatePresence>
          {placeholder === 'blur' && (
            <motion.img
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={placeholderUrl}
              alt=''
              className='absolute inset-0 w-full h-full object-cover filter blur-xl scale-110'
              aria-hidden='true'
            />
          )}
          
          {placeholder === 'skeleton' && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 animate-pulse'
            />
          )}
        </AnimatePresence>
      )}

      {/* Main Image */}
      {isInView && !error && (
        <motion.img
          ref={imgRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          src={src}
          alt={alt}
          srcSet={imageSrcSet}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={clsx(
            'w-full h-full',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          style={{
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined,
          }}
        />
      )}

      {/* Error State */}
      {error && (
        <div className='absolute inset-0 flex items-center justify-center bg-neutral-100'>
          <div className='text-center p-4'>
            <svg
              className='w-12 h-12 mx-auto text-neutral-400 mb-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            <p className='text-sm text-neutral-600'>Failed to load image</p>
          </div>
        </div>
      )}

      {/* Loading Spinner for priority images */}
      {priority && !isLoaded && !error && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin' />
        </div>
      )}
    </div>
  );
};

// Image Gallery Component with optimization
export const OptimizedImageGallery: React.FC<{
  images: Array<{ src: string; alt: string }>;
  className?: string;
}> = ({ images, className }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [preloadedIndexes, setPreloadedIndexes] = useState(new Set([0]));

  // Preload adjacent images
  useEffect(() => {
    const indexesToPreload = [
      selectedIndex - 1,
      selectedIndex,
      selectedIndex + 1,
    ].filter(i => i >= 0 && i < images.length);

    indexesToPreload.forEach(index => {
      if (!preloadedIndexes.has(index)) {
        const img = new Image();
        img.src = images[index].src;
        setPreloadedIndexes(prev => new Set([...prev, index]));
      }
    });
  }, [selectedIndex, images, preloadedIndexes]);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Main Image */}
      <div className='relative aspect-w-16 aspect-h-9'>
        <OptimizedImage
          src={images[selectedIndex].src}
          alt={images[selectedIndex].alt}
          priority
          className='w-full h-full rounded-lg'
        />
      </div>

      {/* Thumbnails */}
      <div className='flex space-x-2 overflow-x-auto'>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={clsx(
              'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
              selectedIndex === index
                ? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2'
                : 'border-transparent hover:border-neutral-300'
            )}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              className='w-full h-full'
              priority={preloadedIndexes.has(index)}
              placeholder='skeleton'
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default OptimizedImage;