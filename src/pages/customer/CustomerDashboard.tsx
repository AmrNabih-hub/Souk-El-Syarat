import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingBagIcon,
  HeartIcon,
  TruckIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import { db } from '@/config/firebase.config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Order, Product } from '@/types';

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  wishlistItems: number;
  cartItems: number;
  pendingOrders: number;
  completedOrders: number;
}

const CustomerDashboard: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: wishlistItems.length,
    cartItems: cartItems.length,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders: Order[] = [];
      let totalSpent = 0;
      let pending = 0;
      let completed = 0;
      
      ordersSnapshot.forEach(doc => {
        const order = { id: doc.id, ...doc.data() } as Order;
        orders.push(order);
        totalSpent += order.totalAmount || 0;
        if (order.status === 'pending' || order.status === 'processing') pending++;
        if (order.status === 'delivered') completed++;
      });
      
      setRecentOrders(orders);
      setStats({
        totalOrders: ordersSnapshot.size,
        totalSpent,
        wishlistItems: wishlistItems.length,
        cartItems: cartItems.length,
        pendingOrders: pending,
        completedOrders: completed
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      link: '/orders'
    },
    {
      title: language === 'ar' ? 'المبلغ المنفق' : 'Total Spent',
      value: `${stats.totalSpent.toLocaleString()} ${language === 'ar' ? 'جنيه' : 'EGP'}`,
      icon: CreditCardIcon,
      color: 'bg-green-500',
      link: '/orders'
    },
    {
      title: language === 'ar' ? 'قائمة الأمنيات' : 'Wishlist Items',
      value: stats.wishlistItems,
      icon: HeartIcon,
      color: 'bg-red-500',
      link: '/wishlist'
    },
    {
      title: language === 'ar' ? 'السلة' : 'Cart Items',
      value: stats.cartItems,
      icon: ShoppingBagIcon,
      color: 'bg-purple-500',
      link: '/cart'
    }
  ];

  const quickActions = [
    {
      title: language === 'ar' ? 'تصفح المنتجات' : 'Browse Products',
      icon: ShoppingBagIcon,
      link: '/marketplace',
      color: 'text-blue-600'
    },
    {
      title: language === 'ar' ? 'تتبع الطلبات' : 'Track Orders',
      icon: TruckIcon,
      link: '/orders',
      color: 'text-green-600'
    },
    {
      title: language === 'ar' ? 'العروض الخاصة' : 'Special Offers',
      icon: StarIcon,
      link: '/offers',
      color: 'text-yellow-600'
    },
    {
      title: language === 'ar' ? 'المساعدة' : 'Help Center',
      icon: ChartBarIcon,
      link: '/help',
      color: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h1 className='text-3xl font-bold text-gray-900'>
            {language === 'ar' 
              ? `مرحباً ${user?.displayName || 'العميل'}` 
              : `Welcome back, ${user?.displayName || 'Customer'}`}
          </h1>
          <p className='text-gray-600 mt-2'>
            {language === 'ar' 
              ? 'إليك نظرة عامة على حسابك'
              : "Here's an overview of your account"}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={stat.link}
                className='block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>{stat.title}</p>
                    <p className='text-2xl font-bold text-gray-900 mt-2'>{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className='w-6 h-6 text-white' />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='lg:col-span-2'
          >
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}
                </h2>
                <Link
                  to='/orders'
                  className='text-primary-600 hover:text-primary-700 text-sm font-medium'
                >
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </Link>
              </div>
              
              {recentOrders.length > 0 ? (
                <div className='space-y-4'>
                  {recentOrders.map(order => (
                    <div
                      key={order.id}
                      className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium text-gray-900'>
                            {language === 'ar' ? 'طلب' : 'Order'} #{order.id?.slice(-8)}
                          </p>
                          <p className='text-sm text-gray-600 mt-1'>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='font-medium text-gray-900'>
                            {order.totalAmount?.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            order.status === 'delivered' 
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <ShoppingBagIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-600'>
                    {language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No orders yet'}
                  </p>
                  <Link
                    to='/marketplace'
                    className='text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block'
                  >
                    {language === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </h2>
              <div className='space-y-3'>
                {quickActions.map(action => (
                  <Link
                    key={action.title}
                    to={action.link}
                    className='flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <action.icon className={`w-5 h-5 ${action.color} mr-3`} />
                    <span className='text-gray-700 font-medium'>{action.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Activity Summary */}
            <div className='bg-white rounded-xl shadow-sm p-6 mt-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                {language === 'ar' ? 'ملخص النشاط' : 'Activity Summary'}
              </h2>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>
                    {language === 'ar' ? 'طلبات قيد التنفيذ' : 'Pending Orders'}
                  </span>
                  <span className='font-semibold text-yellow-600'>{stats.pendingOrders}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>
                    {language === 'ar' ? 'طلبات مكتملة' : 'Completed Orders'}
                  </span>
                  <span className='font-semibold text-green-600'>{stats.completedOrders}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>
                    {language === 'ar' ? 'متوسط الإنفاق' : 'Average Spending'}
                  </span>
                  <span className='font-semibold'>
                    {stats.totalOrders > 0 
                      ? Math.round(stats.totalSpent / stats.totalOrders).toLocaleString()
                      : 0} {language === 'ar' ? 'جنيه' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;