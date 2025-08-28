/**
 * 💎 PREMIUM PRODUCTS SECTION
 * Showcasing luxury cars, parts, and services with real data
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import {
  SparklesIcon,
  TruckIcon,
  CogIcon,
  WrenchIcon,
  BoltIcon,
  ShieldCheckIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface ProductCategory {
  id: string;
  name: { ar: string; en: string };
  icon: React.ElementType;
  count: number;
  featured: Product[];
}

interface Product {
  id: string;
  name: { ar: string; en: string };
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: { ar: string; en: string };
  rating: number;
  reviews: number;
  specs?: { ar: string[]; en: string[] };
  inStock: boolean;
}

const PremiumProducts: React.FC = () => {
  const { language } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('luxury-cars');

  const categories: ProductCategory[] = [
    {
      id: 'luxury-cars',
      name: { ar: 'سيارات فاخرة', en: 'Luxury Cars' },
      icon: SparklesIcon,
      count: 156,
      featured: [
        {
          id: 'merc-s500',
          name: { ar: 'مرسيدس S500 2024', en: 'Mercedes S500 2024' },
          brand: 'Mercedes-Benz',
          price: 3500000,
          originalPrice: 3800000,
          image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop',
          badge: { ar: 'عرض خاص', en: 'Special Offer' },
          rating: 4.9,
          reviews: 127,
          specs: {
            ar: ['محرك V8 4.0L', '463 حصان', '0-100: 4.9 ثانية', 'دفع رباعي'],
            en: ['V8 4.0L Engine', '463 HP', '0-100: 4.9s', '4MATIC AWD']
          },
          inStock: true
        },
        {
          id: 'bmw-750',
          name: { ar: 'بي إم دبليو 750Li', en: 'BMW 750Li' },
          brand: 'BMW',
          price: 3200000,
          image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
          rating: 4.8,
          reviews: 89,
          specs: {
            ar: ['محرك V8 4.4L', '530 حصان', 'نظام iDrive 8', 'مقاعد تدليك'],
            en: ['V8 4.4L Engine', '530 HP', 'iDrive 8', 'Massage Seats']
          },
          inStock: true
        },
        {
          id: 'audi-a8',
          name: { ar: 'أودي A8 L', en: 'Audi A8 L' },
          brand: 'Audi',
          price: 2900000,
          originalPrice: 3100000,
          image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&h=600&fit=crop',
          badge: { ar: 'توفير 200,000', en: 'Save 200,000' },
          rating: 4.7,
          reviews: 65,
          specs: {
            ar: ['محرك V6 3.0L', 'هايبرد معتدل', 'مصفوفة LED', 'قيادة ذاتية'],
            en: ['V6 3.0L Engine', 'Mild Hybrid', 'Matrix LED', 'Self Driving']
          },
          inStock: true
        }
      ]
    },
    {
      id: 'sports-cars',
      name: { ar: 'سيارات رياضية', en: 'Sports Cars' },
      icon: BoltIcon,
      count: 89,
      featured: [
        {
          id: 'porsche-911',
          name: { ar: 'بورش 911 توربو', en: 'Porsche 911 Turbo' },
          brand: 'Porsche',
          price: 4500000,
          image: 'https://images.unsplash.com/photo-1614162691292-7ac56d7f7f1e?w=800&h=600&fit=crop',
          badge: { ar: 'جديد', en: 'New' },
          rating: 5.0,
          reviews: 45,
          specs: {
            ar: ['محرك بوكسر 3.7L', '572 حصان', '0-100: 2.8 ثانية', 'PDK جير'],
            en: ['3.7L Boxer Engine', '572 HP', '0-100: 2.8s', 'PDK Transmission']
          },
          inStock: true
        },
        {
          id: 'ferrari-f8',
          name: { ar: 'فيراري F8 تريبوتو', en: 'Ferrari F8 Tributo' },
          brand: 'Ferrari',
          price: 8500000,
          image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&h=600&fit=crop',
          rating: 5.0,
          reviews: 23,
          specs: {
            ar: ['محرك V8 3.9L توين توربو', '710 حصان', '0-100: 2.9 ثانية', '340 كم/س'],
            en: ['V8 3.9L Twin Turbo', '710 HP', '0-100: 2.9s', '340 km/h']
          },
          inStock: false
        },
        {
          id: 'lambo-huracan',
          name: { ar: 'لامبورجيني هوراكان', en: 'Lamborghini Huracán' },
          brand: 'Lamborghini',
          price: 7200000,
          image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
          rating: 4.9,
          reviews: 34,
          specs: {
            ar: ['محرك V10 5.2L', '640 حصان', 'دفع رباعي', 'نظام ANIMA'],
            en: ['V10 5.2L Engine', '640 HP', 'AWD', 'ANIMA System']
          },
          inStock: true
        }
      ]
    },
    {
      id: 'premium-parts',
      name: { ar: 'قطع غيار فاخرة', en: 'Premium Parts' },
      icon: CogIcon,
      count: 1250,
      featured: [
        {
          id: 'amg-exhaust',
          name: { ar: 'عادم AMG Performance', en: 'AMG Performance Exhaust' },
          brand: 'Mercedes-AMG',
          price: 45000,
          originalPrice: 52000,
          image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
          badge: { ar: 'خصم 15%', en: '15% OFF' },
          rating: 4.8,
          reviews: 67,
          specs: {
            ar: ['تيتانيوم', 'صوت قابل للتعديل', 'زيادة 15 حصان', 'ضمان سنتين'],
            en: ['Titanium', 'Adjustable Sound', '+15 HP', '2 Year Warranty']
          },
          inStock: true
        },
        {
          id: 'brembo-brakes',
          name: { ar: 'فرامل بريمبو GT', en: 'Brembo GT Brakes' },
          brand: 'Brembo',
          price: 85000,
          image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
          rating: 5.0,
          reviews: 112,
          specs: {
            ar: ['6 بستم', 'أقراص كربون', 'مقاوم للحرارة', 'أداء سباقات'],
            en: ['6 Piston', 'Carbon Discs', 'Heat Resistant', 'Racing Performance']
          },
          inStock: true
        },
        {
          id: 'kw-suspension',
          name: { ar: 'معاونات KW V3', en: 'KW V3 Coilovers' },
          brand: 'KW Suspensions',
          price: 65000,
          image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
          rating: 4.9,
          reviews: 89,
          specs: {
            ar: ['قابل للتعديل', 'ألمانية الصنع', 'رياضي/مريح', 'ضمان 5 سنوات'],
            en: ['Adjustable', 'German Made', 'Sport/Comfort', '5 Year Warranty']
          },
          inStock: true
        }
      ]
    },
    {
      id: 'services',
      name: { ar: 'خدمات متميزة', en: 'Premium Services' },
      icon: WrenchIcon,
      count: 45,
      featured: [
        {
          id: 'ppf-full',
          name: { ar: 'حماية كاملة PPF', en: 'Full PPF Protection' },
          brand: 'XPEL',
          price: 25000,
          image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop',
          badge: { ar: 'الأكثر طلباً', en: 'Most Popular' },
          rating: 4.9,
          reviews: 234,
          specs: {
            ar: ['حماية 10 سنوات', 'ضد الخدوش', 'شفاف 100%', 'ضمان مدى الحياة'],
            en: ['10 Year Protection', 'Scratch Proof', '100% Clear', 'Lifetime Warranty']
          },
          inStock: true
        },
        {
          id: 'ceramic-pro',
          name: { ar: 'سيراميك احترافي', en: 'Professional Ceramic' },
          brand: 'Ceramic Pro',
          price: 15000,
          originalPrice: 18000,
          image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop',
          rating: 4.8,
          reviews: 189,
          specs: {
            ar: ['9 طبقات', 'نانو تكنولوجي', 'لمعان دائم', 'حماية UV'],
            en: ['9 Layers', 'Nano Technology', 'Permanent Shine', 'UV Protection']
          },
          inStock: true
        },
        {
          id: 'stage-2-tune',
          name: { ar: 'برمجة Stage 2', en: 'Stage 2 ECU Tune' },
          brand: 'APR',
          price: 35000,
          image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop',
          rating: 4.7,
          reviews: 78,
          specs: {
            ar: ['+80 حصان', '+120 عزم', 'توفير وقود', 'ضمان المحرك'],
            en: ['+80 HP', '+120 Torque', 'Fuel Saving', 'Engine Warranty']
          },
          inStock: true
        }
      ]
    }
  ];

  const activeProducts = categories.find(cat => cat.id === activeCategory);
  const isArabic = language === 'ar';

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {isArabic ? 'منتجات وخدمات مميزة' : 'Premium Products & Services'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {isArabic
              ? 'اكتشف مجموعتنا الحصرية من السيارات الفاخرة وقطع الغيار الأصلية والخدمات الاحترافية'
              : 'Discover our exclusive collection of luxury vehicles, genuine parts, and professional services'}
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all ${
                activeCategory === category.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <category.icon className="w-5 h-5" />
              <span>{category.name[language]}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {category.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          {activeProducts && (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {activeProducts.featured.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                        {product.badge[language]}
                      </span>
                    </div>
                  )}

                  {/* Stock Status */}
                  {!product.inStock && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 bg-gray-800 text-white text-sm font-bold rounded-full">
                        {isArabic ? 'نفذ المخزون' : 'Out of Stock'}
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name[language]}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Brand */}
                    <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">
                      {product.brand}
                    </p>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {product.name[language]}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating) ? 'fill-current' : ''
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>

                    {/* Specs */}
                    {product.specs && (
                      <ul className="space-y-1 mb-4">
                        {product.specs[language].slice(0, 2).map((spec, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center">
                            <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-2" />
                            {spec}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-primary-600">
                          {product.price.toLocaleString()} {isArabic ? 'ج.م' : 'EGP'}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            {product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${product.id}`}
                        className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-center font-semibold rounded-lg transition-all"
                      >
                        {isArabic ? 'عرض التفاصيل' : 'View Details'}
                      </Link>
                      <button
                        disabled={!product.inStock}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          product.inStock
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isArabic ? 'أضف للسلة' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to={`/marketplace?category=${activeCategory}`}
            className="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg hover:shadow-xl transition-all"
          >
            {isArabic ? 'عرض جميع المنتجات' : 'View All Products'}
            <ArrowRightIcon className={`w-5 h-5 ${isArabic ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumProducts;