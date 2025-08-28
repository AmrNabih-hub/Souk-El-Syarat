import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  CubeIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TruckIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { Product, Order } from '@/types';
import toast from 'react-hot-toast';
import { syncService } from '@/services/sync.service';

interface VendorStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  todayOrders: number;
  todayRevenue: number;
}

interface InventoryItem {
  id: string;
  product: Product;
  stock: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  lastRestocked?: Date;
}

const VendorDashboard: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [realTimeViewers, setRealTimeViewers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadVendorData();
      setupRealtimeListeners();
    }
  }, [user]);

  const loadVendorData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load products
      const productsQuery = query(
        collection(db, 'products'),
        where('vendorId', '==', user.uid)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const products: Product[] = [];
      let lowStock = 0;
      
      productsSnapshot.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as Product;
        products.push(product);
        if (product.quantity && product.quantity < 10) {
          lowStock++;
        }
      });
      
      // Load orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('items', 'array-contains-any', products.map(p => ({ productId: p.id })))
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      let totalRevenue = 0;
      let todayRevenue = 0;
      let todayOrders = 0;
      let pending = 0;
      const customers = new Set();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const orders: Order[] = [];
      ordersSnapshot.forEach(doc => {
        const order = { id: doc.id, ...doc.data() } as Order;
        orders.push(order);
        
        totalRevenue += order.totalAmount || 0;
        customers.add(order.userId);
        
        if (order.status === 'pending' || order.status === 'processing') {
          pending++;
        }
        
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        if (orderDate >= today) {
          todayOrders++;
          todayRevenue += order.totalAmount || 0;
        }
      });
      
      // Sort orders by date
      orders.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setRecentOrders(orders.slice(0, 10));
      
      // Prepare inventory
      const inventoryItems: InventoryItem[] = products.map(product => ({
        id: product.id,
        product,
        stock: product.quantity || 0,
        reserved: 0,
        available: product.quantity || 0,
        lowStockThreshold: 10,
        lastRestocked: product.updatedAt
      }));
      
      setInventory(inventoryItems);
      
      // Update stats
      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        totalCustomers: customers.size,
        pendingOrders: pending,
        lowStockProducts: lowStock,
        todayOrders,
        todayRevenue
      });
      
    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    if (!user) return;
    
    // Listen to real-time inventory changes
    const inventoryRef = ref(realtimeDb, 'inventory');
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Update local inventory with real-time data
        setInventory(prev => prev.map(item => ({
          ...item,
          stock: data[item.id]?.stock || item.stock,
          reserved: data[item.id]?.reserved || 0,
          available: (data[item.id]?.stock || item.stock) - (data[item.id]?.reserved || 0)
        })));
      }
    });
    
    // Listen to real-time viewers
    const viewersRef = ref(realtimeDb, 'productViewers');
    onValue(viewersRef, (snapshot) => {
      const viewers = snapshot.val() || {};
      setRealTimeViewers(viewers);
    });
    
    // Listen to new orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setRecentOrders(orders);
      
      // Show notification for new orders
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && change.doc.data().createdAt) {
          const orderTime = change.doc.data().createdAt.toDate();
          const now = new Date();
          if (now.getTime() - orderTime.getTime() < 5000) {
            toast.success(language === 'ar' ? 'طلب جديد!' : 'New order received!');
          }
        }
      });
    });
    
    return () => unsubscribe();
  };

  const updateInventory = async (productId: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        quantity: newStock,
        updatedAt: serverTimestamp()
      });
      
      // Update real-time database
      const inventoryRef = ref(realtimeDb, `inventory/${productId}`);
      await syncService.forceSync();
      
      toast.success(language === 'ar' ? 'تم تحديث المخزون' : 'Inventory updated');
      loadVendorData();
    } catch (error) {
      toast.error(language === 'ar' ? 'خطأ في التحديث' : 'Update failed');
    }
  };

  const handleAddProduct = () => {
    navigate('/vendor/add-product');
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject' | 'ship') => {
    try {
      const newStatus = action === 'accept' ? 'processing' : 
                       action === 'reject' ? 'cancelled' : 'shipped';
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      toast.success(
        language === 'ar' 
          ? `تم ${action === 'accept' ? 'قبول' : action === 'reject' ? 'رفض' : 'شحن'} الطلب`
          : `Order ${action}ed successfully`
      );
      
      loadVendorData();
    } catch (error) {
      toast.error(language === 'ar' ? 'خطأ في معالجة الطلب' : 'Error processing order');
    }
  };

  const statCards = [
    {
      title: language === 'ar' ? 'إجمالي المنتجات' : 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      color: 'bg-blue-500',
      trend: null
    },
    {
      title: language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: 'bg-green-500',
      trend: stats.todayOrders > 0 ? 'up' : null
    },
    {
      title: language === 'ar' ? 'الإيرادات' : 'Revenue',
      value: `${stats.totalRevenue.toLocaleString()} ${language === 'ar' ? 'جنيه' : 'EGP'}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      trend: stats.todayRevenue > 0 ? 'up' : null
    },
    {
      title: language === 'ar' ? 'العملاء' : 'Customers',
      value: stats.totalCustomers,
      icon: UserGroupIcon,
      color: 'bg-yellow-500',
      trend: null
    }
  ];

  const tabs = [
    { id: 'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: ChartBarIcon },
    { id: 'inventory', label: language === 'ar' ? 'المخزون' : 'Inventory', icon: CubeIcon },
    { id: 'orders', label: language === 'ar' ? 'الطلبات' : 'Orders', icon: ShoppingBagIcon },
    { id: 'analytics', label: language === 'ar' ? 'التحليلات' : 'Analytics', icon: ChartBarIcon }
  ];

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {language === 'ar' ? 'لوحة تحكم البائع' : 'Vendor Dashboard'}
          </h1>
          <p className='text-gray-600 mt-2'>
            {language === 'ar' 
              ? `مرحباً ${user?.displayName}, إليك نظرة عامة على متجرك`
              : `Welcome ${user?.displayName}, here's your store overview`}
          </p>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-xl shadow-sm p-4 mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={handleAddProduct}
                className='flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600'
              >
                <PlusIcon className='w-5 h-5 mr-2' />
                {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
              </button>
              <button
                onClick={loadVendorData}
                className='flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
              >
                <ArrowPathIcon className='w-5 h-5 mr-2' />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </button>
            </div>
            
            {stats.pendingOrders > 0 && (
              <div className='flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg'>
                <BellIcon className='w-5 h-5 mr-2' />
                <span className='font-medium'>
                  {stats.pendingOrders} {language === 'ar' ? 'طلب معلق' : 'pending orders'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className='bg-white rounded-xl shadow-sm p-6'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>{stat.title}</p>
                  <p className='text-2xl font-bold text-gray-900 mt-2'>{stat.value}</p>
                  {stat.trend && (
                    <div className='flex items-center mt-2'>
                      {stat.trend === 'up' ? (
                        <ArrowTrendingUpIcon className='w-4 h-4 text-green-500 mr-1' />
                      ) : (
                        <ArrowTrendingDownIcon className='w-4 h-4 text-red-500 mr-1' />
                      )}
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {language === 'ar' ? 'اليوم' : 'Today'}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className='w-6 h-6 text-white' />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className='bg-white rounded-xl shadow-sm'>
          <div className='border-b'>
            <nav className='flex space-x-8 px-6'>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className='w-5 h-5' />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className='p-6'>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className='space-y-6'>
                {/* Recent Orders */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    {language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}
                  </h3>
                  {recentOrders.length > 0 ? (
                    <div className='space-y-4'>
                      {recentOrders.slice(0, 5).map(order => (
                        <div key={order.id} className='border rounded-lg p-4'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-medium text-gray-900'>
                                {language === 'ar' ? 'طلب' : 'Order'} #{order.id?.slice(-8)}
                              </p>
                              <p className='text-sm text-gray-600'>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleOrderAction(order.id!, 'accept')}
                                    className='px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600'
                                  >
                                    {language === 'ar' ? 'قبول' : 'Accept'}
                                  </button>
                                  <button
                                    onClick={() => handleOrderAction(order.id!, 'reject')}
                                    className='px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600'
                                  >
                                    {language === 'ar' ? 'رفض' : 'Reject'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-500 text-center py-8'>
                      {language === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}
                    </p>
                  )}
                </div>

                {/* Low Stock Alert */}
                {stats.lowStockProducts > 0 && (
                  <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                    <div className='flex items-center'>
                      <BellIcon className='w-5 h-5 text-yellow-600 mr-3' />
                      <div>
                        <p className='font-medium text-yellow-900'>
                          {language === 'ar' ? 'تنبيه المخزون' : 'Low Stock Alert'}
                        </p>
                        <p className='text-sm text-yellow-700'>
                          {stats.lowStockProducts} {language === 'ar' ? 'منتج بمخزون منخفض' : 'products with low stock'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div>
                {/* Search and Filter */}
                <div className='flex items-center justify-between mb-6'>
                  <div className='relative flex-1 max-w-md'>
                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                      type='text'
                      placeholder={language === 'ar' ? 'البحث في المخزون...' : 'Search inventory...'}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    />
                  </div>
                  <button className='ml-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg'>
                    <FunnelIcon className='w-5 h-5' />
                  </button>
                </div>

                {/* Inventory Table */}
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          {language === 'ar' ? 'المنتج' : 'Product'}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          {language === 'ar' ? 'المخزون' : 'Stock'}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          {language === 'ar' ? 'محجوز' : 'Reserved'}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          {language === 'ar' ? 'متاح' : 'Available'}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          {language === 'ar' ? 'المشاهدات' : 'Viewers'}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          {language === 'ar' ? 'الإجراءات' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {inventory
                        .filter(item => 
                          item.product.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(item => (
                          <tr key={item.id}>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='flex items-center'>
                                <img
                                  src={item.product.images?.[0]?.url || 'https://via.placeholder.com/40'}
                                  alt={item.product.title}
                                  className='w-10 h-10 rounded-lg object-cover mr-3'
                                />
                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {item.product.title}
                                  </p>
                                  <p className='text-sm text-gray-500'>
                                    {item.product.price} {language === 'ar' ? 'جنيه' : 'EGP'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span className={`font-medium ${
                                item.stock < 10 ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {item.stock}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-gray-900'>
                              {item.reserved}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-gray-900'>
                              {item.available}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span className='text-sm text-gray-900'>
                                {realTimeViewers[item.id] || 0} 
                                {realTimeViewers[item.id] > 0 && (
                                  <span className='ml-1 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                                )}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <button
                                onClick={() => {
                                  const newStock = prompt(
                                    language === 'ar' ? 'أدخل الكمية الجديدة:' : 'Enter new quantity:',
                                    item.stock.toString()
                                  );
                                  if (newStock && !isNaN(Number(newStock))) {
                                    updateInventory(item.id, Number(newStock));
                                  }
                                }}
                                className='text-primary-600 hover:text-primary-700 font-medium text-sm'
                              >
                                {language === 'ar' ? 'تحديث' : 'Update'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className='space-y-4'>
                  {recentOrders.map(order => (
                    <div key={order.id} className='border rounded-lg p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <div>
                          <h4 className='text-lg font-semibold text-gray-900'>
                            {language === 'ar' ? 'طلب' : 'Order'} #{order.id?.slice(-8).toUpperCase()}
                          </h4>
                          <p className='text-sm text-gray-600 mt-1'>
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-xl font-bold text-gray-900'>
                            {order.totalAmount?.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                          </p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className='border-t pt-4'>
                        <h5 className='font-medium text-gray-900 mb-3'>
                          {language === 'ar' ? 'المنتجات' : 'Items'}
                        </h5>
                        <div className='space-y-2'>
                          {order.items?.map((item, index) => (
                            <div key={index} className='flex items-center justify-between'>
                              <div className='flex items-center'>
                                <img
                                  src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/40'}
                                  alt={item.product?.title}
                                  className='w-10 h-10 rounded object-cover mr-3'
                                />
                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {item.product?.title}
                                  </p>
                                  <p className='text-sm text-gray-500'>
                                    {language === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className='font-medium text-gray-900'>
                                {item.subtotal?.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {order.status === 'pending' && (
                        <div className='mt-4 pt-4 border-t flex justify-end space-x-3'>
                          <button
                            onClick={() => handleOrderAction(order.id!, 'reject')}
                            className='px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50'
                          >
                            {language === 'ar' ? 'رفض الطلب' : 'Reject Order'}
                          </button>
                          <button
                            onClick={() => handleOrderAction(order.id!, 'accept')}
                            className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600'
                          >
                            {language === 'ar' ? 'قبول الطلب' : 'Accept Order'}
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'processing' && (
                        <div className='mt-4 pt-4 border-t flex justify-end'>
                          <button
                            onClick={() => handleOrderAction(order.id!, 'ship')}
                            className='px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600'
                          >
                            <TruckIcon className='w-5 h-5 inline mr-2' />
                            {language === 'ar' ? 'شحن الطلب' : 'Ship Order'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className='text-center py-12'>
                <ChartBarIcon className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  {language === 'ar' ? 'التحليلات قريباً' : 'Analytics Coming Soon'}
                </h3>
                <p className='text-gray-600'>
                  {language === 'ar' 
                    ? 'سيتم إضافة تحليلات مفصلة قريباً'
                    : 'Detailed analytics will be added soon'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;