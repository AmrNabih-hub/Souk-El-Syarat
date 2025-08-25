import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MapIcon,
  HeartIcon,
  ShareIcon,
  EyeIcon,
  StarIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

import AdvancedSearchEngine from '@/components/search/AdvancedSearchEngine';
import SmartRecommendationsEngine from '@/components/recommendations/SmartRecommendationsEngine';
import CarViewer360 from '@/components/product/CarViewer360';
import RealTimeChat from '@/components/messaging/RealTimeChat';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage: number;
  location: string;
  condition: 'new' | 'used' | 'certified';
  images: Array<{
    id: string;
    url: string;
    angle: number;
    view: 'exterior' | 'interior' | 'engine' | 'trunk';
  }>;
  rating: number;
  views: number;
  features: string[];
  bodyType: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
    responseTime: string;
    location: string;
  };
  specifications: {
    engine: string;
    horsepower: number;
    acceleration: string;
    topSpeed: string;
    fuelEconomy: string;
    safety: string[];
    technology: string[];
  };
  isPromoted?: boolean;
  isFeatured?: boolean;
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchFilters {
  query: string;
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  mileageMax: number | null;
  location: string;
  condition: 'new' | 'used' | 'certified' | '';
  bodyType: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  features: string[];
  sortBy: 'price-asc' | 'price-desc' | 'year-desc' | 'year-asc' | 'mileage-asc' | 'distance' | 'popularity' | 'date-desc';
}

type ViewMode = 'grid' | 'list' | 'map';

const UltimateMarketplacePage: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();

  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showCarViewer, setShowCarViewer] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Mock data with comprehensive car information
  const mockCars: Car[] = useMemo(() => [
    {
      id: '1',
      title: 'تويوتا كامري 2023 الفئة المتوسطة - حالة ممتازة',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      price: 450000,
      originalPrice: 480000,
      mileage: 15000,
      location: 'القاهرة الجديدة، القاهرة',
      condition: 'used',
      images: [
        { id: '1-1', url: '/images/cars/camry-exterior-1.jpg', angle: 0, view: 'exterior' },
        { id: '1-2', url: '/images/cars/camry-exterior-2.jpg', angle: 45, view: 'exterior' },
        { id: '1-3', url: '/images/cars/camry-interior-1.jpg', angle: 0, view: 'interior' },
        { id: '1-4', url: '/images/cars/camry-engine-1.jpg', angle: 0, view: 'engine' },
      ],
      rating: 4.8,
      views: 1250,
      features: ['نظام ملاحة GPS', 'كاميرا خلفية', 'مقاعد جلدية', 'فتحة سقف', 'نظام صوت premium'],
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      drivetrain: 'fwd',
      exteriorColor: 'أبيض لؤلؤي',
      interiorColor: 'بيج',
      seller: {
        id: 'vendor-1',
        name: 'معرض النخبة للسيارات',
        rating: 4.9,
        verified: true,
        responseTime: '15 دقيقة',
        location: 'القاهرة الجديدة'
      },
      specifications: {
        engine: '2.5L 4-Cylinder',
        horsepower: 203,
        acceleration: '0-100 في 8.4 ثانية',
        topSpeed: '190 كم/ساعة',
        fuelEconomy: '7.2L/100km',
        safety: ['ABS', 'ESP', '8 وسائد هوائية', 'مثبت سرعة تكيفي'],
        technology: ['Apple CarPlay', 'Android Auto', 'شاشة لمس 9 بوصة']
      },
      isPromoted: true,
      discount: 6.25,
      createdAt: new Date(2024, 0, 15),
      updatedAt: new Date(2024, 7, 20)
    },
    {
      id: '2',
      title: 'هيونداي توسان 2024 جديدة بالكامل - ضمان 5 سنوات',
      make: 'Hyundai',
      model: 'Tucson',
      year: 2024,
      price: 520000,
      mileage: 0,
      location: 'الجيزة، الجيزة',
      condition: 'new',
      images: [
        { id: '2-1', url: '/images/cars/tucson-exterior-1.jpg', angle: 0, view: 'exterior' },
        { id: '2-2', url: '/images/cars/tucson-interior-1.jpg', angle: 0, view: 'interior' },
      ],
      rating: 4.7,
      views: 890,
      features: ['دفع رباعي AWD', 'شاشة تاتش 12 بوصة', 'فتحة سقف بانوراما', 'مقاعد مدفأة'],
      bodyType: 'suv',
      fuelType: 'gasoline',
      transmission: 'automatic',
      drivetrain: 'awd',
      exteriorColor: 'أزرق معدني',
      interiorColor: 'أسود',
      seller: {
        id: 'vendor-2',
        name: 'وكيل هيونداي الرسمي',
        rating: 5.0,
        verified: true,
        responseTime: '5 دقائق',
        location: 'الجيزة'
      },
      specifications: {
        engine: '2.0L Turbo',
        horsepower: 187,
        acceleration: '0-100 في 9.1 ثانية',
        topSpeed: '185 كم/ساعة',
        fuelEconomy: '8.1L/100km',
        safety: ['Lane Keep Assist', 'Forward Collision Warning', '10 وسائد هوائية'],
        technology: ['Wireless CarPlay', 'Digital Cluster', 'Wireless Charging']
      },
      isFeatured: true,
      createdAt: new Date(2024, 6, 1),
      updatedAt: new Date(2024, 7, 25)
    },
    // Add more mock cars...
  ], []);

  useEffect(() => {
    // Simulate loading cars data
    setLoading(true);
    setTimeout(() => {
      setCars(mockCars);
      setFilteredCars(mockCars);
      setLoading(false);
    }, 1000);
  }, [mockCars]);

  // Advanced search and filtering
  const handleSearch = useCallback((filters: SearchFilters) => {
    let filtered = [...cars];

    // Apply filters
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(car => 
        car.title.toLowerCase().includes(query) ||
        car.make.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query)
      );
    }

    if (filters.make) {
      filtered = filtered.filter(car => car.make === filters.make);
    }

    if (filters.condition) {
      filtered = filtered.filter(car => car.condition === filters.condition);
    }

    if (filters.location) {
      filtered = filtered.filter(car => car.location.includes(filters.location));
    }

    if (filters.priceFrom) {
      filtered = filtered.filter(car => car.price >= filters.priceFrom!);
    }

    if (filters.priceTo) {
      filtered = filtered.filter(car => car.price <= filters.priceTo!);
    }

    if (filters.yearFrom) {
      filtered = filtered.filter(car => car.year >= filters.yearFrom!);
    }

    if (filters.yearTo) {
      filtered = filtered.filter(car => car.year <= filters.yearTo!);
    }

    if (filters.mileageMax) {
      filtered = filtered.filter(car => car.mileage <= filters.mileageMax);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'year-desc':
        filtered.sort((a, b) => b.year - a.year);
        break;
      case 'year-asc':
        filtered.sort((a, b) => a.year - b.year);
        break;
      case 'mileage-asc':
        filtered.sort((a, b) => a.mileage - b.mileage);
        break;
      case 'popularity':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'date-desc':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredCars(filtered);
    setCurrentPage(1);
  }, [cars]);

  const handleSaveSearch = (filters: SearchFilters, name: string) => {
    // In a real app, this would save to backend
    toast.success(`تم حفظ البحث: ${name}`);
  };

  const toggleWishlist = (carId: string) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(carId)) {
      newWishlist.delete(carId);
      toast.success(language === 'ar' ? 'تم الحذف من المفضلة' : 'Removed from wishlist');
    } else {
      newWishlist.add(carId);
      toast.success(language === 'ar' ? 'تم الإضافة للمفضلة' : 'Added to wishlist');
    }
    setWishlist(newWishlist);
  };

  const handleContactSeller = (car: Car) => {
    setChatPartner({
      id: car.seller.id,
      name: car.seller.name,
      role: 'vendor',
      isOnline: true,
      avatar: '/default-vendor-avatar.png'
    });
    setSelectedCar(car);
    setShowChat(true);
  };

  const handleViewCar360 = (car: Car) => {
    setSelectedCar(car);
    setShowCarViewer(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('ar-EG').format(mileage);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCars = filteredCars.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="h-40 bg-gray-300 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'سوق السيارات المصري' : 'Egyptian Car Marketplace'}
          </h1>
          <p className="text-gray-600">
            {language === 'ar' 
              ? `${filteredCars.length} سيارة متاحة من بائعين موثوقين`
              : `${filteredCars.length} cars available from trusted sellers`
            }
          </p>
        </motion.div>

        {/* Advanced Search Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <AdvancedSearchEngine
            onSearch={handleSearch}
            onSaveSearch={handleSaveSearch}
            showVisualSearch={true}
            showVoiceSearch={true}
          />
        </motion.div>

        {/* View Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-900">
              {language === 'ar' ? 'عرض:' : 'View:'}
            </span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { mode: 'grid' as ViewMode, icon: Squares2X2Icon, label: 'شبكة' },
                { mode: 'list' as ViewMode, icon: ListBulletIcon, label: 'قائمة' },
                { mode: 'map' as ViewMode, icon: MapIcon, label: 'خريطة' }
              ].map(({ mode, icon: Icon, label }) => (
                <motion.button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    viewMode === mode
                      ? 'bg-white text-primary-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {language === 'ar' 
                ? `${startIndex + 1}-${Math.min(endIndex, filteredCars.length)} من ${filteredCars.length}`
                : `${startIndex + 1}-${Math.min(endIndex, filteredCars.length)} of ${filteredCars.length}`
              }
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {/* Cars Grid/List */}
            <AnimatePresence mode="wait">
              {viewMode === 'grid' && (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {currentCars.map((car, index) => (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                    >
                      {/* Car Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={car.images[0]?.url || '/placeholder-car.jpg'}
                          alt={car.title}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col space-y-2">
                          {car.isPromoted && (
                            <span className="bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                              {language === 'ar' ? 'مميز' : 'Featured'}
                            </span>
                          )}
                          {car.condition === 'new' && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                              {language === 'ar' ? 'جديد' : 'New'}
                            </span>
                          )}
                          {car.discount && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                              -{car.discount}%
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex flex-col space-y-2">
                          <motion.button
                            onClick={() => toggleWishlist(car.id)}
                            className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                            whileTap={{ scale: 0.9 }}
                          >
                            {wishlist.has(car.id) ? (
                              <HeartSolid className="w-5 h-5 text-red-500" />
                            ) : (
                              <HeartIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </motion.button>

                          <motion.button
                            onClick={() => handleViewCar360(car)}
                            className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="w-5 h-5 text-gray-600" />
                          </motion.button>
                        </div>

                        {/* 360° Indicator */}
                        {car.images.length > 1 && (
                          <div className="absolute bottom-3 left-3">
                            <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                              360°
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Car Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">
                          {car.title}
                        </h3>

                        {/* Price */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-2xl font-bold text-primary-600">
                              {formatPrice(car.price)}
                            </span>
                            {car.originalPrice && (
                              <span className="text-sm text-gray-500 line-through mr-2">
                                {formatPrice(car.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{car.rating}</span>
                          </div>
                        </div>

                        {/* Car Details */}
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                          <div>{car.year}</div>
                          <div>{formatMileage(car.mileage)} كم</div>
                          <div>{car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'}</div>
                          <div>{car.condition === 'new' ? 'جديد' : car.condition === 'used' ? 'مستعمل' : 'معتمد'}</div>
                        </div>

                        {/* Location & Seller */}
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <span>{car.location}</span>
                          {car.seller.verified && (
                            <div className="flex items-center space-x-1">
                              <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                              <span>موثق</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={() => handleContactSeller(car)}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            <span>{language === 'ar' ? 'تواصل' : 'Contact'}</span>
                          </motion.button>

                          <motion.button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <PhoneIcon className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {viewMode === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {currentCars.map((car, index) => (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Car Image */}
                        <div className="relative md:w-80 h-48 md:h-auto overflow-hidden">
                          <img
                            src={car.images[0]?.url || '/placeholder-car.jpg'}
                            alt={car.title}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex space-x-2">
                            {car.isPromoted && (
                              <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                                مميز
                              </span>
                            )}
                            {car.condition === 'new' && (
                              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                جديد
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Car Info */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{car.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                <span>{car.year}</span>
                                <span>{formatMileage(car.mileage)} كم</span>
                                <span>{car.location}</span>
                              </div>
                              <div className="flex items-center space-x-2 mb-3">
                                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="font-medium">{car.rating}</span>
                                <span className="text-gray-600">({car.views} مشاهدة)</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary-600">
                                {formatPrice(car.price)}
                              </div>
                              {car.originalPrice && (
                                <div className="text-sm text-gray-500 line-through">
                                  {formatPrice(car.originalPrice)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Features */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {car.features.slice(0, 4).map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                >
                                  {feature}
                                </span>
                              ))}
                              {car.features.length > 4 && (
                                <span className="text-xs text-gray-500">
                                  +{car.features.length - 4} المزيد
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Seller Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {car.seller.verified && (
                                <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                              )}
                              <span className="font-medium">{car.seller.name}</span>
                              <div className="flex items-center space-x-1">
                                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm">{car.seller.rating}</span>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <motion.button
                                onClick={() => toggleWishlist(car.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                whileTap={{ scale: 0.9 }}
                              >
                                {wishlist.has(car.id) ? (
                                  <HeartSolid className="w-5 h-5 text-red-500" />
                                ) : (
                                  <HeartIcon className="w-5 h-5 text-gray-600" />
                                )}
                              </motion.button>

                              <motion.button
                                onClick={() => handleContactSeller(car)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                تواصل الآن
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-8"
              >
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <motion.button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {page}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Smart Recommendations */}
            <SmartRecommendationsEngine
              userPreferences={{
                budget: { min: 300000, max: 600000 },
                preferredMakes: ['Toyota', 'Hyundai'],
                preferredBodyTypes: ['sedan', 'suv'],
                maxMileage: 50000,
                preferredLocation: 'القاهرة',
                mustHaveFeatures: ['كاميرا خلفية'],
                viewHistory: [],
                searchHistory: [],
                wishlist: Array.from(wishlist)
              }}
              maxRecommendations={6}
              showMatchScores={true}
              className="lg:sticky lg:top-6"
            />
          </div>
        </div>
      </div>

      {/* 360° Car Viewer Modal */}
      <AnimatePresence>
        {showCarViewer && selectedCar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-bold">{selectedCar.title}</h3>
                <motion.button
                  onClick={() => setShowCarViewer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  ×
                </motion.button>
              </div>
              <CarViewer360
                images={selectedCar.images}
                carTitle={selectedCar.title}
                autoPlay={false}
                showHotspots={true}
                className="h-[600px]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && chatPartner && selectedCar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <RealTimeChat
                chatId={`${user?.id}-${chatPartner.id}`}
                currentUser={{
                  id: user?.id || 'guest',
                  name: user?.displayName || 'زائر',
                  role: 'customer',
                  isOnline: true
                }}
                otherParticipant={chatPartner}
                carId={selectedCar.id}
                onClose={() => setShowChat(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UltimateMarketplacePage;