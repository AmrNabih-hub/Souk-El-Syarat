import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartIcon, EyeIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const WishlistPage: React.FC = () => {
  const { user } = useAuthStore();

  // Mock wishlist data
  const wishlistItems = [
    {
      id: '1', carId: '1', title: 'تويوتا كامري 2021', price: '285,000',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      location: 'الجيزة', vendor: 'شركة الأمان'
    },
    {
      id: '2', carId: '2', title: 'مرسيدس E200 2020', price: '450,000',
      image: 'https://images.unsplash.com/photo-1606016937473-509d8ff3b4a9?w=400&h=300&fit=crop',
      location: 'القاهرة', vendor: 'معرض الفخامة'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div className="text-center bg-white p-8 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">يجب تسجيل الدخول أولاً</h2>
          <p className="text-gray-600 mb-6">تحتاج إلى تسجيل الدخول لعرض قائمة المفضلة</p>
          <Link to="/login" className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">
            تسجيل الدخول
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <HeartIcon className="w-8 h-8 text-red-500 mr-3 fill-current" />
            قائمة المفضلة
          </h1>
          <p className="text-xl text-gray-600">لديك {wishlistItems.length} سيارة في قائمة المفضلة</p>
        </motion.div>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item, index) => (
              <motion.div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-2">{item.location} - {item.vendor}</p>
                  <div className="text-2xl font-bold text-primary-600 mb-4">{item.price} جنيه</div>
                  
                  <div className="flex space-x-2 space-x-reverse mb-3">
                    <Link to={`/product/${item.carId}`} 
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg text-center transition-colors">
                      <div className="flex items-center justify-center space-x-1 space-x-reverse">
                        <EyeIcon className="w-4 h-4" />
                        <span>عرض التفاصيل</span>
                      </div>
                    </Link>
                    <motion.button onClick={() => toast.success('تم إضافة للسلة')}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <ShoppingCartIcon className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <motion.button onClick={() => toast.success('تم الحذف من المفضلة')}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <div className="flex items-center justify-center space-x-1 space-x-reverse">
                      <TrashIcon className="w-4 h-4" />
                      <span>حذف من المفضلة</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div className="text-center py-20 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <HeartIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">قائمة المفضلة فارغة</h3>
            <p className="text-gray-600 mb-8">ابدأ في إضافة السيارات التي تعجبك إلى قائمة المفضلة</p>
            <Link to="/marketplace" className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">
              تصفح السيارات المتاحة
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;