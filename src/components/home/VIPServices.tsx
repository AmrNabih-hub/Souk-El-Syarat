/**
 * 🌟 VIP SERVICES COMPONENT
 * Premium services showcase with real-time booking
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import {
  SparklesIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  PhoneIcon,
  ClockIcon,
  HomeIcon,
  CreditCardIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface VIPService {
  id: string;
  icon: React.ElementType;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  features: { ar: string[]; en: string[] };
  price: { ar: string; en: string };
  badge?: { ar: string; en: string };
  color: string;
}

const VIPServices: React.FC = () => {
  const { language } = useAppStore();

  const vipServices: VIPService[] = [
    {
      id: 'concierge',
      icon: SparklesIcon,
      title: {
        ar: 'خدمة الكونسيرج الشخصي',
        en: 'Personal Concierge Service'
      },
      description: {
        ar: 'مستشار شخصي مخصص لتلبية جميع احتياجاتك من السيارات',
        en: 'Dedicated personal advisor for all your automotive needs'
      },
      features: {
        ar: ['استشارات 24/7', 'حجز المواعيد', 'متابعة شخصية', 'خط ساخن VIP'],
        en: ['24/7 Consultation', 'Appointment Booking', 'Personal Follow-up', 'VIP Hotline']
      },
      price: {
        ar: 'مجاناً للعملاء المميزين',
        en: 'Free for Premium Customers'
      },
      badge: {
        ar: 'الأكثر طلباً',
        en: 'Most Popular'
      },
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'home-service',
      icon: HomeIcon,
      title: {
        ar: 'الصيانة المنزلية',
        en: 'Home Service'
      },
      description: {
        ar: 'فريق الصيانة يأتي إليك أينما كنت',
        en: 'Our maintenance team comes to you wherever you are'
      },
      features: {
        ar: ['صيانة في المنزل', 'غسيل وتلميع', 'فحص شامل', 'تغيير زيت'],
        en: ['Home Maintenance', 'Wash & Polish', 'Full Inspection', 'Oil Change']
      },
      price: {
        ar: 'يبدأ من 500 ج.م',
        en: 'Starting from 500 EGP'
      },
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'emergency',
      icon: TruckIcon,
      title: {
        ar: 'الإنقاذ الطارئ 24/7',
        en: '24/7 Emergency Rescue'
      },
      description: {
        ar: 'خدمة إنقاذ فورية في أي وقت وأي مكان',
        en: 'Instant rescue service anytime, anywhere'
      },
      features: {
        ar: ['ونش سريع', 'إصلاح طارئ', 'بنزين طوارئ', 'فتح أبواب'],
        en: ['Fast Towing', 'Emergency Repair', 'Fuel Delivery', 'Lockout Service']
      },
      price: {
        ar: 'اشتراك سنوي 2000 ج.م',
        en: 'Annual 2000 EGP'
      },
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'premium-warranty',
      icon: ShieldCheckIcon,
      title: {
        ar: 'الضمان الذهبي',
        en: 'Golden Warranty'
      },
      description: {
        ar: 'تغطية شاملة لسيارتك مع مزايا حصرية',
        en: 'Comprehensive coverage for your car with exclusive benefits'
      },
      features: {
        ar: ['ضمان 5 سنوات', 'قطع غيار مجانية', 'سيارة بديلة', 'صيانة مجانية'],
        en: ['5 Year Warranty', 'Free Parts', 'Replacement Car', 'Free Maintenance']
      },
      price: {
        ar: 'حسب قيمة السيارة',
        en: 'Based on Car Value'
      },
      badge: {
        ar: 'حصري',
        en: 'Exclusive'
      },
      color: 'from-yellow-500 to-amber-500'
    },
    {
      id: 'detailing',
      icon: WrenchScrewdriverIcon,
      title: {
        ar: 'العناية الفائقة',
        en: 'Premium Detailing'
      },
      description: {
        ar: 'عناية احترافية لسيارتك بأحدث التقنيات',
        en: 'Professional car care with latest technologies'
      },
      features: {
        ar: ['نانو سيراميك', 'حماية الطلاء', 'تنظيف عميق', 'عطور فاخرة'],
        en: ['Nano Ceramic', 'Paint Protection', 'Deep Cleaning', 'Luxury Perfumes']
      },
      price: {
        ar: 'يبدأ من 1500 ج.م',
        en: 'Starting from 1500 EGP'
      },
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'finance',
      icon: CreditCardIcon,
      title: {
        ar: 'التمويل الميسر',
        en: 'Easy Financing'
      },
      description: {
        ar: 'خطط تمويل مرنة بدون فوائد',
        en: 'Flexible financing plans with zero interest'
      },
      features: {
        ar: ['0% فائدة', 'أقساط 60 شهر', 'موافقة فورية', 'بدون دفعة أولى'],
        en: ['0% Interest', '60 Month Plans', 'Instant Approval', 'No Down Payment']
      },
      price: {
        ar: 'تقييم مجاني',
        en: 'Free Assessment'
      },
      badge: {
        ar: 'جديد',
        en: 'New'
      },
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-4">
            <StarIcon className="w-8 h-8 text-yellow-500" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mx-4">
              {language === 'ar' ? 'خدمات VIP الحصرية' : 'Exclusive VIP Services'}
            </h2>
            <StarIcon className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'ar'
              ? 'استمتع بتجربة فريدة مع باقة خدماتنا المميزة المصممة خصيصاً لعملائنا الكرام'
              : 'Enjoy a unique experience with our premium service package designed exclusively for our valued customers'}
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vipServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10"
                style={{
                  backgroundImage: `linear-gradient(to right, ${service.color.split(' ')[1]}, ${service.color.split(' ')[3]})`
                }}
              />
              
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full border border-gray-100">
                {/* Badge */}
                {service.badge && (
                  <div className="absolute -top-3 right-6">
                    <span className={`px-4 py-1 bg-gradient-to-r ${service.color} text-white text-xs font-bold rounded-full`}>
                      {service.badge[language]}
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-6`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {service.title[language]}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                  {service.description[language]}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {service.features[language].map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Price */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-500">
                      {service.price[language]}
                    </span>
                    <Link
                      to={`/services/vip/${service.id}`}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
                    >
                      {language === 'ar' ? 'احجز الآن' : 'Book Now'}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center space-x-4 bg-primary-500 text-white px-8 py-4 rounded-full shadow-xl">
            <PhoneIcon className="w-6 h-6" />
            <span className="text-lg font-semibold">
              {language === 'ar' ? 'اتصل بنا للحجز: 19555' : 'Call to Book: 19555'}
            </span>
            <ClockIcon className="w-6 h-6" />
            <span className="text-lg">24/7</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VIPServices;