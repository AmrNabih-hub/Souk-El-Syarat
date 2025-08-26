import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartIcon,
  EyeIcon,
  ShareIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  CalendarIcon,
  ClockIcon,
  CheckBadgeIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid
} from '@heroicons/react/24/solid';

import RealDataService, { RealCar, CarService, CarPart } from '@/services/real-data.service';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

type TabType = 'cars' | 'services' | 'parts';
type ViewMode = 'grid' | 'list';

const EnhancedMarketplace: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('cars');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Set<string>>(new Set());

  // Real data
  const [cars] = useState<RealCar[]>(RealDataService.getRealCars());
  const [services] = useState<CarService[]>(RealDataService.getCarServices());
  const [parts] = useState<CarPart[]>(RealDataService.getCarParts());

  // Filtered data
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesSearch = car.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          car.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = car.price >= priceRange[0] && car.price <= priceRange[1];
      const matchesLocation = !selectedLocation || car.location.includes(selectedLocation);
      
      return matchesSearch && matchesPrice && matchesLocation;
    });
  }, [cars, searchQuery, priceRange, selectedLocation]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1];
      const matchesLocation = !selectedLocation || service.provider.location.includes(selectedLocation);
      
      return matchesSearch && matchesPrice && matchesLocation;
    });
  }, [services, searchQuery, priceRange, selectedLocation]);

  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchesSearch = part.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          part.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = part.price >= priceRange[0] && part.price <= priceRange[1];
      const matchesLocation = !selectedLocation || part.seller.location.includes(selectedLocation);
      
      return matchesSearch && matchesPrice && matchesLocation;
    });
  }, [parts, searchQuery, priceRange, selectedLocation]);

  // Real-time actions
  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
      toast.success('تم الحذف من المفضلة', { icon: '💔' });
    } else {
      newFavorites.add(itemId);
      toast.success('تم الإضافة للمفضلة', { icon: '❤️' });
    }
    setFavorites(newFavorites);
  };

  const addToCart = (itemId: string, itemType: 'car' | 'service' | 'part') => {
    const newCart = new Set(cart);
    if (!newCart.has(itemId)) {
      newCart.add(itemId);
      setCart(newCart);
      toast.success('تم الإضافة للسلة', { icon: '🛒' });
      
      // Redirect to checkout for immediate purchase
      setTimeout(() => {
        window.location.href = `/checkout?item=${itemId}&type=${itemType}&qty=1`;
      }, 1000);
    } else {
      toast.error('العنصر موجود بالسلة بالفعل');
    }
  };

  const bookService = (serviceId: string) => {
    // Redirect to booking page
    window.location.href = `/booking?service=${serviceId}`;
  };

  const contactSeller = (sellerPhone: string, itemTitle: string) => {
    const whatsappUrl = `https://wa.me/2${sellerPhone}?text=مرحباً، أريد الاستفسار عن ${itemTitle}`;
    window.open(whatsappUrl, '_blank');
    toast.success('جاري فتح واتساب...');
  };

  const shareItem = (itemTitle: string, itemId: string) => {
    const url = `${window.location.origin}/item/${itemId}`;
    if (navigator.share) {
      navigator.share({
        title: itemTitle,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ الرابط');
    }
  };

  // Quick view for items
  const [quickViewItem, setQuickViewItem] = useState<any>(null);

  const tabs = [
    { id: 'cars', label: 'السيارات', labelEn: 'Cars', icon: TruckIcon, count: filteredCars.length },
    { id: 'services', label: 'الخدمات', labelEn: 'Services', icon: WrenchScrewdriverIcon, count: filteredServices.length },
    { id: 'parts', label: 'قطع الغيار', labelEn: 'Parts', icon: SparklesIcon, count: filteredParts.length }
  ];

  const renderCarCard = (car: RealCar, index: number) => (
    <motion.div
      key={car.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
      }`}
    >
      {/* Image Section */}
      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-80 h-64' : 'w-full h-64'}`}>
        <img
          src={car.images[0]}
          alt={car.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {car.isPromoted && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              مميز
            </span>
          )}
          {car.isFeatured && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              مُنسق
            </span>
          )}
          {car.originalPrice && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              -{RealDataService.getDiscountPercentage(car.originalPrice, car.price)}%
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <motion.button
            onClick={() => toggleFavorite(car.id)}
            className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            {favorites.has(car.id) ? (
              <HeartSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600" />
            )}
          </motion.button>
          
          <motion.button
            onClick={() => setQuickViewItem(car)}
            className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <EyeIcon className="w-5 h-5 text-gray-600" />
          </motion.button>
          
          <motion.button
            onClick={() => shareItem(car.title, car.id)}
            className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <ShareIcon className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white text-sm">
          <div className="flex items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded">
            <EyeIcon className="w-4 h-4" />
            <span>{car.views}</span>
          </div>
          <div className="flex items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded">
            <HeartIcon className="w-4 h-4" />
            <span>{car.likes}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
            {car.title}
          </h3>
          <div className="flex items-center gap-1 text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <StarSolid key={i} className={`w-4 h-4 ${i < Math.floor(car.seller.rating) ? 'text-yellow-500' : 'text-gray-300'}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span>{car.year}</span>
          <span>{car.mileage.toLocaleString()} كم</span>
          <span className={`px-2 py-1 rounded text-xs ${
            car.condition === 'new' ? 'bg-green-100 text-green-800' :
            car.condition === 'certified' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {car.condition === 'new' ? 'جديد' : car.condition === 'certified' ? 'معتمد' : 'مستعمل'}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{car.location}</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">
              {RealDataService.formatEGP(car.price)}
            </span>
            {car.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {RealDataService.formatEGP(car.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {car.features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {feature}
              </span>
            ))}
            {car.features.length > 3 && (
              <span className="text-xs text-gray-500">+{car.features.length - 3} المزيد</span>
            )}
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {car.seller.verified && (
              <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
            )}
            <span className="font-medium text-gray-900">{car.seller.name}</span>
          </div>
          <span className="text-xs text-gray-500">{car.seller.responseTime}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => contactSeller(car.seller.phone, car.title)}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>تواصل</span>
          </motion.button>
          
          <motion.button
            onClick={() => contactSeller(car.seller.phone, car.title)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PhoneIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderServiceCard = (service: CarService, index: number) => (
    <motion.div
      key={service.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative overflow-hidden h-48">
        <img
          src={service.image}
          alt={service.nameAr}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {service.isPopular && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              شائع
            </span>
          )}
          {service.discount && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              -{service.discount}%
            </span>
          )}
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
            service.availability === 'available' ? 'bg-green-500 text-white' :
            service.availability === 'busy' ? 'bg-yellow-500 text-white' :
            'bg-red-500 text-white'
          }`}>
            {service.availability === 'available' ? 'متاح' :
             service.availability === 'busy' ? 'مشغول' : 'غير متاح'}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <motion.button
            onClick={() => toggleFavorite(service.id)}
            className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            {favorites.has(service.id) ? (
              <HeartSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{service.nameAr}</h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.descriptionAr}</p>

        {/* Price and Duration */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">
              {RealDataService.formatEGP(service.price)}
            </span>
            {service.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {RealDataService.formatEGP(service.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <ClockIcon className="w-4 h-4" />
            <span className="text-sm">{service.durationAr}</span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {service.featuresAr.slice(0, 2).map((feature, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Provider */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {service.provider.verified && (
              <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
            )}
            <span className="font-medium text-gray-900">{service.provider.nameAr}</span>
          </div>
          <div className="flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{service.provider.rating}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-4">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{service.provider.location}</span>
        </div>

                      {/* Action Button */}
              <motion.button
                onClick={() => bookService(service.id)}
                disabled={service.availability === 'unavailable'}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  service.availability === 'unavailable'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
                whileHover={service.availability !== 'unavailable' ? { scale: 1.02 } : {}}
                whileTap={service.availability !== 'unavailable' ? { scale: 0.98 } : {}}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>احجز الآن</span>
              </motion.button>
      </div>
    </motion.div>
  );

  const renderPartCard = (part: CarPart, index: number) => (
    <motion.div
      key={part.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative overflow-hidden h-48">
        <img
          src={part.images[0]}
          alt={part.nameAr}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {part.isPopular && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              شائع
            </span>
          )}
          {part.discount && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              -{part.discount}%
            </span>
          )}
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
            part.inStock ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {part.inStock ? 'متوفر' : 'نفد المخزون'}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <motion.button
            onClick={() => toggleFavorite(part.id)}
            className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            {favorites.has(part.id) ? (
              <HeartSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">{part.nameAr}</h3>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
            {part.brand}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{part.partNumber}</p>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-primary-600">
            {RealDataService.formatEGP(part.price)}
          </span>
          {part.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {RealDataService.formatEGP(part.originalPrice)}
            </span>
          )}
        </div>

        {/* Warranty */}
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheckIcon className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600">ضمان {part.warrantyAr}</span>
        </div>

        {/* Compatibility */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">متوافق مع:</p>
          <div className="flex flex-wrap gap-1">
            {part.compatibility.slice(0, 2).map((car, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                {car}
              </span>
            ))}
          </div>
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {part.seller.verified && (
              <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
            )}
            <span className="font-medium text-gray-900">{part.seller.nameAr}</span>
          </div>
          <div className="flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{part.seller.rating}</span>
          </div>
        </div>

        {/* Shipping Info */}
        {part.shipping.available && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <TruckIcon className="w-4 h-4" />
            <span>{part.shipping.durationAr} - {RealDataService.formatEGP(part.shipping.cost)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => addToCart(part.id, 'part')}
            disabled={!part.inStock}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              !part.inStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
            whileHover={part.inStock ? { scale: 1.02 } : {}}
            whileTap={part.inStock ? { scale: 0.98 } : {}}
          >
            <ShoppingCartIcon className="w-4 h-4" />
            <span>أضف للسلة</span>
          </motion.button>
          
          <motion.button
            onClick={() => contactSeller(part.seller.name, part.nameAr)}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'cars': return filteredCars;
      case 'services': return filteredServices;
      case 'parts': return filteredParts;
      default: return [];
    }
  };

  const renderCurrentItems = () => {
    switch (activeTab) {
      case 'cars': return filteredCars.map(renderCarCard);
      case 'services': return filteredServices.map(renderServiceCard);
      case 'parts': return filteredParts.map(renderPartCard);
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'السوق المصري للسيارات' : 'Egyptian Car Marketplace'}
          </h1>
          <p className="text-gray-600">
            اكتشف أفضل السيارات والخدمات وقطع الغيار في مصر
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن السيارات، الخدمات، أو قطع الغيار..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  showFilters ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>فلتر</span>
              </motion.button>
              
              <div className="flex bg-white border border-gray-300 rounded-xl p-1">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-white rounded-xl shadow-lg p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نطاق السعر</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="من"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="إلى"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">جميع المحافظات</option>
                    {RealDataService.getEgyptianGovernorates().map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <motion.button
                    onClick={() => {
                      setSearchQuery('');
                      setPriceRange([0, 1000000]);
                      setSelectedLocation('');
                    }}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    مسح الفلاتر
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs font-bold">
                    {tab.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            عرض {getCurrentData().length} نتيجة
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>المفضلة: {favorites.size}</span>
            <span>|</span>
            <span>السلة: {cart.size}</span>
          </div>
        </div>

        {/* Items Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          <AnimatePresence mode="wait">
            {renderCurrentItems()}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {getCurrentData().length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لم نجد نتائج
            </h3>
            <p className="text-gray-600">
              جرب تعديل معايير البحث أو الفلاتر
            </p>
          </motion.div>
        )}
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setQuickViewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Quick view content would go here */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">{quickViewItem.title}</h3>
                <p>معلومات سريعة عن {quickViewItem.title}</p>
                <motion.button
                  onClick={() => setQuickViewItem(null)}
                  className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg"
                  whileTap={{ scale: 0.95 }}
                >
                  إغلاق
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedMarketplace;