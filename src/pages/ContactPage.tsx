import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import { db } from '@/config/firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ContactPage: React.FC = () => {
  const { language } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      
      toast.success(language === 'ar' ? 'تم إرسال رسالتك بنجاح' : 'Message sent successfully');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: PhoneIcon,
      title: language === 'ar' ? 'الهاتف' : 'Phone',
      value: '+20 123 456 7890',
      link: 'tel:+201234567890'
    },
    {
      icon: EnvelopeIcon,
      title: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: 'support@souk-el-syarat.com',
      link: 'mailto:support@souk-el-syarat.com'
    },
    {
      icon: MapPinIcon,
      title: language === 'ar' ? 'العنوان' : 'Address',
      value: language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt',
      link: '#'
    },
    {
      icon: ClockIcon,
      title: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
      value: language === 'ar' ? '9 صباحاً - 9 مساءً' : '9 AM - 9 PM',
      link: '#'
    }
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-7xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className='text-4xl font-bold text-center mb-8 text-gray-900'>
            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
          </h1>
          
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Contact Form */}
            <div className='bg-white rounded-xl shadow-lg p-8'>
              <h2 className='text-2xl font-semibold mb-6'>
                {language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message'}
              </h2>
              
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <input
                    type='text'
                    placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  />
                  <input
                    type='email'
                    placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  />
                </div>
                
                <input
                  type='tel'
                  placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                />
                
                <input
                  type='text'
                  placeholder={language === 'ar' ? 'الموضوع' : 'Subject'}
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                />
                
                <textarea
                  placeholder={language === 'ar' ? 'رسالتك' : 'Your Message'}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                />
                
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors'
                >
                  {isSubmitting ? (
                    <LoadingSpinner size='sm' color='white' />
                  ) : (
                    language === 'ar' ? 'إرسال الرسالة' : 'Send Message'
                  )}
                </button>
              </form>
            </div>
            
            {/* Contact Information */}
            <div className='space-y-6'>
              <div className='bg-white rounded-xl shadow-lg p-8'>
                <h2 className='text-2xl font-semibold mb-6'>
                  {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                </h2>
                
                <div className='space-y-4'>
                  {contactInfo.map((info, index) => (
                    <a
                      key={index}
                      href={info.link}
                      className='flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <info.icon className='w-6 h-6 text-primary-500 mt-1' />
                      <div>
                        <p className='font-semibold text-gray-900'>{info.title}</p>
                        <p className='text-gray-600'>{info.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Map */}
              <div className='bg-white rounded-xl shadow-lg p-8'>
                <h2 className='text-2xl font-semibold mb-6'>
                  {language === 'ar' ? 'موقعنا' : 'Our Location'}
                </h2>
                <div className='h-64 bg-gray-200 rounded-lg flex items-center justify-center'>
                  <MapPinIcon className='w-12 h-12 text-gray-400' />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;