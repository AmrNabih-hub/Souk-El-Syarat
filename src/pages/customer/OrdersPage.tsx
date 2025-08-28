import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import { db } from '@/config/firebase.config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Order, OrderStatus } from '@/types';
import toast from 'react-hot-toast';

const OrdersPage: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    pending: {
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100',
      label: language === 'ar' ? 'قيد الانتظار' : 'Pending'
    },
    processing: {
      icon: ClockIcon,
      color: 'text-blue-600 bg-blue-100',
      label: language === 'ar' ? 'قيد المعالجة' : 'Processing'
    },
    shipped: {
      icon: TruckIcon,
      color: 'text-purple-600 bg-purple-100',
      label: language === 'ar' ? 'تم الشحن' : 'Shipped'
    },
    delivered: {
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
      label: language === 'ar' ? 'تم التسليم' : 'Delivered'
    },
    cancelled: {
      icon: XCircleIcon,
      color: 'text-red-600 bg-red-100',
      label: language === 'ar' ? 'ملغي' : 'Cancelled'
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
      // Set up real-time listener
      const unsubscribe = setupRealtimeListener();
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus]);

  const loadOrders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(ordersQuery);
      const ordersData: Order[] = [];
      
      snapshot.forEach(doc => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الطلبات' : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    if (!user) return () => {};
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    
    return onSnapshot(ordersQuery, (snapshot) => {
      const updatedOrders: Order[] = [];
      snapshot.forEach(doc => {
        updatedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      // Sort by date
      updatedOrders.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setOrders(updatedOrders);
    });
  };

  const filterOrders = () => {
    if (selectedStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === selectedStatus));
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      });
      
      toast.success(language === 'ar' ? 'تم إلغاء الطلب' : 'Order cancelled successfully');
      loadOrders();
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل إلغاء الطلب' : 'Failed to cancel order');
    }
  };

  const downloadInvoice = (order: Order) => {
    // In production, this would generate and download a PDF invoice
    toast.success(language === 'ar' ? 'جاري تحميل الفاتورة' : 'Downloading invoice');
  };

  const getOrderDate = (order: Order) => {
    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const getDeliveryDate = (order: Order) => {
    if (!order.estimatedDelivery) return null;
    const date = order.estimatedDelivery?.toDate ? order.estimatedDelivery.toDate() : new Date(order.estimatedDelivery);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>
              {language === 'ar' ? 'طلباتي' : 'My Orders'}
            </h1>
            <p className='text-gray-600 mt-2'>
              {language === 'ar' 
                ? `لديك ${orders.length} طلب`
                : `You have ${orders.length} order${orders.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Filters */}
          <div className='bg-white rounded-xl shadow-sm p-4 mb-6'>
            <div className='flex items-center space-x-2 overflow-x-auto'>
              <FunnelIcon className='w-5 h-5 text-gray-500' />
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  selectedStatus === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'All'} ({orders.length})
              </button>
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = orders.filter(o => o.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status as OrderStatus)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                      selectedStatus === status
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {config.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <div className='space-y-4'>
              {filteredOrders.map(order => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='bg-white rounded-xl shadow-sm overflow-hidden'
                  >
                    <div className='p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <div>
                          <div className='flex items-center space-x-3 mb-2'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                              {language === 'ar' ? 'طلب' : 'Order'} #{order.id?.slice(-8).toUpperCase()}
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              <StatusIcon className='w-4 h-4 mr-1' />
                              {config.label}
                            </span>
                          </div>
                          <div className='text-sm text-gray-600 space-y-1'>
                            <p>{language === 'ar' ? 'تاريخ الطلب:' : 'Order Date:'} {getOrderDate(order)}</p>
                            {getDeliveryDate(order) && (
                              <p>
                                {language === 'ar' ? 'التسليم المتوقع:' : 'Expected Delivery:'} {getDeliveryDate(order)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-2xl font-bold text-gray-900'>
                            {order.totalAmount?.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {order.items?.length || 0} {language === 'ar' ? 'منتج' : 'item(s)'}
                          </p>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className='border-t pt-4 mb-4'>
                        <div className='flex items-center space-x-4 overflow-x-auto'>
                          {order.items?.slice(0, 3).map((item, index) => (
                            <div key={index} className='flex-shrink-0'>
                              <img
                                src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/100'}
                                alt={item.product?.title}
                                className='w-16 h-16 object-cover rounded-lg'
                              />
                            </div>
                          ))}
                          {order.items && order.items.length > 3 && (
                            <div className='flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center'>
                              <span className='text-gray-600 text-sm'>
                                +{order.items.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetails(true);
                            }}
                            className='px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center'
                          >
                            <EyeIcon className='w-4 h-4 mr-2' />
                            {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                          </button>
                          <button
                            onClick={() => downloadInvoice(order)}
                            className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center'
                          >
                            <ArrowDownTrayIcon className='w-4 h-4 mr-2' />
                            {language === 'ar' ? 'تحميل الفاتورة' : 'Download Invoice'}
                          </button>
                        </div>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => cancelOrder(order.id!)}
                            className='px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                          >
                            {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <Link
                            to={`/orders/${order.id}/review`}
                            className='px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors'
                          >
                            {language === 'ar' ? 'كتابة تقييم' : 'Write Review'}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Order Timeline */}
                    {order.status !== 'cancelled' && (
                      <div className='bg-gray-50 px-6 py-4'>
                        <div className='flex items-center justify-between'>
                          <div className={`flex flex-col items-center ${
                            ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) 
                              ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <CheckCircleIcon className='w-6 h-6 mb-1' />
                            <span className='text-xs'>{language === 'ar' ? 'تم الطلب' : 'Ordered'}</span>
                          </div>
                          <div className={`flex-1 h-1 mx-2 ${
                            ['processing', 'shipped', 'delivered'].includes(order.status)
                              ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <div className={`flex flex-col items-center ${
                            ['processing', 'shipped', 'delivered'].includes(order.status)
                              ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <ClockIcon className='w-6 h-6 mb-1' />
                            <span className='text-xs'>{language === 'ar' ? 'قيد المعالجة' : 'Processing'}</span>
                          </div>
                          <div className={`flex-1 h-1 mx-2 ${
                            ['shipped', 'delivered'].includes(order.status)
                              ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <div className={`flex flex-col items-center ${
                            ['shipped', 'delivered'].includes(order.status)
                              ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <TruckIcon className='w-6 h-6 mb-1' />
                            <span className='text-xs'>{language === 'ar' ? 'تم الشحن' : 'Shipped'}</span>
                          </div>
                          <div className={`flex-1 h-1 mx-2 ${
                            order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <div className={`flex flex-col items-center ${
                            order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <CheckCircleIcon className='w-6 h-6 mb-1' />
                            <span className='text-xs'>{language === 'ar' ? 'تم التسليم' : 'Delivered'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className='bg-white rounded-xl shadow-sm p-12 text-center'>
              <ShoppingBagIcon className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
              </h3>
              <p className='text-gray-600 mb-6'>
                {selectedStatus === 'all'
                  ? language === 'ar' ? 'لم تقم بأي طلبات بعد' : "You haven't placed any orders yet"
                  : language === 'ar' ? 'لا توجد طلبات بهذه الحالة' : 'No orders with this status'}
              </p>
              <Link
                to='/marketplace'
                className='inline-flex items-center px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors'
              >
                {language === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OrdersPage;