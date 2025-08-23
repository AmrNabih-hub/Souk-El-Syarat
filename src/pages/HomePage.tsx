import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  TruckIcon,
  ShieldCheckIcon,
  StarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { EgyptianLoader } from '@/components/ui/LoadingSpinner';

const HomePage: React.FC = () => {
  const { language } = useAppStore();

  const features = {
    ar: [
      {
        icon: MagnifyingGlassIcon,
        title: 'بحث متقدم',
        description: 'ابحث عن السيارة المثالية من بين آلاف الخيارات المتاحة',
      },
      {
        icon: ShieldCheckIcon,
        title: 'تجار موثوقين',
        description: 'جميع تجارنا معتمدين ومراجعين لضمان الجودة والثقة',
      },
      {
        icon: TruckIcon,
        title: 'توصيل آمن',
        description: 'خدمة توصيل آمنة وسريعة لجميع أنحاء مصر',
      },
      {
        icon: StarIcon,
        title: 'تقييمات حقيقية',
        description: 'تقييمات من عملاء حقيقيين لمساعدتك في اتخاذ القرار الصحيح',
      },
    ],
    en: [
      {
        icon: MagnifyingGlassIcon,
        title: 'Advanced Search',
        description: 'Find your perfect car from thousands of available options',
      },
      {
        icon: ShieldCheckIcon,
        title: 'Trusted Vendors',
        description: 'All our vendors are certified and reviewed for quality and trust',
      },
      {
        icon: TruckIcon,
        title: 'Safe Delivery',
        description: 'Safe and fast delivery service throughout Egypt',
      },
      {
        icon: StarIcon,
        title: 'Real Reviews',
        description: 'Reviews from real customers to help you make the right decision',
      },
    ],
  };

  const stats = [
    { number: '10,000+', label: language === 'ar' ? 'سيارة متاحة' : 'Available Cars' },
    { number: '500+', label: language === 'ar' ? 'تاجر موثوق' : 'Trusted Vendors' },
    { number: '50,000+', label: language === 'ar' ? 'عميل راضي' : 'Happy Customers' },
    { number: '27', label: language === 'ar' ? 'محافظة' : 'Governorates' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pyramid-pattern opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.h1 
                className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="gradient-text">
                  {language === 'ar' ? 'سوق السيارات' : 'Souk El-Syarat'}
                </span>
                <br />
                <span className="text-neutral-700">
                  {language === 'ar' ? 'الأول في مصر' : 'Egypt\'s #1 Platform'}
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-neutral-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {language === 'ar' 
                  ? 'اكتشف أفضل السيارات وقطع الغيار والخدمات من تجار موثوقين في جميع أنحاء مصر'
                  : 'Discover the best cars, parts, and services from trusted vendors across Egypt'
                }
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <Link
                  to="/marketplace"
                  className="btn btn-primary btn-lg group"
                >
                  {language === 'ar' ? 'تصفح السوق' : 'Browse Marketplace'}
                  <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <Link
                  to="/vendor/apply"
                  className="btn btn-outline btn-lg"
                >
                  {language === 'ar' ? 'كن تاجراً' : 'Become a Vendor'}
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Hero Visual */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="relative">
                {/* Placeholder for hero image */}
                <div className="w-full h-96 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-2xl flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    <EgyptianLoader size="xl" text="" />
                  </motion.div>
                </div>
                
                {/* Floating elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500 rounded-full opacity-20"
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary-500 rounded-full opacity-20"
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="text-4xl lg:text-5xl font-bold gradient-text mb-2"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-neutral-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              {language === 'ar' ? 'لماذا سوق السيارات؟' : 'Why Souk El-Syarat?'}
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'نقدم لك أفضل تجربة شراء للسيارات في مصر مع ضمان الجودة والثقة'
                : 'We provide the best car buying experience in Egypt with quality and trust guaranteed'
              }
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features[language].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card p-6 text-center card-hover"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {language === 'ar' 
                ? 'ابدأ رحلتك في عالم السيارات اليوم'
                : 'Start Your Car Journey Today'
              }
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              {language === 'ar'
                ? 'انضم إلى آلاف العملاء الذين وجدوا سياراتهم المثالية معنا'
                : 'Join thousands of customers who found their perfect cars with us'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="btn bg-white text-primary-600 hover:bg-neutral-50 btn-lg font-semibold"
                >
                  {language === 'ar' ? 'سجل الآن' : 'Sign Up Now'}
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/marketplace"
                  className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg font-semibold"
                >
                  {language === 'ar' ? 'تصفح السيارات' : 'Browse Cars'}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;