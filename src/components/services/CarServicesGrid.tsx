import React from 'react';
import { motion } from 'framer-motion';
import { WrenchScrewdriverIcon, ShieldCheckIcon, SparklesIcon, TruckIcon, StarIcon, PhoneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CarServicesGrid: React.FC = () => {
  const services = [
    {
      id: '1', title: 'غسيل VIP متكامل', price: '120 جنيه', image: 'https://images.unsplash.com/photo-1558618666-fbd51c2cd834?w=400&h=300&fit=crop',
      description: 'غسيل شامل داخلي وخارجي مع تلميع', features: ['غسيل خارجي شامل', 'تنظيف داخلي عميق', 'تلميع الهيكل', 'تعطير']
    },
    {
      id: '2', title: 'قطع غيار أصلية', price: '50-5000 جنيه', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
      description: 'قطع غيار أصلية لجميع السيارات', features: ['قطع أصلية 100%', 'ضمان سنة كاملة', 'توصيل مجاني', 'أسعار منافسة']
    },
    {
      id: '3', title: 'كت صيانة شامل', price: '450 جنيه', image: 'https://images.unsplash.com/photo-1609205804882-e1c6a72e9d0b?w=400&h=300&fit=crop',
      description: 'حزمة صيانة كاملة للسيارة', features: ['تغيير الزيت', 'فلاتر جديدة', 'فحص شامل', 'تقرير حالة']
    },
    {
      id: '4', title: 'حماية نانو سيراميك', price: '800 جنيه', image: 'https://images.unsplash.com/photo-1609105954880-e4c28648b098?w=400&h=300&fit=crop',
      description: 'حماية متقدمة لطلاء السيارة', features: ['حماية 5 سنوات', 'مقاوم للخدوش', 'لمعة دائمة', 'سهولة التنظيف']
    },
    {
      id: '5', title: 'إطارات ميشلان', price: '800-2500 جنيه', image: 'https://images.unsplash.com/photo-1606987542373-0c71b19d46d6?w=400&h=300&fit=crop',
      description: 'إطارات عالية الجودة من ميشلان', features: ['ضمان الوكيل', 'أداء متميز', 'توازن مجاني', 'تركيب احترافي']
    },
    {
      id: '6', title: 'نظام صوت متطور', price: '1200-4000 جنيه', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      description: 'أنظمة صوت وترفيه متقدمة', features: ['صوت عالي الدقة', 'بلوتوث وUSB', 'شاشة تاتش', 'تركيب مجاني']
    },
    {
      id: '7', title: 'خدمة توصيل VIP', price: '200 جنيه', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop',
      description: 'استلام وتسليم السيارة من المنزل', features: ['استلام من المنزل', 'خدمة 24/7', 'متتبع رحلة', 'أمان كامل']
    },
    {
      id: '8', title: 'فحص شامل بالكمبيوتر', price: '150 جنيه', image: 'https://images.unsplash.com/photo-1609205804902-1976d87ec1ad?w=400&h=300&fit=crop',
      description: 'فحص إلكتروني شامل لجميع أنظمة السيارة', features: ['فحص كمبيوتر متطور', 'تقرير مفصل', 'نصائح صيانة', 'متابعة دورية']
    }
  ];

  const handleBookService = (service: any) => {
    toast.success(`تم حجز ${service.title} بنجاح! سيتم التواصل معك خلال 15 دقيقة`);
  };

  const handleCallProvider = (serviceTitle: string) => {
    toast.success(`جاري الاتصال بمقدم خدمة ${serviceTitle}`);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">خدمات السيارات المتكاملة</h2>
          <p className="text-xl text-gray-600">قطع غيار أصلية • خدمات صيانة • إكسسوارات عالية الجودة</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div key={service.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              
              <div className="relative">
                <img src={service.image} alt={service.title} className="w-full h-48 object-cover" />
                <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  متوفر الآن
                </div>
                <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                  ⭐ 4.8
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                
                <div className="text-2xl font-bold text-primary-600 mb-4">{service.price}</div>

                <div className="space-y-2 mb-4">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <StarIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2 space-x-reverse">
                  <motion.button onClick={() => handleBookService(service)}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    احجز الآن
                  </motion.button>
                  <motion.button onClick={() => handleCallProvider(service.title)}
                    className="px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <PhoneIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div className="text-center mt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="bg-primary-500 text-white p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">🎉 عرض خاص - خصم 25% على جميع الخدمات</h3>
            <p className="text-lg mb-4">احجز الآن واحصل على خصم فوري + ضمان 6 أشهر</p>
            <div className="flex justify-center items-center space-x-4 space-x-reverse text-sm">
              <div className="flex items-center"><ShieldCheckIcon className="w-5 h-5 mr-1" /> ضمان شامل</div>
              <div className="flex items-center"><TruckIcon className="w-5 h-5 mr-1" /> توصيل مجاني</div>
              <div className="flex items-center"><SparklesIcon className="w-5 h-5 mr-1" /> جودة عالية</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CarServicesGrid;