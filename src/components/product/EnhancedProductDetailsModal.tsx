/**
 * Enhanced Product Details Modal
 * Comprehensive product information display with image gallery
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  HeartIcon,
  ShareIcon,
  ShoppingCartIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { Product } from '@/types';
import { useAppStore } from '@/stores/appStore';
// import { useAuthStore } from '@/stores/authStore';

interface EnhancedProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
  isFavorite: boolean;
}

export const EnhancedProductDetailsModal: React.FC<EnhancedProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}) => {
  const { language, currency } = useAppStore();
  // const { user } = useAuthStore(); // Available if needed for user-specific features
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const isRTL = language === 'ar';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG').format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);
    setImageLoading(true);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
    setImageLoading(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        // if (process.env.NODE_ENV === 'development') console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={clsx(
            'relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden',
            isRTL ? 'font-arabic' : ''
          )}
        >
          {/* Header */}
          <div className='sticky top-0 z-10 flex items-center justify-between p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={onClose}
                className='p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              >
                <XMarkIcon className='w-6 h-6' />
              </button>
              <div>
                <h2 className='text-xl font-bold text-slate-900 dark:text-white line-clamp-1'>
                  {product.title}
                </h2>
                <p className='text-sm text-slate-600 dark:text-slate-400'>
                  {product.category} • {product.subcategory}
                </p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <button
                onClick={handleShare}
                className='p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              >
                <ShareIcon className='w-5 h-5' />
              </button>
              <button
                onClick={() => onToggleFavorite(product.id)}
                className={clsx(
                  'p-2 rounded-full transition-all duration-200',
                  isFavorite
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {isFavorite ? (
                  <HeartSolidIcon className='w-5 h-5' />
                ) : (
                  <HeartIcon className='w-5 h-5' />
                )}
              </button>
            </div>
          </div>

          <div className='flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)] overflow-hidden'>
            {/* Image Gallery */}
            <div className='lg:w-1/2 relative bg-slate-100 dark:bg-slate-800'>
              <div className='relative h-96 lg:h-full'>
                <AnimatePresence mode='wait'>
                  <motion.img
                    key={currentImageIndex}
                    src={product.images[currentImageIndex].url}
                    alt={product.images[currentImageIndex].alt}
                    className='w-full h-full object-cover'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imageLoading ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    onLoad={() => setImageLoading(false)}
                    loading='lazy'
                  />
                </AnimatePresence>

                {/* Loading Overlay */}
                {imageLoading && (
                  <div className='absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800'>
                    <div className='w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin' />
                  </div>
                )}

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className='absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors'
                    >
                      <ChevronLeftIcon className='w-5 h-5' />
                    </button>
                    <button
                      onClick={nextImage}
                      className='absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors'
                    >
                      <ChevronRightIcon className='w-5 h-5' />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className='absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full'>
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {product.images.length > 1 && (
                <div className='flex space-x-2 p-4 overflow-x-auto'>
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setImageLoading(true);
                      }}
                      className={clsx(
                        'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                        index === currentImageIndex
                          ? 'border-amber-500 ring-2 ring-amber-500/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-amber-400'
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className='w-full h-full object-cover'
                        loading='lazy'
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className='lg:w-1/2 p-6 overflow-y-auto'>
              <div className='space-y-6'>
                {/* Price and Rating */}
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='flex items-center space-x-2 mb-2'>
                      <span className='text-3xl font-bold text-slate-900 dark:text-white'>
                        {formatPrice(product.price)} {currency}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className='text-lg text-slate-500 line-through'>
                          {formatPrice(product.originalPrice)} {currency}
                        </span>
                      )}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='flex items-center'>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={clsx(
                              'w-4 h-4',
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-slate-300'
                            )}
                          />
                        ))}
                      </div>
                      <span className='text-sm text-slate-600 dark:text-slate-400'>
                        {product.rating} ({product.reviewCount}{' '}
                        {language === 'ar' ? 'تقييم' : 'reviews'})
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400'>
                    <div className='flex items-center space-x-1'>
                      <EyeIcon className='w-4 h-4' />
                      <span>{product.views}</span>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <HeartIcon className='w-4 h-4' />
                      <span>{product.favorites}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </h3>
                  <p className='text-slate-700 dark:text-slate-300 leading-relaxed'>
                    {product.description}
                  </p>
                </div>

                {/* Specifications */}
                {product.specifications && product.specifications.length > 0 && (
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
                      {language === 'ar' ? 'المواصفات' : 'Specifications'}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {product.specifications.map((spec, index) => (
                        <div
                          key={index}
                          className='flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg'
                        >
                          <span className='font-medium text-slate-900 dark:text-white'>
                            {spec.name}
                          </span>
                          <span className='text-slate-600 dark:text-slate-400'>{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
                      {language === 'ar' ? 'المميزات' : 'Features'}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                      {product.features.map((feature, index) => (
                        <div
                          key={index}
                          className='flex items-center space-x-2 text-slate-700 dark:text-slate-300'
                        >
                          <div className='w-2 h-2 bg-amber-500 rounded-full flex-shrink-0' />
                          <span className='text-sm'>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warranty */}
                {product.warranty && (
                  <div className='flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                    <ShieldCheckIcon className='w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
                    <div>
                      <h4 className='font-semibold text-blue-900 dark:text-blue-100'>
                        {language === 'ar' ? 'الضمان' : 'Warranty'}
                      </h4>
                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                        {product.warranty.duration} {language === 'ar' ? 'شهر' : 'months'} -{' '}
                        {product.warranty.coverage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className='grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700'>
                  <div className='flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400'>
                    <CalendarIcon className='w-4 h-4' />
                    <span>
                      {language === 'ar' ? 'تاريخ الإضافة' : 'Listed'}:{' '}
                      {formatDate(product.createdAt)}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400'>
                    <span
                      className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        product.condition === 'new'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      )}
                    >
                      {product.condition === 'new'
                        ? language === 'ar'
                          ? 'جديد'
                          : 'New'
                        : language === 'ar'
                          ? 'مستعمل'
                          : 'Used'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='sticky bottom-0 bg-white dark:bg-slate-900 pt-6 border-t border-slate-200 dark:border-slate-700'>
                  <div className='flex space-x-4'>
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={!product.inStock}
                      className={clsx(
                        'flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200',
                        product.inStock
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      )}
                    >
                      <ShoppingCartIcon className='w-5 h-5' />
                      <span>
                        {product.inStock
                          ? language === 'ar'
                            ? 'أضف للسلة'
                            : 'Add to Cart'
                          : language === 'ar'
                            ? 'غير متوفر'
                            : 'Out of Stock'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EnhancedProductDetailsModal;
