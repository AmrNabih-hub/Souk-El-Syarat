import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  HeartIcon,
  ShoppingCartIcon,
  ShareIcon,
  StarIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { ProductService } from '@/services/product.service';
import { Product, CarProduct } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { EgyptianLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, isFavorite, addToFavorites, removeFromFavorites, addToCart } = useAppStore();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState<'details' | 'specs' | 'reviews'>('details');

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setIsLoading(true);

      // Get sample products for demo
      const sampleProducts = ProductService.getSampleProducts();
      const foundProduct = sampleProducts.find(p => p.id === productId);

      if (!foundProduct) {
        toast.error(language === 'ar' ? 'المنتج غير موجود' : 'Product not found');
        navigate('/marketplace');
        return;
      }

      setProduct(foundProduct);

      // Increment views (in real app, this would be done server-side)
      ProductService.incrementViews(productId);

      // Load related products
      const related = await ProductService.getRecommendations(productId, 4);
      setRelatedProducts(related);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error loading product:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل المنتج' : 'Error loading product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    if (!product) return;

    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
      toast.success(language === 'ar' ? 'تم حذف المنتج من المفضلة' : 'Removed from favorites');
    } else {
      addToFavorites(product.id);
      toast.success(language === 'ar' ? 'تم إضافة المنتج للمفضلة' : 'Added to favorites');
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    if (!product) return;

    if (product.category === 'services') {
      toast(language === 'ar' ? 'قريباً - حجز الخدمات' : 'Coming Soon - Service Booking', {
        icon: 'ℹ️',
      });
      return;
    }

    addToCart({ productId: product.id, quantity });
    toast.success(language === 'ar' ? 'تم إضافة المنتج للسلة' : 'Added to cart');
  };

  const handleShare = async () => {
    if (!product) return;

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
      navigator.clipboard.writeText(window.location.href);
      toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
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
    if (product) {
      setCurrentImageIndex(prev => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        {/* Breadcrumb */}
        <div className='bg-white border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <nav className='flex items-center space-x-2 text-sm'>
              <Link to='/' className='text-neutral-500 hover:text-neutral-700'>
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              <span className='text-neutral-400'>/</span>
              <Link to='/marketplace' className='text-neutral-500 hover:text-neutral-700'>
                {language === 'ar' ? 'السوق' : 'Marketplace'}
              </Link>
              <span className='text-neutral-400'>/</span>
              <span className='text-neutral-600'>
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </span>
            </nav>
          </div>
        </div>

        {/* Loading Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex justify-center items-center py-20'>
            <EgyptianLoader
              size='lg'
              text={language === 'ar' ? 'جاري تحميل المنتج...' : 'Loading product...'}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>😕</div>
          <h2 className='text-2xl font-bold text-neutral-900 mb-2'>
            {language === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}
          </h2>
          <Link to='/marketplace' className='btn btn-primary'>
            <ArrowLeftIcon className='w-4 h-4 mr-2' />
            {language === 'ar' ? 'العودة للسوق' : 'Back to Marketplace'}
          </Link>
        </div>
      </div>
    );
  }

  const isCarProduct = product.category === 'cars';
  const carDetails = isCarProduct ? (product as CarProduct).carDetails : null;
  const isProductFavorite = isFavorite(product.id);

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Breadcrumb */}
      <div className='bg-white border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <nav className='flex items-center space-x-2 text-sm'>
            <Link to='/' className='text-neutral-500 hover:text-neutral-700'>
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <span className='text-neutral-400'>/</span>
            <Link to='/marketplace' className='text-neutral-500 hover:text-neutral-700'>
              {language === 'ar' ? 'السوق' : 'Marketplace'}
            </Link>
            <span className='text-neutral-400'>/</span>
            <span className='text-neutral-900 font-medium line-clamp-1'>{product.title}</span>
          </nav>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12'>
          {/* Image Gallery */}
          <div className='space-y-4'>
            <div className='aspect-square bg-neutral-100 rounded-xl overflow-hidden relative'>
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
                  >
                    <ChevronLeftIcon className='w-5 h-5' />
                  </button>

                  <button
                    onClick={nextImage}
                    className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors'
                  >
                    <ChevronRightIcon className='w-5 h-5' />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className='absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
                {currentImageIndex + 1} / {product.images.length}
              </div>

              {/* Discount Badge */}
              {product.originalPrice && product.originalPrice > product.price && (
                <div className='absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold'>
                  -
                  {Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100
                  )}
                  %
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className='flex space-x-2 overflow-x-auto pb-2'>
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
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

          {/* Product Info */}
          <div className='space-y-6'>
            {/* Header */}
            <div>
              <div className='flex items-center justify-between mb-2'>
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

                <div className='flex items-center space-x-2'>
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
                    onClick={handleShare}
                    className='p-2 rounded-full hover:bg-neutral-100 transition-colors'
                  >
                    <ShareIcon className='w-6 h-6 text-neutral-400' />
                  </button>
                </div>
              </div>

              <h1 className='text-3xl font-bold text-neutral-900 mb-4'>{product.title}</h1>

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
            </div>

            {/* Price */}
            <div className='space-y-2'>
              <div className='flex items-center space-x-3'>
                <span className='text-4xl font-bold text-primary-600'>
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className='text-2xl text-neutral-500 line-through'>
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className='bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium'>
                      {language === 'ar' ? 'خصم' : 'Save'}{' '}
                      {formatPrice(product.originalPrice - product.price)}
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
              <div className='p-6 bg-neutral-50 rounded-lg'>
                <h3 className='font-semibold text-neutral-900 mb-4'>
                  {language === 'ar' ? 'تفاصيل السيارة' : 'Car Details'}
                </h3>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-neutral-600'>
                      {language === 'ar' ? 'السنة:' : 'Year:'}
                    </span>
                    <span className='font-medium'>{carDetails.year}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-neutral-600'>
                      {language === 'ar' ? 'المسافة:' : 'Mileage:'}
                    </span>
                    <span className='font-medium'>
                      {carDetails.mileage?.toLocaleString()} {language === 'ar' ? 'كم' : 'km'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-neutral-600'>
                      {language === 'ar' ? 'الوقود:' : 'Fuel:'}
                    </span>
                    <span className='font-medium'>{carDetails.fuelType}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-neutral-600'>
                      {language === 'ar' ? 'الناقل:' : 'Transmission:'}
                    </span>
                    <span className='font-medium'>{carDetails.transmission}</span>
                  </div>
                  <div className='col-span-2 flex justify-between'>
                    <span className='text-neutral-600'>
                      {language === 'ar' ? 'الطراز:' : 'Model:'}
                    </span>
                    <span className='font-medium'>
                      {carDetails.make} {carDetails.model}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className='font-semibold text-neutral-900 mb-3'>
                  {language === 'ar' ? 'المميزات' : 'Features'}
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {product.features.map((feature, index) => (
                    <span
                      key={index}
                      className='px-3 py-2 bg-primary-100 text-primary-800 text-sm rounded-full font-medium'
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            {product.category !== 'services' && product.inStock && (
              <div className='space-y-4'>
                <div className='flex items-center space-x-4'>
                  <span className='text-neutral-700 font-medium'>
                    {language === 'ar' ? 'الكمية:' : 'Quantity:'}
                  </span>
                  <div className='flex items-center border border-neutral-300 rounded-lg'>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className='px-4 py-2 hover:bg-neutral-100 transition-colors'
                    >
                      -
                    </button>
                    <span className='px-4 py-2 border-x border-neutral-300 min-w-[3rem] text-center'>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className='px-4 py-2 hover:bg-neutral-100 transition-colors'
                    >
                      +
                    </button>
                  </div>
                </div>

                <motion.button
                  onClick={handleAddToCart}
                  className='w-full bg-primary-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center text-lg'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingCartIcon className='w-6 h-6 mr-2' />
                  {language === 'ar' ? 'إضافة للسلة' : 'Add to Cart'}
                </motion.button>
              </div>
            )}

            {/* Service Booking */}
            {product.category === 'services' && (
              <motion.button
                onClick={() =>
                  toast(
                    language === 'ar' ? 'قريباً - حجز الخدمات' : 'Coming Soon - Service Booking',
                    { icon: 'ℹ️' }
                  )
                }
                className='w-full bg-primary-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center text-lg'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChatBubbleLeftRightIcon className='w-6 h-6 mr-2' />
                {language === 'ar' ? 'حجز الخدمة' : 'Book Service'}
              </motion.button>
            )}

            {/* Trust Badges */}
            <div className='grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200'>
              <div className='text-center'>
                <ShieldCheckIcon className='w-8 h-8 text-green-500 mx-auto mb-2' />
                <p className='text-sm text-neutral-600'>
                  {language === 'ar' ? 'دفع آمن' : 'Secure Payment'}
                </p>
              </div>
              <div className='text-center'>
                <TruckIcon className='w-8 h-8 text-blue-500 mx-auto mb-2' />
                <p className='text-sm text-neutral-600'>
                  {language === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}
                </p>
              </div>
              <div className='text-center'>
                <CheckBadgeIcon className='w-8 h-8 text-purple-500 mx-auto mb-2' />
                <p className='text-sm text-neutral-600'>
                  {language === 'ar' ? 'ضمان الجودة' : 'Quality Guarantee'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className='bg-white rounded-xl border border-neutral-200 p-6 mb-12'>
          {/* Tabs Navigation */}
          <div className='border-b border-neutral-200 mb-6'>
            <nav className='flex space-x-8'>
              {[
                { id: 'details', label: language === 'ar' ? 'التفاصيل' : 'Details' },
                { id: 'specs', label: language === 'ar' ? 'المواصفات' : 'Specifications' },
                { id: 'reviews', label: language === 'ar' ? 'التقييمات' : 'Reviews' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
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
          <div className='min-h-[200px]'>
            {selectedTab === 'details' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='space-y-6'
              >
                <div>
                  <h3 className='font-semibold text-neutral-900 mb-3'>
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </h3>
                  <p className='text-neutral-700 leading-relaxed text-lg'>{product.description}</p>
                </div>

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
                className='space-y-4'
              >
                {product.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className='flex justify-between py-3 border-b border-neutral-100'
                  >
                    <span className='text-neutral-600 font-medium'>{spec.name}</span>
                    <span className='font-semibold text-neutral-900'>{spec.value}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {selectedTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-center py-12 text-neutral-500'
              >
                <StarIcon className='w-16 h-16 mx-auto mb-4 text-neutral-300' />
                <h3 className='text-xl font-semibold mb-2'>
                  {language === 'ar' ? 'قريباً - نظام التقييمات' : 'Coming Soon - Reviews System'}
                </h3>
                <p>
                  {language === 'ar'
                    ? 'سيتم إضافة نظام التقييمات قريباً'
                    : 'Review system will be added soon'}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className='text-2xl font-bold text-neutral-900 mb-6'>
              {language === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {relatedProducts.map(relatedProduct => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={(productId, quantity) => addToCart({ productId, quantity })}
                  onToggleFavorite={(productId, isFav) => {
                    if (isFav) {
                      addToFavorites(productId);
                    } else {
                      removeFromFavorites(productId);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
