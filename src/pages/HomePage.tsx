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
import EnhancedHeroSlider from '@/components/ui/EnhancedHeroSlider';

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
        description: 'Certified service centers with latest technology and expert technicians for optimal vehicle performance',
      },
      {
        icon: ShieldCheckIcon,
        title: 'Comprehensive Warranty',
        description: 'Complete protection for your investment with extended warranties and exceptional after-sales service',
      },
    ],
  };

  const stats = [
    { 
      number: '10,000+', 
      label: 'سيارة متوفرة',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      glowColor: 'shadow-emerald-200 dark:shadow-emerald-800'
    },
    { 
      number: '50,000+', 
      label: 'قطعة غيار',
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      glowColor: 'shadow-blue-200 dark:shadow-blue-800'
    },
    { 
      number: '5,000+', 
      label: 'عميل راضي',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      glowColor: 'shadow-amber-200 dark:shadow-amber-800'
    },
    { 
      number: '100+', 
      label: 'مركز خدمة',
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      glowColor: 'shadow-purple-200 dark:shadow-purple-800'
    },
  ];

  return (
    <div className='min-h-screen fade-in-view'>
      {/* Enhanced Hero Slider */}
      <EnhancedHeroSlider />

      {/* Stats Section */}
      <section className='py-16 bg-white dark:bg-neutral-900'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className={`
                  text-center p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50
                  ${stat.bgColor} backdrop-blur-sm transition-all duration-300
                  hover:shadow-xl hover:${stat.glowColor}/20 dark:hover:${stat.glowColor}/30
                  hover:-translate-y-2 hover:scale-105
                  transform-gpu relative overflow-hidden
                `}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -8 }}
              >
                {/* Premium background shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-out" />
                
                {/* Premium gradient number */}
                <motion.div
                  className={`
                    text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r ${stat.color} 
                    bg-clip-text text-transparent drop-shadow-lg
                    relative z-10
                  `}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.6, type: 'spring', stiffness: 200 }}
                  viewport={{ once: true }}
                >
                  {stat.number}
                </motion.div>
                
                {/* Enhanced label */}
                <div className={`
                  font-semibold text-sm lg:text-base ${stat.iconColor} 
                  tracking-wide relative z-10
                `}>
                  {stat.label}
                </div>

                {/* Enhanced accent line with gradient */}
                <motion.div
                  className={`mt-3 h-1 w-12 mx-auto rounded-full bg-gradient-to-r ${stat.color} opacity-80 shadow-lg`}
                  initial={{ width: 0 }}
                  whileInView={{ width: 48 }}
                  transition={{ delay: index * 0.1 + 0.4, duration: 0.4 }}
                  viewport={{ once: true }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 bg-neutral-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl lg:text-4xl font-bold text-neutral-900 mb-4'>
              لماذا سوق السيارات؟
            </h2>
            <p className='text-xl text-neutral-600 max-w-3xl mx-auto'>
              نقدم لك أفضل تجربة شراء للسيارات في مصر مع ضمان الجودة والثقة
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.ar.map((feature, index) => (
              <motion.div
                key={feature.title}
                className='card p-6 text-center card-modern-hover glass-effect backdrop-blur-md'
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <motion.div
                  className='w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <feature.icon className='w-8 h-8 text-white' />
                </motion.div>
                <h3 className='text-xl font-semibold text-neutral-900 mb-3'>{feature.title}</h3>
                <p className='text-neutral-600 leading-relaxed'>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className='py-20 bg-gradient-to-br from-primary-500 to-secondary-500'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl lg:text-4xl font-bold text-white mb-6'>
              ابدأ رحلتك في عالم السيارات اليوم
            </h2>
            <p className='text-xl text-white/90 mb-8 max-w-3xl mx-auto'>
              انضم إلى آلاف العملاء الراضين واكتشف أفضل عروض السيارات وقطع الغيار في مصر
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to='/marketplace'
                  className='btn btn-lg bg-white text-primary-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-xl shadow-lg'
                >
                  تصفح السوق الآن
                  <ArrowRightIcon className='w-6 h-6 mr-3' />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to='/vendor/apply'
                  className='btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold px-8 py-4 rounded-xl'
                >
                  انضم كتاجر
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