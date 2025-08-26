import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  HeartIcon,
  EyeIcon,
  StarIcon,
  ShoppingCartIcon,
  PhoneIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import RealDataService, { RealCar } from '@/services/real-data.service';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  location: string;
  image: string;
  vendor: string;
  rating: number;
  reviewCount: number;
  specs: {
    year: string;
    fuel: string;
    transmission: string;
    mileage: string;
    engine?: string;
    color?: string;
  };
  features: string[];
  condition: 'new' | 'used' | 'excellent';
  verified: boolean;
  discount?: number;
  type: 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'pickup' | 'van';
  brand: string;
  model: string;
}

interface FilterState {
  searchQuery: string;
  brand: string;
  model: string;
  minPrice: string;
  maxPrice: string;
  year: string;
  fuel: string;
  transmission: string;
  condition: string;
  location: string;
  type: string;
}

const MarketplacePage: React.FC = () => {
  const { language } = useAppStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    brand: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    year: '',
    fuel: '',
    transmission: '',
    condition: '',
    location: '',
    type: '',
  });

  // Mock Egyptian automotive marketplace data
  const mockVehicles: Vehicle[] = [
    {
      id: '1',
      title: 'تويوتا كامري 2021 - فل كامل بالجلد',
      price: '285,000',
      originalPrice: '320,000',
      location: 'الجيزة',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      vendor: 'شركة الأمان للسيارات',
      rating: 4.8,
      reviewCount: 156,
      specs: {
        year: '2021',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '45,000 كم',
        engine: '2.5 لتر',
        color: 'أبيض لؤلؤي'
      },
      features: ['فتحة سقف', 'جلد طبيعي', 'نظام ملاحة GPS', 'كاميرا خلفية', 'شاشة تاتش', 'تكييف أوتوماتيك'],
      condition: 'excellent',
      verified: true,
      discount: 11,
      type: 'sedan',
      brand: 'تويوتا',
      model: 'كامري'
    },
    {
      id: '2',
      title: 'مرسيدس E200 2020 - صيانات توكيل',
      price: '450,000',
      originalPrice: '520,000',
      location: 'القاهرة الجديدة',
      image: 'https://images.unsplash.com/photo-1606016937473-509d8ff3b4a9?w=400&h=300&fit=crop',
      vendor: 'معرض الفخامة للسيارات المميزة',
      rating: 4.9,
      reviewCount: 89,
      specs: {
        year: '2020',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '32,000 كم',
        engine: '2.0 لتر تيربو',
        color: 'أسود ميتاليك'
      },
      features: ['فتحة سقف بانوراما', 'جلد فاخر', 'نظام أمان متطور', 'شاشة COMMAND', 'مقاعد كهربائية', 'تحكم مناخي'],
      condition: 'excellent',
      verified: true,
      discount: 13,
      type: 'sedan',
      brand: 'مرسيدس',
      model: 'E200'
    },
    {
      id: '3',
      title: 'BMW X3 2022 - جديدة بالضمان',
      price: '680,000',
      location: 'الشيخ زايد',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop',
      vendor: 'وكيل BMW المعتمد',
      rating: 5.0,
      reviewCount: 45,
      specs: {
        year: '2022',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '5,000 كم',
        engine: '2.0 لتر تيربو',
        color: 'أزرق معدني'
      },
      features: ['دفع رباعي xDrive', 'شاشة iDrive', 'نظام صوتي Harman Kardon', 'كاميرا 360', 'مقاعد جلد رياضية', 'إضاءة LED'],
      condition: 'new',
      verified: true,
      type: 'suv',
      brand: 'BMW',
      model: 'X3'
    },
    {
      id: '4',
      title: 'هونداي إلنترا 2021 - اقتصادية ونظيفة',
      price: '220,000',
      originalPrice: '240,000',
      location: 'المعادي',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
      vendor: 'معرض النجمة للسيارات',
      rating: 4.5,
      reviewCount: 112,
      specs: {
        year: '2021',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '38,000 كم',
        engine: '1.6 لتر',
        color: 'فضي ميتاليك'
      },
      features: ['شاشة تاتش', 'كاميرا خلفية', 'حساسات ركن', 'تحكم في المقود', 'بلوتوث', 'USB و AUX'],
      condition: 'used',
      verified: true,
      discount: 8,
      type: 'sedan',
      brand: 'هونداي',
      model: 'إلنترا'
    },
    {
      id: '5',
      title: 'نيسان صني 2020 - مثالية للعمل',
      price: '175,000',
      location: 'الإسكندرية',
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop',
      vendor: 'الإسكندرية موتورز',
      rating: 4.3,
      reviewCount: 78,
      specs: {
        year: '2020',
        fuel: 'بنزين',
        transmission: 'مانيوال',
        mileage: '55,000 كم',
        engine: '1.5 لتر',
        color: 'أبيض'
      },
      features: ['تكييف', 'مشغل CD', 'حساسات خلفية', 'إطارات جديدة', 'تأمين شامل'],
      condition: 'used',
      verified: true,
      type: 'sedan',
      brand: 'نيسان',
      model: 'صني'
    },
    {
      id: '6',
      title: 'شيفروليه كروز 2019 - حالة ممتازة',
      price: '195,000',
      originalPrice: '210,000',
      location: 'المنصورة',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
      vendor: 'معرض الدلتا للسيارات',
      rating: 4.4,
      reviewCount: 92,
      specs: {
        year: '2019',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '42,000 كم',
        engine: '1.4 لتر تيربو',
        color: 'أحمر'
      },
      features: ['شاشة تاتش كبيرة', 'نظام MyLink', 'كاميرا خلفية', 'تحكم صوتي', 'مقاعد رياضية', 'إضاءة داخلية'],
      condition: 'excellent',
      verified: true,
      discount: 7,
      type: 'sedan',
      brand: 'شيفروليه',
      model: 'كروز'
    },
    {
      id: '7',
      title: 'كيا سيراتو 2021 - ضمان المصنع',
      price: '245,000',
      location: 'طنطا',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
      vendor: 'وكيل كيا المعتمد',
      rating: 4.7,
      reviewCount: 134,
      specs: {
        year: '2021',
        fuel: 'بنزين',
        transmission: 'CVT',
        mileage: '28,000 كم',
        engine: '1.6 لتر',
        color: 'رمادي داكن'
      },
      features: ['شاشة ذكية', 'Android Auto', 'Apple CarPlay', 'نظام أمان', 'مقاعد قماش فاخر', 'إضاءة LED كاملة'],
      condition: 'excellent',
      verified: true,
      type: 'sedan',
      brand: 'كيا',
      model: 'سيراتو'
    },
    {
      id: '8',
      title: 'فولكس واجن جيتا 2020 - أوروبية أصلية',
      price: '315,000',
      location: 'الزقازيق',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
      vendor: 'معرض أوروبا للسيارات',
      rating: 4.6,
      reviewCount: 67,
      specs: {
        year: '2020',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '35,000 كم',
        engine: '1.4 لتر TSI',
        color: 'أبيض نقي'
      },
      features: ['تكنولوجيا ألمانية', 'نظام MIB', 'نظام أمان متقدم', 'مقاعد رياضية', 'عجلة قيادة متعددة الوظائف'],
      condition: 'excellent',
      verified: true,
      type: 'sedan',
      brand: 'فولكس واجن',
      model: 'جيتا'
    }
  ];

  const brands = ['تويوتا', 'مرسيدس', 'BMW', 'هونداي', 'نيسان', 'شيفروليه', 'كيا', 'فولكس واجن', 'هوندا', 'فورد'];
  const egyptianCities = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشيخ زايد', 'القاهرة الجديدة', 'المعادي', 'المنصورة', 'طنطا', 'الزقازيق', 'أسوان'];
  const years = ['2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'];

  // Convert RealCar to Vehicle format
  const convertRealCarsToVehicles = (realCars: RealCar[]): Vehicle[] => {
    return realCars.map(car => ({
      id: car.id,
      title: car.title,
      price: RealDataService.formatEGP(car.price),
      originalPrice: car.originalPrice ? RealDataService.formatEGP(car.originalPrice) : undefined,
      location: car.location,
      image: car.images[0] || '/placeholder-car.jpg',
      vendor: car.seller.name,
      rating: car.seller.rating,
      reviewCount: Math.floor(car.views / 10), // Simulate review count from views
      specs: {
        year: car.year.toString(),
        fuel: car.fuelType === 'gasoline' ? 'بنزين' : car.fuelType === 'diesel' ? 'ديزل' : 'هايبرد',
        transmission: car.transmission === 'automatic' ? 'أوتوماتيك' : car.transmission === 'manual' ? 'يدوي' : 'CVT',
        mileage: `${car.mileage.toLocaleString()} كم`,
        engine: car.specifications?.engine || '',
        color: car.color
      },
      features: car.features,
      condition: car.condition === 'new' ? 'new' : car.condition === 'certified' ? 'excellent' : 'used',
      verified: car.seller.verified,
      discount: car.originalPrice ? RealDataService.getDiscountPercentage(car.originalPrice, car.price) : undefined,
      type: car.bodyType as 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'pickup' | 'van',
      brand: car.make,
      model: car.model
    }));
  };

  useEffect(() => {
    // Load real data
    setIsLoading(true);
    setTimeout(() => {
      const realCars = RealDataService.getRealCars();
      const convertedVehicles = convertRealCarsToVehicles(realCars);
      setVehicles(convertedVehicles);
      setFilteredVehicles(convertedVehicles);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = [...vehicles];

    // Apply filters
    if (filters.searchQuery) {
      filtered = filtered.filter(vehicle => 
        vehicle.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    if (filters.brand) {
      filtered = filtered.filter(vehicle => vehicle.brand === filters.brand);
    }

    if (filters.condition) {
      filtered = filtered.filter(vehicle => vehicle.condition === filters.condition);
    }

    if (filters.location) {
      filtered = filtered.filter(vehicle => vehicle.location === filters.location);
    }

    if (filters.fuel) {
      filtered = filtered.filter(vehicle => vehicle.specs.fuel === filters.fuel);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(vehicle => 
        parseInt(vehicle.price.replace(/,/g, '')) >= parseInt(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(vehicle => 
        parseInt(vehicle.price.replace(/,/g, '')) <= parseInt(filters.maxPrice)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => parseInt(a.price.replace(/,/g, '')) - parseInt(b.price.replace(/,/g, '')));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseInt(b.price.replace(/,/g, '')) - parseInt(a.price.replace(/,/g, '')));
        break;
      case 'year_new':
        filtered.sort((a, b) => parseInt(b.specs.year) - parseInt(a.specs.year));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // newest first
        break;
    }

    setFilteredVehicles(filtered);
  }, [vehicles, filters, sortBy]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      brand: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      year: '',
      fuel: '',
      transmission: '',
      condition: '',
      location: '',
      type: '',
    });
  };

  const handleAddToFavorites = (vehicleId: string) => {
    toast.success('تم إضافة السيارة إلى المفضلة');
  };

  const handleContactVendor = (vendor: string, vehicleTitle: string) => {
    toast.success(`سيتم التواصل مع ${vendor} بخصوص ${vehicleTitle}`);
  };

  const handleViewDetails = (vehicleId: string) => {
    // In a real app, navigate to product details page
    window.location.href = `/product/${vehicleId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري تحميل السيارات...</h2>
          <p className="text-gray-600">البحث في أكبر سوق للسيارات في مصر</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">سوق السيارات المصري</h1>
          <p className="text-gray-600">
            اكتشف أكثر من {vehicles.length} سيارة من تجار موثوقين في جميع أنحاء مصر
          </p>
        </motion.div>

        {/* Search Bar */}
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
                placeholder="ابحث عن السيارة المناسبة... (مثال: تويوتا كامري 2020)"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
              />
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>فلترة</span>
              </motion.button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
              >
                <option value="newest">الأحدث</option>
                <option value="price_low">السعر: الأقل أولاً</option>
                <option value="price_high">السعر: الأعلى أولاً</option>
                <option value="year_new">السنة: الأحدث أولاً</option>
                <option value="rating">التقييم الأعلى</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">فلاتر البحث المتقدمة</h3>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <motion.button
                    onClick={clearFilters}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    مسح الفلاتر
                  </motion.button>
                  <motion.button
                    onClick={() => setShowFilters(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    whileHover={{ scale: 1.1 }}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الماركة</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع الماركات</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع الحالات</option>
                    <option value="new">جديد</option>
                    <option value="excellent">ممتاز</option>
                    <option value="used">مستعمل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع المحافظات</option>
                    {egyptianCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الوقود</label>
                  <select
                    value={filters.fuel}
                    onChange={(e) => handleFilterChange('fuel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع الأنواع</option>
                    <option value="بنزين">بنزين</option>
                    <option value="ديزل">ديزل</option>
                    <option value="هايبرد">هايبرد</option>
                    <option value="كهربائي">كهربائي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر الأدنى (جنيه)</label>
                  <input
                    type="number"
                    placeholder="50,000"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر الأعلى (جنيه)</label>
                  <input
                    type="number"
                    placeholder="1,000,000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السنة</label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع السنوات</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع ناقل الحركة</label>
                  <select
                    value={filters.transmission}
                    onChange={(e) => handleFilterChange('transmission', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع الأنواع</option>
                    <option value="أوتوماتيك">أوتوماتيك</option>
                    <option value="مانيوال">مانيوال</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              النتائج ({filteredVehicles.length} سيارة)
            </h2>
            {filters.searchQuery && (
              <p className="text-gray-600 mt-1">
                نتائج البحث عن: "{filters.searchQuery}"
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-sm text-gray-600">العرض:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-1">
                  <div className="bg-gray-400 rounded-sm"></div>
                  <div className="bg-gray-400 rounded-sm"></div>
                  <div className="bg-gray-400 rounded-sm"></div>
                  <div className="bg-gray-400 rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              >
                <div className="w-4 h-4 flex flex-col space-y-1">
                  <div className="h-1 bg-gray-400 rounded"></div>
                  <div className="h-1 bg-gray-400 rounded"></div>
                  <div className="h-1 bg-gray-400 rounded"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle Listings */}
        {filteredVehicles.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد سيارات مطابقة للبحث</h3>
            <p className="text-gray-600 mb-6">جرب تعديل معايير البحث أو الفلاتر</p>
            <motion.button
              onClick={clearFilters}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              مسح جميع الفلاتر
            </motion.button>
          </motion.div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1 }}
              >
                <div className={`relative ${viewMode === 'list' ? 'w-80' : ''}`}>
                  <img
                    src={vehicle.image}
                    alt={vehicle.title}
                    className={`object-cover ${
                      viewMode === 'list' ? 'w-full h-48' : 'w-full h-48'
                    }`}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-2">
                    {vehicle.verified && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        ✓ موثق
                      </span>
                    )}
                    <span className={`text-white text-xs px-2 py-1 rounded-full font-medium ${
                      vehicle.condition === 'new' ? 'bg-blue-500' : 
                      vehicle.condition === 'excellent' ? 'bg-green-500' : 'bg-orange-500'
                    }`}>
                      {vehicle.condition === 'new' ? 'جديد' : 
                       vehicle.condition === 'excellent' ? 'ممتاز' : 'مستعمل'}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {vehicle.discount && (
                    <div className="absolute bottom-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      خصم {vehicle.discount}%
                    </div>
                  )}

                  {/* Favorite Button */}
                  <div className="absolute top-4 left-4">
                    <motion.button
                      onClick={() => handleAddToFavorites(vehicle.id)}
                      className="w-8 h-8 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <HeartIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                        {vehicle.title}
                      </h3>
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-2">
                        <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{vehicle.location}</span>
                        <span>•</span>
                        <span>{vehicle.vendor}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse ml-4">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{vehicle.rating}</span>
                      <span className="text-xs text-gray-500">({vehicle.reviewCount})</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline space-x-2 space-x-reverse">
                      <span className="text-2xl font-bold text-primary-600">
                        {vehicle.price} جنيه
                      </span>
                      {vehicle.originalPrice && vehicle.originalPrice !== vehicle.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {vehicle.originalPrice} جنيه
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">السنة</div>
                      <div className="font-semibold text-sm">{vehicle.specs.year}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">الوقود</div>
                      <div className="font-semibold text-sm">{vehicle.specs.fuel}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">ناقل الحركة</div>
                      <div className="font-semibold text-sm">{vehicle.specs.transmission}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">المسافة</div>
                      <div className="font-semibold text-sm">{vehicle.specs.mileage}</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {vehicle.features.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                      {vehicle.features.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          +{vehicle.features.length - 3} المزيد
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 space-x-reverse">
                    <motion.button
                      onClick={() => handleViewDetails(vehicle.id)}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm flex items-center justify-center space-x-1 space-x-reverse"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>عرض التفاصيل</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleContactVendor(vehicle.vendor, vehicle.title)}
                      className="px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors font-medium text-sm flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PhoneIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredVehicles.length > 0 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              تحميل المزيد من السيارات
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;