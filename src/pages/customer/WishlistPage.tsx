import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  StarIcon,
  MapPinIcon,
  ShareIcon,
  ShoppingCartIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  carId: string;
  title: string;
  price: string;
  originalPrice?: string;
  location: string;
  image: string;
  vendor: {
    name: string;
    phone: string;
    verified: boolean;
  };
  specs: {
    year: string;
    fuel: string;
    transmission: string;
    mileage: string;
  };
  rating: number;
  reviewCount: number;
  condition: 'new' | 'used' | 'excellent';
  addedAt: string;
  isAvailable: boolean;
}

const WishlistPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language, removeFromFavorites } = useAppStore();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  // Mock wishlist data - In real app, fetch from Firebase
  const mockWishlistItems: WishlistItem[] = [
    {
      id: '1',
      carId: '1',
      title: 'تويوتا كامري 2021 - فل كامل',
      price: '285,000',
      originalPrice: '320,000',
      location: 'الجيزة',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      vendor: {
        name: 'شركة الأمان للسيارات',
        phone: '01012345678',
        verified: true,
      },
      specs: {
        year: '2021',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '45,000 كم',
      },
      rating: 4.8,
      reviewCount: 156,
      condition: 'excellent',
      addedAt: '2024-01-15T10:30:00Z',
      isAvailable: true,
    },
    {
      id: '2',
      carId: '2',
      title: 'مرسيدس E200 2020 - حالة ممتازة',
      price: '450,000',
      originalPrice: '520,000',
      location: 'القاهرة الجديدة',
      image: 'https://images.unsplash.com/photo-1606016937473-509d8ff3b4a9?w=400&h=300&fit=crop',
      vendor: {
        name: 'معرض الفخامة للسيارات',
        phone: '01098765432',
        verified: true,
      },
      specs: {
        year: '2020',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '32,000 كم',
      },
      rating: 4.9,
      reviewCount: 89,
      condition: 'excellent',
      addedAt: '2024-01-12T14:20:00Z',
      isAvailable: true,
    },
    {
      id: '3',
      carId: '3',
      title: 'BMW X3 2022 - جديدة بالضمان',
      price: '680,000',
      location: 'الشيخ زايد',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop',
      vendor: {
        name: 'وكيل BMW المعتمد',
        phone: '01122334455',
        verified: true,
      },
      specs: {
        year: '2022',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '5,000 كم',
      },
      rating: 5.0,
      reviewCount: 45,
      condition: 'new',
      addedAt: '2024-01-08T09:15:00Z',
      isAvailable: false, // Car sold
    },
  ];

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setWishlistItems(mockWishlistItems);
        setFilteredItems(mockWishlistItems);
        setIsLoading(false);
      }, 1000);
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...wishlistItems];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply availability filter
    if (filterBy === 'available') {
      filtered = filtered.filter(item => item.isAvailable);
    } else if (filterBy === 'unavailable') {
      filtered = filtered.filter(item => !item.isAvailable);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
      case 'price_low':
        filtered.sort((a, b) => parseInt(a.price.replace(/,/g, '')) - parseInt(b.price.replace(/,/g, '')));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseInt(b.price.replace(/,/g, '')) - parseInt(a.price.replace(/,/g, '')));
        break;
      default:
        break;
    }

    setFilteredItems(filtered);
  }, [wishlistItems, searchQuery, sortBy, filterBy]);

  const handleRemoveFromWishlist = (itemId: string, carId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    removeFromFavorites(carId);
    toast.success('تم إزالة السيارة من المفضلة');
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.isAvailable) {
      toast.error('هذه السيارة غير متاحة حالياً');
      return;
    }
    toast.success(`تم إضافة ${item.title} إلى السلة`);
  };

  const handleContactVendor = (phone: string, carTitle: string) => {
    window.open(`tel:${phone}`);
    toast.success(`الاتصال بالتاجر بخصوص ${carTitle}`);
  };

  const handleShare = async (item: WishlistItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: `اكتشف هذه السيارة الرائعة: ${item.title}`,
          url: `${window.location.origin}/product/${item.carId}`,
        });
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/product/${item.carId}`);
        toast.success('تم نسخ رابط السيارة');
      }
    } catch (error) {
      navigator.clipboard.writeText(`${window.location.origin}/product/${item.carId}`);
      toast.success('تم نسخ رابط السيارة');
    }
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    setFilteredItems([]);
    toast.success('تم مسح جميع المفضلة');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          className="text-center bg-white p-8 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">يجب تسجيل الدخول أولاً</h2>
          <p className="text-gray-600 mb-6">تحتاج إلى تسجيل الدخول لعرض قائمة المفضلة</p>
          <motion.a
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            تسجيل الدخول
          </motion.a>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري تحميل المفضلة...</h2>
          <p className="text-gray-600">يرجى الانتظار لحظات</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <HeartIcon className="w-8 h-8 text-red-500 mr-3 fill-current" />
            قائمة المفضلة
          </h1>
          <p className="text-xl text-gray-600">
            {filteredItems.length > 0 
              ? `لديك ${filteredItems.length} سيارة في قائمة المفضلة`
              : 'قائمة المفضلة فارغة'}
          </p>
        </motion.div>

        {wishlistItems.length > 0 && (
          <>
            {/* Search and Filters */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 md:space-x-reverse">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث في المفضلة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">جميع السيارات</option>
                    <option value="available">المتاحة فقط</option>
                    <option value="unavailable">غير المتاحة</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="newest">الأحدث إضافة</option>
                    <option value="price_low">السعر: الأقل أولاً</option>
                    <option value="price_high">السعر: الأعلى أولاً</option>
                  </select>

                  {wishlistItems.length > 0 && (
                    <motion.button
                      onClick={clearWishlist}
                      className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      مسح الكل
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Wishlist Items */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                      layout
                    >
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                          {!item.isAvailable ? (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              غير متاح
                            </span>
                          ) : (
                            <span className={`text-white text-xs px-2 py-1 rounded-full font-medium ${
                              item.condition === 'new' ? 'bg-blue-500' : 
                              item.condition === 'excellent' ? 'bg-green-500' : 'bg-orange-500'
                            }`}>
                              {item.condition === 'new' ? 'جديد' : 
                               item.condition === 'excellent' ? 'ممتاز' : 'مستعمل'}
                            </span>
                          )}
                        </div>

                        {/* Verified Badge */}
                        {item.vendor.verified && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              ✓ موثق
                            </span>
                          </div>
                        )}

                        {/* Discount Badge */}
                        {item.originalPrice && (
                          <div className="absolute bottom-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            خصم {Math.round((1 - parseInt(item.price.replace(/,/g, '')) / parseInt(item.originalPrice.replace(/,/g, ''))) * 100)}%
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        {/* Car Info */}
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-2">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{item.location}</span>
                            <span>•</span>
                            <span>{item.vendor.name}</span>
                          </div>
                          <div className="flex items-center space-x-1 space-x-reverse text-sm">
                            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-semibold">{item.rating}</span>
                            <span className="text-gray-500">({item.reviewCount} تقييم)</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                          <div className="flex items-baseline space-x-2 space-x-reverse">
                            <span className="text-2xl font-bold text-primary-600">
                              {item.price} جنيه
                            </span>
                            {item.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {item.originalPrice} جنيه
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">السنة</div>
                            <div className="font-semibold">{item.specs.year}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">الوقود</div>
                            <div className="font-semibold">{item.specs.fuel}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">ناقل الحركة</div>
                            <div className="font-semibold">{item.specs.transmission}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">المسافة</div>
                            <div className="font-semibold">{item.specs.mileage}</div>
                          </div>
                        </div>

                        {/* Added Date */}
                        <div className="text-xs text-gray-500 mb-4">
                          أضيف في {new Date(item.addedAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 space-x-reverse mb-3">
                          <Link
                            to={`/product/${item.carId}`}
                            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium text-center transition-colors"
                          >
                            <div className="flex items-center justify-center space-x-1 space-x-reverse">
                              <EyeIcon className="w-4 h-4" />
                              <span>عرض التفاصيل</span>
                            </div>
                          </Link>
                          
                          {item.isAvailable && (
                            <motion.button
                              onClick={() => handleAddToCart(item)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <ShoppingCartIcon className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2 space-x-reverse">
                            <motion.button
                              onClick={() => handleContactVendor(item.vendor.phone, item.title)}
                              className="px-3 py-1 border border-primary-500 text-primary-500 hover:bg-primary-50 rounded text-sm transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="flex items-center space-x-1 space-x-reverse">
                                <PhoneIcon className="w-3 h-3" />
                                <span>اتصال</span>
                              </div>
                            </motion.button>
                            
                            <motion.button
                              onClick={() => handleShare(item)}
                              className="px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded text-sm transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <ShareIcon className="w-3 h-3" />
                            </motion.button>
                          </div>

                          <motion.button
                            onClick={() => handleRemoveFromWishlist(item.id, item.carId)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <TrashIcon className="w-3 h-3" />
                              <span>حذف</span>
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                className="text-center py-16 bg-white rounded-xl shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  لا توجد نتائج مطابقة للبحث
                </h3>
                <p className="text-gray-600 mb-6">جرب تعديل معايير البحث أو الفلاتر</p>
                <motion.button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterBy('all');
                  }}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  مسح الفلاتر
                </motion.button>
              </motion.div>
            )}
          </>
        )}

        {/* Empty State */}
        {wishlistItems.length === 0 && (
          <motion.div
            className="text-center py-20 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HeartIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">قائمة المفضلة فارغة</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              ابدأ في إضافة السيارات التي تعجبك إلى قائمة المفضلة لتتمكن من العودة إليها لاحقاً ومقارنتها.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
                >
                  تصفح السيارات المتاحة
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/vendors"
                  className="inline-flex items-center px-8 py-4 border border-primary-500 text-primary-500 hover:bg-primary-50 font-medium rounded-lg"
                >
                  اكتشف التجار المعتمدين
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;