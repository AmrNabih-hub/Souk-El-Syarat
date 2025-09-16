import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartIcon,
  ShoppingCartIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

import { Product, CarProduct } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { HeartSolid } from '@/components/ui/CustomIcons';

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
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false);
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
      return;
    }

    onAddToCart?.(product.id, 1);
    toast.success(language === 'ar' ? 'تم إضافة المنتج للسلة' : 'Added to cart');
  };

  const handlePreviousImage = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(
      (prev: number) => (prev - 1 + product.images.length) % product.images.length
    );
  };

  const handleNextImage = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev: number) => (prev + 1) % product.images.length);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden border border-neutral-200 group ${className || ''}`}>
      {/* Image Section - Fixed aspect ratio with responsive scaling */}
      <div className="relative w-full">
        <div className="aspect-[4/3] w-full bg-neutral-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={product.images[currentImageIndex]?.url || primaryImage?.url}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Navigation Buttons - Positioned for desktop scaling */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
                aria-label="Previous image"
              >
                <svg className="w-3.5 h-3.5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
                aria-label="Next image"
              >
                <svg className="w-3.5 h-3.5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Image Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index === currentImageIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Stock Status Badge */}
          <div className="absolute top-2 left-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                product.inStock
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md transition-all duration-200 hover:scale-110"
            aria-label={isProductFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isProductFavorite ? (
              <HeartSolid className="w-4 h-4 text-red-500" />
            ) : (
              <HeartIcon className="w-4 h-4 text-neutral-600 hover:text-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content Section - Optimized for desktop scaling */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow space-y-2">
        {/* Title and Rating */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-2 leading-tight">
            {product.title}
          </h3>
          
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating || 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-neutral-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-600">
              {product.rating?.toFixed(1) || '0.0'} ({product.reviewCount || 0})
            </span>
          </div>
        </div>

        {/* Car Details */}
        <div className="flex flex-wrap gap-1.5 text-xs text-neutral-600">
          {carDetails?.year && (
            <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{carDetails.year}</span>
          )}
          {carDetails?.mileage && (
            <span className="bg-neutral-100 px-1.5 py-0.5 rounded">
              {carDetails.mileage.toLocaleString()} km
            </span>
          )}
          {product.fuelType && (
            <span className="bg-neutral-100 px-1.5 py-0.5 rounded capitalize">{product.fuelType}</span>
          )}
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded capitalize"
              >
                {feature}
              </span>
            ))}
            {product.features.length > 3 && (
              <span className="text-xs text-neutral-500">+{product.features.length - 3}</span>
            )}
          </div>
        )}

        {/* Price Section */}
        <div className="mt-auto pt-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg sm:text-xl font-bold text-neutral-900">
                {formatPrice(product.price)}
              </p>
              {product.originalPrice && product.originalPrice > product.price && (
                <p className="text-xs text-neutral-500 line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              )}
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              product.condition === 'new'
                ? 'bg-green-100 text-green-800'
                : product.condition === 'used'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {product.condition}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 pt-2">
          <button
            onClick={() => setIsEnhancedModalOpen(true)}
            className="flex-1 bg-neutral-100 text-neutral-700 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-200 transition-colors"
          >
            Quick View
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 bg-primary-600 text-white px-2 py-1.5 rounded-md text-xs font-medium hover:bg-primary-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default ProductCard;
