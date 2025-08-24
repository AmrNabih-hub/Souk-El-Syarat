import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StarIcon, ArrowRightIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import {
  LuxuryCarIcon,
  PremiumEngineIcon,
  LuxuryServiceIcon,
  PremiumShieldIcon,
} from '@/components/ui/ProfessionalIcons';
import { useAppStore } from '@/stores/appStore';
import { EgyptianLoader } from '@/components/ui/LoadingSpinner';

const HomePage: React.FC = () => {
  const { language } = useAppStore();

  const features = {
    ar: [
      {
        icon: LuxuryCarIcon,
        title: 'سيارات فاخرة معتمدة',
        description:
          'مجموعة حصرية من أفخم السيارات المعتمدة من أشهر الماركات العالمية مع ضمان الجودة والأصالة',
      },
      {
        icon: PremiumEngineIcon,
        title: 'قطع غيار أصلية',
        description: 'قطع غيار أصلية من المصنع مباشرة مع شهادات الجودة وضمان الأداء المتميز',
      },
      {
        icon: LuxuryServiceIcon,
        title: 'خدمات احترافية',
        description: 'مراكز خدمة معتمدة بأحدث التقنيات وفنيين متخصصين لضمان أفضل أداء لسيارتك',
      },
      {
        icon: PremiumShieldIcon,
        title: 'ضمان شامل',
        description: 'حماية شاملة لاستثمارك مع ضمانات ممتدة وخدمة ما بعد البيع المتميزة',
      },
    ],
    en: [
      {
        icon: LuxuryCarIcon,
        title: 'Certified Luxury Vehicles',
        description:
          'Exclusive collection of premium certified vehicles from world-renowned brands with guaranteed quality and authenticity',
      },
      {
        icon: PremiumEngineIcon,
        title: 'Genuine OEM Parts',
        description:
          'Factory-direct genuine parts with quality certifications and guaranteed superior performance',
      },
      {
        icon: LuxuryServiceIcon,
        title: 'Professional Services',
        description:
          'Certified service centers with cutting-edge technology and specialized technicians for optimal vehicle performance',
      },
      {
        icon: PremiumShieldIcon,
        title: 'Comprehensive Warranty',
        description:
          'Complete protection for your investment with extended warranties and exceptional after-sales service',
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
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden'>
        {/* Premium Car Background */}
        <div className='absolute inset-0'>
          <div className='absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 z-10'></div>
          <img
            src='https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&crop=center'
            alt='Premium Exotic Car - Souk El-Syarat'
            className='w-full h-full object-cover object-center scale-105'
            style={{ objectPosition: '65% center' }}
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 z-5'></div>
          <div className='absolute inset-0 bg-gradient-to-br from-primary-900/30 to-secondary-900/20 z-8'></div>
        </div>
        {/* Background Pattern */}
        <div className='absolute inset-0 pyramid-pattern opacity-10 z-20'></div>

        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 z-30'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.h1
                className='text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-2xl'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className='bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg'>
                  {language === 'ar' ? 'سوق السيارات' : 'Souk El-Syarat'}
                </span>
                <br />
                <span className='text-white/90 drop-shadow-lg'>
                  {language === 'ar' ? 'الأول في مصر' : "Egypt's #1 Platform"}
                </span>
              </motion.h1>

              <motion.p
                className='text-xl text-white/80 mb-8 leading-relaxed drop-shadow-lg'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {language === 'ar'
                  ? 'اكتشف أفضل السيارات وقطع الغيار والخدمات من تجار موثوقين في جميع أنحاء مصر'
                  : 'Discover the best cars, parts, and services from trusted vendors across Egypt'}
              </motion.p>

              <motion.div
                className='flex flex-col sm:flex-row gap-4'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <Link to='/marketplace' className='btn btn-primary btn-lg group'>
                  {language === 'ar' ? 'تصفح السوق' : 'Browse Marketplace'}
                  <ArrowRightIcon className='w-5 h-5 ml-2 transition-transform group-hover:translate-x-1' />
                </Link>

                <Link to='/vendor/apply' className='btn btn-outline btn-lg'>
                  {language === 'ar' ? 'كن تاجراً' : 'Become a Vendor'}
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              className='relative'
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className='relative'>
                {/* Hero Image Carousel */}
                <div className='w-full h-96 rounded-2xl overflow-hidden relative'>
                  <motion.div
                    className='flex w-full h-full'
                    animate={{ x: [0, -100, -200, -300, 0] }}
                    transition={{ 
                      duration: 15, 
                      repeat: Infinity, 
                      ease: 'easeInOut',
                      times: [0, 0.25, 0.5, 0.75, 1]
                    }}
                  >
                    {/* Car Image 1 */}
                    <div className='min-w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                      <div className='text-center text-white'>
                        <h3 className='text-2xl font-bold mb-2'>Luxury Cars</h3>
                        <p className='text-lg opacity-90'>Premium Selection</p>
                      </div>
                    </div>
                    
                    {/* Car Image 2 */}
                    <div className='min-w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center'>
                      <div className='text-center text-white'>
                        <h3 className='text-2xl font-bold mb-2'>Family Cars</h3>
                        <p className='text-lg opacity-90'>Safe & Reliable</p>
                      </div>
                    </div>
                    
                    {/* Car Image 3 */}
                    <div className='min-w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center'>
                      <div className='text-center text-white'>
                        <h3 className='text-2xl font-bold mb-2'>Sports Cars</h3>
                        <p className='text-lg opacity-90'>High Performance</p>
                      </div>
                    </div>
                    
                    {/* Car Image 4 */}
                    <div className='min-w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center'>
                      <div className='text-center text-white'>
                        <h3 className='text-2xl font-bold mb-2'>Electric Cars</h3>
                        <p className='text-lg opacity-90'>Future Ready</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Carousel Indicators */}
                  <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2'>
                    {[0, 1, 2, 3].map((index) => (
                      <motion.div
                        key={index}
                        className='w-3 h-3 bg-white rounded-full opacity-60'
                        animate={{ 
                          opacity: [0.6, 1, 0.6],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          delay: index * 0.75 
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Floating elements - Simple sliding */}
                <motion.div
                  className='absolute -top-4 -right-4 w-24 h-24 bg-primary-500 rounded-full opacity-20'
                  animate={{ x: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className='absolute -bottom-6 -left-6 w-32 h-32 bg-secondary-500 rounded-full opacity-20'
                  animate={{ x: [5, -5, 5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className='text-center'
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className='text-4xl lg:text-5xl font-bold gradient-text mb-2'
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {stat.number}
                </motion.div>
                <div className='text-neutral-600 font-medium'>{stat.label}</div>
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
              {language === 'ar' ? 'لماذا سوق السيارات؟' : 'Why Souk El-Syarat?'}
            </h2>
            <p className='text-xl text-neutral-600 max-w-3xl mx-auto'>
              {language === 'ar'
                ? 'نقدم لك أفضل تجربة شراء للسيارات في مصر مع ضمان الجودة والثقة'
                : 'We provide the best car buying experience in Egypt with quality and trust guaranteed'}
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features[language].map((feature, index) => (
              <motion.div
                key={feature.title}
                className='card p-6 text-center card-hover'
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className='w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4'
                  whileHover={{ scale: 1.1 }}
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

      {/* Top Vendors Section */}
      <section className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl lg:text-4xl font-bold text-neutral-900 mb-4'>
              {language === 'ar' ? 'أفضل البائعين المعتمدين' : 'Top Trusted Vendors'}
            </h2>
            <p className='text-xl text-neutral-600 max-w-3xl mx-auto'>
              {language === 'ar'
                ? 'تعرف على أفضل البائعين المعتمدين لدينا الذين يقدمون أجود المنتجات والخدمات'
                : 'Meet our top trusted vendors who provide the finest products and services'}
            </p>
          </motion.div>

          <div className='grid md:grid-cols-3 gap-8 mb-12'>
            {/* Vendor 1 */}
            <motion.div
              className='card p-6 text-center card-hover bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className='relative mb-6'>
                <img
                  src='https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=120&fit=crop&crop=center'
                  alt='معرض النخبة للسيارات الفاخرة'
                  className='w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg'
                />
                <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center'>
                  <CheckBadgeIcon className='w-4 h-4 text-white' />
                </div>
              </div>
              <h3 className='text-xl font-bold text-neutral-900 mb-2'>
                {language === 'ar' ? 'معرض النخبة للسيارات' : 'Elite Luxury Cars'}
              </h3>
              <p className='text-neutral-600 mb-4'>
                {language === 'ar'
                  ? 'متخصص في BMW، Mercedes، Audi'
                  : 'Specializing in BMW, Mercedes, Audi'}
              </p>
              <div className='flex items-center justify-center mb-4'>
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className='w-5 h-5 text-yellow-400 fill-current' />
                ))}
                <span className='ml-2 font-semibold text-neutral-700'>4.9</span>
              </div>
              <div className='grid grid-cols-2 gap-4 mb-6 text-sm'>
                <div className='bg-white/50 rounded-lg p-2'>
                  <div className='font-bold text-neutral-900'>45</div>
                  <div className='text-neutral-600'>{language === 'ar' ? 'منتج' : 'Products'}</div>
                </div>
                <div className='bg-white/50 rounded-lg p-2'>
                  <div className='font-bold text-neutral-900'>127</div>
                  <div className='text-neutral-600'>{language === 'ar' ? 'تقييم' : 'Reviews'}</div>
                </div>
              </div>
              <Link to='/vendors' className='btn btn-primary w-full'>
                {language === 'ar' ? 'عرض المنتجات' : 'View Products'}
              </Link>
            </motion.div>

            {/* Vendor 2 */}
            <motion.div
              className='card p-6 text-center card-hover bg-gradient-to-br from-secondary-50 to-accent-50 border border-secondary-200'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className='relative mb-6'>
                <img
                  src='https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=120&h=120&fit=crop&crop=center'
                  alt='تويوتا الشرق الأوسط'
                  className='w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg'
                />
                <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center'>
                  <CheckBadgeIcon className='w-4 h-4 text-white' />
                </div>
              </div>
              <h3 className='text-xl font-bold text-neutral-900 mb-2'>
                {language === 'ar' ? 'تويوتا الشرق الأوسط' : 'Toyota Middle East'}
              </h3>
              <p className='text-neutral-600 mb-4'>
                {language === 'ar' ? 'الوكيل المعتمد لسيارات تويوتا' : 'Official Toyota Dealer'}
              </p>
              <div className='flex items-center justify-center mb-4'>
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-5 h-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-neutral-300'}`}
                  />
                ))}
                <span className='ml-2 font-semibold text-neutral-700'>4.8</span>
              </div>
              <div className='grid grid-cols-2 gap-4 mb-6 text-sm'>
                <div className='bg-white/50 rounded-lg p-2'>
                  <div className='font-bold text-neutral-900'>32</div>
                  <div className='text-neutral-600'>{language === 'ar' ? 'منتج' : 'Products'}</div>
                </div>
                <div className='bg-white/50 rounded-lg p-2'>
                  <div className='font-bold text-neutral-900'>89</div>
                  <div className='text-neutral-600'>{language === 'ar' ? 'تقييم' : 'Reviews'}</div>
                </div>
              </div>
              <Link to='/vendors' className='btn btn-secondary w-full'>
                {language === 'ar' ? 'عرض المنتجات' : 'View Products'}
              </Link>
            </motion.div>

            {/* Vendor 3 */}
            <motion.div
              className='card p-6 text-center card-hover bg-gradient-to-br from-accent-50 to-primary-50 border border-accent-200'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className='relative mb-6'>
                <img
                  src='https://images.unsplash.com/photo-1617040619263-41c5a9ca7521?w=120&h=120&fit=crop&crop=center'
                  alt='مركز الصفوة VIP'
                  className='w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg'
                />
                <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center'>
                  <CheckBadgeIcon className='w-4 h-4 text-white' />
                </div>
              </div>
              <h3 className='text-xl font-bold text-neutral-900 mb-2'>
                {language === 'ar' ? 'مركز الصفوة VIP' : 'Alsafwa VIP Center'}
              </h3>
              <p className='text-neutral-600 mb-4'>
                {language === 'ar' ? 'خدمات VIP للسيارات الفاخرة' : 'VIP Services for Luxury Cars'}
              </p>
              <div className='flex items-center justify-center mb-4'>
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className='w-5 h-5 text-yellow-400 fill-current' />
                ))}
                <span className='ml-2 font-semibold text-neutral-700'>4.9</span>
              </div>
              <div className='grid grid-cols-2 gap-4 mb-6 text-sm'>
                <div className='bg-white/50 rounded-lg p-2'>
                  <div className='font-bold text-neutral-900'>23</div>
                  <div className='text-neutral-600'>{language === 'ar' ? 'خدمة' : 'Services'}</div>
                </div>
                <div className='bg-white/50 rounded-lg p-2'>
                  <div className='font-bold text-neutral-900'>78</div>
                  <div className='text-neutral-600'>{language === 'ar' ? 'تقييم' : 'Reviews'}</div>
                </div>
              </div>
              <Link to='/vendors' className='btn btn-accent w-full'>
                {language === 'ar' ? 'عرض الخدمات' : 'View Services'}
              </Link>
            </motion.div>
          </div>

          <motion.div
            className='text-center'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link to='/vendors' className='btn btn-outline btn-lg'>
              {language === 'ar' ? 'عرض جميع البائعين' : 'View All Vendors'}
              <ArrowRightIcon className='w-5 h-5 ml-2' />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-gradient-to-br from-primary-500 to-secondary-500'>
        <div className='max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl lg:text-4xl font-bold text-white mb-6'>
              {language === 'ar'
                ? 'ابدأ رحلتك في عالم السيارات اليوم'
                : 'Start Your Car Journey Today'}
            </h2>
            <p className='text-xl text-white/90 mb-8 leading-relaxed'>
              {language === 'ar'
                ? 'انضم إلى آلاف العملاء الذين وجدوا سياراتهم المثالية معنا'
                : 'Join thousands of customers who found their perfect cars with us'}
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to='/register'
                  className='btn bg-white text-primary-600 hover:bg-neutral-50 btn-lg font-semibold'
                >
                  {language === 'ar' ? 'سجل الآن' : 'Sign Up Now'}
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to='/marketplace'
                  className='btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg font-semibold'
                >
                  {language === 'ar' ? 'تصفح السيارات' : 'Browse Cars'}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center mb-12'
            data-testid='featured-products'
          >
            <h2 className='text-4xl font-bold text-neutral-800 mb-4'>
              {language === 'ar' ? 'مجموعة مختارة من أفخم السيارات' : 'Curated Luxury Collection'}
            </h2>
            <p className='text-xl text-neutral-600 max-w-3xl mx-auto'>
              {language === 'ar'
                ? 'اكتشف مجموعتنا الحصرية من أرقى السيارات والقطع والخدمات المتميزة'
                : 'Discover our exclusive selection of premium vehicles, parts, and professional services'}
            </p>
          </motion.div>

          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'
            data-testid='features-grid'
          >
            {/* Premium Porsche Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className='bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100 hover:shadow-2xl transition-all duration-300'
            >
              <div className='relative h-64 overflow-hidden'>
                <img
                  src='https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop&crop=center'
                  alt='Porsche 911 Turbo S'
                  className='w-full h-full object-cover transition-transform duration-300 hover:scale-110'
                />
                <div className='absolute top-4 left-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold'>
                  {language === 'ar' ? 'جديد' : 'NEW'}
                </div>
                <div className='absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold'>
                  {language === 'ar' ? '٦% خصم' : '6% OFF'}
                </div>
              </div>
              <div className='p-6'>
                <h3 className='font-bold text-xl mb-2 text-neutral-800'>
                  {language === 'ar' ? 'بورش ٩١١ تيربو إس ٢٠٢٤' : 'Porsche 911 Turbo S 2024'}
                </h3>
                <p className='text-neutral-600 mb-4 text-sm'>
                  {language === 'ar'
                    ? 'محرك تيربو مسطح ٦ أسطوانات بقوة ٦٤٠ حصان'
                    : '640 HP Twin-Turbo Flat-6 Engine'}
                </p>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-2xl font-bold text-primary-600'>
                      {language === 'ar' ? '٤,٥٠٠,٠٠٠ جنيه' : 'EGP 4,500,000'}
                    </span>
                    <span className='text-sm text-neutral-500 line-through ml-2'>
                      {language === 'ar' ? '٤,٨٠٠,٠٠٠' : '4,800,000'}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors'
                  >
                    {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Premium Brembo Parts Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className='bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100 hover:shadow-2xl transition-all duration-300'
            >
              <div className='relative h-64 overflow-hidden'>
                <img
                  src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&crop=center'
                  alt='Brembo Brake Kit'
                  className='w-full h-full object-cover transition-transform duration-300 hover:scale-110'
                />
                <div className='absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold'>
                  {language === 'ar' ? 'متوفر' : 'IN STOCK'}
                </div>
              </div>
              <div className='p-6'>
                <h3 className='font-bold text-xl mb-2 text-neutral-800'>
                  {language === 'ar' ? 'طقم فرامل بريمبو GT' : 'Brembo GT Brake Kit'}
                </h3>
                <p className='text-neutral-600 mb-4 text-sm'>
                  {language === 'ar'
                    ? 'طقم فرامل احترافي ٦ مكابس لسيارات BMW M'
                    : 'Professional 6-Piston Kit for BMW M Series'}
                </p>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-2xl font-bold text-primary-600'>
                      {language === 'ar' ? '٤٥,٠٠٠ جنيه' : 'EGP 45,000'}
                    </span>
                    <span className='text-sm text-neutral-500 line-through ml-2'>
                      {language === 'ar' ? '٥٢,٠٠٠' : '52,000'}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors'
                  >
                    {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Professional Service Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className='bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100 hover:shadow-2xl transition-all duration-300'
            >
              <div className='relative h-64 overflow-hidden'>
                <img
                  src='https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&h=400&fit=crop&crop=center'
                  alt='Ceramic Coating Service'
                  className='w-full h-full object-cover transition-transform duration-300 hover:scale-110'
                />
                <div className='absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold'>
                  {language === 'ar' ? 'خدمة' : 'SERVICE'}
                </div>
              </div>
              <div className='p-6'>
                <h3 className='font-bold text-xl mb-2 text-neutral-800'>
                  {language === 'ar' ? 'طلاء سيراميك احترافي' : 'Ceramic Coating Service'}
                </h3>
                <p className='text-neutral-600 mb-4 text-sm'>
                  {language === 'ar'
                    ? 'حماية متقدمة للطلاء لمدة ٥ سنوات'
                    : '5-Year Advanced Paint Protection'}
                </p>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-2xl font-bold text-primary-600'>
                      {language === 'ar' ? '١٥,٠٠٠ جنيه' : 'EGP 15,000'}
                    </span>
                    <span className='text-sm text-neutral-500 line-through ml-2'>
                      {language === 'ar' ? '١٨,٠٠٠' : '18,000'}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors'
                  >
                    {language === 'ar' ? 'احجز الآن' : 'Book Now'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* View All Products CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='text-center'
          >
            <Link
              to='/marketplace'
              className='inline-flex items-center bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl'
            >
              {language === 'ar' ? 'تصفح جميع المنتجات' : 'Explore All Products'}
              <ArrowRightIcon className='w-5 h-5 ml-2' />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
