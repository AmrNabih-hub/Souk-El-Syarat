/**
 * Real-time Order Tracker Component
 * Tracks order status with live updates
 */

import React, { useEffect } from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  TruckIcon,
  ClockIcon,
  CubeIcon as PackageIcon, // Using CubeIcon as PackageIcon
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';

interface OrderTrackerProps {
  orderId: string;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({ orderId }) => {
  const { orders, orderUpdates, listenToOrderUpdates } = useRealtimeStore();
  const { language } = useAppStore();
  
  const locale = language === 'ar' ? ar : enUS;
  const order = orders.find(o => o.id === orderId) || orderUpdates[orderId];

  useEffect(() => {
    if (orderId) {
      const unsubscribe = listenToOrderUpdates(orderId);
      return () => unsubscribe?.();
    }
  }, [orderId]);

  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const orderSteps = [
    {
      id: 'pending',
      name: language === 'ar' ? 'معلق' : 'Pending',
      icon: ClockIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100'
    },
    {
      id: 'confirmed',
      name: language === 'ar' ? 'مؤكد' : 'Confirmed',
      icon: CheckCircleIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'processing',
      name: language === 'ar' ? 'قيد المعالجة' : 'Processing',
      icon: PackageIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'shipped',
      name: language === 'ar' ? 'تم الشحن' : 'Shipped',
      icon: TruckIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    },
    {
      id: 'delivered',
      name: language === 'ar' ? 'تم التسليم' : 'Delivered',
      icon: CheckCircleIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    }
  ];

  const currentStepIndex = orderSteps.findIndex(step => step.id === order.status);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'تتبع الطلب' : 'Order Tracking'} #{order.id}
          </h3>
          <p className="text-sm text-gray-500">
            {language === 'ar' ? 'تم الطلب' : 'Ordered'} {' '}
            {formatDistanceToNow(new Date(order.createdAt), {
              addSuffix: true,
              locale
            })}
          </p>
        </div>
        
        {/* Live Status Indicator */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 bg-green-500 rounded-full"
          />
          <span className="text-sm text-gray-600">
            {language === 'ar' ? 'تحديثات مباشرة' : 'Live Updates'}
          </span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
          <motion.div
            className="h-full bg-primary-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStepIndex / (orderSteps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {orderSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? isCurrent
                        ? `${step.bgColor} ${step.color}`
                        : 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className={`mt-2 text-xs font-medium ${
                  isCompleted ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
                {isCurrent && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-xs text-primary-600"
                  >
                    {language === 'ar' ? 'حالي' : 'Current'}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Order Details */}
      <div className="mt-8 space-y-4">
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">
            {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === 'ar' ? 'إجمالي المنتجات:' : 'Total Items:'}
              </span>
              <span className="font-medium">{order.items?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}
              </span>
              <span className="font-medium">
                {order.total?.toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
              </span>
              <span className="font-medium flex items-center">
                <CreditCardIcon className="w-4 h-4 mr-1" />
                {order.paymentMethod || (language === 'ar' ? 'نقدي' : 'Cash')}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Updates */}
        {order.updates && order.updates.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {language === 'ar' ? 'التحديثات المباشرة' : 'Live Updates'}
            </h4>
            <div className="space-y-2">
              {order.updates.slice(0, 3).map((update: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-2 rtl:space-x-reverse text-sm"
                >
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-gray-700">{update.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(update.timestamp), {
                        addSuffix: true,
                        locale
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3 rtl:space-x-reverse">
        <button className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
        </button>
        {order.status === 'shipped' && (
          <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            {language === 'ar' ? 'تتبع الشحنة' : 'Track Shipment'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderTracker;