import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import OrderTrackingService, { OrderTracking, BookingTracking } from '@/services/order-tracking.service';
import toast from 'react-hot-toast';

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<OrderTracking[]>([]);
  const [bookings, setBookings] = useState<BookingTracking[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings'>('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const trackingService = OrderTrackingService.getInstance();
    
    // Subscribe to real-time order updates
    const unsubscribeOrders = trackingService.subscribeToOrderTracking(user.id, (updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    // Subscribe to real-time booking updates
    const unsubscribeBookings = trackingService.subscribeToBookingTracking(user.id, (updatedBookings) => {
      setBookings(updatedBookings);
    });

    // Load localStorage orders as fallback
    const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    if (localOrders.length > 0 && orders.length === 0) {
      setOrders(localOrders.map((order: any) => ({
        id: order.orderId,
        orderId: order.orderId,
        userId: user.id,
        itemType: order.item?.type || 'car',
        itemName: order.item?.name || order.productName,
        currentStatus: order.status || 'confirmed',
        statusHistory: [{ status: order.status || 'confirmed', timestamp: new Date(order.createdAt) }],
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
        paymentMethod: order.paymentMethod || 'cod',
        totalAmount: order.totalPrice || order.totalAmount,
        createdAt: new Date(order.createdAt)
      })));
    }

    return () => {
      unsubscribeOrders();
      unsubscribeBookings();
    };
  }, [user, navigate]);

  const getStatusIcon = (status: OrderTracking['currentStatus'] | BookingTracking['currentStatus']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'ready':
      case 'scheduled':
        return <ClockIcon className="w-5 h-5 text-orange-500" />;
      case 'shipped':
      case 'out_for_delivery':
      case 'in_progress':
        return <TruckIcon className="w-5 h-5 text-purple-500" />;
      case 'delivered':
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: OrderTracking['currentStatus'] | BookingTracking['currentStatus']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
      case 'scheduled':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
      case 'out_for_delivery':
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'service': return '🔧';
      case 'part': return '⚙️';
      default: return '📦';
    }
  };

  const renderOrderCard = (order: OrderTracking, index: number) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getItemTypeIcon(order.itemType)}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {order.itemName}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>#{order.orderId}</span>
              <span>{order.createdAt.toLocaleDateString('ar-EG')}</span>
              {order.vendorName && (
                <span className="text-primary-600">🏪 {order.vendorName}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(order.currentStatus)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.currentStatus)}`}>
            {OrderTrackingService.getStatusDisplayText(order.currentStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">المبلغ:</span>
          <span className="font-semibold text-primary-600">{formatCurrency(order.totalAmount)}</span>
        </div>

        {order.estimatedDelivery && order.currentStatus !== 'delivered' && (
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">التوصيل المتوقع:</span>
            <span className="font-semibold">{order.estimatedDelivery.toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {order.actualDelivery && (
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">تم التوصيل:</span>
            <span className="font-semibold text-green-600">{order.actualDelivery.toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {order.trackingNumber && (
          <div className="flex items-center gap-2">
            <TruckIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">رقم التتبع:</span>
            <span className="font-semibold">{order.trackingNumber}</span>
          </div>
        )}
      </div>

      {order.shippingAddress && (
        <div className="flex items-start gap-2 text-sm mb-4">
          <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <span className="text-gray-600">عنوان التوصيل:</span>
            <p className="text-gray-900">{order.shippingAddress}</p>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      {order.statusHistory && order.statusHistory.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>آخر التحديثات:</span>
          </div>
          <div className="space-y-2">
            {order.statusHistory.slice(0, 3).map((status, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                <span className="text-gray-600">{OrderTrackingService.getStatusDisplayText(status.status)}</span>
                <span className="text-gray-400">{status.timestamp.toLocaleDateString('ar-EG')}</span>
                {status.notes && <span className="text-gray-500">• {status.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <Link to={`/order-success?orderId=${order.orderId}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            تفاصيل الطلب
          </motion.button>
        </Link>

        {order.contactPhone && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open(`tel:${order.contactPhone}`)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <PhoneIcon className="w-4 h-4" />
            اتصل
          </motion.button>
        )}

        {(order.currentStatus === 'confirmed' || order.currentStatus === 'processing') && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // In a real app, this would call the API to cancel
              toast.success('تم إلغاء الطلب');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircleIcon className="w-4 h-4" />
            إلغاء
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  const renderBookingCard = (booking: BookingTracking, index: number) => (
    <motion.div
      key={booking.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔧</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {booking.serviceName}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>#{booking.bookingId}</span>
              <span>🏪 {booking.providerName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(booking.currentStatus)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.currentStatus)}`}>
            {OrderTrackingService.getBookingStatusDisplayText(booking.currentStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">الموعد:</span>
          <span className="font-semibold">{booking.appointmentDate.toLocaleDateString('ar-EG')} - {booking.appointmentTime}</span>
        </div>

        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">المدة:</span>
          <span className="font-semibold">{booking.duration}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">الموقع:</span>
          <span className="font-semibold">{booking.location}</span>
        </div>
      </div>

      {booking.customerNotes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">ملاحظاتك:</span>
          <p className="text-sm text-gray-900 mt-1">{booking.customerNotes}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <Link to={`/booking-success?bookingId=${booking.bookingId}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            تفاصيل الحجز
          </motion.button>
        </Link>

        {booking.currentStatus === 'confirmed' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              toast.success('تم إلغاء الحجز');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircleIcon className="w-4 h-4" />
            إلغاء
          </motion.button>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">طلباتي وحجوزاتي</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
            <motion.button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <TruckIcon className="w-5 h-5" />
              <span>الطلبات</span>
              <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs font-bold">
                {orders.length}
              </span>
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'bookings'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <CalendarIcon className="w-5 h-5" />
              <span>الحجوزات</span>
              <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs font-bold">
                {bookings.length}
              </span>
            </motion.button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {orders.length > 0 ? (
                  orders.map(renderOrderCard)
                ) : (
                  <div className="text-center py-12">
                    <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد طلبات بعد
                    </h3>
                    <p className="text-gray-500 mb-6">
                      ابدأ التسوق واطلب ما تحتاجه من سيارات وقطع غيار
                    </p>
                    <Link to="/marketplace">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        تصفح السوق
                      </motion.button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {bookings.length > 0 ? (
                  bookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد حجوزات بعد
                    </h3>
                    <p className="text-gray-500 mb-6">
                      احجز الخدمات التي تحتاجها لسيارتك
                    </p>
                    <Link to="/marketplace">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        تصفح الخدمات
                      </motion.button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;