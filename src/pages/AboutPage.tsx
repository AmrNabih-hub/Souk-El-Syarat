import React from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon,
  ShieldCheckIcon,
  UsersIcon,
  TruckIcon,
  CheckBadgeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

const AboutPage: React.FC = () => {
  const { language } = useAppStore();

  const aboutContent = {
    ar: {
      title: 'عن سوق السيارات',
      subtitle: 'منصة التجارة الإلكترونية الرائدة للسيارات في مصر',
      description: 'نحن نسعى لتوفير أفضل تجربة شراء للسيارات وقطع الغيار في مصر من خلال منصة آمنة وموثوقة تجمع بين أفضل التجار والعملاء.',
      mission: 'مهمتنا',
      missionText: 'تسهيل عملية بيع وشراء السيارات وقطع الغيار في مصر من خلال توفير منصة آمنة وشفافة تضمن حقوق جميع الأطراف.',
      vision: 'رؤيتنا',
      visionText: 'أن نصبح المنصة الأولى والأكثر ثقة لتجارة السيارات في الشرق الأوسط وشمال أفريقيا.',
      values: 'قيمنا',
      stats: [
        { number: '10,000+', label: 'سيارة متوفرة' },
        { number: '500+', label: 'تاجر موثوق' },
        { number: '50,000+', label: 'عميل راضي' },
        { number: '27', label: 'محافظة مصرية' }
      ]
    },
    en: {
      title: 'About Souk El-Syarat',
      subtitle: 'Egypt\'s Leading Automotive E-commerce Platform',
      description: 'We strive to provide the best car and auto parts shopping experience in Egypt through a secure and reliable platform that connects the best vendors with customers.',
      mission: 'Our Mission',
      missionText: 'To facilitate the buying and selling of cars and auto parts in Egypt by providing a secure and transparent platform that protects the rights of all parties.',
      vision: 'Our Vision',
      visionText: 'To become the leading and most trusted automotive trading platform in the Middle East and North Africa.',
      values: 'Our Values',
      stats: [
        { number: '10,000+', label: 'Cars Available' },
        { number: '500+', label: 'Trusted Vendors' },
        { number: '50,000+', label: 'Happy Customers' },
        { number: '27', label: 'Egyptian Governorates' }
      ]
    }
  };

  const values = [
    {
      icon: ShieldCheckIcon,
      title: { ar: 'الثقة والأمان', en: 'Trust & Security' },
      description: { ar: 'نضمن بيئة آمنة وموثوقة لجميع المعاملات', en: 'We ensure a safe and trusted environment for all transactions' }
    },
    {
      icon: SparklesIcon,
      title: { ar: 'الجودة العالية', en: 'High Quality' },
      description: { ar: 'نلتزم بأعلى معايير الجودة في جميع خدماتنا', en: 'We maintain the highest quality standards in all our services' }
    },
    {
      icon: UsersIcon,
      title: { ar: 'خدمة العملاء', en: 'Customer Service' },
      description: { ar: 'دعم متواصل وخدمة عملاء متميزة', en: 'Continuous support and excellent customer service' }
    },
    {
      icon: TruckIcon,
      title: { ar: 'التسليم السريع', en: 'Fast Delivery' },
      description: { ar: 'شبكة توصيل سريعة وموثوقة في جميع أنحاء مصر', en: 'Fast and reliable delivery network across Egypt' }
    }
  ];

  const team = [
    {
      name: 'أحمد محمد',
      role: { ar: 'المؤسس والرئيس التنفيذي', en: 'Founder & CEO' },
      image: '/api/placeholder/150/150'
    },
    {
      name: 'فاطمة أحمد',
      role: { ar: 'مديرة التكنولوجيا', en: 'CTO' },
      image: '/api/placeholder/150/150'
    },
    {
      name: 'محمد علي',
      role: { ar: 'مدير المبيعات', en: 'Sales Director' },
      image: '/api/placeholder/150/150'
    },
    {
      name: 'سارة حسن',
      role: { ar: 'مديرة التسويق', en: 'Marketing Director' },
      image: '/api/placeholder/150/150'
    }
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50'>
      {/* Hero Section */}
      <div className='relative py-20 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-90'></div>
        <div className='absolute inset-0 bg-black opacity-30'></div>
        
        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className='text-4xl lg:text-6xl font-bold mb-6'>
              {aboutContent[language].title}
            </h1>
            <p className='text-xl lg:text-2xl mb-8 opacity-90'>
              {aboutContent[language].subtitle}
            </p>
            <p className='text-lg max-w-4xl mx-auto opacity-80'>
              {aboutContent[language].description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
            {aboutContent[language].stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className='text-center'
              >
                <div className='text-4xl lg:text-5xl font-bold text-primary-500 mb-2'>
                  {stat.number}
                </div>
                <div className='text-neutral-600 font-medium'>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className='py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='bg-white rounded-xl p-8 shadow-sm border border-neutral-200'
            >
              <div className='flex items-center mb-6'>
                <CheckBadgeIcon className='w-8 h-8 text-primary-500 mr-4' />
                <h2 className='text-2xl font-bold text-neutral-900'>
                  {aboutContent[language].mission}
                </h2>
              </div>
              <p className='text-neutral-600 leading-relaxed'>
                {aboutContent[language].missionText}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='bg-white rounded-xl p-8 shadow-sm border border-neutral-200'
            >
              <div className='flex items-center mb-6'>
                <SparklesIcon className='w-8 h-8 text-secondary-500 mr-4' />
                <h2 className='text-2xl font-bold text-neutral-900'>
                  {aboutContent[language].vision}
                </h2>
              </div>
              <p className='text-neutral-600 leading-relaxed'>
                {aboutContent[language].visionText}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className='py-20 bg-neutral-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-3xl lg:text-4xl font-bold text-neutral-900 mb-4'>
              {aboutContent[language].values}
            </h2>
            <p className='text-xl text-neutral-600 max-w-3xl mx-auto'>
              {language === 'ar' 
                ? 'القيم التي نلتزم بها في جميع أعمالنا'
                : 'The values we uphold in everything we do'
              }
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className='bg-white rounded-xl p-6 text-center shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'
              >
                <div className='w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <value.icon className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-lg font-semibold text-neutral-900 mb-3'>
                  {value.title[language]}
                </h3>
                <p className='text-neutral-600 text-sm leading-relaxed'>
                  {value.description[language]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className='py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-3xl lg:text-4xl font-bold text-neutral-900 mb-4'>
              {language === 'ar' ? 'فريق العمل' : 'Our Team'}
            </h2>
            <p className='text-xl text-neutral-600 max-w-3xl mx-auto'>
              {language === 'ar' 
                ? 'الفريق المتميز الذي يقف وراء نجاح سوق السيارات'
                : 'The exceptional team behind Souk El-Syarat\'s success'
              }
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className='bg-white rounded-xl p-6 text-center shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className='w-24 h-24 rounded-full mx-auto mb-4 object-cover'
                />
                <h3 className='text-lg font-semibold text-neutral-900 mb-2'>
                  {member.name}
                </h3>
                <p className='text-neutral-600 text-sm'>
                  {member.role[language]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='py-20 bg-gradient-to-r from-primary-500 to-secondary-500'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <HeartIcon className='w-16 h-16 mx-auto mb-6 opacity-80' />
            <h2 className='text-3xl lg:text-4xl font-bold mb-6'>
              {language === 'ar' ? 'انضم إلى عائلة سوق السيارات' : 'Join the Souk El-Syarat Family'}
            </h2>
            <p className='text-xl mb-8 opacity-90 max-w-3xl mx-auto'>
              {language === 'ar' 
                ? 'ابدأ رحلتك معنا اليوم واكتشف أفضل العروض والخدمات'
                : 'Start your journey with us today and discover the best deals and services'
              }
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <button className='bg-white text-primary-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors'>
                {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
              </button>
              <button className='border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white hover:text-primary-600 transition-colors'>
                {language === 'ar' ? 'كن تاجراً' : 'Become a Vendor'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;