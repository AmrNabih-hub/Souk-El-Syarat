import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

const AboutPage: React.FC = () => {
  const { language } = useAppStore();

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-7xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className='text-4xl font-bold text-center mb-8'>
            {language === 'ar' ? 'من نحن' : 'About Us'}
          </h1>
          <div className='bg-white rounded-xl shadow-lg p-8'>
            <p className='text-lg text-gray-700 leading-relaxed'>
              {language === 'ar' 
                ? 'سوق السيارات هو أكبر منصة للتجارة الإلكترونية في مصر متخصصة في السيارات وقطع الغيار والخدمات.'
                : 'Souk El-Syarat is Egypt\'s largest e-commerce platform specialized in cars, parts, and services.'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;