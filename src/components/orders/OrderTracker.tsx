import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  HandRaisedIcon,
  XCircleIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  PrinterIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

import PaymentService, { Order, PaymentTransaction } from '@/services/payment.service';
import { useAppStore } from '@/stores/appStore';
import toast from 'react-hot-toast';

interface OrderTrackerProps {
  order: Order;
  onStatusUpdate?: (newStatus: Order['status']) => void;
  showActions?: boolean;
  isVendor?: boolean;
}

interface TrackingEvent {
  id: string;
  status: Order['status'];
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  timestamp: Date;
  completed: boolean;
  icon: React.ComponentType<any>;
  color: string;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({
  order,
  onStatusUpdate,
  showActions = true,
  isVendor = false
}) => {
  const { language } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDeliveryDialog, setShowConfirmDeliveryDialog] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [customerRating, setCustomerRating] = useState(5);
  const [customerReview, setCustomerReview] = useState('');

  // Create tracking timeline based on order status
  const getTrackingEvents = (): TrackingEvent[] => {
    const events: TrackingEvent[] = [
      {
        id: 'pending',
        status: 'pending',
        title: 'Order Placed',
        titleAr: 'تم إنشاء الطلب',
        description: 'Your order has been received and is being processed',
        descriptionAr: 'تم استلام طلبك وجاري معالجته',
        timestamp: order.createdAt,
        completed: true,
        icon: ClockIcon,
        color: 'blue'
      },
      {
        id: 'confirmed',
        status: 'confirmed',
        title: 'Order Confirmed',
        titleAr: 'تم تأكيد الطلب',
        description: 'Seller has confirmed your order and started preparation',
        descriptionAr: 'أكد البائع طلبك وبدأ في التحضير',
        timestamp: order.timeline.find(t => t.status === 'confirmed')?.timestamp || new Date(),
        completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status),
        icon: CheckCircleIcon,
        color: 'green'
      },
      {
        id: 'processing',
        status: 'processing',
        title: 'Processing',
        titleAr: 'جاري التحضير',
        description: 'Your car is being prepared for delivery',
        descriptionAr: 'يتم تحضير السيارة للتسليم',
        timestamp: order.timeline.find(t => t.status === 'processing')?.timestamp || new Date(),
        completed: ['processing', 'shipped', 'delivered'].includes(order.status),
        icon: ArrowPathIcon,
        color: 'yellow'
      },
      {
        id: 'shipped',
        status: 'shipped',
        title: 'Out for Delivery',
        titleAr: 'في الطريق للتسليم',
        description: 'Your car is on the way to your location',
        descriptionAr: 'السيارة في الطريق إلى موقعك',
        timestamp: order.timeline.find(t => t.status === 'shipped')?.timestamp || new Date(),
        completed: ['shipped', 'delivered'].includes(order.status),
        icon: TruckIcon,
        color: 'purple'
      },
      {
        id: 'delivered',
        status: 'delivered',
        title: 'Delivered',
        titleAr: 'تم التسليم',
        description: 'Your car has been delivered successfully',
        descriptionAr: 'تم تسليم السيارة بنجاح',
        timestamp: order.timeline.find(t => t.status === 'delivered')?.timestamp || new Date(),
        completed: order.status === 'delivered',
        icon: HandRaisedIcon,
        color: 'green'
      }
    ];

    // Handle cancelled orders
    if (order.status === 'cancelled') {
      events.push({
        id: 'cancelled',
        status: 'cancelled',
        title: 'Order Cancelled',
        titleAr: 'تم إلغاء الطلب',
        description: 'This order has been cancelled',
        descriptionAr: 'تم إلغاء هذا الطلب',
        timestamp: order.timeline.find(t => t.status === 'cancelled')?.timestamp || new Date(),
        completed: true,
        icon: XCircleIcon,
        color: 'red'
      });
    }

    return events;
  };

  const trackingEvents = getTrackingEvents();

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order.id) return;
    
    setLoading(true);
    try {
      await PaymentService.updateOrderStatus(order.id, newStatus);
      onStatusUpdate?.(newStatus);
      toast.success(`تم تحديث حالة الطلب إلى: ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('فشل في تحديث حالة الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    await handleStatusUpdate('cancelled');
    setShowCancelDialog(false);
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryCode.trim()) {
      toast.error('يرجى إدخال كود التسليم');
      return;
    }

    try {
      await PaymentService.confirmCashOnDelivery(order.id, deliveryCode);
      onStatusUpdate?.('delivered');
      setShowConfirmDeliveryDialog(false);
      setDeliveryCode('');
    } catch (error) {
      toast.error(error.message || 'فشل في تأكيد التسليم');
    }
  };

  const getStatusText = (status: Order['status']): string => {
    const statusTexts = {
      pending: 'في انتظار التأكيد',
      confirmed: 'مؤكد',
      processing: 'جاري التحضير',
      shipped: 'في الطريق',
      delivered: 'مُسلم',
      cancelled: 'مُلغي'
    };
    return statusTexts[status] || status;
  };

  const getStatusColor = (status: Order['status']): string => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ar-EG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const canUpdateStatus = (targetStatus: Order['status']): boolean => {
    if (!isVendor) return false;
    
    const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(order.status);
    const targetIndex = statusFlow.indexOf(targetStatus);
    
    return targetIndex === currentIndex + 1;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">
              {language === 'ar' ? 'تتبع الطلب' : 'Order Tracking'}
            </h3>
            <p className="text-primary-100">
              {language === 'ar' ? 'رقم الطلب:' : 'Order ID:'} #{order.id.slice(-8)}
            </p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'delivered' 
                ? 'bg-green-500 text-white' 
                : order.status === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-white bg-opacity-20 text-white'
            }`}>
              {getStatusText(order.status)}
            </div>
            <p className="text-sm text-primary-100 mt-1">
              {formatDateTime(order.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Car Information */}
        <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <img
            src={order.carDetails.images[0] || '/placeholder-car.jpg'}
            alt={order.carDetails.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{order.carDetails.title}</h4>
            <p className="text-gray-600">
              {order.carDetails.make} {order.carDetails.model} - {order.carDetails.year}
            </p>
            <p className="text-lg font-bold text-primary-600">
              {PaymentService.formatCurrency(order.totalAmount)}
            </p>
          </div>
          {order.status === 'delivered' && (
            <div className="text-green-500">
              <CheckCircleSolid className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Tracking Timeline */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'تتبع الطلب' : 'Order Timeline'}
          </h4>
          
          <div className="relative">
            {trackingEvents.map((event, index) => {
              const isLast = index === trackingEvents.length - 1;
              const IconComponent = event.icon;
              
              return (
                <div key={event.id} className="flex items-start space-x-4 pb-8 relative">
                  {/* Timeline Line */}
                  {!isLast && (
                    <div className={`absolute left-4 top-10 bottom-0 w-0.5 ${
                      event.completed ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                  
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.completed
                        ? event.color === 'red'
                          ? 'bg-red-500 text-white'
                          : 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    } relative z-10`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </motion.div>
                  
                  {/* Content */}
                  <div className={`flex-1 ${event.completed ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">
                        {language === 'ar' ? event.titleAr : event.title}
                      </h5>
                      {event.completed && (
                        <span className="text-sm text-gray-500">
                          {formatDateTime(event.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'ar' ? event.descriptionAr : event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-blue-600" />
            معلومات الدفع
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">طريقة الدفع:</span>
              <p className="font-medium">
                {order.paymentTransaction?.paymentMethod.nameAr}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">حالة الدفع:</span>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${
                order.paymentStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : order.paymentStatus === 'confirmed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.paymentStatus === 'completed' ? 'مكتمل' :
                 order.paymentStatus === 'confirmed' ? 'مؤكد' : 'في انتظار الدفع'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">المبلغ الإجمالي:</span>
              <p className="font-bold text-primary-600">
                {PaymentService.formatCurrency(order.totalAmount)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">العملة:</span>
              <p className="font-medium">جنيه مصري (EGP)</p>
            </div>
          </div>

          {/* COD Specific Information */}
          {order.paymentTransaction?.paymentMethod.type === 'cash_on_delivery' && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">الدفع عند الاستلام</p>
                  <p>يرجى تحضير المبلغ نقداً عند استلام السيارة. سيتم التواصل معك قبل التسليم.</p>
                  {order.paymentTransaction.paymentDetails.codDetails?.preferredTimeSlot && (
                    <p className="mt-2">
                      <span className="font-medium">الوقت المفضل:</span> {
                        order.paymentTransaction.paymentDetails.codDetails.preferredTimeSlot === 'morning' ? 'صباحاً' :
                        order.paymentTransaction.paymentDetails.codDetails.preferredTimeSlot === 'afternoon' ? 'بعد الظهر' :
                        order.paymentTransaction.paymentDetails.codDetails.preferredTimeSlot === 'evening' ? 'مساءً' : 'مرن'
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2 text-gray-600" />
            عنوان التسليم
          </h4>
          
          <div className="space-y-2">
            <p className="text-gray-900">{order.deliveryAddress.street}</p>
            <p className="text-gray-600">
              {order.deliveryAddress.city}, {order.deliveryAddress.governorate}
            </p>
            {order.deliveryAddress.postalCode && (
              <p className="text-gray-600">
                الرمز البريدي: {order.deliveryAddress.postalCode}
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">هاتف الاتصال:</p>
              <p className="font-medium">{order.contactInfo.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">البريد الإلكتروني:</p>
              <p className="font-medium">{order.contactInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-3">
            {/* Vendor Actions */}
            {isVendor && (
              <>
                {canUpdateStatus('confirmed') && (
                  <motion.button
                    onClick={() => handleStatusUpdate('confirmed')}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>تأكيد الطلب</span>
                  </motion.button>
                )}

                {canUpdateStatus('processing') && (
                  <motion.button
                    onClick={() => handleStatusUpdate('processing')}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>بدء التحضير</span>
                  </motion.button>
                )}

                {canUpdateStatus('shipped') && (
                  <motion.button
                    onClick={() => handleStatusUpdate('shipped')}
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <TruckIcon className="w-5 h-5" />
                    <span>تم الشحن</span>
                  </motion.button>
                )}
              </>
            )}

            {/* Customer Actions */}
            {!isVendor && (
              <>
                {order.status === 'shipped' && order.paymentTransaction?.paymentMethod.type === 'cash_on_delivery' && (
                  <motion.button
                    onClick={() => setShowConfirmDeliveryDialog(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <HandRaisedIcon className="w-5 h-5" />
                    <span>تأكيد الاستلام</span>
                  </motion.button>
                )}

                {['pending', 'confirmed'].includes(order.status) && (
                  <motion.button
                    onClick={() => setShowCancelDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <XCircleIcon className="w-5 h-5" />
                    <span>إلغاء الطلب</span>
                  </motion.button>
                )}
              </>
            )}

            {/* Common Actions */}
            <motion.button
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              whileTap={{ scale: 0.95 }}
            >
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span>التواصل</span>
            </motion.button>

            <motion.button
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              whileTap={{ scale: 0.95 }}
            >
              <PrinterIcon className="w-5 h-5" />
              <span>طباعة</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900">تأكيد إلغاء الطلب</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleCancelOrder}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  نعم، إلغاء الطلب
                </motion.button>
                <motion.button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  تراجع
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delivery Dialog */}
      <AnimatePresence>
        {showConfirmDeliveryDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center space-x-3 mb-4">
                <HandRaisedIcon className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-bold text-gray-900">تأكيد استلام السيارة</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                يرجى إدخال كود التسليم الذي قدمه لك المندوب لتأكيد استلام السيارة والدفع.
              </p>
              
              <input
                type="text"
                value={deliveryCode}
                onChange={(e) => setDeliveryCode(e.target.value.toUpperCase())}
                placeholder="أدخل كود التسليم"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-6"
              />
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleConfirmDelivery}
                  disabled={!deliveryCode.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  تأكيد الاستلام والدفع
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowConfirmDeliveryDialog(false);
                    setDeliveryCode('');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderTracker;