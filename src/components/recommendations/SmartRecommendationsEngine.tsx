import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  HeartIcon,
  StarIcon,
  EyeIcon,
  ClockIcon,
  ArrowArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
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
  mileage: number;
  location: string;
  condition: 'new' | 'used' | 'certified';
  images: string[];
  rating: number;
  views: number;
  features: string[];
  bodyType: string;
  fuelType: string;
  transmission: string;
  seller: {
    name: string;
    rating: number;
    verified: boolean;
  };
  isPromoted?: boolean;
  matchScore?: number;
  matchReasons?: string[];
}

interface UserPreferences {
  budget: { min: number; max: number };
  preferredMakes: string[];
  preferredBodyTypes: string[];
  maxMileage: number;
  preferredLocation: string;
  mustHaveFeatures: string[];
  viewHistory: string[];
  searchHistory: string[];
  wishlist: string[];
}

interface RecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  cars: Car[];
  algorithm: 'collaborative' | 'content-based' | 'trending' | 'similar' | 'personalized';
  priority: number;
}

interface SmartRecommendationsProps {
  currentCarId?: string;
  userPreferences?: UserPreferences;
  className?: string;
  maxRecommendations?: number;
  showMatchScores?: boolean;
}

const SmartRecommendationsEngine: React.FC<SmartRecommendationsProps> = ({
  currentCarId,
  userPreferences,
  className = '',
  maxRecommendations = 20,
  showMatchScores = true
}) => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [recommendationSections, setRecommendationSections] = useState<RecommendationSection[]>([]);
  const [activeSection, setActiveSection] = useState<string>('personalized');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Mock data for demonstration
  const mockCars: Car[] = useMemo(() => [
    {
      id: '1',
      title: 'تويوتا كامري 2023 الفئة المتوسطة',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      price: 450000,
      mileage: 15000,
      location: 'القاهرة الجديدة',
      condition: 'used',
      images: ['/images/cars/camry-1.jpg'],
      rating: 4.8,
      views: 1250,
      features: ['نظام ملاحة', 'كاميرا خلفية', 'مقاعد جلدية'],
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      seller: { name: 'معرض النخبة للسيارات', rating: 4.9, verified: true },
      matchScore: 0.95,
      matchReasons: ['في نطاق الميزانية', 'ماركة مفضلة', 'موقع قريب']
    },
    {
      id: '2',
      title: 'هيونداي توسان 2024 جديدة بالكامل',
      make: 'Hyundai',
      model: 'Tucson',
      year: 2024,
      price: 520000,
      mileage: 0,
      location: 'الجيزة',
      condition: 'new',
      images: ['/images/cars/tucson-1.jpg'],
      rating: 4.7,
      views: 890,
      features: ['دفع رباعي', 'شاشة تاتش', 'فتحة سقف'],
      bodyType: 'suv',
      fuelType: 'gasoline',
      transmission: 'automatic',
      seller: { name: 'وكيل هيونداي الرسمي', rating: 5.0, verified: true },
      isPromoted: true,
      matchScore: 0.88,
      matchReasons: ['جديدة تماماً', 'بائع موثق', 'مواصفات عالية']
    },
    {
      id: '3',
      title: 'بي إم دبليو X3 2022 فئة فاخرة',
      make: 'BMW',
      model: 'X3',
      year: 2022,
      price: 750000,
      mileage: 25000,
      location: 'الإسكندرية',
      condition: 'certified',
      images: ['/images/cars/bmw-x3-1.jpg'],
      rating: 4.9,
      views: 2100,
      features: ['مقاعد رياضية', 'نظام صوت premium', 'قيادة ذاتية'],
      bodyType: 'suv',
      fuelType: 'gasoline',
      transmission: 'automatic',
      seller: { name: 'بي إم دبليو معتمد', rating: 4.8, verified: true },
      matchScore: 0.72,
      matchReasons: ['سيارة معتمدة', 'مواصفات رائعة']
    }
    // Add more mock cars as needed...
  ], []);

  const mockPreferences: UserPreferences = {
    budget: { min: 300000, max: 600000 },
    preferredMakes: ['Toyota', 'Hyundai', 'Nissan'],
    preferredBodyTypes: ['sedan', 'suv'],
    maxMileage: 50000,
    preferredLocation: 'القاهرة',
    mustHaveFeatures: ['كاميرا خلفية', 'نظام ملاحة'],
    viewHistory: ['1', '5', '8', '12'],
    searchHistory: ['تويوتا كامري', 'سيارات SUV', 'سيارات اوتوماتيك'],
    wishlist: ['2', '7', '15']
  };

  const effectivePreferences = userPreferences || mockPreferences;

  // AI-powered recommendation algorithms
  const generatePersonalizedRecommendations = (cars: Car[]): Car[] => {
    return cars
      .map(car => {
        let score = 0;
        const reasons: string[] = [];

        // Budget matching (30% weight)
        if (car.price >= effectivePreferences.budget.min && car.price <= effectivePreferences.budget.max) {
          score += 0.3;
          reasons.push('في نطاق الميزانية');
        }

        // Preferred make (25% weight)
        if (effectivePreferences.preferredMakes.includes(car.make)) {
          score += 0.25;
          reasons.push('ماركة مفضلة');
        }

        // Body type preference (20% weight)
        if (effectivePreferences.preferredBodyTypes.includes(car.bodyType)) {
          score += 0.2;
          reasons.push('نوع هيكل مفضل');
        }

        // Mileage (15% weight)
        if (car.mileage <= effectivePreferences.maxMileage) {
          score += 0.15;
          reasons.push('مسافة مقبولة');
        }

        // Location proximity (10% weight)
        if (car.location.includes(effectivePreferences.preferredLocation)) {
          score += 0.1;
          reasons.push('موقع قريب');
        }

        // Must-have features bonus
        const hasRequiredFeatures = effectivePreferences.mustHaveFeatures.some(feature =>
          car.features.some(carFeature => carFeature.includes(feature))
        );
        if (hasRequiredFeatures) {
          score += 0.1;
          reasons.push('يحتوي على مواصفات مطلوبة');
        }

        // Seller credibility bonus
        if (car.seller.verified) {
          score += 0.05;
          reasons.push('بائع موثق');
        }

        return {
          ...car,
          matchScore: Math.min(score, 1),
          matchReasons: reasons
        };
      })
      .filter(car => car.matchScore > 0.3)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 6);
  };

  const generateSimilarRecommendations = (cars: Car[], targetCarId: string): Car[] => {
    const targetCar = cars.find(car => car.id === targetCarId);
    if (!targetCar) return [];

    return cars
      .filter(car => car.id !== targetCarId)
      .map(car => {
        let similarity = 0;
        const reasons: string[] = [];

        // Same make (40% weight)
        if (car.make === targetCar.make) {
          similarity += 0.4;
          reasons.push('نفس الماركة');
        }

        // Similar price range (30% weight)
        const priceDiff = Math.abs(car.price - targetCar.price) / targetCar.price;
        if (priceDiff < 0.2) {
          similarity += 0.3;
          reasons.push('نطاق سعر مشابه');
        }

        // Same body type (20% weight)
        if (car.bodyType === targetCar.bodyType) {
          similarity += 0.2;
          reasons.push('نفس نوع الهيكل');
        }

        // Similar year (10% weight)
        const yearDiff = Math.abs(car.year - targetCar.year);
        if (yearDiff <= 2) {
          similarity += 0.1;
          reasons.push('سنة صنع مشابهة');
        }

        return {
          ...car,
          matchScore: similarity,
          matchReasons: reasons
        };
      })
      .filter(car => car.matchScore > 0.4)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 6);
  };

  const generateTrendingRecommendations = (cars: Car[]): Car[] => {
    // Sort by views, rating, and recent activity
    return cars
      .map(car => ({
        ...car,
        trendingScore: (car.views * 0.4) + (car.rating * 200) + (car.year - 2020) * 50,
        matchReasons: ['شائع جداً', 'تقييم عالي', 'كثير المشاهدة']
      }))
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
      .slice(0, 6);
  };

  // Generate recommendation sections
  useEffect(() => {
    const generateRecommendations = async () => {
      setLoading(true);

      const sections: RecommendationSection[] = [];

      // Personalized recommendations (highest priority)
      if (user) {
        const personalizedCars = generatePersonalizedRecommendations(mockCars);
        if (personalizedCars.length > 0) {
          sections.push({
            id: 'personalized',
            title: language === 'ar' ? 'مخصص لك' : 'For You',
            subtitle: language === 'ar' ? 'بناءً على تفضيلاتك وسجل البحث' : 'Based on your preferences and search history',
            icon: <SparklesIcon className="w-5 h-5" />,
            cars: personalizedCars,
            algorithm: 'personalized',
            priority: 1
          });
        }
      }

      // Similar cars (if viewing a specific car)
      if (currentCarId) {
        const similarCars = generateSimilarRecommendations(mockCars, currentCarId);
        if (similarCars.length > 0) {
          sections.push({
            id: 'similar',
            title: language === 'ar' ? 'سيارات مشابهة' : 'Similar Cars',
            subtitle: language === 'ar' ? 'سيارات تشبه ما تتصفحه الآن' : 'Cars similar to what you\'re viewing',
            icon: <EyeIcon className="w-5 h-5" />,
            cars: similarCars,
            algorithm: 'similar',
            priority: 2
          });
        }
      }

      // Trending cars
      const trendingCars = generateTrendingRecommendations(mockCars);
      sections.push({
        id: 'trending',
        title: language === 'ar' ? 'الأكثر شيوعاً' : 'Trending Now',
        subtitle: language === 'ar' ? 'السيارات الأكثر مشاهدة هذا الأسبوع' : 'Most viewed cars this week',
        icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
        cars: trendingCars,
        algorithm: 'trending',
        priority: 3
      });

      // Recently viewed (mock)
      if (effectivePreferences.viewHistory.length > 0) {
        const recentCars = mockCars
          .filter(car => effectivePreferences.viewHistory.includes(car.id))
          .slice(0, 4);
        
        if (recentCars.length > 0) {
          sections.push({
            id: 'recent',
            title: language === 'ar' ? 'شاهدتها مؤخراً' : 'Recently Viewed',
            subtitle: language === 'ar' ? 'سيارات قمت بمشاهدتها مؤخراً' : 'Cars you viewed recently',
            icon: <ClockIcon className="w-5 h-5" />,
            cars: recentCars,
            algorithm: 'content-based',
            priority: 4
          });
        }
      }

      // Premium/Promoted cars
      const premiumCars = mockCars.filter(car => car.isPromoted);
      if (premiumCars.length > 0) {
        sections.push({
          id: 'premium',
          title: language === 'ar' ? 'سيارات مميزة' : 'Featured Cars',
          subtitle: language === 'ar' ? 'سيارات مميزة من بائعين موثوقين' : 'Featured cars from trusted sellers',
          icon: <CheckBadgeIcon className="w-5 h-5" />,
          cars: premiumCars,
          algorithm: 'content-based',
          priority: 5
        });
      }

      setRecommendationSections(sections.sort((a, b) => a.priority - b.priority));
      setActiveSection(sections[0]?.id || 'trending');
      setLoading(false);
    };

    generateRecommendations();
  }, [currentCarId, user, language, mockCars, effectivePreferences]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (recommendationSections.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 text-center ${className}`}>
        <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'لا توجد توصيات متاحة' : 'No recommendations available'}
        </h3>
        <p className="text-gray-600">
          {language === 'ar' 
            ? 'ابدأ بتصفح السيارات للحصول على توصيات شخصية' 
            : 'Start browsing cars to get personalized recommendations'
          }
        </p>
      </div>
    );
  }

  const activeRecommendations = recommendationSections.find(section => section.id === activeSection);

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Section Selector */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-wrap gap-2">
          {recommendationSections.map(section => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeSection === section.id
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {section.icon}
              <span className="font-medium">{section.title}</span>
              <span className="text-xs bg-white px-2 py-1 rounded-full">
                {section.cars.length}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="p-6">
        {activeRecommendations && (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                {activeRecommendations.icon}
                <span className="mr-2">{activeRecommendations.title}</span>
                {showMatchScores && activeRecommendations.algorithm === 'personalized' && (
                  <BoltIcon className="w-5 h-5 text-yellow-500 mr-1" />
                )}
              </h3>
              <p className="text-gray-600">{activeRecommendations.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="wait">
                {activeRecommendations.cars.map((car, index) => (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Car Image */}
                    <div className="relative">
                      <img
                        src={car.images[0] || '/placeholder-car.jpg'}
                        alt={car.title}
                        className="w-full h-48 object-cover"
                      />
                      
                      {/* Match Score Badge */}
                      {showMatchScores && car.matchScore && (
                        <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                          {Math.round(car.matchScore * 100)}% {language === 'ar' ? 'مطابق' : 'match'}
                        </div>
                      )}

                      {/* Promoted Badge */}
                      {car.isPromoted && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                          {language === 'ar' ? 'مميز' : 'Featured'}
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <motion.button
                        onClick={() => toggleWishlist(car.id)}
                        className="absolute bottom-2 right-2 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                        whileTap={{ scale: 0.9 }}
                      >
                        {wishlist.has(car.id) ? (
                          <HeartSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-600" />
                        )}
                      </motion.button>
                    </div>

                    {/* Car Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {car.title}
                      </h4>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-primary-600">
                          {formatPrice(car.price)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{car.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>{car.year}</span>
                        <span>{car.mileage.toLocaleString()} كم</span>
                        <span>{car.location}</span>
                      </div>

                      {/* Match Reasons */}
                      {car.matchReasons && car.matchReasons.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {car.matchReasons.slice(0, 2).map((reason, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
                              >
                                {reason}
                              </span>
                            ))}
                            {car.matchReasons.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{car.matchReasons.length - 2} {language === 'ar' ? 'المزيد' : 'more'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Seller Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {car.seller.verified && (
                            <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-xs text-gray-600">{car.seller.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">{car.views.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <motion.button
                        className="w-full mt-3 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {activeRecommendations.cars.length >= 6 && (
              <div className="text-center mt-6">
                <motion.button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {language === 'ar' ? 'عرض المزيد' : 'Load More'}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SmartRecommendationsEngine;