import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  TruckIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { realTimeService } from '@/services/realtime-websocket.service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface VendorStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  monthlyGrowth: number;
  recentOrders: Order[];
  topProducts: Product[];
  customerSatisfaction: number;
}

interface Order {
  id: string;
  customerName: string;
  productName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  deliveryDate?: Date;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  category: string;
  images: string[];
  views: number;
}

interface Notification {
  id: string;
  type: 'new_order' | 'low_stock' | 'review' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
}

const EnhancedVendorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'analytics' | 'notifications'>('overview');
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadDashboardData();
    setupRealTimeUpdates();
    
    return () => {
      // Cleanup WebSocket listeners
      realTimeService.destroy();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - in production this would come from API
      const mockStats: VendorStats = {
        totalOrders: 125,
        totalRevenue: 87500,
        totalProducts: 45,
        pendingOrders: 8,
        monthlyGrowth: 12.5,
        recentOrders: generateMockOrders(),
        topProducts: generateMockProducts(),
        customerSatisfaction: 4.7
      };

      const mockProducts = generateMockProducts(20);
      const mockOrders = generateMockOrders(50);
      const mockNotifications = generateMockNotifications();

      setStats(mockStats);
      setProducts(mockProducts);
      setOrders(mockOrders);
      setNotifications(mockNotifications);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    // Subscribe to WebSocket connection status
    const unsubscribeConnection = realTimeService.subscribe('connection', (data) => {
      setIsConnected(data.status === 'connected');
      if (data.status === 'connected') {
        toast.success('🔌 متصل - سيتم تحديث البيانات في الوقت الفعلي');
      }
    });

    // Subscribe to vendor-specific stats updates
    const unsubscribeStats = realTimeService.subscribeToVendorStats(user?.id || 'vendor1', (newStats) => {
      setStats(newStats);
      toast.success('📊 تم تحديث الإحصائيات', { duration: 2000 });
    });

    // Subscribe to admin notifications for vendor approvals
    const unsubscribeNotifications = realTimeService.subscribeToAdminNotifications((notification) => {
      if (notification.type === 'vendor_status_update') {
        toast.success('تم تحديث حالة الحساب!');
        loadDashboardData(); // Refresh data
      }
    });

    // Start simulating real-time data for demo
    realTimeService.simulateVendorStats(user?.id || 'vendor1');

    return () => {
      unsubscribeConnection();
      unsubscribeStats();
      unsubscribeNotifications();
    };
  };

  const generateMockOrders = (count: number = 10): Order[] => {
    const customerNames = ['أحمد محمد', 'فاطمة علي', 'محمود حسن', 'سارة أحمد', 'عمر خالد', 'نورا محمد'];
    const productNames = ['تويوتا كامري 2020', 'هوندا أكورد 2019', 'نيسان التيما 2021', 'هيونداي إلنترا 2018'];
    const statuses: Order['status'][] = ['pending', 'confirmed', 'shipped', 'delivered'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `order_${i + 1}`,
      customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
      productName: productNames[Math.floor(Math.random() * productNames.length)],
      amount: Math.floor(Math.random() * 300000) + 100000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      deliveryDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined
    }));
  };

  const generateMockProducts = (count: number = 10): Product[] => {
    const productNames = ['تويوتا كامري 2020', 'هوندا أكورد 2019', 'نيسان التيما 2021', 'هيونداي إلنترا 2018', 'كيا سيراتو 2020'];
    const categories = ['سيارات', 'قطع غيار', 'إكسسوارات'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `product_${i + 1}`,
      name: productNames[Math.floor(Math.random() * productNames.length)],
      price: Math.floor(Math.random() * 500000) + 100000,
      stock: Math.floor(Math.random() * 10) + 1,
      sold: Math.floor(Math.random() * 50),
      status: Math.random() > 0.1 ? 'active' : 'out_of_stock',
      category: categories[Math.floor(Math.random() * categories.length)],
      images: ['https://via.placeholder.com/200'],
      views: Math.floor(Math.random() * 1000) + 100
    }));
  };

  const generateMockNotifications = (): Notification[] => {
    return [
      {
        id: '1',
        type: 'new_order',
        title: 'طلب جديد',
        message: 'تم استلام طلب جديد لسيارة تويوتا كامري',
        isRead: false,
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: '2',
        type: 'low_stock',
        title: 'مخزون منخفض',
        message: 'كمية هوندا أكورد أصبحت قليلة (قطعتان متبقيتان)',
        isRead: false,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'review',
        title: 'تقييم جديد',
        message: 'تلقيت تقييم 5 نجوم من أحمد محمد',
        isRead: true,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success('تم تحديث حالة الطلب');
  };

  const toggleProductStatus = (productId: string) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, status: product.status === 'active' ? 'inactive' : 'active' }
        : product
    ));
    toast.success('تم تحديث حالة المنتج');
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'out_of_stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
      active: 'نشط',
      inactive: 'غير نشط',
      out_of_stock: 'نفد المخزون'
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg flex items-center space-x-3 ${
        isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={`text-sm font-medium ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
          {isConnected ? '🔌 متصل - تحديث فوري للبيانات' : '🔌 غير متصل - سيتم إعادة المحاولة'}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-neutral-900">{stats?.totalOrders}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{stats?.monthlyGrowth}%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-neutral-900">{stats?.totalRevenue.toLocaleString()} ج.م</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+15.3%</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">المنتجات النشطة</p>
              <p className="text-2xl font-bold text-neutral-900">{stats?.totalProducts}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">+3 منتجات</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TruckIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">طلبات قيد المراجعة</p>
              <p className="text-2xl font-bold text-neutral-900">{stats?.pendingOrders}</p>
              <div className="flex items-center mt-2">
                <ClockIcon className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm text-yellow-600">تحتاج متابعة</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">الطلبات الأخيرة</h3>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            عرض الكل
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-right text-sm font-medium text-neutral-600 pb-3">العميل</th>
                <th className="text-right text-sm font-medium text-neutral-600 pb-3">المنتج</th>
                <th className="text-right text-sm font-medium text-neutral-600 pb-3">المبلغ</th>
                <th className="text-right text-sm font-medium text-neutral-600 pb-3">الحالة</th>
                <th className="text-right text-sm font-medium text-neutral-600 pb-3">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders.slice(0, 5).map((order, index) => (
                <motion.tr
                  key={order.id}
                  className="border-b border-neutral-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <td className="py-4 text-sm text-neutral-900">{order.customerName}</td>
                  <td className="py-4 text-sm text-neutral-600">{order.productName}</td>
                  <td className="py-4 text-sm font-medium text-neutral-900">{order.amount.toLocaleString()} ج.م</td>
                  <td className="py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-neutral-600">{order.orderDate.toLocaleDateString('ar-EG')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">أفضل المنتجات مبيعاً</h3>
          <button
            onClick={() => setActiveTab('products')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            إدارة المنتجات
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.topProducts.slice(0, 3).map((product, index) => (
            <motion.div
              key={product.id}
              className="border border-neutral-200 rounded-lg p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-neutral-900 text-sm">{product.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                  {getStatusText(product.status)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">السعر:</span>
                  <span className="font-medium">{product.price.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">المبيعات:</span>
                  <span className="font-medium">{product.sold} قطعة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">المشاهدات:</span>
                  <span className="font-medium">{product.views}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">إدارة المنتجات</h2>
        <motion.button
          className="btn btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>إضافة منتج جديد</span>
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">المنتج</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">السعر</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">المخزون</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">المبيعات</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">الحالة</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <motion.tr
                  key={product.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-neutral-900">{product.name}</p>
                        <p className="text-sm text-neutral-600">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{product.price.toLocaleString()} ج.م</td>
                  <td className="p-4">
                    <span className={product.stock < 5 ? 'text-red-600 font-medium' : 'text-neutral-900'}>
                      {product.stock} قطعة
                    </span>
                  </td>
                  <td className="p-4">{product.sold} قطعة</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleProductStatus(product.id)}
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}
                    >
                      {getStatusText(product.status)}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-neutral-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">إدارة الطلبات</h2>
        <div className="flex space-x-2">
          <select className="px-3 py-2 border border-neutral-300 rounded-lg text-sm">
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">مؤكد</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التسليم</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">رقم الطلب</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">العميل</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">المنتج</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">المبلغ</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">الحالة</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">التاريخ</th>
                <th className="text-right text-sm font-medium text-neutral-600 p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <td className="p-4 font-medium text-neutral-900">#{order.id}</td>
                  <td className="p-4 text-neutral-900">{order.customerName}</td>
                  <td className="p-4 text-neutral-600">{order.productName}</td>
                  <td className="p-4 font-medium">{order.amount.toLocaleString()} ج.م</td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                      className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="shipped">تم الشحن</option>
                      <option value="delivered">تم التسليم</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </td>
                  <td className="p-4 text-neutral-600">{order.orderDate.toLocaleDateString('ar-EG')}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="p-2 text-neutral-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">الإشعارات</h2>
      
      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            className={`bg-white rounded-xl shadow-sm border border-neutral-200 p-6 ${
              !notification.isRead ? 'border-l-4 border-l-primary-500' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => markNotificationAsRead(notification.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  notification.type === 'new_order' ? 'bg-green-100' :
                  notification.type === 'low_stock' ? 'bg-yellow-100' :
                  notification.type === 'review' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {notification.type === 'new_order' && <ShoppingBagIcon className="w-5 h-5 text-green-600" />}
                  {notification.type === 'low_stock' && <ClockIcon className="w-5 h-5 text-yellow-600" />}
                  {notification.type === 'review' && <UsersIcon className="w-5 h-5 text-blue-600" />}
                  {notification.type === 'system' && <BellIcon className="w-5 h-5 text-gray-600" />}
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900">{notification.title}</h4>
                  <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {notification.timestamp.toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
              {!notification.isRead && (
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">لوحة تحكم التاجر</h1>
            <p className="text-neutral-600">أهلاً بك {user?.displayName}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <BellIcon className="w-6 h-6 text-neutral-600" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-neutral-200 px-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: ChartBarIcon },
            { id: 'products', name: 'المنتجات', icon: TruckIcon },
            { id: 'orders', name: 'الطلبات', icon: ShoppingBagIcon },
            { id: 'notifications', name: 'الإشعارات', icon: BellIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
              {tab.id === 'notifications' && notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'notifications' && renderNotifications()}
      </div>
    </div>
  );
};

export default EnhancedVendorDashboard;