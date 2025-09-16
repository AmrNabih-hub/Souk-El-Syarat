import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';

import { Product, ProductCategory, ProductCondition, SearchFilters } from '@/types';
import { ProductService } from '@/services/product.service';

import ProductCard from '@/components/product/ProductCard';
import { EgyptianLoader } from '@/components/ui/LoadingSpinner';
import CustomCheckbox from '@/components/ui/CustomCheckbox';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import toast from 'react-hot-toast';

// Simple in-memory cache for products - Fixed initialization
let productCache: {
  data: Product[] | null;
  timestamp: number;
  ttl: number;
} = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

const isCacheValid = (): boolean => {
  return productCache.data !== null && (Date.now() - productCache.timestamp) < productCache.ttl;
};

const MarketplacePage: React.FC = () => {
  const { language, addToCart, addToFavorites, removeFromFavorites } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: undefined,
    condition: undefined,
    priceRange: undefined,
    inStock: true,
  });

  const categories: { value: ProductCategory; label: { ar: string; en: string } }[] = [
    { value: 'cars', label: { ar: 'سيارات', en: 'Cars' } },
    { value: 'parts', label: { ar: 'قطع غيار', en: 'Parts' } },
    { value: 'accessories', label: { ar: 'إكسسوارات', en: 'Accessories' } },
    { value: 'services', label: { ar: 'خدمات', en: 'Services' } },
    { value: 'tools', label: { ar: 'أدوات', en: 'Tools' } },
    { value: 'tires', label: { ar: 'إطارات', en: 'Tires' } },
  ];

  const conditions: { value: ProductCondition; label: { ar: string; en: string } }[] = [
    { value: 'new', label: { ar: 'جديد', en: 'New' } },
    { value: 'used', label: { ar: 'مستعمل', en: 'Used' } },
    { value: 'refurbished', label: { ar: 'مجدد', en: 'Refurbished' } },
  ];

  // Memoize filtered products for better performance
  const memoizedFilteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.condition) {
      filtered = filtered.filter(product => product.condition === filters.condition);
    }

    if (filters.priceRange) {
      filtered = filtered.filter(
        product =>
          product.price >= filters.priceRange!.min && product.price <= filters.priceRange!.max
      );
    }

    if (filters.inStock !== null) {
      filtered = filtered.filter(product => product.inStock === filters.inStock);
    }

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [products, searchQuery, filters, sortBy]);

  const loadProducts = useCallback(async () => {
    const startTime = performance.now();
    try {
      setIsLoading(true);
      console.log('🛍️ Loading marketplace products...');

      // Check cache first for faster loading
      if (isCacheValid()) {
        console.log(`✅ Loading ${productCache.data!.length} products from cache`);
        setProducts(productCache.data!);
        setIsLoading(false);
        
        // Performance monitoring for cache hits
        const loadTime = performance.now() - startTime;
        console.log(`⚡ Products loaded from cache in ${loadTime.toFixed(2)}ms`);
        return;
      }

      // Parallel loading strategy for better performance
      const loadPromises = [
        // Try Firebase first (higher priority)
        ProductService.getPublishedProducts().catch(error => {
          console.warn('⚠️ Firebase products not available:', error);
          return null;
        }),
        // Always have sample products as backup
        Promise.resolve(ProductService.getSampleProducts())
      ];

      const [firebaseProducts, sampleProducts] = await Promise.all(loadPromises);
      
      // Use Firebase products if available, otherwise use sample products
      const productsToUse = (firebaseProducts && firebaseProducts.length > 0) 
        ? firebaseProducts 
        : sampleProducts;
        
      if (productsToUse && productsToUse.length > 0) {
        console.log(`✅ Loaded ${productsToUse.length} products (${firebaseProducts ? 'Firebase' : 'Sample'})`);
        
        // Update cache with loaded products
        productCache.data = productsToUse;
        productCache.timestamp = Date.now();
        setProducts(productsToUse);
      } else {
        throw new Error('No products available from any source');
      }
      
      // Performance monitoring
      const loadTime = performance.now() - startTime;
      console.log(`⚡ Products loaded in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      // Even if there's an error, try to load sample products as last resort
      try {
        const sampleProducts = ProductService.getSampleProducts();
        console.log(`✅ Loaded ${sampleProducts.length} sample products as emergency fallback`);
        setProducts(sampleProducts);
      } catch (fallbackError) {
        console.error('❌ Emergency fallback failed:', fallbackError);
        toast.error(language === 'ar' ? 'خطأ في تحميل المنتجات' : 'Error loading products');
      }
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: undefined,
      condition: undefined,
      priceRange: undefined,
      inStock: true,
    });
    setSearchQuery('');
  };

  const handleAddToCart = (productId: string, quantity: number) => {
    addToCart({ productId, quantity });
  };

  const handleToggleFavorite = (productId: string, isFavorite: boolean) => {
    if (isFavorite) {
      addToFavorites(productId);
    } else {
      removeFromFavorites(productId);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        {/* Header */}
        <div className='bg-white border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
              <div>
                <h1 className='text-3xl font-bold text-neutral-900'>
                  {language === 'ar' ? 'السوق' : 'Marketplace'}
                </h1>
                <p className='text-neutral-600 mt-1'>
                  {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
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

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <div className='bg-white border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
            <div>
              <h1 className='text-3xl font-bold text-neutral-900'>
                {language === 'ar' ? 'السوق' : 'Marketplace'}
              </h1>
              <p className='text-neutral-600 mt-1'>
                {language === 'ar'
                  ? `${memoizedFilteredProducts.length} منتج متاح`
                  : `${memoizedFilteredProducts.length} products available`}
              </p>
            </div>

            {/* Search Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                // Search is handled by the memoized filtering
              }}
              className='flex-1 max-w-md'
            >
              <div className='relative'>
                <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'البحث في المنتجات...' : 'Search products...'}
                  className='w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Filters Sidebar */}
          <div className='lg:w-64 flex-shrink-0'>
            <div className='sticky top-4'>
              {/* Mobile Filter Toggle */}
              <div className='lg:hidden mb-4'>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className='w-full flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors'
                >
                  <FunnelIcon className='w-5 h-5 mr-2' />
                  {language === 'ar' ? 'الفلاتر' : 'Filters'}
                </button>
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {(showFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='bg-white rounded-lg border border-neutral-200 p-6 space-y-6'
                  >
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-neutral-900'>
                        {language === 'ar' ? 'الفلاتر' : 'Filters'}
                      </h3>
                      <button
                        onClick={clearFilters}
                        className='text-sm text-primary-600 hover:text-primary-700'
                      >
                        {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                      </button>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <h4 className='font-medium text-neutral-900 mb-3'>
                        {language === 'ar' ? 'الفئة' : 'Category'}
                      </h4>
                      <div className='space-y-2'>
                        <label className='flex items-center'>
                          <input
                            type='radio'
                            name='category'
                            checked={!filters.category}
                            onChange={() => handleFilterChange('category', undefined)}
                            className='mr-2'
                          />
                          <span className='text-sm text-neutral-700'>
                            {language === 'ar' ? 'الكل' : 'All'}
                          </span>
                        </label>
                        {categories.map(category => (
                          <label key={category.value} className='flex items-center'>
                            <input
                              type='radio'
                              name='category'
                              checked={filters.category === category.value}
                              onChange={() => handleFilterChange('category', category.value)}
                              className='mr-2'
                            />
                            <span className='text-sm text-neutral-700'>
                              {category.label[language]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Condition Filter */}
                    <div>
                      <h4 className='font-medium text-neutral-900 mb-3'>
                        {language === 'ar' ? 'الحالة' : 'Condition'}
                      </h4>
                      <div className='space-y-2'>
                        <label className='flex items-center'>
                          <input
                            type='radio'
                            name='condition'
                            checked={!filters.condition}
                            onChange={() => handleFilterChange('condition', undefined)}
                            className='mr-2'
                          />
                          <span className='text-sm text-neutral-700'>
                            {language === 'ar' ? 'الكل' : 'All'}
                          </span>
                        </label>
                        {conditions.map(condition => (
                          <label key={condition.value} className='flex items-center'>
                            <input
                              type='radio'
                              name='condition'
                              checked={filters.condition === condition.value}
                              onChange={() => handleFilterChange('condition', condition.value)}
                              className='mr-2'
                            />
                            <span className='text-sm text-neutral-700'>
                              {condition.label[language]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h4 className='font-medium text-neutral-900 mb-3'>
                        {language === 'ar' ? 'نطاق السعر' : 'Price Range'}
                      </h4>
                      <div className='grid grid-cols-2 gap-2'>
                        <input
                          type='number'
                          placeholder={language === 'ar' ? 'من' : 'Min'}
                          value={filters.priceRange?.min || ''}
                          onChange={e =>
                            handleFilterChange('priceRange', {
                              ...filters.priceRange,
                              min: parseInt(e.target.value) || 0,
                            })
                          }
                          className='input text-sm'
                        />
                        <input
                          type='number'
                          placeholder={language === 'ar' ? 'إلى' : 'Max'}
                          value={filters.priceRange?.max || ''}
                          onChange={e =>
                            handleFilterChange('priceRange', {
                              ...filters.priceRange,
                              max: parseInt(e.target.value) || 999999,
                            })
                          }
                          className='input text-sm'
                        />
                      </div>
                    </div>

                    {/* Stock Filter */}
                    <div>
                      <CustomCheckbox
                        id='inStock'
                        checked={filters.inStock || false}
                        onChange={(checked) => handleFilterChange('inStock', checked)}
                        size='sm'
                        variant='primary'
                        label={language === 'ar' ? 'متوفر فقط' : 'In stock only'}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Products Section */}
          <div className='flex-1'>
            {/* Toolbar */}
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center space-x-4'>
                <span className='text-sm text-neutral-600'>
                  {language === 'ar' ? 'ترتيب حسب:' : 'Sort by:'}
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'newest' | 'price_low' | 'price_high' | 'popular')}
                  className='input text-sm'
                  aria-label={language === 'ar' ? 'ترتيب المنتجات' : 'Sort products'}
                  title={language === 'ar' ? 'ترتيب المنتجات' : 'Sort products'}
                >
                  <option value='newest'>{language === 'ar' ? 'الأحدث' : 'Newest'}</option>
                  <option value='popular'>
                    {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                  </option>
                  <option value='price_low'>
                    {language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}
                  </option>
                  <option value='price_high'>
                    {language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}
                  </option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                  aria-label={language === 'ar' ? 'عرض الشبكة' : 'Grid view'}
                  title={language === 'ar' ? 'عرض الشبكة' : 'Grid view'}
                >
                  <Squares2X2Icon className='w-5 h-5' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                  aria-label={language === 'ar' ? 'عرض القائمة' : 'List view'}
                  title={language === 'ar' ? 'عرض القائمة' : 'List view'}
                >
                  <ListBulletIcon className='w-5 h-5' />
                </button>
              </div>
            </div>

            {/* Products Grid - Enhanced responsive scaling */}
            {memoizedFilteredProducts.length > 0 ? (
              <motion.div
                layout
                className={`grid gap-4 sm:gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                    : 'grid-cols-1'
                }`}
              >
                <AnimatePresence>
                  {memoizedFilteredProducts.map(product => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        onToggleFavorite={handleToggleFavorite}
                        className="h-full"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                className='text-center py-20'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className='text-6xl mb-4'>🔍</div>
                <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                  {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
                </h3>
                <p className='text-neutral-600 mb-6'>
                  {language === 'ar'
                    ? 'جرب تعديل معايير البحث أو الفلاتر'
                    : 'Try adjusting your search criteria or filters'}
                </p>
                <button onClick={clearFilters} className='btn btn-primary'>
                  {language === 'ar' ? 'مسح جميع الفلاتر' : 'Clear all filters'}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
};

export default MarketplacePage;
