import React from 'react';

import { motion } from 'framer-motion';
import {
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedInIcon,
  YouTubeIcon,
} from '@/components/ui/SocialIcons';
import { useAppStore } from '@/stores/appStore';

const Footer: React.FC = () => {
  const { language } = useAppStore();

  const footerLinks = {
    ar: {
      company: {
        title: 'الشركة',
        links: [
          { name: 'من نحن', href: '/about' },
          { name: 'اتصل بنا', href: '/contact' },
          { name: 'الوظائف', href: '/careers' },
          { name: 'الأخبار', href: '/news' },
        ],
      },
      marketplace: {
        title: 'السوق',
        links: [
          { name: 'سيارات للبيع', href: '/marketplace?category=cars' },
          { name: 'قطع غيار', href: '/marketplace?category=parts' },
          { name: 'الخدمات', href: '/marketplace?category=services' },
          { name: 'التجار المميزين', href: '/vendors' },
        ],
      },
      support: {
        title: 'الدعم',
        links: [
          { name: 'مركز المساعدة', href: '/help' },
          { name: 'الأسئلة الشائعة', href: '/faq' },
          { name: 'سياسة الخصوصية', href: '/privacy' },
          { name: 'الشروط والأحكام', href: '/terms' },
        ],
      },
      vendors: {
        title: 'للتجار',
        links: [
          { name: 'كن تاجراً', href: '/vendor/apply' },
          { name: 'مركز البائعين', href: '/vendor/center' },
          { name: 'دليل البيع', href: '/selling-guide' },
          { name: 'الرسوم والعمولات', href: '/fees' },
        ],
      },
    },
    en: {
      company: {
        title: 'Company',
        links: [
          { name: 'About Us', href: '/about' },
          { name: 'Contact', href: '/contact' },
          { name: 'Careers', href: '/careers' },
          { name: 'News', href: '/news' },
        ],
      },
      marketplace: {
        title: 'Marketplace',
        links: [
          { name: 'Cars for Sale', href: '/marketplace?category=cars' },
          { name: 'Parts', href: '/marketplace?category=parts' },
          { name: 'Services', href: '/marketplace?category=services' },
          { name: 'Featured Vendors', href: '/vendors' },
        ],
      },
      support: {
        title: 'Support',
        links: [
          { name: 'Help Center', href: '/help' },
          { name: 'FAQ', href: '/faq' },
          { name: 'Privacy Policy', href: '/privacy' },
          { name: 'Terms & Conditions', href: '/terms' },
        ],
      },
      vendors: {
        title: 'For Vendors',
        links: [
          { name: 'Become a Vendor', href: '/vendor/apply' },
          { name: 'Seller Center', href: '/vendor/center' },
          { name: 'Selling Guide', href: '/selling-guide' },
          { name: 'Fees & Commissions', href: '/fees' },
        ],
      },
    },
  };

  const currentLinks = footerLinks[language];

  const contactInfo = {
    ar: {
      address: 'القاهرة، مصر',
      phone: '+20 10 1234 5678',
      email: 'info@soukel-syarat.com',
      website: 'www.soukel-syarat.com',
    },
    en: {
      address: 'Cairo, Egypt',
      phone: '+20 10 1234 5678',
      email: 'info@soukel-syarat.com',
      website: 'www.soukel-syarat.com',
    },
  };

  return (
    <footer className='bg-gradient-to-br from-neutral-900 to-neutral-800 text-white'>
      {/* Main Footer Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8'>
          {/* Logo and Description */}
          <div className='lg:col-span-1'>
            <motion.div className='flex items-center space-x-2 mb-4' whileHover={{ scale: 1.05 }}>
              <div className='w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>س</span>
              </div>
              <div>
                <h3 className='text-lg font-bold gradient-text font-display'>سوق السيارات</h3>
                <p className='text-xs text-neutral-400 -mt-1'>Souk El-Syarat</p>
              </div>
            </motion.div>

            <p className='text-sm text-neutral-300 mb-4 leading-relaxed'>
              {language === 'ar'
                ? 'منصة التجارة الإلكترونية الرائدة في مصر للسيارات وقطع الغيار والخدمات'
                : 'Leading e-commerce platform in Egypt for cars, parts, and services'}
            </p>

            {/* Contact Info */}
            <div className='space-y-2 text-sm'>
              <div className='flex items-center space-x-2'>
                <MapPinIcon className='w-4 h-4 text-primary-400' />
                <span className='text-neutral-300'>{contactInfo[language].address}</span>
              </div>
              <div className='flex items-center space-x-2'>
                <PhoneIcon className='w-4 h-4 text-primary-400' />
                <span className='text-neutral-300'>{contactInfo[language].phone}</span>
              </div>
              <div className='flex items-center space-x-2'>
                <EnvelopeIcon className='w-4 h-4 text-primary-400' />
                <span className='text-neutral-300'>{contactInfo[language].email}</span>
              </div>
              <div className='flex items-center space-x-2'>
                <GlobeAltIcon className='w-4 h-4 text-primary-400' />
                <span className='text-neutral-300'>{contactInfo[language].website}</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(currentLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className='text-lg font-semibold mb-4 text-primary-400'>{section.title}</h4>
              <ul className='space-y-2'>
                {section.links.map(link => (
                  <li key={link.href}>
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Link
                        to={link.href}
                        className='text-sm text-neutral-300 hover:text-primary-400 transition-colors duration-200'
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className='mt-12 pt-8 border-t border-neutral-700'>
          <div className='max-w-md mx-auto text-center'>
            <h4 className='text-lg font-semibold mb-2 text-primary-400'>
              {language === 'ar' ? 'اشترك في نشرتنا الإخبارية' : 'Subscribe to Our Newsletter'}
            </h4>
            <p className='text-sm text-neutral-300 mb-4'>
              {language === 'ar'
                ? 'احصل على آخر العروض والأخبار من سوق السيارات'
                : 'Get the latest offers and news from Souk El-Syarat'}
            </p>

            <form className='flex space-x-2'>
              <input
                type='email'
                placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                className='flex-1 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
              />
              <motion.button
                type='submit'
                className='btn btn-primary'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {language === 'ar' ? 'اشترك' : 'Subscribe'}
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className='bg-neutral-800 border-t border-neutral-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            {/* Copyright */}
            <div className='flex items-center space-x-2 mb-4 md:mb-0'>
              <p className='text-sm text-neutral-400'>
                © 2024 {language === 'ar' ? 'سوق السيارات' : 'Souk El-Syarat'}.
                {language === 'ar' ? ' جميع الحقوق محفوظة' : ' All rights reserved'}
              </p>
              <HeartIcon className='w-4 h-4 text-red-500' />
            </div>

            {/* Social Media Links */}
            <div className='flex items-center space-x-4'>
              <p className='text-sm text-neutral-400 mr-4'>
                {language === 'ar' ? 'تابعنا على:' : 'Follow us:'}
              </p>

              {[
                {
                  icon: FacebookIcon,
                  href: 'https://facebook.com/soukel-syarat',
                  label: 'Facebook',
                },
                {
                  icon: InstagramIcon,
                  href: 'https://instagram.com/soukel-syarat',
                  label: 'Instagram',
                },
                { icon: TwitterIcon, href: 'https://twitter.com/soukel-syarat', label: 'Twitter' },
                {
                  icon: LinkedInIcon,
                  href: 'https://linkedin.com/company/soukel-syarat',
                  label: 'LinkedIn',
                },
                { icon: YouTubeIcon, href: 'https://youtube.com/soukel-syarat', label: 'YouTube' },
              ].map(social => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-2 text-neutral-400 hover:text-primary-400 transition-colors duration-200'
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.label}
                >
                  <social.icon className='w-5 h-5' />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Egyptian Theme Accent */}
          <motion.div
            className='w-full h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 mt-6 rounded-full'
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
