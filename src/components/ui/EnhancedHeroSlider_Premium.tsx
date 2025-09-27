import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowRightIcon,
  StarIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';

const EnhancedHeroSlider: React.FC = () => {
  const { language } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      id: 1,
      title: { ar: 'سيارات فاخرة', en: 'Luxury Cars' },
      subtitle: { ar: 'اكتشف أفخم السيارات', en: 'Discover Premium Vehicles' },
      description: { ar: 'مجموعة حصرية من أفخم السيارات الأوروبية والأمريكية', en: 'Exclusive collection of premium European and American cars' },
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop&crop=center',
      bgGradient: 'from-amber-900/90 via-yellow-800/80 to-orange-700/90',
      cardGradient: 'from-amber-500 via-yellow-400 to-orange-500',
      accentColor: 'amber-400'
    },
    {
      id: 2,
      title: { ar: 'قطع غيار أصلية', en: 'Genuine Parts' },
      subtitle: { ar: 'جودة مضمونة', en: 'Guaranteed Quality' },
      description: { ar: 'قطع غيار أصلية من المصنع مباشرة لجميع أنواع السيارات', en: 'Original factory parts direct from manufacturers for all car brands' },
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=800&fit=crop&crop=center',
      bgGradient: 'from-blue-900/90 via-sky-800/80 to-cyan-700/90',
      cardGradient: 'from-blue-500 via-sky-400 to-cyan-500',
      accentColor: 'sky-400'
    },
    {
      id: 3,
      title: { ar: 'خدمات احترافية', en: 'Professional Services' },
      subtitle: { ar: 'خبرة وثقة', en: 'Experience & Trust' },
      description: { ar: 'شبكة من أفضل المراكز المعتمدة في جميع أنحاء مصر', en: 'Network of certified service centers across Egypt' },
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=800&fit=crop&crop=center',
      bgGradient: 'from-emerald-900/90 via-teal-800/80 to-green-700/90',
      cardGradient: 'from-emerald-500 via-teal-400 to-green-500',
      accentColor: 'emerald-400'
    },
    {
      id: 4,
      title: { ar: 'تجار موثوقين', en: 'Trusted Vendors' },
      subtitle: { ar: 'شراكات مضمونة', en: 'Guaranteed Partnerships' },
      description: { ar: 'تعامل مع أفضل التجار المعتمدين في مصر', en: 'Deal with the best certified dealers in Egypt' },
      image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=1200&h=800&fit=crop&crop=center',
      bgGradient: 'from-purple-900/90 via-indigo-800/80 to-violet-700/90',
      cardGradient: 'from-purple-500 via-indigo-400 to-violet-500',
      accentColor: 'purple-400'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800">
      {/* Enhanced Background with Egyptian Theme */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentSlide}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.bgGradient}`} />
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-75"
            style={{ 
              backgroundImage: `url(${currentSlideData.image})`
            }}
          />
          {/* Egyptian Pattern Overlay */}
          <div className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} 
          />
        </motion.div>
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content - Text */}
            <div className={`${language === 'ar' ? 'lg:order-2 text-right' : 'lg:order-1 text-left'} space-y-6`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${currentSlide}`}
                  initial={{ opacity: 0, x: language === 'ar' ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: language === 'ar' ? -50 : 50 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* Premium Badge */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center"
                  >
                    <div className={`bg-gradient-to-r ${currentSlideData.cardGradient} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center space-x-2`}>
                      <SparklesIcon className="w-4 h-4" />
                      <span>{language === 'ar' ? 'حصري' : 'Exclusive'}</span>
                    </div>
                  </motion.div>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className={`text-${currentSlideData.accentColor} font-semibold text-lg uppercase tracking-wider`}
                  >
                    {currentSlideData.subtitle[language]}
                  </motion.p>

                  {/* Main Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7 }}
                    className="text-5xl lg:text-7xl font-black text-white leading-tight drop-shadow-2xl"
                    style={{
                      textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    {currentSlideData.title[language]}
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-xl text-white/90 leading-relaxed max-w-lg drop-shadow-lg"
                  >
                    {currentSlideData.description[language]}
                  </motion.p>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 pt-4"
                  >
                    <Link
                      to="/marketplace"
                      className={`group bg-gradient-to-r ${currentSlideData.cardGradient} text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                    >
                      <span className="flex items-center justify-center space-x-3">
                        <span>{language === 'ar' ? 'تصفح الآن' : 'Browse Now'}</span>
                        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                    
                    <button className="group bg-white/20 backdrop-blur-md text-white font-semibold px-8 py-4 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all duration-300">
                      <span className="flex items-center justify-center space-x-3">
                        <span>{language === 'ar' ? 'تعرف أكثر' : 'Learn More'}</span>
                        <InformationCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </span>
                    </button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Content - Premium Card */}
            <div className={`${language === 'ar' ? 'lg:order-1' : 'lg:order-2'} flex justify-center`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`card-${currentSlide}`}
                  initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="relative max-w-md w-full"
                >
                  {/* Premium Glass Card */}
                  <div 
                    className={`relative p-8 rounded-3xl bg-gradient-to-br ${currentSlideData.cardGradient} shadow-2xl backdrop-blur-lg`}
                    style={{
                      background: `linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(14, 165, 233, 0.9))`,
                      boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                    }}
                  >
                    {/* Glass Effect Overlay */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    
                    {/* Egyptian Pattern */}
                    <div className="absolute inset-0 rounded-3xl opacity-20" 
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 20.5V18H17.5v2.5H15v2.5h2.5V26h2.5v-3H22.5V20.5H20zm0-8V10H17.5v2.5H15v2.5h2.5V18h2.5v-3H22.5V12.5H20z'/%3E%3C/g%3E%3C/svg%3E")`
                      }} 
                    />

                    <div className="relative z-10 text-white text-center">
                      {/* Premium Icon */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                      >
                        <StarIcon className="w-10 h-10 text-white" />
                      </motion.div>

                      {/* Card Title */}
                      <h3 className="text-2xl font-bold mb-3 drop-shadow-lg">
                        {currentSlideData.title[language]}
                      </h3>
                      
                      <p className="text-lg opacity-90 mb-6 leading-relaxed">
                        {currentSlideData.subtitle[language]}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 py-6 border-t border-white/20">
                        <div className="group cursor-pointer">
                          <motion.div 
                            className="text-2xl font-bold group-hover:scale-110 transition-transform"
                            whileHover={{ scale: 1.1 }}
                          >
                            10K+
                          </motion.div>
                          <div className="text-sm opacity-80">{language === 'ar' ? 'منتج' : 'Products'}</div>
                        </div>
                        <div className="group cursor-pointer">
                          <motion.div 
                            className="text-2xl font-bold group-hover:scale-110 transition-transform"
                            whileHover={{ scale: 1.1 }}
                          >
                            500+
                          </motion.div>
                          <div className="text-sm opacity-80">{language === 'ar' ? 'تاجر' : 'Vendors'}</div>
                        </div>
                        <div className="group cursor-pointer">
                          <motion.div 
                            className="text-2xl font-bold group-hover:scale-110 transition-transform"
                            whileHover={{ scale: 1.1 }}
                          >
                            50K+
                          </motion.div>
                          <div className="text-sm opacity-80">{language === 'ar' ? 'عميل' : 'Customers'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-4 right-4 w-3 h-3 bg-white/30 rounded-full" />
                    <div className="absolute top-8 right-8 w-2 h-2 bg-white/20 rounded-full" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 bg-white/20 rounded-full" />
                  </div>

                  {/* Floating Orbs */}
                  <motion.div
                    animate={{ 
                      y: [-10, 10, -10],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-60 blur-sm"
                  />
                  <motion.div
                    animate={{ 
                      y: [10, -10, 10],
                      opacity: [0.6, 0.9, 0.6]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-50 blur-sm"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
        {/* Slide Indicators */}
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Side Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 z-20 group"
      >
        <ChevronLeftIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 z-20 group"
      >
        <ChevronRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    </section>
  );
};

export default EnhancedHeroSlider;