import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  ShoppingCartIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';

import { ProductService } from '@/services/product.service';

import { EgyptianLoader } from '@/components/ui/LoadingSpinner';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import toast from 'react-hot-toast';

const WishlistPage: React.FC = () => {
  const { language, favorites, removeFromFavorites, addToCart } = useAppStore();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      //       return;
    }
    loadWishlistProducts();
  }, [favorites, user]);

  const loadWishlistProducts = async () => {
    try {
      setIsLoading(true);

      // Get all sample products for demo
      const sampleProducts = ProductService.getSampleProducts();
      const productMap: Record<string, Product> = {};

      // Add more sample products
      const allProducts = [
        ...sampleProducts,
        {
          ...sampleProducts[0],
          id: 'car-2',
          title: 'BMW X5 2019 - فل أوبشن',
          price: 850000,
          originalPrice: 950000,
          images: [
            {
              id: 'car-2-img-1',
              url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
              alt: 'BMW X5 2019',
              isPrimary: true,
              order: 0,
            },
          ],
        },
        {
          ...sampleProducts[1],
          id: 'part-2',
          title: 'فرامل سيراميك عالية الأداء',
          price: 450,
          images: [
            {
              id: 'part-2-img-1',
              url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
              alt: 'Ceramic Brake Pads',
              isPrimary: true,
              order: 0,
            },
          ],
        },
      ];

      allProducts.forEach(product => {
        productMap[product.id] = product;
      });

      setProducts(productMap);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error loading wishlist products:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل المنتجات' : 'Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromFavorites(productId);
    toast.success(language === 'ar' ? 'تم حذف المنتج من المفضلة' : 'Product removed from wishlist');
  };

  const handleAddToCart = (productId: string, quantity: number = 1) => {
    const product = products[productId];
    if (!product) return;

    if (product.category === 'services') {
      toast(language === 'ar' ? 'قريباً - حجز الخدمات' : 'Coming Soon - Service Booking', {
        icon: 'ℹ️',
      });
      //       return;
    }

    addToCart({ productId, quantity });
    toast.success(language === 'ar' ? 'تم إضافة المنتج للسلة' : 'Product added to cart');
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleShare = async (product: Product) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.origin + `/product/${product.id}`,
        });
      } catch (error) {
        // if (process.env.NODE_ENV === 'development') console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      const url = window.location.origin + `/product/${product.id}`;
      navigator.clipboard.writeText(url);
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

  const favoriteProducts = favorites.map(id => products[id]).filter(Boolean);

  if (!user) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <motion.div
            className='text-center py-20'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='text-8xl mb-6'>🔒</div>
            <h2 className='text-3xl font-bold text-neutral-900 mb-4'>
              {language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required'}
            </h2>
            <p className='text-xl text-neutral-600 mb-8'>
              {language === 'ar'
                ? 'سجل دخولك لعرض قائمة المفضلة'
                : 'Please login to view your wishlist'}
            </p>
            <Link to='/login' className='btn btn-primary btn-lg'>
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        {/* Header */}
        <div className='bg-white border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-neutral-900 flex items-center'>
                  <HeartSolid className='w-8 h-8 mr-3 text-red-500' />
                  {language === 'ar' ? 'قائمة المفضلة' : 'My Wishlist'}
                </h1>
                <p className='text-neutral-600 mt-1'>
                  {language === 'ar' ? 'جاري تحميل المفضلة...' : 'Loading wishlist...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex justify-center items-center py-20'>
            <EgyptianLoader size='lg' text={language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
          </div>
        </div>
      </div>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <motion.div
            className='text-center py-20'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='text-8xl mb-6'>💝</div>
            <h2 className='text-3xl font-bold text-neutral-900 mb-4'>
              {language === 'ar' ? 'لا توجد منتجات في المفضلة' : 'No items in your wishlist'}
            </h2>
            <p className='text-xl text-neutral-600 mb-8'>
              {language === 'ar'
                ? 'ابدأ بإضافة المنتجات التي تعجبك لقائمة المفضلة'
                : 'Start adding products you love to your wishlist'}
            </p>
            <Link to='/marketplace' className='btn btn-primary btn-lg'>
              <ArrowLeftIcon className='w-5 h-5 mr-2' />
              {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='min-h-screen bg-neutral-50'>
        {/* Header */}
        <div className='bg-white border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-neutral-900 flex items-center'>
                  <HeartSolid className='w-8 h-8 mr-3 text-red-500' />
                  {language === 'ar' ? 'قائمة المفضلة' : 'My Wishlist'}
                </h1>
                <p className='text-neutral-600 mt-1'>
                  {language === 'ar'
                    ? `${favoriteProducts.length} منتج في المفضلة`
                    : `${favoriteProducts.length} items in your wishlist`}
                </p>
              </div>

              <Link to='/marketplace' className='btn btn-outline'>
                <ArrowLeftIcon className='w-4 h-4 mr-2' />
                {language === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
              </Link>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <motion.div
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            layout
          >
            <AnimatePresence>
              {favoriteProducts.map(product => {
                const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];

                return (
                  <motion.div
                    key={product.id}
                    className='bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group'
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    whileHover={{ y: -4 }}
                  >
                    {/* Image Section */}
                    <div className='relative aspect-[4/3] overflow-hidden bg-neutral-100'>
                      {/* Discount Badge */}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className='absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold'>
                          -
                          {Math.round(
                            ((product.originalPrice - product.price) / product.originalPrice) * 100
                          )}
                          %
                        </div>
                      )}

                      {/* Favorite Badge */}
                      <div className='absolute top-3 right-3 z-10'>
                        <button
                          onClick={() => handleRemoveFromWishlist(product.id)}
                          className='p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors'
                        >
                          <HeartSolid className='w-5 h-5 text-red-500' />
                        </button>
                      </div>

                      <img
                        src={primaryImage?.url}
                        alt={product.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      />

                      {/* Hover Overlay */}
                      <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2'>
                        <motion.button
                          onClick={() => handleViewProduct(product)}
                          className='bg-white text-neutral-900 p-2 rounded-full shadow-lg hover:bg-neutral-100 transition-colors'
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <EyeIcon className='w-5 h-5' />
                        </motion.button>

                        <motion.button
                          onClick={() => handleShare(product)}
                          className='bg-white text-neutral-900 p-2 rounded-full shadow-lg hover:bg-neutral-100 transition-colors'
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ShareIcon className='w-5 h-5' />
                        </motion.button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className='p-4 space-y-3'>
                      <div>
                        <h3 className='font-semibold text-neutral-900 line-clamp-2 mb-1'>
                          {product.title}
                        </h3>

                        {/* Category Badge */}
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                            product.category === 'cars'
                              ? 'bg-blue-100 text-blue-800'
                              : product.category === 'parts'
                                ? 'bg-green-100 text-green-800'
                                : product.category === 'services'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.category === 'cars' && (language === 'ar' ? 'سيارات' : 'Cars')}
                          {product.category === 'parts' &&
                            (language === 'ar' ? 'قطع غيار' : 'Parts')}
                          {product.category === 'services' &&
                            (language === 'ar' ? 'خدمات' : 'Services')}
                          {product.category === 'accessories' &&
                            (language === 'ar' ? 'إكسسوارات' : 'Accessories')}
                        </span>
                      </div>

                      {/* Features */}
                      {product.features && product.features.length > 0 && (
                        <div className='flex flex-wrap gap-1'>
                          {product.features.slice(0, 2).map((feature, index) => (
                            <span
                              key={index}
                              className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'
                            >
                              {feature}
                            </span>
                          ))}
                          {product.features.length > 2 && (
                            <span className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'>
                              +{product.features.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
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
                        <div className='text-xs'>
                          {product.inStock ? (
                            <span className='text-green-600'>
                              {language === 'ar' ? 'متوفر' : 'In Stock'}
                            </span>
                          ) : (
                            <span className='text-red-600'>
                              {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='flex space-x-2'>
                        {product.category !== 'services' && product.inStock ? (
                          <motion.button
                            onClick={() => handleAddToCart(product.id)}
                            className='flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ShoppingCartIcon className='w-4 h-4 mr-1' />
                            {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => handleViewProduct(product)}
                            className='flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <EyeIcon className='w-4 h-4 mr-1' />
                            {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                          </motion.button>
                        )}

                        <motion.button
                          onClick={() => handleRemoveFromWishlist(product.id)}
                          className='p-2 border border-neutral-300 rounded-lg text-neutral-400 hover:text-red-500 hover:border-red-300 transition-colors'
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <TrashIcon className='w-4 h-4' />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className='mt-12 text-center'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='bg-white rounded-xl border border-neutral-200 p-8 shadow-sm'>
              <h3 className='text-xl font-semibold text-neutral-900 mb-4'>
                {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </h3>

              <div className='flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4'>
                <button
                  onClick={() => {
                    favoriteProducts.forEach(product => {
                      if (product.category !== 'services' && product.inStock) {
                        handleAddToCart(product.id);
                      }
                    });
                  }}
                  className='btn btn-primary'
                >
                  <ShoppingCartIcon className='w-5 h-5 mr-2' />
                  {language === 'ar' ? 'إضافة الكل للسلة' : 'Add All to Cart'}
                </button>

                <Link to='/marketplace' className='btn btn-outline'>
                  <ArrowLeftIcon className='w-5 h-5 mr-2' />
                  {language === 'ar' ? 'تصفح المزيد' : 'Browse More'}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          onAddToCart={handleAddToCart}
          onToggleFavorite={(productId, isFav) => {
            if (!isFav) {
              handleRemoveFromWishlist(productId);
            }
          }}
        />
      )}
    </>
  );
};

export default WishlistPage;
