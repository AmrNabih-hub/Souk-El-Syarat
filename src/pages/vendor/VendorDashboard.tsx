import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  StarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import RealTimeOrderService from '@/services/realtime-order.service';
import ProfessionalPushNotificationService from '@/services/professional-push-notification.service';
import ProfessionalChatService from '@/services/professional-chat.service';
import VendorApplicationService from '@/services/vendor-application.service';
import InventoryManagementService from '@/services/inventory-management.service';

import { Product, Order, Notification, VendorStats } from '@/types';
import { ProductService } from '@/services/product.service';
import { OrderService } from '@/services/order.service';
import { NotificationService } from '@/services/notification.service';
import { VendorService } from '@/services/vendor.service';

import { EgyptianLoader, LoadingSpinner } from '@/components/ui/CustomIcons';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import toast from 'react-hot-toast';

interface VendorDashboardStats {
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalViews: number;
  averageRating: number;
  unreadNotifications: number;
}

interface DashboardTab {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  count?: number;
}

const VendorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const { notifications, unreadNotifications } = useRealtimeStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'inventory' | 'orders' | 'analytics' | 'notifications' | 'settings' | 'application'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [vendorApplication, setVendorApplication] = useState<any>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const tabs: DashboardTab[] = [
    { id: 'overview', name: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: ChartBarIcon },
    { id: 'products', name: language === 'ar' ? 'المنتجات' : 'Products', icon: BuildingStorefrontIcon, count: stats?.totalProducts },
    { id: 'inventory', name: language === 'ar' ? 'المخزون' : 'Inventory', icon: ArchiveBoxIcon, count: inventoryStats?.totalProducts },
    { id: 'orders', name: language === 'ar' ? 'الطلبات' : 'Orders', icon: ShoppingBagIcon, count: stats?.totalOrders },
    { id: 'analytics', name: language === 'ar' ? 'التحليلات' : 'Analytics', icon: TrendingUpIcon },
    { id: 'notifications', name: language === 'ar' ? 'الإشعارات' : 'Notifications', icon: BellIcon, count: unreadNotifications },
    { id: 'application', name: language === 'ar' ? 'طلب البائع' : 'Application', icon: DocumentTextIcon },
    { id: 'settings', name: language === 'ar' ? 'الإعدادات' : 'Settings', icon: ClockIcon },
  ];

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      initializeRealTimeServices();
    }
  }, [user?.id]);

  const initializeRealTimeServices = async () => {
    try {
      // Initialize real-time order tracking
      const orderService = RealTimeOrderService.getInstance();
      await orderService.initialize();

      // Initialize push notifications
      const pushService = ProfessionalPushNotificationService.getInstance();
      await pushService.initialize();

      // Initialize chat service
      const chatService = ProfessionalChatService.getInstance();
      await chatService.initialize(user!.id);

      // Subscribe to vendor order updates
      if (orders.length > 0) {
        orders.forEach(order => {
          orderService.subscribeToOrderTracking(
            order.id,
            (orderData) => {
              // Update order in state
              setOrders(prev => prev.map(o => 
                o.id === order.id ? { ...o, status: orderData.status } : o
              ));
              
              // Show notification for new orders
              if (orderData.status === 'pending') {
                pushService.sendLocalNotification({
                  title: 'New Order Received',
                  body: `New order #${order.id.slice(-8)} from customer`,
                  category: 'order_update',
                  priority: 'high'
                });
              }
            }
          );
        });
      }

      // Subscribe to vendor notifications
      pushService.addNotificationHandler('order_update', (notification) => {
        toast.success(notification.body);
      });

    } catch (error) {
      console.error('Error initializing real-time services:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load vendor statistics
      const vendorStats = await VendorService.getVendorStats(user!.id);
      const productStats = await ProductService.getVendorProductStats(user!.id);
      const orderStats = await OrderService.getVendorOrderStats(user!.id);
      const userNotifications = await NotificationService.getUserNotifications(user!.id);

      // Load recent products
      const recentProducts = await ProductService.getVendorProducts(user!.id, { limit: 10 });

      // Load recent orders
      const recentOrders = await OrderService.getVendorOrders(user!.id, { limit: 10 });

      // Load inventory data
      const inventoryService = InventoryManagementService.getInstance();
      const inventoryData = await inventoryService.getVendorInventory(user!.id);
      const inventoryStatsData = await inventoryService.getInventoryStats(user!.id);

      // Load vendor application
      const applicationService = VendorApplicationService.getInstance();
      const userApplications = await applicationService.getUserVendorApplications(user!.id);
      const latestApplication = userApplications.length > 0 ? userApplications[0] : null;

      setStats({
        totalProducts: productStats.total,
        activeProducts: productStats.active,
        pendingProducts: productStats.pending,
        totalOrders: orderStats.total,
        pendingOrders: orderStats.pending,
        completedOrders: orderStats.completed,
        totalRevenue: orderStats.totalRevenue,
        monthlyRevenue: orderStats.monthlyRevenue,
        totalViews: productStats.totalViews,
        averageRating: productStats.averageRating,
        unreadNotifications: userNotifications.filter(n => !n.read).length,
      });

      setProducts(recentProducts);
      setOrders(recentOrders);
      setInventoryItems(inventoryData);
      setInventoryStats(inventoryStatsData);
      setVendorApplication(latestApplication);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      setIsProcessing(true);
      await OrderService.updateOrderStatus(orderId, status);
      await loadDashboardData(); // Refresh data
      toast.success(language === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(language === 'ar' ? 'خطأ في تحديث حالة الطلب' : 'Error updating order status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setIsProcessing(true);
      await ProductService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success(language === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(language === 'ar' ? 'خطأ في حذف المنتج' : 'Error deleting product');
    } finally {
      setIsProcessing(false);
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

  const getProductStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
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
            {language === 'ar' ? 'لوحة تحكم التاجر' : 'Vendor Dashboard'}
          </h1>
          <p className="text-neutral-600">
            {language === 'ar' ? 'إدارة منتجاتك وطلباتك' : 'Manage your products and orders'}
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
                  <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">
                    {language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{stats?.totalProducts || 0}</p>
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
                  <ShoppingBagIcon className="w-6 h-6 text-green-600" />
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
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">
                    {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    EGP {stats?.totalRevenue?.toLocaleString() || '0'}
                  </p>
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
                  <StarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">
                    {language === 'ar' ? 'متوسط التقييم' : 'Average Rating'}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats?.averageRating?.toFixed(1) || '0.0'}
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}
                      </h3>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        {language === 'ar' ? 'عرض الكل' : 'View All'}
                      </button>
                    </div>
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
                  </div>

                  {/* Recent Products */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {language === 'ar' ? 'المنتجات الأخيرة' : 'Recent Products'}
                      </h3>
                      <button
                        onClick={() => setActiveTab('products')}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        {language === 'ar' ? 'عرض الكل' : 'View All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.slice(0, 6).map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="aspect-w-16 aspect-h-9">
                            <OptimizedImage
                              src={product.images[0]?.url || '/placeholder-product.jpg'}
                              alt={product.title}
                              className="w-full h-32 object-cover"
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
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProductStatusColor(product.status)}`}>
                                {language === 'ar' ? 
                                  (product.status === 'active' ? 'نشط' :
                                   product.status === 'pending' ? 'قيد المراجعة' :
                                   product.status === 'rejected' ? 'مرفوض' :
                                   product.status === 'draft' ? 'مسودة' : product.status) :
                                  product.status.charAt(0).toUpperCase() + product.status.slice(1)
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                        <PlusIcon className="w-6 h-6 text-primary-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'إضافة منتج إلى متجرك' : 'Add product to your store'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('orders')}
                        className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <ShoppingBagIcon className="w-6 h-6 text-primary-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'إدارة الطلبات' : 'Manage Orders'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'تتبع ومعالجة الطلبات' : 'Track and process orders'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <ChartBarIcon className="w-6 h-6 text-primary-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'عرض التحليلات' : 'View Analytics'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'إحصائيات الأداء' : 'Performance statistics'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'products' && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}
                    </h3>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                      <PlusIcon className="w-5 h-5" />
                      <span>{language === 'ar' ? 'إضافة منتج' : 'Add Product'}</span>
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <BuildingStorefrontIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <p className="text-lg text-neutral-600 mb-2">
                        {language === 'ar' ? 'لا توجد منتجات بعد' : 'No products yet'}
                      </p>
                      <p className="text-neutral-500">
                        {language === 'ar' ? 'ابدأ بإضافة منتجات إلى متجرك' : 'Start by adding products to your store'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
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
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-lg font-semibold text-primary-600">
                                EGP {product.price.toLocaleString()}
                              </p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProductStatusColor(product.status)}`}>
                                {language === 'ar' ? 
                                  (product.status === 'active' ? 'نشط' :
                                   product.status === 'pending' ? 'قيد المراجعة' :
                                   product.status === 'rejected' ? 'مرفوض' :
                                   product.status === 'draft' ? 'مسودة' : product.status) :
                                  product.status.charAt(0).toUpperCase() + product.status.slice(1)
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-neutral-600 mb-3">
                              <span>{language === 'ar' ? 'المشاهدات' : 'Views'}: {product.views}</span>
                              <span>{language === 'ar' ? 'المفضلة' : 'Favorites'}: {product.favorites}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleProductClick(product)}
                                className="flex-1 bg-neutral-100 text-neutral-700 px-3 py-2 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center space-x-1"
                              >
                                <EyeIcon className="w-4 h-4" />
                                <span>{language === 'ar' ? 'عرض' : 'View'}</span>
                              </button>
                              <button className="flex-1 bg-primary-100 text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-200 transition-colors flex items-center justify-center space-x-1">
                                <PencilIcon className="w-4 h-4" />
                                <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                              >
                                <TrashIcon className="w-4 h-4" />
                                <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    {language === 'ar' ? 'إدارة الطلبات' : 'Order Management'}
                  </h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <p className="text-lg text-neutral-600 mb-2">
                        {language === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
                      </p>
                      <p className="text-neutral-500">
                        {language === 'ar' ? 'ستظهر طلباتك هنا' : 'Your orders will appear here'}
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

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    {language === 'ar' ? 'التحليلات والإحصائيات' : 'Analytics & Statistics'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-neutral-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">
                            {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                          </p>
                          <p className="text-2xl font-bold text-neutral-900">{stats?.totalViews || 0}</p>
                        </div>
                        <EyeIcon className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">
                            {language === 'ar' ? 'متوسط التقييم' : 'Average Rating'}
                          </p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {stats?.averageRating?.toFixed(1) || '0.0'}
                          </p>
                        </div>
                        <StarIcon className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">
                            {language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
                          </p>
                          <p className="text-2xl font-bold text-neutral-900">
                            EGP {stats?.monthlyRevenue?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <TrendingUpIcon className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  </div>
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
                              <button className="ml-4 px-3 py-1 bg-primary-600 text-white text-xs rounded-full hover:bg-primary-700 transition-colors">
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

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    {language === 'ar' ? 'إعدادات التاجر' : 'Vendor Settings'}
                  </h3>
                  
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                      {language === 'ar' ? 'معلومات المتجر' : 'Store Information'}
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          {language === 'ar' ? 'اسم المتجر' : 'Store Name'}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={language === 'ar' ? 'أدخل اسم المتجر' : 'Enter store name'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          {language === 'ar' ? 'وصف المتجر' : 'Store Description'}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={language === 'ar' ? 'أدخل وصف المتجر' : 'Enter store description'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                      {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'إشعارات الطلبات الجديدة' : 'New Order Notifications'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'تلقي إشعار عند وصول طلب جديد' : 'Get notified when new orders arrive'}
                          </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {language === 'ar' ? 'إشعارات التقييمات' : 'Review Notifications'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {language === 'ar' ? 'تلقي إشعار عند إضافة تقييم جديد' : 'Get notified when new reviews are added'}
                          </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {language === 'ar' ? 'إدارة المخزون' : 'Inventory Management'}
                    </h3>
                    <button
                      onClick={() => setShowInventoryModal(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
                    </button>
                  </div>

                  {/* Inventory Stats */}
                  {inventoryStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-neutral-200">
                        <div className="flex items-center">
                          <ArchiveBoxIcon className="h-8 w-8 text-blue-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-600">
                              {language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
                            </p>
                            <p className="text-2xl font-bold text-neutral-900">{inventoryStats.totalProducts}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-neutral-200">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-8 w-8 text-green-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-600">
                              {language === 'ar' ? 'منتجات نشطة' : 'Active Products'}
                            </p>
                            <p className="text-2xl font-bold text-neutral-900">{inventoryStats.activeProducts}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-neutral-200">
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-600">
                              {language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
                            </p>
                            <p className="text-2xl font-bold text-neutral-900">{inventoryStats.lowStockItems}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-neutral-200">
                        <div className="flex items-center">
                          <XCircleIcon className="h-8 w-8 text-red-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-600">
                              {language === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
                            </p>
                            <p className="text-2xl font-bold text-neutral-900">{inventoryStats.outOfStockItems}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inventory Items */}
                  <div className="bg-white border border-neutral-200 rounded-lg">
                    <div className="p-4 border-b border-neutral-200">
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {language === 'ar' ? 'منتجات المخزون' : 'Inventory Items'}
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              {language === 'ar' ? 'المنتج' : 'Product'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              {language === 'ar' ? 'المخزون' : 'Stock'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              {language === 'ar' ? 'السعر' : 'Price'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              {language === 'ar' ? 'الحالة' : 'Status'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                              {language === 'ar' ? 'الإجراءات' : 'Actions'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {inventoryItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img
                                      className="h-10 w-10 rounded-lg object-cover"
                                      src={item.images?.[0] || '/placeholder-product.jpg'}
                                      alt={item.productName}
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-neutral-900">
                                      {item.productName}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      {item.sku}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">
                                  {item.inventory.quantity}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  {language === 'ar' ? 'متاح' : 'Available'}: {item.inventory.availableQuantity}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">
                                  EGP {item.pricing.sellingPrice.toLocaleString()}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  {language === 'ar' ? 'التكلفة' : 'Cost'}: EGP {item.pricing.cost.toLocaleString()}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.status === 'active' ? 'bg-green-100 text-green-800' :
                                  item.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                  item.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {language === 'ar' ? 
                                    (item.status === 'active' ? 'نشط' :
                                     item.status === 'pending_approval' ? 'في انتظار الموافقة' :
                                     item.status === 'inactive' ? 'غير نشط' : item.status) :
                                    item.status.charAt(0).toUpperCase() + item.status.slice(1)
                                  }
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-primary-600 hover:text-primary-900 mr-3">
                                  {language === 'ar' ? 'تعديل' : 'Edit'}
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  {language === 'ar' ? 'حذف' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'application' && (
                <motion.div
                  key="application"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {language === 'ar' ? 'طلب البائع' : 'Vendor Application'}
                  </h3>

                  {vendorApplication ? (
                    <div className="bg-white border border-neutral-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-neutral-900">
                          {language === 'ar' ? 'حالة الطلب' : 'Application Status'}
                        </h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          vendorApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                          vendorApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          vendorApplication.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {language === 'ar' ? 
                            (vendorApplication.status === 'approved' ? 'موافق عليه' :
                             vendorApplication.status === 'rejected' ? 'مرفوض' :
                             vendorApplication.status === 'under_review' ? 'قيد المراجعة' :
                             vendorApplication.status === 'pending' ? 'في الانتظار' : vendorApplication.status) :
                            vendorApplication.status.charAt(0).toUpperCase() + vendorApplication.status.slice(1)
                          }
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {language === 'ar' ? 'اسم العمل' : 'Business Name'}
                          </label>
                          <p className="text-neutral-900">{vendorApplication.businessName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {language === 'ar' ? 'نوع العمل' : 'Business Type'}
                          </label>
                          <p className="text-neutral-900">
                            {language === 'ar' ? 
                              (vendorApplication.businessType === 'individual' ? 'فردي' : 'شركة') :
                              vendorApplication.businessType.charAt(0).toUpperCase() + vendorApplication.businessType.slice(1)
                            }
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {language === 'ar' ? 'تاريخ التقديم' : 'Submitted At'}
                          </label>
                          <p className="text-neutral-900">
                            {new Date(vendorApplication.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {vendorApplication.reviewNotes && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              {language === 'ar' ? 'ملاحظات المراجعة' : 'Review Notes'}
                            </label>
                            <p className="text-neutral-900">{vendorApplication.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
                      <DocumentTextIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                        {language === 'ar' ? 'لم يتم تقديم طلب بائع' : 'No Vendor Application'}
                      </h4>
                      <p className="text-neutral-600 mb-4">
                        {language === 'ar' ? 
                          'لم تقم بتقديم طلب بائع بعد. قم بتقديم طلبك لتصبح بائعاً في منصتنا.' :
                          'You haven\'t submitted a vendor application yet. Submit your application to become a vendor on our platform.'
                        }
                      </p>
                      <button
                        onClick={() => setShowApplicationModal(true)}
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        {language === 'ar' ? 'تقديم طلب بائع' : 'Submit Vendor Application'}
                      </button>
                    </div>
                  )}
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

                  {selectedOrder.status === 'pending' && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <h4 className="font-semibold text-neutral-900 mb-3">
                        {language === 'ar' ? 'تحديث حالة الطلب' : 'Update Order Status'}
                      </h4>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                          disabled={isProcessing}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VendorDashboard;