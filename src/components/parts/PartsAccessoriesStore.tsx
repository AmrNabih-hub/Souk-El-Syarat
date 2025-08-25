import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  BoltIcon,
  ShieldCheckIcon,
  StarIcon,
  ShoppingCartIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TagIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PartsAccessoriesStore: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'جميع القطع', icon: WrenchScrewdriverIcon },
    { id: 'engine', name: 'قطع المحرك', icon: Cog6ToothIcon },
    { id: 'brakes', name: 'الفرامل', icon: BoltIcon },
    { id: 'filters', name: 'الفلاتر', icon: FunnelIcon },
    { id: 'electrical', name: 'كهربائية', icon: BoltIcon },
    { id: 'accessories', name: 'إكسسوارات', icon: StarIcon }
  ];

  const parts = [
    {
      id: '1',
      name: 'زيت محرك موبيل 1 (5 لتر)',
      category: 'engine',
      price: '320 جنيه',
      originalPrice: '380 جنيه',
      image: 'https://images.unsplash.com/photo-1609205804860-e7b7ea5e1e3a?w=300&h=300&fit=crop',
      brand: 'Mobil 1',
      rating: 4.9,
      reviews: 156,
      inStock: true,
      features: ['صناعة ألمانية', 'حماية متقدمة', 'ضمان 6 أشهر'],
      description: 'زيت محرك صناعي بالكامل يوفر حماية فائقة للمحرك'
    },
    {
      id: '2',
      name: 'إطارات ميشلان 205/55 R16',
      category: 'accessories',
      price: '1,200 جنيه',
      originalPrice: '1,400 جنيه',
      image: 'https://images.unsplash.com/photo-1606987542373-0c71b19d46d6?w=300&h=300&fit=crop',
      brand: 'Michelin',
      rating: 4.8,
      reviews: 89,
      inStock: true,
      features: ['توفير في الوقود', 'ثبات عالي', 'عمر افتراضي طويل'],
      description: 'إطارات عالية الأداء مع تقنية متقدمة للثبات والأمان'
    },
    {
      id: '3',
      name: 'بطارية فارتا 70 أمبير',
      category: 'electrical',
      price: '850 جنيه',
      originalPrice: '950 جنيه',
      image: 'https://images.unsplash.com/photo-1609205804990-1976d87ec1ad?w=300&h=300&fit=crop',
      brand: 'Varta',
      rating: 4.7,
      reviews: 124,
      inStock: true,
      features: ['تقنية AGM', 'بداية قوية', 'ضمان سنتين'],
      description: 'بطارية عالية الأداء مع تقنية متقدمة للشحن السريع'
    },
    {
      id: '4',
      name: 'مكابح برامبو سيراميك',
      category: 'brakes',
      price: '1,800 جنيه',
      originalPrice: '2,200 جنيه',
      image: 'https://images.unsplash.com/photo-1609205804882-e1c6a72e9d0b?w=300&h=300&fit=crop',
      brand: 'Brembo',
      rating: 4.9,
      reviews: 67,
      inStock: false,
      features: ['أداء فائق', 'مقاومة الحرارة', 'عمر أطول'],
      description: 'مكابح سيراميك عالية الأداء للسيارات الرياضية'
    },
    {
      id: '5',
      name: 'فلتر هواء K&N قابل للغسيل',
      category: 'filters',
      price: '280 جنيه',
      originalPrice: '320 جنيه',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300&h=300&fit=crop',
      brand: 'K&N',
      rating: 4.6,
      reviews: 93,
      inStock: true,
      features: ['قابل للغسيل', 'تحسين الأداء', 'ضمان مليون ميل'],
      description: 'فلتر هواء عالي الأداء قابل للغسيل وإعادة الاستخدام'
    },
    {
      id: '6',
      name: 'شمعات إشعال NGK إيريديوم',
      category: 'engine',
      price: '450 جنيه',
      originalPrice: '520 جنيه',
      image: 'https://images.unsplash.com/photo-1609205804902-1976d87ec1ad?w=300&h=300&fit=crop',
      brand: 'NGK',
      rating: 4.8,
      reviews: 78,
      inStock: true,
      features: ['إيريديوم خالص', 'إشعال أقوى', 'اقتصاد في الوقود'],
      description: 'شمعات إشعال بتقنية الإيريديوم لأداء محرك متفوق'
    },
    {
      id: '7',
      name: 'نظام صوت بايونير مع بلوتوث',
      category: 'accessories',
      price: '1,500 جنيه',
      originalPrice: '1,800 جنيه',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      brand: 'Pioneer',
      rating: 4.5,
      reviews: 112,
      inStock: true,
      features: ['بلوتوث 5.0', 'صوت عالي الوضوح', 'تركيب سهل'],
      description: 'نظام صوت متطور مع تقنية البلوتوث وجودة صوت فائقة'
    },
    {
      id: '8',
      name: 'فلتر زيت مان أصلي',
      category: 'filters',
      price: '85 جنيه',
      originalPrice: '100 جنيه',
      image: 'https://images.unsplash.com/photo-1609205804860-e7b7ea5e1e3a?w=300&h=300&fit=crop',
      brand: 'Mann Filter',
      rating: 4.7,
      reviews: 156,
      inStock: true,
      features: ['ألماني أصلي', 'فلترة ممتازة', 'متوافق مع جميع الزيوت'],
      description: 'فلتر زيت أصلي بجودة ألمانية عالية'
    }
  ];

  const filteredParts = parts.filter(part => {
    const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory;
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         part.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (part: any) => {
    if (!part.inStock) {
      toast.error('هذا المنتج غير متوفر حالياً');
      return;
    }
    toast.success(`تم إضافة ${part.name} إلى السلة بنجاح!`);
  };

  const handleBuyNow = (part: any) => {
    if (!part.inStock) {
      toast.error('هذا المنتج غير متوفر حالياً');
      return;
    }
    toast.success(`جاري معالجة طلب شراء ${part.name}`);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            🛠️ متجر قطع الغيار والإكسسوارات
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            قطع غيار أصلية من أفضل الماركات العالمية • أسعار تنافسية • توصيل سريع • ضمان معتمد
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن قطع الغيار والإكسسوارات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <category.icon className="w-4 h-4 mr-2" />
                  <span className="text-sm">{category.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center items-center space-x-8 space-x-reverse mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{filteredParts.length}</div>
              <div className="text-sm text-gray-600">منتج متاح</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-gray-600">ضمان أصلي</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">🚚</div>
              <div className="text-sm text-gray-600">توصيل سريع</div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredParts.map((part, index) => (
            <motion.div
              key={part.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Product Image */}
              <div className="relative">
                <img 
                  src={part.image} 
                  alt={part.name} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-4 right-4">
                  {part.originalPrice && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold mb-2">
                      خصم {Math.round((1 - parseInt(part.price.split(' ')[0].replace(',', '')) / parseInt(part.originalPrice.split(' ')[0].replace(',', ''))) * 100)}%
                    </div>
                  )}
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    part.inStock ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {part.inStock ? 'متوفر' : 'نفذ'}
                  </div>
                </div>

                {/* Brand Badge */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-gray-800">{part.brand}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{part.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{part.description}</p>
                
                {/* Rating */}
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`w-4 h-4 ${
                        i < Math.floor(part.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({part.reviews} تقييم)</span>
                </div>

                {/* Features */}
                <div className="space-y-1 mb-4">
                  {part.features.slice(0, 2).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <ShieldCheckIcon className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline space-x-2 space-x-reverse">
                    <span className="text-2xl font-bold text-primary-600">{part.price}</span>
                    {part.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">{part.originalPrice}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <motion.button
                    onClick={() => handleBuyNow(part)}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                      part.inStock
                        ? 'bg-primary-500 hover:bg-primary-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={part.inStock ? { scale: 1.02 } : {}}
                    whileTap={part.inStock ? { scale: 0.98 } : {}}
                    disabled={!part.inStock}
                  >
                    {part.inStock ? 'اشتري الآن' : 'غير متوفر'}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleAddToCart(part)}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm border transition-all duration-200 ${
                      part.inStock
                        ? 'border-primary-500 text-primary-500 hover:bg-primary-50'
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={part.inStock ? { scale: 1.02 } : {}}
                    whileTap={part.inStock ? { scale: 0.98 } : {}}
                    disabled={!part.inStock}
                  >
                    <div className="flex items-center justify-center">
                      <ShoppingCartIcon className="w-4 h-4 mr-2" />
                      أضف للسلة
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredParts.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <WrenchScrewdriverIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لم نجد أي منتجات</h3>
            <p className="text-gray-600 mb-4">جرب البحث بكلمات مختلفة أو اختر فئة أخرى</p>
            <motion.button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              مسح الفلاتر
            </motion.button>
          </motion.div>
        )}

        {/* Delivery & Warranty Banner */}
        <motion.div 
          className="mt-12 bg-gradient-to-r from-green-500 to-blue-600 text-white p-8 rounded-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">🎯 خدمات إضافية مميزة</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <TruckIcon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-bold mb-1">توصيل سريع</h4>
                <p className="text-sm opacity-90">خلال 24 ساعة في القاهرة والجيزة</p>
              </div>
              <div className="text-center">
                <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-bold mb-1">ضمان أصلي</h4>
                <p className="text-sm opacity-90">ضمان الوكيل على جميع القطع</p>
              </div>
              <div className="text-center">
                <WrenchScrewdriverIcon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-bold mb-1">تركيب مجاني</h4>
                <p className="text-sm opacity-90">خدمة تركيب في مراكز معتمدة</p>
              </div>
              <div className="text-center">
                <TagIcon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-bold mb-1">أسعار تنافسية</h4>
                <p className="text-sm opacity-90">أفضل الأسعار مع جودة مضمونة</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PartsAccessoriesStore;