import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  total: number;
  estimatedDelivery?: string;
}

const OrdersPage: React.FC = () => {
  const { language } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');
  
  // Mock data - replace with actual API call
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      date: '2024-01-15',
      status: 'delivered',
      items: [
        { name: 'BMW X5 2020', quantity: 1, price: 450000, image: '/api/placeholder/100/100' }
      ],
      total: 450000,
      estimatedDelivery: '2024-01-20'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      date: '2024-01-20',
      status: 'shipped',
      items: [
        { name: 'Mercedes Engine Oil Filter', quantity: 2, price: 150, image: '/api/placeholder/100/100' },
        { name: 'Brake Pads Set', quantity: 1, price: 800, image: '/api/placeholder/100/100' }
      ],
      total: 1100,
      estimatedDelivery: '2024-01-25'
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      date: '2024-01-22',
      status: 'processing',
      items: [
        { name: 'Toyota Camry Headlight', quantity: 1, price: 1200, image: '/api/placeholder/100/100' }
      ],
      total: 1200,
      estimatedDelivery: '2024-01-30'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'processing': return ClockIcon;
      case 'shipped': return TruckIcon;
      case 'delivered': return CheckCircleIcon;
      case 'cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(order => order.status === filter);

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-8'
        >
          <h1 className='text-4xl font-bold text-neutral-900 mb-4'>
            {language === 'ar' ? 'طلباتي' : 'My Orders'}
          </h1>
          <p className='text-xl text-neutral-600'>
            {language === 'ar' ? 'تتبع جميع طلباتك وحالة التسليم' : 'Track all your orders and delivery status'}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8'
        >
          <div className='flex flex-wrap gap-4'>
            {[
              { key: 'all', label: { ar: 'الكل', en: 'All' } },
              { key: 'pending', label: { ar: 'معلق', en: 'Pending' } },
              { key: 'processing', label: { ar: 'قيد المعالجة', en: 'Processing' } },
              { key: 'shipped', label: { ar: 'تم الشحن', en: 'Shipped' } },
              { key: 'delivered', label: { ar: 'تم التسليم', en: 'Delivered' } },
              { key: 'cancelled', label: { ar: 'ملغي', en: 'Cancelled' } }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === filterOption.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {filterOption.label[language]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Orders List */}
        <div className='space-y-6'>
          {filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-neutral-900 mb-1'>
                      {order.orderNumber}
                    </h3>
                    <p className='text-sm text-neutral-600'>
                      {language === 'ar' ? 'تاريخ الطلب:' : 'Order Date:'} {order.date}
                    </p>
                  </div>
                  
                  <div className='flex items-center space-x-3'>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <StatusIcon className='w-4 h-4 mr-1' />
                      {language === 'ar' 
                        ? ({ pending: 'معلق', processing: 'قيد المعالجة', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' })[order.status]
                        : order.status.charAt(0).toUpperCase() + order.status.slice(1)
                      }
                    </span>
                    <button className='p-2 text-neutral-600 hover:text-primary-600 transition-colors'>
                      <EyeIcon className='w-5 h-5' />
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className='space-y-3 mb-4'>
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className='flex items-center p-3 bg-neutral-50 rounded-lg'>
                      <img
                        src={item.image}
                        alt={item.name}
                        className='w-12 h-12 object-cover rounded-md mr-4'
                      />
                      <div className='flex-1'>
                        <h4 className='font-medium text-neutral-900'>{item.name}</h4>
                        <p className='text-sm text-neutral-600'>
                          {language === 'ar' ? 'الكمية:' : 'Quantity:'} {item.quantity}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold text-neutral-900'>
                          {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 0,
                          }).format(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className='flex items-center justify-between pt-4 border-t border-neutral-200'>
                  <div>
                    {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <p className='text-sm text-neutral-600'>
                        {language === 'ar' ? 'التسليم المتوقع:' : 'Estimated Delivery:'} {order.estimatedDelivery}
                      </p>
                    )}
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-neutral-600 mb-1'>
                      {language === 'ar' ? 'المجموع:' : 'Total:'}
                    </p>
                    <p className='text-xl font-bold text-neutral-900'>
                      {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 0,
                      }).format(order.total)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-16'
          >
            <TruckIcon className='w-16 h-16 text-neutral-300 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
              {language === 'ar' ? 'لا توجد طلبات' : 'No Orders Found'}
            </h3>
            <p className='text-neutral-600 mb-6'>
              {language === 'ar' 
                ? 'لم تقم بأي طلبات بعد. ابدأ التسوق الآن!'
                : "You haven't placed any orders yet. Start shopping now!"
              }
            </p>
            <button className='btn btn-primary'>
              {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;