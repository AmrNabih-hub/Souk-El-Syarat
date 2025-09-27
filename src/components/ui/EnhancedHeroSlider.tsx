import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';

interface HeroSlide {
  id: number;
  title: {
    ar: string;
    en: string;
  };
  subtitle: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  image: string;
  cta: {
    text: { ar: string; en: string };
    link: string;
    color: 'primary' | 'secondary';
  };
  badge?: {
    text: { ar: string; en: string };
    color: string;
  };
}

const EnhancedHeroSlider: React.FC = () => {
  const { language } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides: HeroSlide[] = [
    {
      id: 1,
      title: {
        ar: 'اكتشف مجموعة حصرية من السيارات الفاخرة',
        en: 'Discover Exclusive Collection of Luxury Vehicles'
      },
      subtitle: {
        ar: 'أفضل العروض في مصر',
        en: 'Best Deals in Egypt'
      },
      description: {
        ar: 'استعرض آلاف السيارات المعتمدة من أشهر الماركات العالمية مع ضمان الجودة والأسعار التنافسية',
        en: 'Browse thousands of certified vehicles from world-renowned brands with quality guarantee and competitive prices'
      },
      image: 'https://images.unsplash.com/photo-1493238792000-8113da705763?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      cta: {
        text: { ar: 'تسوق الآن', en: 'Shop Now' },
        link: '/marketplace',
        color: 'primary'
      },
      badge: {
        text: { ar: 'جديد', en: 'New' },
        color: 'bg-red-500'
      }
    },
    {
      id: 2,
      title: {
        ar: 'قطع غيار أصلية بأفضل الأسعار',
        en: 'Genuine Parts at Best Prices'
      },
      subtitle: {
        ar: 'جودة مضمونة',
        en: 'Guaranteed Quality'
      },
      description: {
        ar: 'احصل على قطع غيار أصلية من المصنع مباشرة مع شهادات الجودة وضمان شامل لراحة البال',
        en: 'Get genuine factory parts direct from manufacturer with quality certificates and comprehensive warranty'
      },
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      cta: {
        text: { ar: 'اكتشف المزيد', en: 'Discover More' },
        link: '/marketplace?category=parts',
        color: 'secondary'
      }
    },
    {
      id: 3,
      title: {
        ar: 'خدمات احترافية متكاملة',
        en: 'Complete Professional Services'
      },
      subtitle: {
        ar: 'خبراء السيارات',
        en: 'Auto Experts'
      },
      description: {
        ar: 'مراكز خدمة معتمدة بأحدث التقنيات وفنيين متخصصين لضمان أفضل أداء وصيانة لسيارتك',
        en: 'Certified service centers with latest technology and specialized technicians for optimal performance and maintenance'
      },
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      cta: {
        text: { ar: 'احجز موعد', en: 'Book Service' },
        link: '/services',
        color: 'primary'
      }
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isAutoPlaying]);

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      className="relative w-full h-[70vh] min-h-[600px] overflow-hidden bg-gradient-to-br from-gray-900 to-black"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${currentSlideData.image})`
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${currentSlide}`}
                initial={{ x: language === 'ar' ? 50 : -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: language === 'ar' ? -50 : 50, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`text-white ${language === 'ar' ? 'text-right lg:text-right' : 'text-left lg:text-left'}`}
              >
                {/* Badge */}
                {currentSlideData.badge && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="inline-block mb-4"
                  >
                    <span className={`${currentSlideData.badge.color} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg`}>
                      {currentSlideData.badge.text[language]}
                    </span>
                  </motion.div>
                )}

                {/* Subtitle */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-primary-300 font-medium text-lg mb-2 uppercase tracking-wide"
                >
                  {currentSlideData.subtitle[language]}
                </motion.div>

                {/* Main Title */}
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-white via-primary-200 to-secondary-200 bg-clip-text text-transparent">
                    {currentSlideData.title[language]}
                  </span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-xl text-gray-200 mb-8 leading-relaxed max-w-2xl"
                >
                  {currentSlideData.description[language]}
                </motion.p>

                {/* CTA Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Link
                    to={currentSlideData.cta.link}
                    className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                      currentSlideData.cta.color === 'primary'
                        ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary'
                        : 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-secondary'
                    }`}
                  >
                    {currentSlideData.cta.text[language]}
                    <motion.div
                      animate={{ x: language === 'ar' ? [-5, 0, -5] : [5, 0, 5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`${language === 'ar' ? 'mr-3' : 'ml-3'}`}
                    >
                      {language === 'ar' ? (
                        <ChevronLeftIcon className="w-6 h-6" />
                      ) : (
                        <ChevronRightIcon className="w-6 h-6" />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Stats/Features */}
            <motion.div
              initial={{ x: language === 'ar' ? -50 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-6">
                {[
                  { number: '10,000+', label: { ar: 'سيارة متاحة', en: 'Cars Available' } },
                  { number: '50,000+', label: { ar: 'قطعة غيار', en: 'Auto Parts' } },
                  { number: '5,000+', label: { ar: 'عميل راضي', en: 'Happy Customers' } },
                  { number: '100+', label: { ar: 'مركز خدمة', en: 'Service Centers' } }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                    className="bg-gradient-to-br from-amber-500/20 via-yellow-400/20 to-orange-500/20 backdrop-blur-lg border border-white/20 text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(14, 165, 233, 0.15))',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div className="text-3xl font-bold text-amber-300 mb-2 drop-shadow-lg">
                      {stat.number}
                    </div>
                    <div className="text-white text-sm font-medium drop-shadow-sm">
                      {stat.label[language]}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className={`absolute top-1/2 -translate-y-1/2 ${language === 'ar' ? 'right-4' : 'left-4'} bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 hover:scale-110`}
        aria-label={language === 'ar' ? 'الشريحة السابقة' : 'Previous slide'}
      >
        {language === 'ar' ? (
          <ChevronRightIcon className="w-6 h-6" />
        ) : (
          <ChevronLeftIcon className="w-6 h-6" />
        )}
      </button>

      <button
        onClick={nextSlide}
        className={`absolute top-1/2 -translate-y-1/2 ${language === 'ar' ? 'left-4' : 'right-4'} bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 hover:scale-110`}
        aria-label={language === 'ar' ? 'الشريحة التالية' : 'Next slide'}
      >
        {language === 'ar' ? (
          <ChevronLeftIcon className="w-6 h-6" />
        ) : (
          <ChevronRightIcon className="w-6 h-6" />
        )}
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex space-x-3 rtl:space-x-reverse">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-primary-500 scale-125'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`${language === 'ar' ? 'انتقل إلى الشريحة' : 'Go to slide'} ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
        aria-label={isAutoPlaying ? 'إيقاف التشغيل التلقائي' : 'تشغيل تلقائي'}
      >
        <PlayIcon className={`w-5 h-5 ${isAutoPlaying ? 'opacity-50' : 'opacity-100'}`} />
      </button>
    </div>
  );
};

export default EnhancedHeroSlider;
