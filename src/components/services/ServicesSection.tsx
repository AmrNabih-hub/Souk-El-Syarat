import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  StarIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  icon: React.ComponentType<any>;
  category: 'washing' | 'protection' | 'maintenance' | 'vip' | 'delivery';
  features: string[];
  rating: number;
  reviewCount: number;
  duration: string;
  location: string;
  available: boolean;
  discount?: number;
  image: string;
  provider: {
    name: string;
    phone: string;
    verified: boolean;
  };
}

const ServicesSection: React.FC = () => {
  const { language } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const services: Service[] = [
    {
      id: '1',
      title: 'غسيل VIP متكامل',
      description: 'غسيل شامل للسيارة من الداخل والخارج مع تلميع وتعطير',
      price: '150',
      originalPrice: '200',
      icon: SparklesIcon,
      category: 'washing',
      features: ['غسيل خارجي شامل', 'تنظيف داخلي كامل', 'تلميع الكروم', 'تعطير فاخر', 'تنشيف بقماش خاص'],
      rating: 4.8,
      reviewCount: 234,
      duration: '45 دقيقة',
      location: 'القاهرة الجديدة',
      available: true,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1558618666-fc8c4c7d0e86?w=400&h=300&fit=crop',
      provider: {
        name: 'مركز العناية الفاخرة',
        phone: '01012345678',
        verified: true
      }
    },
    {
      id: '2',
      title: 'فيلم حماية PPF',
      description: 'فيلم حماية شفاف عالي الجودة لحماية طلاء السيارة',
      price: '2500',
      originalPrice: '3000',
      icon: ShieldCheckIcon,
      category: 'protection',
      features: ['حماية من الخدوش', 'مقاوم للأشعة فوق البنفسجية', 'شفافية عالية', 'ضمان 5 سنوات', 'تركيب احترافي'],
      rating: 4.9,
      reviewCount: 89,
      duration: '3 ساعات',
      location: 'مدينة نصر',
      available: true,
      discount: 17,
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop',
      provider: {
        name: 'مركز الحماية المتطورة',
        phone: '01098765432',
        verified: true
      }
    },
    {
      id: '3',
      title: 'صيانة شاملة احترافية',
      description: 'فحص وصيانة شاملة لجميع أجزاء السيارة',
      price: '800',
      icon: WrenchScrewdriverIcon,
      category: 'maintenance',
      features: ['فحص المحرك', 'فحص الفرامل', 'تغيير الزيت', 'فحص الإطارات', 'تقرير شامل'],
      rating: 4.7,
      reviewCount: 156,
      duration: '2 ساعة',
      location: 'الجيزة',
      available: true,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
      provider: {
        name: 'ورشة الخبراء',
        phone: '01155443322',
        verified: true
      }
    },
    {
      id: '4',
      title: 'خدمة VIP التوصيل',
      description: 'استلام وتسليم السيارة من مكانك مع الخدمة المطلوبة',
      price: '100',
      icon: TruckIcon,
      category: 'vip',
      features: ['استلام من المنزل', 'تسليم في نفس المكان', 'متتبع GPS', 'تأمين شامل', 'خدمة 24 ساعة'],
      rating: 4.6,
      reviewCount: 78,
      duration: 'حسب الخدمة',
      location: 'جميع أنحاء القاهرة',
      available: true,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
      provider: {
        name: 'خدمات التوصيل السريع',
        phone: '01077889900',
        verified: true
      }
    },
    {
      id: '5',
      title: 'تنظيف بالبخار الساخن',
      description: 'تنظيف عميق بالبخار الساخن لإزالة البقع والجراثيم',
      price: '120',
      originalPrice: '150',
      icon: SparklesIcon,
      category: 'washing',
      features: ['تنظيف بالبخار', 'إزالة البقع الصعبة', 'تعقيم شامل', 'صديق للبيئة', 'آمن على الأقمشة'],
      rating: 4.5,
      reviewCount: 92,
      duration: '30 دقيقة',
      location: 'المعادي',
      available: true,
      discount: 20,
      image: 'https://images.unsplash.com/photo-1574220861543-6ab9421c2e04?w=400&h=300&fit=crop',
      provider: {
        name: 'مركز البخار المتقدم',
        phone: '01033667788',
        verified: true
      }
    },
    {
      id: '6',
      title: 'تظليل عازل للحرارة',
      description: 'فيلم تظليل عالي الجودة لحماية من الحرارة والأشعة',
      price: '600',
      originalPrice: '800',
      icon: ShieldCheckIcon,
      category: 'protection',
      features: ['عزل الحرارة 99%', 'حجب الأشعة فوق البنفسجية', 'خصوصية كاملة', 'لا يتقشر', 'ضمان سنتين'],
      rating: 4.4,
      reviewCount: 134,
      duration: '90 دقيقة',
      location: 'الإسكندرية',
      available: true,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1607891415910-12fe93e7bb8a?w=400&h=300&fit=crop',
      provider: {
        name: 'مركز التظليل الاحترافي',
        phone: '01099887766',
        verified: true
      }
    },
    {
      id: '7',
      title: 'خدمة VIP كاملة',
      description: 'باقة شاملة تجمع جميع خدمات العناية الفاخرة',
      price: '500',
      originalPrice: '700',
      icon: StarIcon,
      category: 'vip',
      features: ['غسيل VIP', 'تلميع شامل', 'تنظيف داخلي فاخر', 'حماية مؤقتة', 'خدمة شخصية'],
      rating: 5.0,
      reviewCount: 45,
      duration: '2 ساعة',
      location: 'الشيخ زايد',
      available: true,
      discount: 29,
      image: 'https://images.unsplash.com/photo-1520031441872-459d92d2fa25?w=400&h=300&fit=crop',
      provider: {
        name: 'VIP Car Care',
        phone: '01122334455',
        verified: true
      }
    },
    {
      id: '8',
      title: 'توصيل قطع الغيار',
      description: 'توصيل قطع غيار أصلية لباب البيت مع التركيب',
      price: '50',
      icon: TruckIcon,
      category: 'delivery',
      features: ['قطع غيار أصلية', 'توصيل سريع', 'تركيب مجاني', 'ضمان شامل', 'خدمة طوارئ'],
      rating: 4.3,
      reviewCount: 167,
      duration: '30 دقيقة',
      location: 'جميع المحافظات',
      available: true,
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&h=300&fit=crop',
      provider: {
        name: 'قطع الغيار السريع',
        phone: '01066554433',
        verified: true
      }
    }
  ];

  const categories = [
    { id: 'all', name: 'جميع الخدمات', icon: SparklesIcon },
    { id: 'washing', name: 'غسيل وتنظيف', icon: SparklesIcon },
    { id: 'protection', name: 'الحماية والتظليل', icon: ShieldCheckIcon },
    { id: 'maintenance', name: 'صيانة وإصلاح', icon: WrenchScrewdriverIcon },
    { id: 'vip', name: 'خدمات VIP', icon: StarIcon },
    { id: 'delivery', name: 'التوصيل', icon: TruckIcon },
  ];

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = () => {
    toast.success(`تم حجز خدمة ${selectedService?.title} بنجاح!`);
    setShowBookingModal(false);
    setSelectedService(null);
  };

  const handleCallProvider = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            إجراءات سريعة
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            خدمات متكاملة للعناية بسيارتك من غسيل وحماية وصيانة وخدمات VIP
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-full font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-primary-50 border border-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <category.icon className="w-5 h-5" />
              <span>{category.name}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Service Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  {service.available && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      متاح الآن
                    </span>
                  )}
                  {service.discount && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      خصم {service.discount}%
                    </span>
                  )}
                  {service.provider.verified && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1 space-x-reverse">
                      <CheckIcon className="w-3 h-3" />
                      <span>موثق</span>
                    </span>
                  )}
                </div>

                {/* Category Icon */}
                <div className="absolute top-4 left-4">
                  <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <service.icon className="w-5 h-5 text-primary-500" />
                  </div>
                </div>
              </div>

              {/* Service Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Rating and Reviews */}
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <div className="flex items-center">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold ml-1">{service.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">({service.reviewCount} تقييم)</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{service.duration}</span>
                </div>

                {/* Location and Provider */}
                <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-600 mb-4">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{service.location}</span>
                  <span>•</span>
                  <span>{service.provider.name}</span>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {service.features.slice(0, 2).map((feature, idx) => (
                      <span key={idx} className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                    {service.features.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{service.features.length - 2} المزيد
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <div className="flex items-baseline space-x-2 space-x-reverse">
                      <span className="text-2xl font-bold text-primary-600">
                        {service.price} جنيه
                      </span>
                      {service.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {service.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 space-x-reverse">
                  <motion.button
                    onClick={() => handleBookService(service)}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1 space-x-reverse"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>احجز الآن</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleCallProvider(service.provider.phone)}
                    className="px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PhoneIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            عرض المزيد من الخدمات
          </motion.button>
        </motion.div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center mb-6">
              <selectedService.icon className="w-12 h-12 text-primary-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">حجز خدمة</h3>
              <h4 className="text-lg text-primary-600">{selectedService.title}</h4>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="أدخل اسمك"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وقت مفضل</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option>الصباح (9 ص - 12 م)</option>
                  <option>بعد الظهر (12 م - 5 م)</option>
                  <option>المساء (5 م - 9 م)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                ></textarea>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <motion.button
                onClick={handleBookingSubmit}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                تأكيد الحجز
              </motion.button>
              <motion.button
                onClick={() => setShowBookingModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                إلغاء
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default ServicesSection;