import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { HeartSolid } from '@/components/ui/CustomIcons';
import { useAppStore } from '@/stores/appStore';
import { Link } from 'react-router-dom';

interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: 'cars' | 'parts' | 'accessories';
  vendor: string;
  location: string;
  addedDate: string;
  inStock: boolean;
}

const FavoritesPage: React.FC = () => {
  const { language } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'cars' | 'parts' | 'accessories'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  
  // Mock data - replace with actual API call
  const favorites: FavoriteItem[] = [
    {
      id: '1',
      name: 'BMW X5 2020 - Full Option',
      price: 450000,
      originalPrice: 480000,
      image: '/api/placeholder/300/200',
      category: 'cars',
      vendor: 'Premium Auto',
      location: 'Cairo',
      addedDate: '2024-01-15',
      inStock: true
    },
    {
      id: '2',
      name: 'Mercedes Engine Oil Filter',
      price: 150,
      image: '/api/placeholder/300/200',
      category: 'parts',
      vendor: 'Auto Parts Store',
      location: 'Alexandria',
      addedDate: '2024-01-18',
      inStock: true
    },
    {
      id: '3',
      name: 'Audi A6 2019',
      price: 380000,
      image: '/api/placeholder/300/200',
      category: 'cars',
      vendor: 'Luxury Cars',
      location: 'Giza',
      addedDate: '2024-01-20',
      inStock: false
    },
    {
      id: '4',
      name: 'LED Headlight Kit',
      price: 800,
      originalPrice: 1000,
      image: '/api/placeholder/300/200',
      category: 'accessories',
      vendor: 'Car Electronics',
      location: 'Cairo',
      addedDate: '2024-01-22',
      inStock: true
    }
  ];

  const filteredFavorites = favorites
    .filter(item => filter === 'all' || item.category === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low': return a.price - b.price;
        case 'price_high': return b.price - a.price;
        case 'newest': return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        default: return 0;
      }
    });

  const handleRemoveFromFavorites = (id: string) => {
    // TODO: Implement remove from favorites logic
    console.log('Remove from favorites:', id);
  };

  const handleAddToCart = (id: string) => {
    // TODO: Implement add to cart logic
    console.log('Add to cart:', id);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-8'
        >
          <div className='flex items-center justify-center mb-4'>
            <HeartSolid className='w-12 h-12 text-red-500 mr-4' />
            <h1 className='text-4xl font-bold text-neutral-900'>
              {language === 'ar' ? 'مفضلتي' : 'My Favorites'}
            </h1>
          </div>
          <p className='text-xl text-neutral-600'>
            {language === 'ar' 
              ? `لديك ${favorites.length} عنصر في قائمة المفضلة`
              : `You have ${favorites.length} items in your favorites`
            }
          </p>
        </motion.div>

        {/* Filters and Sort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8'
        >
          <div className='flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0'>
            {/* Category Filter */}
            <div className='flex items-center space-x-4'>
              <FunnelIcon className='w-5 h-5 text-neutral-600' />
              <div className='flex flex-wrap gap-2'>
                {[
                  { key: 'all', label: { ar: 'الكل', en: 'All' } },
                  { key: 'cars', label: { ar: 'سيارات', en: 'Cars' } },
                  { key: 'parts', label: { ar: 'قطع غيار', en: 'Parts' } },
                  { key: 'accessories', label: { ar: 'اكسسوارات', en: 'Accessories' } }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      filter === filterOption.key
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {filterOption.label[language]}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className='flex items-center space-x-4'>
              <label className='text-sm text-neutral-600'>
                {language === 'ar' ? 'ترتيب حسب:' : 'Sort by:'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className='px-3 py-1 border border-neutral-300 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
              >
                <option value='newest'>{language === 'ar' ? 'الأحدث' : 'Newest'}</option>
                <option value='price_low'>{language === 'ar' ? 'السعر: الأقل أولاً' : 'Price: Low to High'}</option>
                <option value='price_high'>{language === 'ar' ? 'السعر: الأعلى أولاً' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Favorites Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {filteredFavorites.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className='bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-200 hover:shadow-lg transition-shadow group'
            >
              {/* Image */}
              <div className='relative h-48 bg-neutral-100 overflow-hidden'>
                <img
                  src={item.image}
                  alt={item.name}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                />
                {!item.inStock && (
                  <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                    <span className='bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
                      {language === 'ar' ? 'نفد من المخزن' : 'Out of Stock'}
                    </span>
                  </div>
                )}
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className='absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium'>
                    {language === 'ar' ? 'خصم' : 'Sale'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className='p-4'>
                <div className='flex items-start justify-between mb-2'>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.category === 'cars' ? 'bg-blue-100 text-blue-800' :
                    item.category === 'parts' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {language === 'ar' 
                      ? ({ cars: 'سيارات', parts: 'قطع غيار', accessories: 'اكسسوارات' })[item.category]
                      : item.category.charAt(0).toUpperCase() + item.category.slice(1)
                    }
                  </span>
                  <button
                    onClick={() => handleRemoveFromFavorites(item.id)}
                    className='text-red-500 hover:text-red-700 transition-colors'
                  >
                    <HeartSolid className='w-5 h-5' />
                  </button>
                </div>

                <h3 className='font-semibold text-neutral-900 mb-2 line-clamp-2'>
                  {item.name}
                </h3>

                <div className='text-sm text-neutral-600 mb-3'>
                  <p>{item.vendor}</p>
                  <p>{item.location}</p>
                </div>

                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <p className='text-lg font-bold text-neutral-900'>
                      {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 0,
                      }).format(item.price)}
                    </p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className='text-sm text-neutral-500 line-through'>
                        {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
                          style: 'currency',
                          currency: 'EGP',
                          minimumFractionDigits: 0,
                        }).format(item.originalPrice)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className='flex space-x-2'>
                  <Link
                    to={`/product/${item.id}`}
                    className='flex-1 flex items-center justify-center px-3 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors'
                  >
                    <EyeIcon className='w-4 h-4 mr-1' />
                    <span className='text-sm'>{language === 'ar' ? 'عرض' : 'View'}</span>
                  </Link>
                  {item.inStock && (
                    <button
                      onClick={() => handleAddToCart(item.id)}
                      className='flex-1 flex items-center justify-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors'
                    >
                      <ShoppingCartIcon className='w-4 h-4 mr-1' />
                      <span className='text-sm'>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredFavorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-16'
          >
            <HeartIcon className='w-16 h-16 text-neutral-300 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
              {language === 'ar' ? 'لا توجد مفضلة' : 'No Favorites Found'}
            </h3>
            <p className='text-neutral-600 mb-6'>
              {language === 'ar' 
                ? 'لم تضف أي عناصر لمفضلتك بعد. ابدأ في إضافة العناصر التي تحبها!'
                : "You haven't added any items to your favorites yet. Start adding items you love!"
              }
            </p>
            <Link
              to='/marketplace'
              className='btn btn-primary'
            >
              {language === 'ar' ? 'تصفح السوق' : 'Browse Marketplace'}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;