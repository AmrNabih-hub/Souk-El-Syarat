/**
 * 🎯 HERO SLIDER COMPONENT
 * Dynamic automotive showcase with real-time data
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { Link } from 'react-router-dom';

interface SlideData {
  id: number;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  description: { ar: string; en: string };
  image: string;
  cta: { ar: string; en: string };
  link: string;
  badge?: { ar: string; en: string };
  stats?: { value: string; label: { ar: string; en: string } }[];
}

const HeroSlider: React.FC = () => {
  const { language } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides: SlideData[] = [
    {
      id: 1,
      title: {
        ar: 'سيارات فاخرة حصرية',
        en: 'Exclusive Luxury Cars'
      },
      subtitle: {
        ar: 'Mercedes-Benz S-Class 2024',
        en: 'Mercedes-Benz S-Class 2024'
      },
      description: {
        ar: 'اكتشف مجموعتنا الحصرية من السيارات الفاخرة مع ضمان شامل وخدمة VIP',
        en: 'Discover our exclusive collection of luxury vehicles with comprehensive warranty and VIP service'
      },
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1920&h=1080&fit=crop',
      cta: {
        ar: 'تصفح السيارات الفاخرة',
        en: 'Browse Luxury Cars'
      },
      link: '/marketplace?category=luxury',
      badge: {
        ar: 'حصري',
        en: 'Exclusive'
      },
      stats: [
        { value: '500+', label: { ar: 'سيارة فاخرة', en: 'Luxury Cars' } },
        { value: '0%', label: { ar: 'فائدة', en: 'APR' } },
        { value: '5', label: { ar: 'سنوات ضمان', en: 'Years Warranty' } }
      ]
    },
    {
      id: 2,
      title: {
        ar: 'خدمات VIP الحصرية',
        en: 'Exclusive VIP Services'
      },
      subtitle: {
        ar: 'صيانة احترافية لسيارتك',
        en: 'Professional Car Maintenance'
      },
      description: {
        ar: 'احجز خدمة الصيانة المنزلية مع فريق الخبراء المعتمدين',
        en: 'Book home maintenance service with our certified expert team'
      },
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=1920&h=1080&fit=crop',
      cta: {
        ar: 'احجز الآن',
        en: 'Book Now'
      },
      link: '/services/vip',
      badge: {
        ar: 'VIP',
        en: 'VIP'
      },
      stats: [
        { value: '24/7', label: { ar: 'خدمة', en: 'Service' } },
        { value: '1hr', label: { ar: 'وقت الوصول', en: 'Response Time' } },
        { value: '100%', label: { ar: 'رضا العملاء', en: 'Satisfaction' } }
      ]
    },
    {
      id: 3,
      title: {
        ar: 'قطع غيار أصلية',
        en: 'Genuine OEM Parts'
      },
      subtitle: {
        ar: 'جودة مضمونة من المصنع',
        en: 'Factory Guaranteed Quality'
      },
      description: {
        ar: 'قطع غيار أصلية لجميع الماركات مع ضمان المصنع وتوصيل سريع',
        en: 'Original parts for all brands with factory warranty and fast delivery'
      },
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&h=1080&fit=crop',
      cta: {
        ar: 'تسوق القطع',
        en: 'Shop Parts'
      },
      link: '/marketplace?category=parts',
      badge: {
        ar: 'أصلي 100%',
        en: '100% Genuine'
      },
      stats: [
        { value: '50K+', label: { ar: 'قطعة غيار', en: 'Parts' } },
        { value: '48hr', label: { ar: 'توصيل', en: 'Delivery' } },
        { value: '2yr', label: { ar: 'ضمان', en: 'Warranty' } }
      ]
    },
    {
      id: 4,
      title: {
        ar: 'عروض حصرية اليوم',
        en: "Today's Exclusive Deals"
      },
      subtitle: {
        ar: 'BMW & Audi - خصم 15%',
        en: 'BMW & Audi - 15% OFF'
      },
      description: {
        ar: 'عروض محدودة على السيارات الألمانية الفاخرة - احجز الآن',
        en: 'Limited offers on premium German vehicles - Book now'
      },
      image: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=1920&h=1080&fit=crop',
      cta: {
        ar: 'شاهد العروض',
        en: 'View Deals'
      },
      link: '/deals',
      badge: {
        ar: 'عرض محدود',
        en: 'Limited Offer'
      },
      stats: [
        { value: '15%', label: { ar: 'خصم', en: 'Discount' } },
        { value: '48hr', label: { ar: 'متبقي', en: 'Left' } },
        { value: '20', label: { ar: 'سيارة متاحة', en: 'Cars Available' } }
      ]
    },
    {
      id: 5,
      title: {
        ar: 'السيارات الكهربائية',
        en: 'Electric Vehicles'
      },
      subtitle: {
        ar: 'Tesla Model S & Model X',
        en: 'Tesla Model S & Model X'
      },
      description: {
        ar: 'مستقبل القيادة مع أحدث السيارات الكهربائية وشبكة الشحن',
        en: 'The future of driving with latest EVs and charging network'
      },
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1920&h=1080&fit=crop',
      cta: {
        ar: 'اكتشف المزيد',
        en: 'Discover More'
      },
      link: '/marketplace?category=electric',
      badge: {
        ar: 'صديق للبيئة',
        en: 'Eco-Friendly'
      },
      stats: [
        { value: '600km', label: { ar: 'مدى', en: 'Range' } },
        { value: '15min', label: { ar: 'شحن سريع', en: 'Fast Charge' } },
        { value: '0', label: { ar: 'انبعاثات', en: 'Emissions' } }
      ]
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const currentSlideData = slides[currentSlide];
  const isArabic = language === 'ar';

  return (
    <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-gray-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={currentSlideData.image}
              alt={currentSlideData.title[language]}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="w-full lg:w-2/3 space-y-6">
              {/* Badge */}
              {currentSlideData.badge && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block"
                >
                  <span className="px-4 py-2 bg-primary-500 text-white text-sm font-bold rounded-full">
                    {currentSlideData.badge[language]}
                  </span>
                </motion.div>
              )}

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-bold text-white"
              >
                {currentSlideData.title[language]}
              </motion.h1>

              {/* Subtitle */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl md:text-3xl text-primary-400 font-semibold"
              >
                {currentSlideData.subtitle[language]}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl text-gray-200 max-w-2xl"
              >
                {currentSlideData.description[language]}
              </motion.p>

              {/* Stats */}
              {currentSlideData.stats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-6 md:gap-12"
                >
                  {currentSlideData.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-primary-400">
                        {stat.value}
                      </div>
                      <div className="text-sm md:text-base text-gray-300">
                        {stat.label[language]}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link
                  to={currentSlideData.link}
                  className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-xl"
                >
                  {currentSlideData.cta[language]}
                  <ChevronRightIcon className={`w-5 h-5 ${isArabic ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-20"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-20"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-primary-500 w-8'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;