import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  TruckIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  
  const [orders] = useState([
    {
      id: 'ORD-001',
      date: '2024-01-15',
      total: '285,000 جنيه',
      status: 'completed',
      items: [{ name: 'تويوتا كامري 2020', quantity: 1, price: '285,000' }],
      vendor: 'معرض النجمة للسيارات'
    },
    {
      id: 'ORD-002', 
      date: '2024-01-10',
      total: '1,200 جنيه',
      status: 'pending',
      items: [{ name: 'خدمة صيانة شاملة', quantity: 1, price: '1,200' }],
      vendor: 'مركز الخدمة السريعة'
    },
    {
      id: 'ORD-003',
      date: '2024-01-08', 
      total: '450 جنيه',
      status: 'delivered',
      items: [{ name: 'قطع غيار أصلية', quantity: 3, price: '450' }],
      vendor: 'مؤسسة النجاح للقطع'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100'; 
      case 'delivered': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'completed': return 'مكتمل';
      case 'pending': return 'قيد المعالجة';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return CheckCircleIcon;
      case 'pending': return ClockIcon;
      case 'delivered': return TruckIcon;
      case 'cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">يجب تسجيل الدخول أولاً</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">طلباتي</h1>
          <p className="text-gray-600">تتبع جميع طلباتك ومشترياتك</p>
        </motion.div>

        <div className="space-y-6">
          {orders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <motion.div 
                key={order.id} 
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 space-x-reverse mb-4 md:mb-0">
                    <div className="p-3 bg-primary-100 rounded-full">
                      <ShoppingBagIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">طلب رقم {order.id}</h3>
                      <p className="text-gray-600 text-sm">{new Date(order.date).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {getStatusText(order.status)}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">{order.total}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">التاجر: {order.vendor}</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-gray-900">{item.name}</span>
                            <span className="text-gray-600">({item.quantity}) - {item.price} جنيه</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 space-x-reverse">
                    <motion.button 
                      className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      عرض التفاصيل
                    </motion.button>
                    
                    {order.status === 'delivered' && (
                      <motion.button 
                        className="flex items-center px-4 py-2 border border-yellow-400 text-yellow-600 hover:bg-yellow-50 rounded-lg text-sm font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <StarIcon className="w-4 h-4 mr-2" />
                        إضافة تقييم
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {orders.length === 0 && (
          <motion.div 
            className="text-center py-16 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد طلبات بعد</h3>
            <p className="text-gray-600 mb-6">ابدأ بتصفح المنتجات وإضافة طلبات جديدة</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;