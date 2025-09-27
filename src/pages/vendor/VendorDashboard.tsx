import React from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingStorefrontIcon,
  ChartBarIcon,
  CogIcon,
  SquaresPlusIcon,
  ShoppingBagIcon,
  UsersIcon,
  BanknotesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const VendorDashboard: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuth();

  const menuItems = [
    {
      icon: SquaresPlusIcon,
      title: { ar: 'منتجاتي', en: 'My Products' },
      description: { ar: 'إدارة السيارات وقطع الغيار', en: 'Manage cars and spare parts' },
      href: '/vendor/products',
      color: 'bg-blue-500',
      badge: '24'
    },
    {
      icon: ShoppingBagIcon,
      title: { ar: 'الطلبات', en: 'Orders' },
      description: { ar: 'متابعة طلبات العملاء', en: 'Track customer orders' },
      href: '/vendor/orders',
      color: 'bg-green-500',
      badge: '7'
    },
    {
      icon: ChartBarIcon,
      title: { ar: 'التحليلات', en: 'Analytics' },
      description: { ar: 'مبيعات وإحصائيات', en: 'Sales and statistics' },
      href: '/vendor/analytics',
      color: 'bg-purple-500'
    },
    {
      icon: UsersIcon,
      title: { ar: 'العملاء', en: 'Customers' },
      description: { ar: 'إدارة قاعدة العملاء', en: 'Manage customer base' },
      href: '/vendor/customers',
      color: 'bg-orange-500'
    }
  ];

  const stats = [
    { label: { ar: 'إجمالي المبيعات', en: 'Total Sales' }, value: '₪45,680', color: 'text-green-600' },
    { label: { ar: 'المنتجات النشطة', en: 'Active Products' }, value: '24', color: 'text-blue-600' },
    { label: { ar: 'الطلبات الجديدة', en: 'New Orders' }, value: '7', color: 'text-orange-600' },
    { label: { ar: 'التقييم', en: 'Rating' }, value: '4.8★', color: 'text-yellow-600' }
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-12'
        >
          <div className='flex items-center justify-center mb-6'>
            <BuildingStorefrontIcon className='w-12 h-12 text-primary-500 mr-4' />
            <div>
              <h1 className='text-4xl font-bold text-neutral-900'>
                {language === 'ar' ? `مرحباً، ${user?.displayName || 'التاجر'}` : `Welcome, ${user?.displayName || 'Vendor'}`}
              </h1>
              <p className='text-lg text-neutral-600 mt-2'>
                {language === 'ar' ? 'لوحة تحكم المتجر' : 'Store Dashboard'}
              </p>
            </div>
          </div>
          <p className='text-xl text-neutral-600'>
            {language === 'ar'
              ? 'إدارة متجرك ومنتجاتك وطلبات العملاء'
              : 'Manage your store, products, and customer orders'}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'
            >
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className='text-sm text-neutral-600'>{stat.label[language]}</div>
            </motion.div>
          ))}
        </div>

        {/* Dashboard Menu */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Link
                to={item.href}
                className='block bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative'
              >
                <div className='flex items-start'>
                  <div className={`${item.color} p-3 rounded-lg mr-4`}>
                    <item.icon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-neutral-900 mb-2'>
                        {item.title[language]}
                      </h3>
                      {item.badge && (
                        <span className='bg-primary-500 text-white text-xs px-2 py-1 rounded-full'>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className='text-neutral-600 text-sm'>
                      {item.description[language]}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className='bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white'
          >
            <h3 className='text-xl font-bold mb-3'>
              {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
            </h3>
            <p className='opacity-90 mb-4'>
              {language === 'ar' 
                ? 'أضف سيارة أو قطعة غيار جديدة لمتجرك'
                : 'Add a new car or spare part to your store'
              }
            </p>
            <Link
              to='/vendor/products/new'
              className='inline-block bg-white text-primary-600 font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors'
            >
              {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className='bg-white rounded-xl p-6 border border-neutral-200 shadow-sm'
          >
            <div className='flex items-center mb-3'>
              <ClockIcon className='w-5 h-5 text-orange-500 mr-2' />
              <h3 className='text-lg font-semibold text-neutral-900'>
                {language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}
              </h3>
            </div>
            <div className='space-y-2'>
              {[
                { id: '#1234', customer: 'أحمد محمد', amount: '₪1,250' },
                { id: '#1235', customer: 'فاطمة علي', amount: '₪850' },
                { id: '#1236', customer: 'محمد حسن', amount: '₪2,100' }
              ].map((order, index) => (
                <div key={index} className='flex justify-between items-center py-2 border-b border-neutral-100 last:border-0'>
                  <div>
                    <div className='font-medium text-sm'>{order.id}</div>
                    <div className='text-xs text-neutral-600'>{order.customer}</div>
                  </div>
                  <div className='font-semibold text-green-600'>{order.amount}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
