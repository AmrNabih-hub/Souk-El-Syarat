import React from 'react';
import { motion } from 'framer-motion';
import { 
  InformationCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

const ContactPage: React.FC = () => {
  const { language } = useAppStore();

  const contactInfo = {
    ar: {
      title: 'اتصل بنا',
      subtitle: 'نحن هنا لمساعدتك',
      description: 'لديك سؤال أو تحتاج مساعدة؟ تواصل معنا وسنكون سعداء لمساعدتك',
      phone: '+20 100 123 4567',
      email: 'info@soukelsyarat.com',
      address: 'القاهرة، مصر',
      workingHours: 'السبت - الخميس: 9:00 ص - 6:00 م'
    },
    en: {
      title: 'Contact Us',
      subtitle: 'We\'re here to help',
      description: 'Have a question or need assistance? Get in touch and we\'ll be happy to help',
      phone: '+20 100 123 4567',
      email: 'info@soukelsyarat.com',
      address: 'Cairo, Egypt',
      workingHours: 'Saturday - Thursday: 9:00 AM - 6:00 PM'
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-12'
        >
          <h1 className='text-4xl font-bold text-neutral-900 mb-4'>
            {contactInfo[language].title}
          </h1>
          <p className='text-xl text-neutral-600 mb-2'>
            {contactInfo[language].subtitle}
          </p>
          <p className='text-lg text-neutral-500 max-w-3xl mx-auto'>
            {contactInfo[language].description}
          </p>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='bg-white rounded-xl p-8 shadow-sm border border-neutral-200'>
              <h2 className='text-2xl font-bold text-neutral-900 mb-6'>
                {language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message'}
              </h2>
              
              <form className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {language === 'ar' ? 'الاسم' : 'Name'}
                    </label>
                    <input
                      type='text'
                      className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                      placeholder={language === 'ar' ? 'اسمك الكامل' : 'Your full name'}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type='email'
                      className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                      placeholder={language === 'ar' ? 'email@example.com' : 'your@email.com'}
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'الموضوع' : 'Subject'}
                  </label>
                  <input
                    type='text'
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    placeholder={language === 'ar' ? 'موضوع الرسالة' : 'Message subject'}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </label>
                  <textarea
                    rows={6}
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  />
                </div>

                <button
                  type='submit'
                  className='w-full bg-primary-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-600 transition-colors'
                >
                  {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className='space-y-8'
          >
            {/* Contact Details */}
            <div className='bg-white rounded-xl p-8 shadow-sm border border-neutral-200'>
              <h2 className='text-2xl font-bold text-neutral-900 mb-6'>
                {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
              </h2>
              
              <div className='space-y-6'>
                <div className='flex items-start'>
                  <PhoneIcon className='w-6 h-6 text-primary-500 mr-4 mt-1' />
                  <div>
                    <h3 className='font-semibold text-neutral-900 mb-1'>
                      {language === 'ar' ? 'الهاتف' : 'Phone'}
                    </h3>
                    <p className='text-neutral-600'>{contactInfo[language].phone}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <EnvelopeIcon className='w-6 h-6 text-primary-500 mr-4 mt-1' />
                  <div>
                    <h3 className='font-semibold text-neutral-900 mb-1'>
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </h3>
                    <p className='text-neutral-600'>{contactInfo[language].email}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <MapPinIcon className='w-6 h-6 text-primary-500 mr-4 mt-1' />
                  <div>
                    <h3 className='font-semibold text-neutral-900 mb-1'>
                      {language === 'ar' ? 'العنوان' : 'Address'}
                    </h3>
                    <p className='text-neutral-600'>{contactInfo[language].address}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <BuildingOfficeIcon className='w-6 h-6 text-primary-500 mr-4 mt-1' />
                  <div>
                    <h3 className='font-semibold text-neutral-900 mb-1'>
                      {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                    </h3>
                    <p className='text-neutral-600'>{contactInfo[language].workingHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className='bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-8 text-white'>
              <div className='flex items-start'>
                <InformationCircleIcon className='w-8 h-8 mr-4 mt-1' />
                <div>
                  <h3 className='text-xl font-bold mb-3'>
                    {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                  </h3>
                  <p className='opacity-90 mb-4'>
                    {language === 'ar' 
                      ? 'تحقق من قسم الأسئلة الشائعة للحصول على إجابات سريعة'
                      : 'Check our FAQ section for quick answers to common questions'
                    }
                  </p>
                  <button className='bg-white text-primary-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors'>
                    {language === 'ar' ? 'عرض الأسئلة الشائعة' : 'View FAQ'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;