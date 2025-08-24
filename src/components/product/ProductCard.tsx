import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartIcon,
  EyeIcon,
  ShoppingCartIcon,
  StarIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

import { Product, CarProduct } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { HeartSolid } from '@/components/ui/CustomIcons';

import ProductDetailModal from './ProductDetailModal';
import EnhancedProductDetailsModal from './EnhancedProductDetailsModal';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string, quantity: number) => void;
  onToggleFavorite?: (productId: string, isFavorite: boolean) => void;
  className?: string;
}

const ProductCard = ({
  product,
  onAddToCart,
  onToggleFavorite,
  className = '',
}: ProductCardProps) => {
  const { language, addToFavorites, removeFromFavorites, isFavorite } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isProductFavorite = isFavorite(product.id);
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const isCarProduct = product.category === 'cars';
  const carDetails = isCarProduct ? (product as CarProduct).carDetails : null;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    if (isProductFavorite) {
      removeFromFavorites(product.id);
      toast.success(language === 'ar' ? 'تم إزالة المنتج من المفضلة' : 'Removed from favorites');
    } else {
      addToFavorites(product.id);
      toast.success(language === 'ar' ? 'تم إضافة المنتج للمفضلة' : 'Added to favorites');
    }

    onToggleFavorite?.(product.id, !isProductFavorite);
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) {
      toast.error(language === 'ar' ? 'المنتج غير متوفر' : 'Product is out of stock');
      //       return;
    }

    onAddToCart?.(product.id, 1);
    toast.success(language === 'ar' ? 'تم إضافة المنتج للسلة' : 'Added to cart');
  };

  const handleImageError = (): void => {
    setImageLoaded(false);
  };

  const handleImageLoad = (): void => {
    setImageLoaded(true);
  };

  const nextImage = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev: number) => (prev + 1) % product.images.length);
  };

  const prevImage = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(
      (prev: number) => (prev - 1 + product.images.length) % product.images.length
    );
  };

  return (
    <>
      <motion.div
        className={`group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-200 hover:border-primary-300 ${className}`}
        whileHover={{ y: -4, scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Image Section */}
        <div className='relative h-48 bg-neutral-100 overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

          {/* Main Image */}
          <AnimatePresence mode='wait'>
            <motion.img
              key={currentImageIndex}
              src={product.images[currentImageIndex]?.url || primaryImage?.url}
              alt={product.images[currentImageIndex]?.alt || primaryImage?.alt}
              className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
              onLoad={handleImageLoad}
              onError={handleImageError}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              exit={{ opacity: 0 }}
              loading='lazy'
            />
          </AnimatePresence>

          {/* Image Navigation */}
          {product.images.length > 1 && (
            <div className='absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
              <button
                onClick={prevImage}
                className='ml-2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md backdrop-blur-sm transition-all duration-200'
                type='button'
                aria-label='Previous image'
              >
                <svg
                  className='w-4 h-4 text-neutral-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 19l-7-7 7-7'
                  />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className='mr-2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md backdrop-blur-sm transition-all duration-200'
                type='button'
                aria-label='Next image'
              >
                <svg
                  className='w-4 h-4 text-neutral-700'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Image Loading Placeholder */}
          {!imageLoaded && (
            <div className='absolute inset-0 flex items-center justify-center bg-neutral-100'>
              <div className='w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin' />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className='p-4 space-y-3'>
          {/* Title and Rating */}
          <div className='space-y-2'>
            <div className='flex items-start justify-between'>
              <h3 className='font-semibold text-neutral-900 line-clamp-2 text-sm leading-tight group-hover:text-primary-600 transition-colors'>
                {product.title}
              </h3>
            </div>

            <div className='flex items-center justify-between text-xs text-neutral-600'>
              <div className='flex items-center space-x-1'>
                <div className='flex items-center'>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className='text-neutral-500'>({product.reviewCount})</span>
              </div>

              <div className='flex items-center space-x-3 text-neutral-500'>
                <div className='flex items-center space-x-1'>
                  <EyeIcon className='w-3 h-3' />
                  <span>{product.views}</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <HeartIcon className='w-3 h-3' />
                  <span>{product.favorites}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Car Details */}
          {carDetails && (
            <div className='grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-2 rounded-lg'>
              <div className='flex justify-between'>
                <span className='text-neutral-600'>{language === 'ar' ? 'السنة' : 'Year'}:</span>
                <span className='font-medium'>{carDetails.year}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-600'>
                  {language === 'ar' ? 'الكيلومترات' : 'Mileage'}:
                </span>
                <span className='font-medium'>{carDetails.mileage?.toLocaleString()} km</span>
              </div>
              <div className='col-span-2 flex justify-between'>
                <span className='text-neutral-600'>{language === 'ar' ? 'الطراز' : 'Model'}:</span>
                <span className='font-medium'>
                  {carDetails.make} {carDetails.model}
                </span>
              </div>
            </div>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {product.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'
                >
                  {feature}
                </span>
              ))}
              {product.features.length > 3 && (
                <span className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'>
                  +{product.features.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Price Section */}
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center space-x-2'>
                <span className='text-lg font-bold text-primary-600'>
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className='text-sm text-neutral-500 line-through'>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className='flex items-center text-xs'>
                {product.inStock ? (
                  <>
                    <CheckBadgeIcon className='w-3 h-3 text-green-500 mr-1' />
                    <span className='text-green-600'>
                      {language === 'ar' ? 'متوفر' : 'In Stock'}
                    </span>
                  </>
                ) : (
                  <span className='text-red-600'>
                    {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center space-x-2'>
              {/* Details Button */}
              <motion.button
                onClick={() => setIsEnhancedModalOpen(true)}
                className='px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type='button'
              >
                {language === 'ar' ? 'التفاصيل' : 'Details'}
              </motion.button>

              <motion.button
                onClick={handleToggleFavorite}
                className='p-2 rounded-full hover:bg-neutral-100 transition-colors'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type='button'
                aria-label={isProductFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isProductFavorite ? (
                  <HeartSolid className='w-5 h-5 text-red-500' />
                ) : (
                  <HeartIcon className='w-5 h-5 text-neutral-400' />
                )}
              </motion.button>

              {product.category !== 'services' && product.inStock && (
                <motion.button
                  onClick={handleAddToCart}
                  className='p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type='button'
                  aria-label='Add to cart'
                >
                  <ShoppingCartIcon className='w-5 h-5' />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Verified Badge */}
        {product.status === 'published' && (
          <div className='absolute top-0 right-0 bg-green-500 text-white p-1 rounded-bl-lg'>
            <CheckBadgeIcon className='w-4 h-4' />
          </div>
        )}
      </motion.div>

      {/* Product Detail Modal */}
      {isModalOpen && (
        <ProductDetailModal
          product={product}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Enhanced Product Details Modal */}
      {isEnhancedModalOpen && (
        <EnhancedProductDetailsModal
          product={product}
          isOpen={isEnhancedModalOpen}
          onClose={() => setIsEnhancedModalOpen(false)}
          onAddToCart={(product: Product) => {
            if (onAddToCart) {
              onAddToCart(product.id, 1);
            }
          }}
          onToggleFavorite={(productId: string) => {
            const currentlyFavorite = isFavorite(productId);
            if (currentlyFavorite) {
              removeFromFavorites(productId);
            } else {
              addToFavorites(productId);
            }
            onToggleFavorite?.(productId, !currentlyFavorite);
          }}
          isFavorite={isProductFavorite}
        />
      )}
    </>
  );
};

export default ProductCard;
