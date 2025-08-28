/**
 * 🛍️ MARKETPLACE CATEGORIES
 * Easy navigation for all product categories
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';

interface Category {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  image: string;
  count: number;
  icon: string;
  color: string;
  subcategories?: { id: string; name: { ar: string; en: string } }[];
}

const MarketplaceCategories: React.FC = () => {
  const { language } = useAppStore();

  const categories: Category[] = [
    {
      id: 'new-cars',
      name: { ar: 'سيارات جديدة', en: 'New Cars' },
      description: { ar: 'أحدث الموديلات من الوكلاء', en: 'Latest models from dealers' },
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop',
      count: 2450,
      icon: '🚗',
      color: 'from-blue-500 to-cyan-500',
      subcategories: [
        { id: 'sedan', name: { ar: 'سيدان', en: 'Sedan' } },
        { id: 'suv', name: { ar: 'دفع رباعي', en: 'SUV' } },
        { id: 'sports', name: { ar: 'رياضية', en: 'Sports' } },
        { id: 'luxury', name: { ar: 'فاخرة', en: 'Luxury' } }
      ]
    },
    {
      id: 'used-cars',
      name: { ar: 'سيارات مستعملة', en: 'Used Cars' },
      description: { ar: 'سيارات مفحوصة ومعتمدة', en: 'Inspected and certified cars' },
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop',
      count: 5680,
      icon: '🚙',
      color: 'from-green-500 to-teal-500',
      subcategories: [
        { id: 'certified', name: { ar: 'معتمدة', en: 'Certified' } },
        { id: 'under-500k', name: { ar: 'أقل من 500 ألف', en: 'Under 500K' } },
        { id: 'family', name: { ar: 'عائلية', en: 'Family' } },
        { id: 'economic', name: { ar: 'اقتصادية', en: 'Economic' } }
      ]
    },
    {
      id: 'motorcycles',
      name: { ar: 'دراجات نارية', en: 'Motorcycles' },
      description: { ar: 'دراجات رياضية وكلاسيكية', en: 'Sport and classic bikes' },
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
      count: 340,
      icon: '🏍️',
      color: 'from-red-500 to-orange-500',
      subcategories: [
        { id: 'sport-bikes', name: { ar: 'رياضية', en: 'Sport' } },
        { id: 'cruiser', name: { ar: 'كروزر', en: 'Cruiser' } },
        { id: 'scooter', name: { ar: 'سكوتر', en: 'Scooter' } },
        { id: 'electric-bikes', name: { ar: 'كهربائية', en: 'Electric' } }
      ]
    },
    {
      id: 'spare-parts',
      name: { ar: 'قطع الغيار', en: 'Spare Parts' },
      description: { ar: 'قطع أصلية وتجارية', en: 'OEM and aftermarket parts' },
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop',
      count: 12500,
      icon: '⚙️',
      color: 'from-purple-500 to-pink-500',
      subcategories: [
        { id: 'engine', name: { ar: 'المحرك', en: 'Engine' } },
        { id: 'brakes', name: { ar: 'الفرامل', en: 'Brakes' } },
        { id: 'suspension', name: { ar: 'التعليق', en: 'Suspension' } },
        { id: 'electronics', name: { ar: 'الكترونيات', en: 'Electronics' } }
      ]
    },
    {
      id: 'accessories',
      name: { ar: 'اكسسوارات', en: 'Accessories' },
      description: { ar: 'تجهيزات داخلية وخارجية', en: 'Interior and exterior accessories' },
      image: 'https://images.unsplash.com/photo-1606664515524-ed9f786b62b9?w=600&h=400&fit=crop',
      count: 8900,
      icon: '🎨',
      color: 'from-indigo-500 to-purple-500',
      subcategories: [
        { id: 'interior', name: { ar: 'داخلية', en: 'Interior' } },
        { id: 'exterior', name: { ar: 'خارجية', en: 'Exterior' } },
        { id: 'audio', name: { ar: 'صوتيات', en: 'Audio' } },
        { id: 'lighting', name: { ar: 'إضاءة', en: 'Lighting' } }
      ]
    },
    {
      id: 'services',
      name: { ar: 'خدمات', en: 'Services' },
      description: { ar: 'صيانة وإصلاح وتجميل', en: 'Maintenance, repair and detailing' },
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop',
      count: 450,
      icon: '🔧',
      color: 'from-yellow-500 to-amber-500',
      subcategories: [
        { id: 'maintenance', name: { ar: 'صيانة دورية', en: 'Maintenance' } },
        { id: 'repair', name: { ar: 'إصلاح', en: 'Repair' } },
        { id: 'detailing', name: { ar: 'تجميل', en: 'Detailing' } },
        { id: 'inspection', name: { ar: 'فحص', en: 'Inspection' } }
      ]
    },
    {
      id: 'tires-wheels',
      name: { ar: 'إطارات وجنوط', en: 'Tires & Wheels' },
      description: { ar: 'إطارات وجنوط رياضية', en: 'Tires and sport wheels' },
      image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=400&fit=crop',
      count: 3200,
      icon: '🛞',
      color: 'from-gray-600 to-gray-800',
      subcategories: [
        { id: 'summer-tires', name: { ar: 'صيفية', en: 'Summer' } },
        { id: 'winter-tires', name: { ar: 'شتوية', en: 'Winter' } },
        { id: 'alloy-wheels', name: { ar: 'جنوط رياضية', en: 'Alloy Wheels' } },
        { id: 'run-flat', name: { ar: 'رن فلات', en: 'Run Flat' } }
      ]
    },
    {
      id: 'electric',
      name: { ar: 'كهربائية', en: 'Electric' },
      description: { ar: 'سيارات ومعدات كهربائية', en: 'Electric cars and equipment' },
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&h=400&fit=crop',
      count: 180,
      icon: '⚡',
      color: 'from-teal-500 to-green-500',
      subcategories: [
        { id: 'ev-cars', name: { ar: 'سيارات كهربائية', en: 'EV Cars' } },
        { id: 'charging', name: { ar: 'شواحن', en: 'Chargers' } },
        { id: 'batteries', name: { ar: 'بطاريات', en: 'Batteries' } },
        { id: 'solar', name: { ar: 'طاقة شمسية', en: 'Solar' } }
      ]
    }
  ];

  const isArabic = language === 'ar';

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isArabic ? 'تصفح حسب الفئة' : 'Browse by Category'}
          </h2>
          <p className="text-lg text-gray-600">
            {isArabic
              ? 'اختر من بين آلاف المنتجات والخدمات المتاحة'
              : 'Choose from thousands of available products and services'}
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <Link
                to={`/marketplace?category=${category.id}`}
                className="block relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name[language]}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60 group-hover:opacity-70 transition-opacity`} />
                  
                  {/* Icon */}
                  <div className="absolute top-4 right-4 text-5xl">
                    {category.icon}
                  </div>

                  {/* Count Badge */}
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur text-gray-800 text-sm font-bold rounded-full">
                      {category.count.toLocaleString()} {isArabic ? 'منتج' : 'Products'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {category.name[language]}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.description[language]}
                  </p>

                  {/* Subcategories */}
                  {category.subcategories && (
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.slice(0, 3).map(sub => (
                        <span
                          key={sub.id}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {sub.name[language]}
                        </span>
                      ))}
                      {category.subcategories.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-600 rounded-full font-semibold">
                          +{category.subcategories.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 border-2 border-primary-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-6 bg-white rounded-2xl shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {isArabic ? 'بحث سريع' : 'Quick Search'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: { ar: 'أقل من 500 ألف', en: 'Under 500K' }, link: '/marketplace?price=0-500000' },
              { label: { ar: 'سيارات فاخرة', en: 'Luxury Cars' }, link: '/marketplace?category=luxury' },
              { label: { ar: 'قطع أصلية', en: 'OEM Parts' }, link: '/marketplace?type=oem' },
              { label: { ar: 'عروض خاصة', en: 'Special Offers' }, link: '/deals' },
              { label: { ar: 'جديد اليوم', en: 'New Today' }, link: '/marketplace?sort=newest' },
              { label: { ar: 'الأكثر مبيعاً', en: 'Best Sellers' }, link: '/marketplace?sort=popular' }
            ].map(filter => (
              <Link
                key={filter.link}
                to={filter.link}
                className="px-4 py-2 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600 rounded-full font-medium transition-all"
              >
                {filter.label[language]}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketplaceCategories;