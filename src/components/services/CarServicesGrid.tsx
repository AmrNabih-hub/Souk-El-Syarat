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
  ShoppingCartIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { realCarServices } from '@/data/real-market-data';
import { useAppStore } from '@/stores/appStore';

const CarServicesGrid: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { addToCart, addToFavorites, removeFromFavorites, isFavorite, favorites, getCartItemsCount } = useAppStore();

  // Use real services data
  const services = realCarServices.slice(0, 8); // Show first 8 services

  // Enhanced add to cart functionality with real-time sync
  const handleAddToCart = async (service: typeof realCarServices[0]) => {
    try {
      await addToCart({
        productId: service.id,
        name: service.title,
        price: parseFloat(service.price.replace(/[^\d]/g, '')),
        image: service.image,
        category: 'service',
        quantity: 1,
        addedAt: new Date()
      });
      toast.success(`تم إضافة ${service.title} إلى السلة`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('فشل في إضافة المنتج إلى السلة');
    }
  };

  // Enhanced wishlist functionality with real-time sync
  const handleToggleFavorite = async (service: typeof realCarServices[0]) => {
    const isCurrentlyFavorite = isFavorite(service.id);
    
    try {
      if (isCurrentlyFavorite) {
        await removeFromFavorites(service.id);
        toast.success(`تم إزالة ${service.title} من المفضلة`);
      } else {
        await addToFavorites(service.id);
        toast.success(`تم إضافة ${service.title} إلى المفضلة`);
      }
    } catch (error) {
      console.error('Failed to update favorites:', error);
      toast.error('فشل في تحديث المفضلة');
    }
  };

  // Get icon for service based on title
  const getServiceIcon = (title: string) => {
    if (title.includes('غسيل')) return SparklesIcon;
    if (title.includes('فيلم') || title.includes('حماية')) return ShieldCheckIcon;
    if (title.includes('صيانة')) return WrenchScrewdriverIcon;
    if (title.includes('تلميع') || title.includes('سيراميك')) return SparklesIcon;
    return TruckIcon;
  };

  const handleBookService = (service: any) => {
    toast.success(`تم حجز ${service.title} بنجاح! سيتم التواصل معك خلال 15 دقيقة`);
    setSelectedService(service.id);
  };

  const handleCallProvider = (phone: string, serviceName: string) => {
    toast.success(`جاري الاتصال بمقدم خدمة ${serviceName}`);
    window.open(`tel:${phone}`);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            🚗 خدمات السيارات المتكاملة
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            قطع غيار أصلية • خدمات صيانة احترافية • إكسسوارات عالية الجودة • حجز فوري
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center items-center space-x-8 space-x-reverse mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">8</div>
              <div className="text-sm text-gray-600">خدمات متخصصة</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">4.8⭐</div>
              <div className="text-sm text-gray-600">متوسط التقييم</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">2500+</div>
              <div className="text-sm text-gray-600">عميل راضي</div>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Image & Badge */}
              <div className="relative">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  متوفر الآن
                </div>
                {service.originalPrice && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    خصم {Math.round((1 - parseInt(service.price.split(' ')[0]) / parseInt(service.originalPrice.split(' ')[0])) * 100)}%
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
                  <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs font-semibold ml-1">{service.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center mb-2">
                  {React.createElement(getServiceIcon(service.title), { className: "w-5 h-5 text-primary-500 mr-2" })}
                  <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                
                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline space-x-2 space-x-reverse">
                    <span className="text-2xl font-bold text-primary-600">{service.price}</span>
                    {service.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">{service.originalPrice}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1 mb-4">
                  {service.features.slice(0, 2).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Provider & Duration */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    <span className="truncate">{service.provider}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    <span>{service.duration}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Top row - Add to Cart and Wishlist */}
                  <div className="flex space-x-2 space-x-reverse">
                    <motion.button
                      onClick={() => handleAddToCart(service)}
                      className="flex-1 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ShoppingCartIcon className="w-4 h-4 mr-1" />
                      أضف للسلة
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleToggleFavorite(service)}
                      className="px-3 py-2 border border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                                             {isFavorite(service.id) ? (
                         <HeartSolidIcon className="w-4 h-4 text-red-500" />
                       ) : (
                         <HeartIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                       )}
                    </motion.button>
                  </div>

                  {/* Bottom row - Book and Call */}
                  <div className="flex space-x-2 space-x-reverse">
                    <motion.button
                      onClick={() => handleBookService(service)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                        selectedService === service.id 
                          ? 'bg-green-500 text-white' 
                          : 'bg-secondary-500 hover:bg-secondary-600 text-white'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={selectedService === service.id}
                    >
                      {selectedService === service.id ? (
                        <div className="flex items-center justify-center">
                          <CheckIcon className="w-4 h-4 mr-1" />
                          تم الحجز
                        </div>
                      ) : (
                        'احجز الآن'
                      )}
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleCallProvider(service.phone, service.title)}
                      className="px-3 py-2 border border-secondary-500 text-secondary-500 hover:bg-secondary-50 rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PhoneIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Special Offer Banner */}
        <motion.div 
          className="bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600 text-white p-8 rounded-2xl text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-3xl font-bold mb-4">🎉 عرض خاص محدود</h3>
          <p className="text-xl mb-6">احجز أي خدمتين واحصل على خصم 25% + ضمان مجاني لمدة 6 أشهر</p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-lg">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-6 h-6 mr-2" />
              <span>ضمان شامل</span>
            </div>
            <div className="flex items-center">
              <TruckIcon className="w-6 h-6 mr-2" />
              <span>توصيل مجاني</span>
            </div>
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2" />
              <span>جودة متميزة</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-6 h-6 mr-2" />
              <span>خدمة 24/7</span>
            </div>
          </div>
          <motion.div 
            className="mt-6"
            whileHover={{ scale: 1.05 }}
          >
            <button className="bg-white text-primary-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              🔥 احجز الآن واستفد من العرض
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CarServicesGrid;