/**
 * 404 NOT FOUND PAGE
 * Professional error page with navigation options
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  ArrowLeftIcon, 
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

const NotFoundPage: React.FC = () => {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const quickLinks = [
    {
      icon: HomeIcon,
      title: { ar: 'الصفحة الرئيسية', en: 'Homepage' },
      description: { ar: 'العودة إلى الصفحة الرئيسية', en: 'Return to homepage' },
      link: '/'
    },
    {
      icon: ShoppingCartIcon,
      title: { ar: 'السوق', en: 'Marketplace' },
      description: { ar: 'تصفح جميع المنتجات', en: 'Browse all products' },
      link: '/marketplace'
    },
    {
      icon: MagnifyingGlassIcon,
      title: { ar: 'البحث', en: 'Search' },
      description: { ar: 'ابحث عن ما تريد', en: 'Search for what you need' },
      link: '/search'
    },
    {
      icon: PhoneIcon,
      title: { ar: 'اتصل بنا', en: 'Contact Us' },
      description: { ar: 'تواصل مع فريق الدعم', en: 'Contact support team' },
      link: '/contact'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* 404 Animation */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="mb-8"
          >
            <div className="text-9xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              404
            </div>
            <motion.div
              animate={{ x: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-6xl mt-4"
            >
              🚗💨
            </motion.div>
          </motion.div>

          {/* Error Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isArabic ? 'الصفحة غير موجودة!' : 'Page Not Found!'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {isArabic 
              ? 'عذراً، يبدو أن السيارة التي تبحث عنها قد غادرت المعرض. دعنا نساعدك في العثور على طريقك.'
              : "Sorry, it seems the car you're looking for has left the showroom. Let us help you find your way."}
          </p>

          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-lg hover:shadow-xl transition-all mb-12"
          >
            <ArrowLeftIcon className={`w-5 h-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
            {isArabic ? 'العودة للخلف' : 'Go Back'}
          </motion.button>
        </motion.div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickLinks.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={item.link}
                className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 group"
              >
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                    <item.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title[language]}
                    </h3>
                    <p className="text-gray-600">
                      {item.description[language]}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Popular Searches */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 mb-4">
            {isArabic ? 'عمليات البحث الشائعة:' : 'Popular Searches:'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: { ar: 'مرسيدس', en: 'Mercedes' }, link: '/marketplace?brand=mercedes' },
              { label: { ar: 'BMW', en: 'BMW' }, link: '/marketplace?brand=bmw' },
              { label: { ar: 'قطع غيار', en: 'Spare Parts' }, link: '/marketplace?category=parts' },
              { label: { ar: 'خدمات', en: 'Services' }, link: '/services' },
              { label: { ar: 'عروض', en: 'Deals' }, link: '/deals' }
            ].map((tag, index) => (
              <Link
                key={index}
                to={tag.link}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {tag.label[language]}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Support Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 bg-blue-50 rounded-xl text-center"
        >
          <p className="text-blue-800">
            {isArabic 
              ? 'هل تحتاج إلى مساعدة؟ اتصل بنا على 19555 أو راسلنا على support@souk-elsayarat.com'
              : 'Need help? Call us at 19555 or email us at support@souk-elsayarat.com'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;