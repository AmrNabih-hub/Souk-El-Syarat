import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  BellIcon,
  Cog6ToothIcon,
  MapPinIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  StarIcon,
  TruckIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useRealtimeStore } from '@/stores/realtimeStore';

import { Order, Product, Notification, Address, PaymentMethod } from '@/types';
import { OrderService } from '@/services/order.service';
import { ProductService } from '@/services/product.service';
import { NotificationService } from '@/services/notification.service';
import { AuthService } from '@/services/auth.service';

import { EgyptianLoader, LoadingSpinner } from '@/components/ui/CustomIcons';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import toast from 'react-hot-toast';

interface CustomerStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
  wishlistItems: number;
  unreadNotifications: number;
}

interface DashboardTab {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  count?: number;
}

const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const { notifications, unreadNotifications } = useRealtimeStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'profile' | 'notifications' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const tabs: DashboardTab[] = [
    { id: 'overview', name: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: ChartBarIcon },
    { id: 'orders', name: language === 'ar' ? 'الطلبات' : 'Orders', icon: ShoppingBagIcon, count: stats?.totalOrders },
    { id: 'wishlist', name: language === 'ar' ? 'المفضلة' : 'Wishlist', icon: HeartIcon, count: stats?.wishlistItems },
    { id: 'profile', name: language === 'ar' ? 'الملف الشخصي' : 'Profile', icon: UserIcon },
    { id: 'notifications', name: language === 'ar' ? 'الإشعارات' : 'Notifications', icon: BellIcon, count: unreadNotifications },
    { id: 'settings', name: language === 'ar' ? 'الإعدادات' : 'Settings', icon: Cog6ToothIcon },
  ];

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load customer statistics
      const orderStats = await OrderService.getCustomerStats(user!.id);
      const wishlistItems = await ProductService.getWishlist(user!.id);
      const userNotifications = await NotificationService.getUserNotifications(user!.id);

      // Load recent orders
      const recentOrders = await OrderService.getCustomerOrders(user!.id, { limit: 10 });

      // Load user profile data
      const userProfile = await AuthService.getUserProfile(user!.id);
      const userAddresses = userProfile?.addresses || [];
      const userPaymentMethods = userProfile?.paymentMethods || [];

      setStats({
        totalOrders: orderStats.total,
        pendingOrders: orderStats.pending,
        completedOrders: orderStats.completed,
        totalSpent: orderStats.totalSpent,
        wishlistItems: wishlistItems.length,
        unreadNotifications: userNotifications.filter(n => !n.read).length,
      });

      setOrders(recentOrders);
      setWishlist(wishlistItems);
      setAddresses(userAddresses);
      setPaymentMethods(userPaymentMethods);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await ProductService.removeFromWishlist(user!.id, productId);
      setWishlist(prev => prev.filter(p => p.id !== productId));
      toast.success(language === 'ar' ? 'تم الحذف من المفضلة' : 'Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error(language === 'ar' ? 'خطأ في الحذف' : 'Error removing item');
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      toast.success(language === 'ar' ? 'تم تمييز الإشعار كمقروء' : 'Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(language === 'ar' ? 'خطأ في تحديث الإشعار' : 'Error updating notification');
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'confirmed': return CheckCircleIcon;
      case 'shipped': return TruckIcon;
      case 'delivered': return CheckCircleIcon;
      case 'cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <EgyptianLoader className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg text-neutral-600">
            {language === 'ar' ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {language === 'ar' ? 'مرحباً، ' : 'Welcome, '}{user?.name}
          </h1>
          <p className="text-neutral-600">
            {language === 'ar' ? 'إدارة طلباتك ومعلوماتك الشخصية' : 'Manage your orders and personal information'}
          </p>
        </div>

        {/* Stats Cards */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">
                    {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{stats?.totalOrders || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">
                    {language === 'ar' ? 'طلبات مكتملة' : 'Completed Orders'}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{stats?.completedOrders || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <HeartIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">
                    {language === 'ar' ? 'المفضلة' : 'Wishlist'}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{stats?.wishlistItems || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">
                    {language === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats?.totalSpent ? `EGP ${stats.totalSpent.toLocaleString()}` : 'EGP 0'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-neutral-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="bg-primary-100 text-primary-600 text-xs font-medium px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Recent Orders */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      {language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}
                    </h3>
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => {
                        const StatusIcon = getOrderStatusIcon(order.status);
                        return (
                          <div
                            key={order.id}
                            onClick={() => handleOrderClick(order)}
                            className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-white rounded-lg">
                                <StatusIcon className="w-5 h-5 text-neutral-600" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">
                                  {language === 'ar' ? 'طلب رقم' : 'Order'} #{order.id.slice(-8)}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-neutral-900">
                                EGP {order.total.toLocaleString()}
                              </p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                {language === 'ar' ? 
                                  (order.status === 'pending' ? 'قيد الانتظار' :
                                   order.status === 'confirmed' ? 'مؤكد' :
                                   order.status === 'shipped' ? 'تم الشحن' :
                                   order.status === 'delivered' ? 'تم التسليم' :
                                   order.status === 'cancelled' ? 'ملغي' : order.status) :
                                  order.status.charAt(0).toUpperCase() + order.status.slice(1)
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <ShoppingBagIcon className="w-6 h-6 text-primary-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'عرض جميع الطلبات' : 'View All Orders'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'تتبع طلباتك' : 'Track your orders'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('wishlist')}
                        className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <HeartIcon className="w-6 h-6 text-primary-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'عرض المفضلة' : 'View Wishlist'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'المنتجات المحفوظة' : 'Saved products'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('profile')}
                        className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <UserIcon className="w-6 h-6 text-primary-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'تحديث الملف الشخصي' : 'Update Profile'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'معلوماتك الشخصية' : 'Your personal info'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    {language === 'ar' ? 'جميع الطلبات' : 'All Orders'}
                  </h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <p className="text-lg text-neutral-600 mb-2">
                        {language === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
                      </p>
                      <p className="text-neutral-500">
                        {language === 'ar' ? 'ابدأ التسوق لرؤية طلباتك هنا' : 'Start shopping to see your orders here'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => {
                        const StatusIcon = getOrderStatusIcon(order.status);
                        return (
                          <div
                            key={order.id}
                            onClick={() => handleOrderClick(order)}
                            className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-neutral-100 rounded-lg">
                                <StatusIcon className="w-5 h-5 text-neutral-600" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">
                                  {language === 'ar' ? 'طلب رقم' : 'Order'} #{order.id.slice(-8)}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} {language === 'ar' ? 'عنصر' : 'items'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-neutral-900">
                                EGP {order.total.toLocaleString()}
                              </p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                {language === 'ar' ? 
                                  (order.status === 'pending' ? 'قيد الانتظار' :
                                   order.status === 'confirmed' ? 'مؤكد' :
                                   order.status === 'shipped' ? 'تم الشحن' :
                                   order.status === 'delivered' ? 'تم التسليم' :
                                   order.status === 'cancelled' ? 'ملغي' : order.status) :
                                  order.status.charAt(0).toUpperCase() + order.status.slice(1)
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    {language === 'ar' ? 'قائمة المفضلة' : 'Wishlist'}
                  </h3>
                  {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                      <HeartIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <p className="text-lg text-neutral-600 mb-2">
                        {language === 'ar' ? 'قائمة المفضلة فارغة' : 'Wishlist is empty'}
                      </p>
                      <p className="text-neutral-500">
                        {language === 'ar' ? 'أضف منتجات إلى المفضلة لرؤيتها هنا' : 'Add products to wishlist to see them here'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlist.map((product) => (
                        <div key={product.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-w-16 aspect-h-9">
                            <OptimizedImage
                              src={product.images[0]?.url || '/placeholder-product.jpg'}
                              alt={product.title}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-neutral-900 mb-2 line-clamp-2">
                              {product.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-semibold text-primary-600">
                                EGP {product.price.toLocaleString()}
                              </p>
                              <button
                                onClick={() => handleRemoveFromWishlist(product.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </h3>
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <BellIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <p className="text-lg text-neutral-600 mb-2">
                        {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                      </p>
                      <p className="text-neutral-500">
                        {language === 'ar' ? 'ستظهر إشعاراتك هنا' : 'Your notifications will appear here'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.read 
                              ? 'bg-white border-neutral-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-sm text-neutral-600 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkNotificationAsRead(notification.id)}
                                className="ml-4 px-3 py-1 bg-primary-600 text-white text-xs rounded-full hover:bg-primary-700 transition-colors"
                              >
                                {language === 'ar' ? 'تمييز كمقروء' : 'Mark as read'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    {language === 'ar' ? 'الملف الشخصي' : 'Profile Information'}
                  </h3>
                  
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-neutral-900">{user?.name}</h4>
                        <p className="text-neutral-600">{user?.email}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {language === 'ar' ? 'عميل' : 'Customer'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                        </label>
                        <input
                          type="text"
                          value={user?.name || ''}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {language === 'ar' ? 'العناوين المحفوظة' : 'Saved Addresses'}
                      </h4>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        {language === 'ar' ? 'إضافة عنوان' : 'Add Address'}
                      </button>
                    </div>
                    {addresses.length === 0 ? (
                      <p className="text-neutral-500 text-center py-4">
                        {language === 'ar' ? 'لا توجد عناوين محفوظة' : 'No saved addresses'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg">
                            <MapPinIcon className="w-5 h-5 text-neutral-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900">{address.label}</p>
                              <p className="text-sm text-neutral-600">{address.fullAddress}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
                      </h4>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        {language === 'ar' ? 'إضافة طريقة دفع' : 'Add Payment Method'}
                      </button>
                    </div>
                    {paymentMethods.length === 0 ? (
                      <p className="text-neutral-500 text-center py-4">
                        {language === 'ar' ? 'لا توجد طرق دفع محفوظة' : 'No saved payment methods'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {paymentMethods.map((method, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                            <CreditCardIcon className="w-5 h-5 text-neutral-400" />
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900">{method.type}</p>
                              <p className="text-sm text-neutral-600">**** **** **** {method.last4}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    {language === 'ar' ? 'الإعدادات' : 'Settings'}
                  </h3>
                  
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                      {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'تلقي إشعارات عبر البريد الإلكتروني' : 'Receive notifications via email'}
                          </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'إشعارات الدفع' : 'Push Notifications'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'تلقي إشعارات فورية' : 'Receive instant notifications'}
                          </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                      {language === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'}
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'مشاركة البيانات' : 'Data Sharing'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'السماح بمشاركة البيانات للتحسين' : 'Allow data sharing for improvements'}
                          </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 text-primary-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Details Modal */}
        <AnimatePresence>
          {orderModalOpen && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setOrderModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-neutral-900">
                      {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
                    </h3>
                    <button
                      onClick={() => setOrderModalOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {language === 'ar' ? 'رقم الطلب' : 'Order Number'}
                      </span>
                      <span className="font-medium">#{selectedOrder.id.slice(-8)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {language === 'ar' ? 'التاريخ' : 'Date'}
                      </span>
                      <span className="font-medium">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrder.status)}`}>
                        {language === 'ar' ? 
                          (selectedOrder.status === 'pending' ? 'قيد الانتظار' :
                           selectedOrder.status === 'confirmed' ? 'مؤكد' :
                           selectedOrder.status === 'shipped' ? 'تم الشحن' :
                           selectedOrder.status === 'delivered' ? 'تم التسليم' :
                           selectedOrder.status === 'cancelled' ? 'ملغي' : selectedOrder.status) :
                          selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {language === 'ar' ? 'المجموع' : 'Total'}
                      </span>
                      <span className="font-semibold text-lg">
                        EGP {selectedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold text-neutral-900 mb-3">
                      {language === 'ar' ? 'عناصر الطلب' : 'Order Items'}
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                          <OptimizedImage
                            src={item.image || '/placeholder-product.jpg'}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900">{item.name}</p>
                            <p className="text-sm text-neutral-600">
                              {language === 'ar' ? 'الكمية' : 'Quantity'}: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-neutral-900">
                            EGP {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomerDashboard;