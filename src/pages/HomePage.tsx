import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  StarIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  SparklesIcon,
  CogIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

// Import new components
import HeroSlider from '@/components/home/HeroSlider';
import VIPServices from '@/components/home/VIPServices';
import PremiumProducts from '@/components/home/PremiumProducts';
import MarketplaceCategories from '@/components/marketplace/MarketplaceCategories';

const HomePage: React.FC = () => {
  const features = {
    ar: [
      {
        icon: SparklesIcon,
        title: 'سيارات فاخرة معتمدة',
        description:
          'مجموعة حصرية من أفخم السيارات المعتمدة من أشهر الماركات العالمية مع ضمان الجودة والأصالة',
      },
      {
        icon: CogIcon,
        title: 'قطع غيار أصلية',
        description: 'قطع غيار أصلية من المصنع مباشرة مع شهادات الجودة وضمان الأداء المتميز',
      },
      {
        icon: TruckIcon,
        title: 'خدمات احترافية',
        description: 'مراكز خدمة معتمدة بأحدث التقنيات وفنيين متخصصين لضمان أفضل أداء لسيارتك',
      },
      {
        icon: ShieldCheckIcon,
        title: 'ضمان شامل',
        description: 'حماية شاملة لاستثمارك مع ضمانات ممتدة وخدمة ما بعد البيع المتميزة',
      },
    ],
    en: [
      {
        icon: SparklesIcon,
        title: 'Certified Luxury Vehicles',
        description:
          'Exclusive collection of premium certified vehicles from world-renowned brands with guaranteed quality and authenticity',
      },
      {
        icon: CogIcon,
        title: 'Genuine OEM Parts',
        description:
          'Factory-direct genuine parts with quality certifications and guaranteed superior performance',
      },
      {
        icon: TruckIcon,
        title: 'Professional Services',
        description:
          'Certified service centers with cutting-edge technology and specialized technicians for optimal vehicle performance',
      },
      {
        icon: ShieldCheckIcon,
        title: 'Comprehensive Warranty',
        description:
          'Complete protection for your investment with extended warranties and exceptional after-sales service',
      },
    ],
  };

  const stats = [
    { number: '10,000+', label: { ar: 'سيارة متاحة', en: 'Cars Available' } },
    { number: '500+', label: { ar: 'تاجر موثوق', en: 'Trusted Dealers' } },
    { number: '50,000+', label: { ar: 'عميل راضي', en: 'Happy Customers' } },
    { number: '27', label: { ar: 'محافظة', en: 'Governorates' } },
  ];

  return (
    <div className='min-h-screen fade-in-view'>
      {/* Hero Slider - NEW */}
      <HeroSlider />

      {/* Stats Section */}
      <section className='py-12 bg-gradient-to-b from-gray-900 to-gray-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='text-center'
              >
                <div className='text-3xl md:text-4xl font-bold text-primary-400 mb-2'>
                  {stat.number}
                </div>
                <div className='text-sm md:text-base text-gray-300'>
                  {stat.label.ar}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Services - NEW */}
      <VIPServices />

      {/* Marketplace Categories - NEW */}
      <MarketplaceCategories />

      {/* Premium Products - NEW */}
      <PremiumProducts />

      {/* Features Section */}
      <section className='py-20 bg-gradient-to-b from-white to-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              لماذا سوق السيارات؟
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              نوفر لك تجربة شراء متكاملة مع ضمانات حصرية وخدمات متميزة
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.ar.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300'
              >
                <div className='w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6'>
                  <feature.icon className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>{feature.title}</h3>
                <p className='text-gray-600 leading-relaxed'>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-wrap items-center justify-center gap-8 md:gap-16'>
            {[
              { name: 'Mercedes-Benz', logo: '🔷' },
              { name: 'BMW', logo: '🔵' },
              { name: 'Audi', logo: '⭕' },
              { name: 'Toyota', logo: '🟥' },
              { name: 'Nissan', logo: '🔴' },
              { name: 'Hyundai', logo: '🔶' },
            ].map((brand, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className='text-center'
              >
                <div className='text-4xl mb-2'>{brand.logo}</div>
                <p className='text-gray-600 font-semibold'>{brand.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-gradient-to-r from-primary-600 to-primary-700'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
              ابدأ رحلتك معنا اليوم
            </h2>
            <p className='text-xl text-white/90 mb-8'>
              انضم لآلاف العملاء السعداء واحصل على سيارة أحلامك
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                to='/marketplace'
                className='inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-bold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105'
              >
                تصفح السيارات
                <ArrowRightIcon className='w-5 h-5 mr-2 rotate-180' />
              </Link>
              <Link
                to='/services/vip'
                className='inline-flex items-center justify-center px-8 py-4 bg-primary-800 text-white font-bold rounded-lg hover:bg-primary-900 transition-all transform hover:scale-105'
              >
                خدمات VIP
                <StarIcon className='w-5 h-5 mr-2' />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className='py-16 bg-gray-50'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='bg-white rounded-2xl shadow-xl p-8 md:p-12'
          >
            <div className='text-center mb-8'>
              <h3 className='text-2xl md:text-3xl font-bold text-gray-900 mb-3'>
                احصل على أفضل العروض
              </h3>
              <p className='text-gray-600'>
                اشترك في نشرتنا البريدية واحصل على عروض حصرية
              </p>
            </div>
            <form className='flex flex-col sm:flex-row gap-4'>
              <input
                type='email'
                placeholder='البريد الإلكتروني'
                className='flex-1 px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                dir='ltr'
              />
              <button
                type='submit'
                className='px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-lg hover:shadow-lg transition-all'
              >
                اشترك الآن
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;