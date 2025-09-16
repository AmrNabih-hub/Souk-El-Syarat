import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  HeartIcon,
  ShoppingCartIcon,
  StarIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { Product, CarProduct } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { HeartSolid } from '@/components/ui/CustomIcons';
import toast from 'react-hot-toast';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productId: string, quantity: number) => void;
  onToggleFavorite?: (productId: string, isFavorite: boolean) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleFavorite,
}) => {
  const { language, isFavorite, addToFavorites, removeFromFavorites } = useAppStore();
  const { user } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState<'details' | 'specs' | 'reviews'>('details');

  const isProductFavorite = isFavorite(product.id);
  const isCarProduct = product.category === 'cars';
  const carDetails = isCarProduct ? (product as CarProduct).carDetails : null;

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      //       return;
    }

    if (isProductFavorite) {
      removeFromFavorites(product.id);
      toast.success(language === 'ar' ? 'تم إزالة المنتج من المفضلة' : 'Removed from favorites');
    } else {
      addToFavorites(product.id);
      toast.success(language === 'ar' ? 'تم إضافة المنتج للمفضلة' : 'Added to favorites');
    }

    onToggleFavorite?.(product.id, !isProductFavorite);
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      //       return;
    }

    onAddToCart?.(product.id, quantity);
    toast.success(language === 'ar' ? 'تم إضافة المنتج للسلة' : 'Added to cart');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getConditionLabel = (condition: string) => {
    const labels = {
      new: { ar: 'جديد', en: 'New' },
      used: { ar: 'مستعمل', en: 'Used' },
      refurbished: { ar: 'مجدد', en: 'Refurbished' },
    };
    return labels[condition as keyof typeof labels]?.[language] || condition;
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
  };

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const contentVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
    exit: { scale: 0.8, opacity: 0 },
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        variants={modalVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
        onClick={onClose}
      >
        <motion.div
          className='bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl'
          variants={contentVariants}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-neutral-200'>
            <div className='flex items-center space-x-4'>
              <h2 className='text-2xl font-bold text-neutral-900'>{product.title}</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.condition === 'new'
                    ? 'bg-green-100 text-green-800'
                    : product.condition === 'used'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                }`}
              >
                {getConditionLabel(product.condition)}
              </span>
            </div>

            <div className='flex items-center space-x-3'>
              <button
                onClick={handleToggleFavorite}
                className='p-2 rounded-full hover:bg-neutral-100 transition-colors'
              >
                {isProductFavorite ? (
                  <HeartSolid className='w-6 h-6 text-red-500' />
                ) : (
                  <HeartIcon className='w-6 h-6 text-neutral-400' />
                )}
              </button>

              <button 
                className='p-2 rounded-full hover:bg-neutral-100 transition-colors'
                title={language === 'ar' ? 'مشاركة المنتج' : 'Share Product'}
                aria-label={language === 'ar' ? 'مشاركة المنتج' : 'Share Product'}
              >
                <ShareIcon className='w-6 h-6 text-neutral-400' />
              </button>

              <button
                onClick={onClose}
                className='p-2 rounded-full hover:bg-neutral-100 transition-colors'
                title={language === 'ar' ? 'إغلاق' : 'Close'}
                aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <XMarkIcon className='w-6 h-6 text-neutral-400' />
              </button>
            </div>
          </div>

          <div className='flex flex-col lg:flex-row overflow-hidden'>
            {/* Image Gallery */}
            <div className='lg:w-1/2 relative'>
              <div className='aspect-square bg-neutral-100 relative overflow-hidden'>
                <AnimatePresence mode='wait'>
                  <motion.img
                    key={currentImageIndex}
                    src={product.images[currentImageIndex]?.url}
                    alt={product.images[currentImageIndex]?.alt || product.title}
                    className='w-full h-full object-cover'
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors'
                      title={language === 'ar' ? 'الصورة السابقة' : 'Previous Image'}
                      aria-label={language === 'ar' ? 'الصورة السابقة' : 'Previous Image'}
                    >
                      <ChevronLeftIcon className='w-5 h-5' />
                    </button>

                    <button
                      onClick={nextImage}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors'
                      title={language === 'ar' ? 'الصورة التالية' : 'Next Image'}
                      aria-label={language === 'ar' ? 'الصورة التالية' : 'Next Image'}
                    >
                      <ChevronRightIcon className='w-5 h-5' />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className='absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className='flex space-x-2 p-4 overflow-x-auto'>
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex
                          ? 'border-primary-500'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      <img src={image.url} alt={image.alt} className='w-full h-full object-cover' />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className='lg:w-1/2 p-6 overflow-y-auto max-h-[70vh]'>
              {/* Rating and Views */}
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-2'>
                  <div className='flex items-center'>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className='text-neutral-600'>
                    {product.rating.toFixed(1)} ({product.reviewCount}{' '}
                    {language === 'ar' ? 'تقييم' : 'reviews'})
                  </span>
                </div>

                <div className='flex items-center text-neutral-500'>
                  <EyeIcon className='w-4 h-4 mr-1' />
                  {product.views} {language === 'ar' ? 'مشاهدة' : 'views'}
                </div>
              </div>

              {/* Price */}
              <div className='mb-6'>
                <div className='flex items-center space-x-3 mb-2'>
                  <span className='text-3xl font-bold text-primary-600'>
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className='text-xl text-neutral-500 line-through'>
                        {formatPrice(product.originalPrice)}
                      </span>
                      <span className='bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium'>
                        -
                        {Math.round(
                          ((product.originalPrice - product.price) / product.originalPrice) * 100
                        )}
                        %
                      </span>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div className='flex items-center'>
                  {product.inStock ? (
                    <>
                      <CheckBadgeIcon className='w-5 h-5 text-green-500 mr-2' />
                      <span className='text-green-600 font-medium'>
                        {language === 'ar' ? 'متوفر في المخزن' : 'In Stock'}
                      </span>
                      {product.quantity > 1 && (
                        <span className='text-neutral-500 ml-2'>
                          ({product.quantity} {language === 'ar' ? 'قطعة متاحة' : 'available'})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className='text-red-600 font-medium'>
                      {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                    </span>
                  )}
                </div>
              </div>

              {/* Car Details */}
              {isCarProduct && carDetails && (
                <div className='mb-6 p-4 bg-neutral-50 rounded-lg'>
                  <h4 className='font-semibold text-neutral-900 mb-3'>
                    {language === 'ar' ? 'تفاصيل السيارة' : 'Car Details'}
                  </h4>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div className='flex items-center'>
                      <span className='text-neutral-600 mr-2'>
                        {language === 'ar' ? 'السنة:' : 'Year:'}
                      </span>
                      <span className='font-medium'>{carDetails.year}</span>
                    </div>
                    <div className='flex items-center'>
                      <span className='text-neutral-600 mr-2'>
                        {language === 'ar' ? 'المسافة:' : 'Mileage:'}
                      </span>
                      <span className='font-medium'>
                        {carDetails.mileage?.toLocaleString()} {language === 'ar' ? 'كم' : 'km'}
                      </span>
                    </div>
                    <div className='flex items-center'>
                      <span className='text-neutral-600 mr-2'>
                        {language === 'ar' ? 'الوقود:' : 'Fuel:'}
                      </span>
                      <span className='font-medium'>{carDetails.fuelType}</span>
                    </div>
                    <div className='flex items-center'>
                      <span className='text-neutral-600 mr-2'>
                        {language === 'ar' ? 'الناقل:' : 'Transmission:'}
                      </span>
                      <span className='font-medium'>{carDetails.transmission}</span>
                    </div>
                    <div className='col-span-2 flex items-center'>
                      <span className='text-neutral-600 mr-2'>
                        {language === 'ar' ? 'الطراز:' : 'Model:'}
                      </span>
                      <span className='font-medium'>
                        {carDetails.make} {carDetails.model}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity Selector and Add to Cart */}
              {product.category !== 'services' && product.inStock && (
                <div className='mb-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center'>
                      <span className='text-neutral-700 mr-3'>
                        {language === 'ar' ? 'الكمية:' : 'Quantity:'}
                      </span>
                      <div className='flex items-center border border-neutral-300 rounded-lg'>
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className='px-3 py-2 hover:bg-neutral-100 transition-colors'
                        >
                          -
                        </button>
                        <span className='px-4 py-2 border-x border-neutral-300'>{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                          className='px-3 py-2 hover:bg-neutral-100 transition-colors'
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleAddToCart}
                      className='flex-1 bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ShoppingCartIcon className='w-5 h-5 mr-2' />
                      {language === 'ar' ? 'إضافة للسلة' : 'Add to Cart'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Service Booking */}
              {product.category === 'services' && (
                <div className='mb-6'>
                  <motion.button
                    className='w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ChatBubbleLeftRightIcon className='w-5 h-5 mr-2' />
                    {language === 'ar' ? 'حجز الخدمة' : 'Book Service'}
                  </motion.button>
                </div>
              )}

              {/* Tabs */}
              <div className='border-b border-neutral-200 mb-4'>
                <nav className='flex space-x-8'>
                  {[
                    { id: 'details', label: language === 'ar' ? 'التفاصيل' : 'Details' },
                    { id: 'specs', label: language === 'ar' ? 'المواصفات' : 'Specifications' },
                    { id: 'reviews', label: language === 'ar' ? 'التقييمات' : 'Reviews' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        selectedTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className='space-y-4'>
                {selectedTab === 'details' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='space-y-4'
                  >
                    <div>
                      <h4 className='font-semibold text-neutral-900 mb-2'>
                        {language === 'ar' ? 'الوصف' : 'Description'}
                      </h4>
                      <p className='text-neutral-700 leading-relaxed'>{product.description}</p>
                    </div>

                    {product.features && product.features.length > 0 && (
                      <div>
                        <h4 className='font-semibold text-neutral-900 mb-2'>
                          {language === 'ar' ? 'المميزات' : 'Features'}
                        </h4>
                        <div className='flex flex-wrap gap-2'>
                          {product.features.map((feature, index) => (
                            <span
                              key={index}
                              className='px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full'
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.warranty && (
                      <div className='p-4 bg-green-50 rounded-lg'>
                        <div className='flex items-center mb-2'>
                          <ShieldCheckIcon className='w-5 h-5 text-green-600 mr-2' />
                          <h4 className='font-semibold text-green-900'>
                            {language === 'ar' ? 'الضمان' : 'Warranty'}
                          </h4>
                        </div>
                        <p className='text-green-800'>
                          {product.warranty.duration} {language === 'ar' ? 'شهر' : 'months'} -{' '}
                          {product.warranty.coverage}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {selectedTab === 'specs' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='space-y-3'
                  >
                    {product.specifications.map((spec, index) => (
                      <div
                        key={index}
                        className='flex justify-between py-2 border-b border-neutral-100'
                      >
                        <span className='text-neutral-600'>{spec.name}</span>
                        <span className='font-medium text-neutral-900'>{spec.value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {selectedTab === 'reviews' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-center py-8 text-neutral-500'
                  >
                    {language === 'ar' ? 'قريباً - نظام التقييمات' : 'Coming Soon - Reviews System'}
                  </motion.div>
                )}
              </div>

              {/* Trust Badges */}
              <div className='mt-6 pt-6 border-t border-neutral-200'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div className='flex items-center text-neutral-600'>
                    <ShieldCheckIcon className='w-4 h-4 mr-2' />
                    {language === 'ar' ? 'ضمان الجودة' : 'Quality Guarantee'}
                  </div>
                  <div className='flex items-center text-neutral-600'>
                    <TruckIcon className='w-4 h-4 mr-2' />
                    {language === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductDetailModal;
