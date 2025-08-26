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
import ServicesSection from '@/components/services/ServicesSection';

const HomePage: React.FC = () => {
  const features = {
    ar: [
      {
        icon: SparklesIcon,
        title: 'سيارات فاخرة معتمدة',
        description:
          'تشكيلة واسعة من السيارات الفاخرة المعتمدة من أفضل الوكلاء في مصر',
      },
      {
        icon: CogIcon,
        title: 'صيانة احترافية',
        description:
          'خدمات صيانة وإصلاح متخصصة من فنيين خبراء ومعتمدين',
      },
      {
        icon: ShieldCheckIcon,
        title: 'ضمان شامل',
        description: 'ضمان شامل على جميع السيارات والخدمات لراحة بالك',
      },
      {
        icon: TruckIcon,
        title: 'توصيل سريع',
        description: 'خدمة توصيل سريعة وآمنة لجميع أنحاء الجمهورية',
      },
    ],
  };

  return (
    <div className='relative overflow-hidden'>
      {/* Hero Section with Enhanced Slider */}
      <section className='relative min-h-screen flex items-center justify-center bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-900 overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] bg-repeat'></div>
        </div>

        {/* Hero Carousel */}
        <div className='relative w-full h-screen'>
          <motion.div
            className='flex w-[400%] h-full'
            animate={{
              x: [0, -25, -50, -75, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Slide 1: Car Sales */}
            <div className='min-w-full h-full relative overflow-hidden'>
              <div className='absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10'></div>
              <img
                src='https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop'
                alt='سيارات مستعملة للبيع في مصر'
                className='w-full h-full object-cover'
                loading='lazy'
              />
              <div className='absolute inset-0 flex items-center justify-center z-20'>
                <div className='text-center text-white p-6'>
                  <h3 className='text-3xl font-bold mb-3 drop-shadow-lg'>بيع وشراء السيارات</h3>
                  <p className='text-lg opacity-90 mb-4 drop-shadow-md'>أفضل الأسعار في السوق المصري</p>
                  <div className='flex items-center justify-center gap-2 text-sm'>
                    <span className='bg-green-500 px-3 py-1 rounded-full'>✓ ضمان</span>
                    <span className='bg-blue-500 px-3 py-1 rounded-full'>✓ معتمد</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2: Auto Parts */}
            <div className='min-w-full h-full relative overflow-hidden'>
              <div className='absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10'></div>
              <img
                src='https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop'
                alt='قطع غيار السيارات الأصلية'
                className='w-full h-full object-cover'
                loading='lazy'
              />
              <div className='absolute inset-0 flex items-center justify-center z-20'>
                <div className='text-center text-white p-6'>
                  <h3 className='text-3xl font-bold mb-3 drop-shadow-lg'>قطع الغيار الأصلية</h3>
                  <p className='text-lg opacity-90 mb-4 drop-shadow-md'>من المصنع مباشرة لسيارتك</p>
                  <div className='flex items-center justify-center gap-2 text-sm'>
                    <span className='bg-yellow-500 px-3 py-1 rounded-full'>⭐ جودة عالية</span>
                    <span className='bg-purple-500 px-3 py-1 rounded-full'>🔧 متوافقة</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 3: Auto Services */}
            <div className='min-w-full h-full relative overflow-hidden'>
              <div className='absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10'></div>
              <img
                src='https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop'
                alt='مراكز خدمة السيارات في مصر'
                className='w-full h-full object-cover'
                loading='lazy'
              />
              <div className='absolute inset-0 flex items-center justify-center z-20'>
                <div className='text-center text-white p-6'>
                  <h3 className='text-3xl font-bold mb-3 drop-shadow-lg'>خدمات السيارات</h3>
                  <p className='text-lg opacity-90 mb-4 drop-shadow-md'>صيانة احترافية وخدمة متميزة</p>
                  <div className='flex items-center justify-center gap-2 text-sm'>
                    <span className='bg-red-500 px-3 py-1 rounded-full'>🔧 صيانة</span>
                    <span className='bg-indigo-500 px-3 py-1 rounded-full'>🏆 احترافية</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 4: Trusted Vendors */}
            <div className='min-w-full h-full relative overflow-hidden'>
              <div className='absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10'></div>
              <img
                src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
                alt='تجار السيارات الموثوقين في مصر'
                className='w-full h-full object-cover'
                loading='lazy'
              />
              <div className='absolute inset-0 flex items-center justify-center z-20'>
                <div className='text-center text-white p-6'>
                  <h3 className='text-3xl font-bold mb-3 drop-shadow-lg'>تجار موثوقون</h3>
                  <p className='text-lg opacity-90 mb-4 drop-shadow-md'>شبكة من أفضل التجار في مصر</p>
                  <div className='flex items-center justify-center gap-2 text-sm'>
                    <span className='bg-green-500 px-3 py-1 rounded-full'>✅ موثق</span>
                    <span className='bg-orange-500 px-3 py-1 rounded-full'>🤝 شراكة</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Carousel Indicators */}
          <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2'>
            {[0, 1, 2, 3].map(index => (
              <motion.div
                key={index}
                className='w-3 h-3 bg-white/50 rounded-full'
                animate={{
                  backgroundColor: ['rgba(255,255,255,0.5)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.5)'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: index * 1.25,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hero Content Overlay */}
        <div className='absolute inset-0 flex items-center justify-center z-30'>
          <div className='text-center text-white max-w-4xl mx-auto px-6'>
            <motion.h1
              className='text-5xl md:text-7xl font-bold mb-6 leading-tight'
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              سوق السيارات
            </motion.h1>
            <motion.p
              className='text-xl md:text-2xl mb-8 opacity-90 leading-relaxed'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              أكبر منصة تجارة إلكترونية للسيارات وقطع الغيار والخدمات في مصر
            </motion.p>
            <motion.div
              className='flex flex-col sm:flex-row gap-4 justify-center'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link
                to='/marketplace'
                className='bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl'
              >
                تصفح السيارات
              </Link>
              <Link
                to='/vendor/apply'
                className='border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary-600 transition-all duration-300'
              >
                انضم كتاجر
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <ServicesSection />

      {/* Features Section */}
      <section className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-4xl font-bold text-gray-900 mb-4'>لماذا تختار سوق السيارات؟</h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              نحن نقدم أفضل تجربة تسوق للسيارات في مصر مع ضمان الجودة والمصداقية
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.ar.map((feature, index) => (
              <motion.div
                key={index}
                className='text-center group'
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className='relative mx-auto w-20 h-20 mb-6'>
                  <div className='absolute inset-0 bg-primary-100 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-300'></div>
                  <div className='relative bg-primary-500 rounded-2xl w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <feature.icon className='w-8 h-8 text-white' />
                  </div>
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>{feature.title}</h3>
                <p className='text-gray-600 leading-relaxed'>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-20 bg-gradient-to-r from-primary-500 to-secondary-500 text-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='grid grid-cols-2 lg:grid-cols-4 gap-8 text-center'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <motion.div
                className='text-4xl lg:text-5xl font-bold mb-2'
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                +10k
              </motion.div>
              <div className='text-primary-100'>سيارة متاحة</div>
            </div>
            <div>
              <motion.div
                className='text-4xl lg:text-5xl font-bold mb-2'
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                +500
              </motion.div>
              <div className='text-primary-100'>تاجر معتمد</div>
            </div>
            <div>
              <motion.div
                className='text-4xl lg:text-5xl font-bold mb-2'
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                +25k
              </motion.div>
              <div className='text-primary-100'>عميل راضي</div>
            </div>
            <div>
              <motion.div
                className='text-4xl lg:text-5xl font-bold mb-2'
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                27
              </motion.div>
              <div className='text-primary-100'>محافظة مصرية</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className='py-20 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-4xl font-bold text-gray-900 mb-4'>السيارات المميزة</h2>
            <p className='text-xl text-gray-600'>تشكيلة من أفضل السيارات المتاحة حالياً</p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
            {[
              {
                id: 1,
                title: 'تويوتا كامري 2021',
                price: '285,000',
                originalPrice: '320,000',
                location: 'الجيزة',
                image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
                rating: 4.8,
                reviews: 156,
                verified: true,
              },
              {
                id: 2,
                title: 'مرسيدس E200 2020',
                price: '450,000',
                originalPrice: '520,000',
                location: 'القاهرة الجديدة',
                image: 'https://images.unsplash.com/photo-1606016937473-509d8ff3b4a9?w=400&h=300&fit=crop',
                rating: 4.9,
                reviews: 89,
                verified: true,
              },
              {
                id: 3,
                title: 'BMW X3 2022',
                price: '680,000',
                location: 'الشيخ زايد',
                image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop',
                rating: 5.0,
                reviews: 45,
                verified: true,
              },
            ].map((car, index) => (
              <motion.div
                key={car.id}
                className='bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300'
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className='relative'>
                  <img
                    src={car.image}
                    alt={car.title}
                    className='w-full h-48 object-cover'
                  />
                  {car.verified && (
                    <div className='absolute top-4 right-4'>
                      <span className='bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1'>
                        <CheckBadgeIcon className='w-3 h-3' />
                        موثق
                      </span>
                    </div>
                  )}
                  {car.originalPrice && (
                    <div className='absolute top-4 left-4'>
                      <span className='bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold'>
                        خصم {Math.round((1 - parseInt(car.price.replace(',', '')) / parseInt(car.originalPrice.replace(',', ''))) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className='p-6'>
                  <h3 className='text-xl font-bold text-gray-900 mb-2'>{car.title}</h3>
                  <p className='text-gray-600 mb-4'>{car.location}</p>
                  <div className='flex items-center mb-4'>
                    <div className='flex items-center'>
                      <StarIcon className='w-4 h-4 text-yellow-400 fill-current' />
                      <span className='text-sm font-medium ml-1'>{car.rating}</span>
                    </div>
                    <span className='text-gray-500 text-sm ml-2'>({car.reviews} تقييم)</span>
                  </div>
                  <div className='flex items-baseline justify-between'>
                    <div>
                      <span className='text-2xl font-bold text-primary-600'>{car.price} جنيه</span>
                      {car.originalPrice && (
                        <span className='text-sm text-gray-500 line-through mr-2'>{car.originalPrice}</span>
                      )}
                    </div>
                    <Link
                      to={`/product/${car.id}`}
                      className='bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors'
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
              تصفح جميع المنتجات
              <ArrowRightIcon className='w-5 h-5 ml-2' />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;