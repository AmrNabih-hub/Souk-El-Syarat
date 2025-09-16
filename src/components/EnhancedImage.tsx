import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { errorHandler } from '@/services/enhanced-error-handler.service';

interface EnhancedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholder?: string;
  fallback?: string;
  retryCount?: number;
  onError?: (error: Event) => void;
  onLoad?: () => void;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  priority?: boolean;
  blurDataURL?: string;
}

interface ImageState {
  status: 'loading' | 'loaded' | 'error' | 'retrying';
  retryAttempt: number;
  currentSrc: string;
}

const ImagePlaceholder: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
}> = ({ width, height, className }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded-lg flex items-center justify-center ${className}`}
    style={{ width, height }}
  >
    <ImageIcon className="w-12 h-12 text-gray-400" />
  </div>
);

const ImageError: React.FC<{
  onRetry: () => void;
  onFallback: () => void;
  width?: number | string;
  height?: number | string;
  className?: string;
}> = ({ onRetry, onFallback, width, height, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 text-center ${className}`}
    style={{ width, height }}
  >
    <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
    <p className="text-sm text-gray-600 mb-3">فشل تحميل الصورة</p>
    <div className="flex gap-2">
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
      >
        <RefreshCw className="w-3 h-3 inline mr-1" />
        إعادة المحاولة
      </button>
      <button
        onClick={onFallback}
        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
      >
        صورة بديلة
      </button>
    </div>
  </motion.div>
);

export const EnhancedImage: React.FC<EnhancedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = '/placeholder-image.jpg',
  fallback = '/fallback-image.jpg',
  retryCount = 3,
  onError,
  onLoad,
  loading = 'lazy',
  objectFit = 'cover',
  priority = false,
  blurDataURL,
}) => {
  const [state, setState] = useState<ImageState>({
    status: 'loading',
    retryAttempt: 0,
    currentSrc: src,
  });

  const [isVisible, setIsVisible] = useState(!loading || priority);
  const imageRef = React.useRef<HTMLImageElement>(null);

  // Handle image loading with retry logic
  const handleImageLoad = useCallback(() => {
    setState(prev => ({ ...prev, status: 'loaded' }));
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(async (event: Event) => {
    const error = event as any;
    
    // Log error with enhanced error handler
    await errorHandler.handleError(error, {
      operation: 'imageLoading',
      metadata: { src, retryAttempt: state.retryAttempt },
      timestamp: new Date(),
    });

    onError?.(event);

    if (state.retryAttempt < retryCount) {
      setState(prev => ({
        ...prev,
        status: 'retrying',
        retryAttempt: prev.retryAttempt + 1,
      }));

      // Retry with exponential backoff
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'loading',
          currentSrc: `${src}?retry=${prev.retryAttempt}`,
        }));
      }, 1000 * Math.pow(2, state.retryAttempt));
    } else {
      setState(prev => ({
        ...prev,
        status: 'error',
        currentSrc: fallback,
      }));
    }
  }, [src, retryCount, fallback, onError, state.retryAttempt]);

  // Handle retry manually
  const handleRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'loading',
      retryAttempt: 0,
      currentSrc: src,
    }));
  }, [src]);

  // Handle fallback
  const handleFallback = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'loaded',
      currentSrc: fallback,
    }));
  }, [fallback]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'lazy' && !priority) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      if (imageRef.current) {
        observer.observe(imageRef.current);
      }

      return () => observer.disconnect();
    }
  }, [loading, priority]);

  // Preload image
  useEffect(() => {
    if (!isVisible) return;

    const img = new Image();
    
    img.onload = handleImageLoad;
    img.onerror = handleImageError;
    
    img.src = state.currentSrc;
    img.alt = alt;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [state.currentSrc, alt, handleImageLoad, handleImageError, isVisible]);

  const renderContent = () => {
    switch (state.status) {
      case 'loading':
      case 'retrying':
        return <ImagePlaceholder width={width} height={height} className={className} />;
      
      case 'error':
        return (
          <ImageError
            onRetry={handleRetry}
            onFallback={handleFallback}
            width={width}
            height={height}
            className={className}
          />
        );
      
      case 'loaded':
        return (
          <img
            ref={imageRef}
            src={state.currentSrc}
            alt={alt}
            className={`${className} transition-opacity duration-300`}
            style={{
              width,
              height,
              objectFit,
            }}
            loading={loading}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for image loading state
export const useImageLoader = (src: string, options?: { retryCount?: number }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryAttempt, setRetryAttempt] = useState(0);

  const loadImage = useCallback(() => {
    const img = new Image();
    
    img.onload = () => {
      setStatus('loaded');
    };
    
    img.onerror = () => {
      if (retryAttempt < (options?.retryCount || 3)) {
        setRetryAttempt(prev => prev + 1);
        setTimeout(() => loadImage(), 1000 * Math.pow(2, retryAttempt));
      } else {
        setStatus('error');
      }
    };
    
    img.src = src;
  }, [src, retryAttempt, options?.retryCount]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return { status, retryAttempt, reload: loadImage };
};

// Image gallery component with error handling
export const ImageGallery: React.FC<{
  images: { src: string; alt: string }[];
  className?: string;
  onImageClick?: (index: number) => void;
}> = ({ images, className, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <ImageIcon className="w-16 h-16 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="aspect-square overflow-hidden rounded-lg">
        <EnhancedImage
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          className="w-full h-full cursor-pointer"
          onClick={() => onImageClick?.(currentIndex)}
        />
      </div>
      
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-orange-500' : 'border-transparent'
              }`}
            >
              <EnhancedImage
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};