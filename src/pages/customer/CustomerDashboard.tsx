import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBagIcon,
  HeartIcon,
  ClockIcon,
  UserCircleIcon,
  CogIcon,
  BellIcon,
  ChartBarIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import { CustomerStatsService, CustomerStats } from '@/services/customer-stats.service';

const CustomerDashboard: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load REAL stats from database
  useEffect(() => {
    async function loadStats() {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const realStats = await CustomerStatsService.getCustomerStats(user.id);
        setStats(realStats);
      } catch (error) {
        console.error('[CustomerDashboard] Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [user?.id]);

  const menuItems = [
    {
      icon: ShoppingBagIcon,
      title: { ar: 'طلباتي', en: 'My Orders' },
      description: { ar: 'تتبع طلباتك وحالة التسليم', en: 'Track your orders and delivery status' },
      href: '/dashboard/orders',
      color: 'bg-blue-500'
    },
    {
      icon: HeartIcon,
      title: { ar: 'المفضلة', en: 'Favorites' },
      description: { ar: 'السيارات وقطع الغيار المحفوظة', en: 'Saved cars and spare parts' },
      href: '/dashboard/favorites',
      color: 'bg-red-500'
    },
    {
      icon: ClockIcon,
      title: { ar: 'المشاهدة الأخيرة', en: 'Recently Viewed' },
      description: { ar: 'المنتجات التي شاهدتها مؤخراً', en: 'Products you viewed recently' },
      href: '/dashboard/recent',
      color: 'bg-purple-500'
    },
    {
      icon: UserCircleIcon,
      title: { ar: 'الملف الشخصي', en: 'Profile' },
      description: { ar: 'إدارة معلوماتك الشخصية', en: 'Manage your personal information' },
      href: '/profile',
      color: 'bg-green-500'
    }
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
          <h1 className='text-4xl font-bold text-neutral-900 mb-4'>
            {language === 'ar' ? `أهلاً بك، ${user?.displayName || 'العميل'}` : `Welcome, ${user?.displayName || 'Customer'}`}
          </h1>
          <p className='text-xl text-neutral-600'>
            {language === 'ar'
              ? 'إدارة حسابك واستعرض طلباتك ومفضلتك'
              : 'Manage your account, orders, and favorites'}
          </p>
        </motion.div>

        {/* Stats Cards - REAL DATA */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
          {[
            { label: { ar: 'الطلبات النشطة', en: 'Active Orders' }, value: stats?.activeOrders || 0, color: 'text-blue-600' },
            { label: { ar: 'المفضلة', en: 'Favorites' }, value: stats?.favorites || 0, color: 'text-red-600' },
            { label: { ar: 'النقاط', en: 'Points' }, value: stats?.points.toLocaleString() || '0', color: 'text-green-600' },
            { label: { ar: 'الطلبات المكتملة', en: 'Completed' }, value: stats?.completedOrders || 0, color: 'text-purple-600' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'
            >
              <div className={`text-2xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className='text-sm text-neutral-600'>{stat.label[language]}</div>
            </motion.div>
          ))}
        </div>

        {/* Dashboard Menu */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Link
                to={item.href}
                className='block bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300'
              >
                <div className='flex items-start'>
                  <div className={`${item.color} p-3 rounded-lg mr-4`}>
                    <item.icon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-neutral-900 mb-2'>
                      {item.title[language]}
                    </h3>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className='mt-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-8 text-white text-center'
        >
          <h2 className='text-2xl font-bold mb-4'>
            {language === 'ar' ? 'هل تبحث عن سيارة جديدة؟' : 'Looking for a new car?'}
          </h2>
          <p className='text-xl opacity-90 mb-6'>
            {language === 'ar' 
              ? 'استعرض آلاف السيارات وقطع الغيار من تجار موثوقين'
              : 'Browse thousands of cars and spare parts from trusted vendors'
            }
          </p>
          <Link
            to='/marketplace'
            className='inline-block bg-white text-primary-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors'
          >
            {language === 'ar' ? 'تصفح السوق' : 'Browse Marketplace'}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
