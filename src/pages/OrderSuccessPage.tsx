import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  TruckIcon,
  PrinterIcon,
  ShareIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import RealDataService from '@/services/real-data.service';
import toast from 'react-hot-toast';

interface OrderData {
  orderId: string;
  item: any;
  customerInfo: any;
  paymentMethod: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  estimatedDelivery: string;
}

const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      toast.error('رقم الطلب غير صحيح');
      navigate('/marketplace');
      return;
    }

    // Load order data from localStorage
    const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    const order = orders.find((o: OrderData) => o.orderId === orderId);
    
    if (order) {
      setOrderData(order);
    } else {
      toast.error('الطلب غير موجود');
      navigate('/marketplace');
    }
    
    setLoading(false);
  }, [orderId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `تم تأكيد طلبي رقم ${orderId} من سوق السيارات المصري`;
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'تأكيد الطلب', text, url });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('تم نسخ رابط الطلب');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'shipped': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'تم تأكيد الطلب';
      case 'processing': return 'جاري التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      default: return 'غير معروف';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cod': return 'دفع عند الاستلام';
      case 'bank': return 'تحويل بنكي';
      case 'installment': return 'تقسيط';
      default: return method;
    }
  };

  const getItemTypeText = (type: string) => {
    switch (type) {
      case 'car': return '🚗 سيارة';
      case 'service': return '🔧 خدمة';
      case 'part': return '⚙️ قطعة غيار';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">الطلب غير موجود</h1>
          <Link to="/marketplace" className="text-primary-600 hover:text-primary-700">
            العودة للسوق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4"
          >
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            تم تأكيد طلبك بنجاح!
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            رقم الطلب: <span className="font-semibold text-primary-600">{orderData.orderId}</span>
          </p>
          <div className="flex items-center justify-center gap-4">
            <motion.button
              onClick={handlePrint}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <PrinterIcon className="w-4 h-4" />
              طباعة
            </motion.button>
            
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              مشاركة
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">تفاصيل الطلب</h2>
            
            {/* Item Details */}
            <div className="flex items-start gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <img
                src={orderData.item.image}
                alt={orderData.item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{orderData.item.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {getItemTypeText(orderData.item.type)}
                  {orderData.item.quantity && ` × ${orderData.item.quantity}`}
                </p>
                <p className="text-lg font-bold text-primary-600">
                  {RealDataService.formatEGP(orderData.totalPrice)}
                </p>
              </div>
            </div>

            {/* Order Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">حالة الطلب</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                  {getStatusText(orderData.status)}
                </span>
              </div>
              
              {/* Order Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">تم تأكيد الطلب</p>
                    <p className="text-sm text-gray-500">
                      {new Date(orderData.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-500">جاري التجهيز</p>
                    <p className="text-sm text-gray-400">قريباً</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-500">
                      {orderData.item.type === 'service' ? 'تنفيذ الخدمة' : 'التوصيل'}
                    </p>
                    <p className="text-sm text-gray-400">
                      متوقع: {new Date(orderData.estimatedDelivery).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">طريقة الدفع:</span>
                <span className="text-gray-900">{getPaymentMethodText(orderData.paymentMethod)}</span>
              </div>
            </div>
          </motion.div>

          {/* Customer & Contact Info */}
          <div className="space-y-6">
            
            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات العميل</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">{orderData.customerInfo.fullName}</p>
                    <p className="text-sm text-gray-600">الاسم الكامل</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{orderData.customerInfo.phone}</p>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {orderData.customerInfo.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderData.customerInfo.governorate}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
              <h3 className="font-bold text-blue-900 mb-4">الخطوات التالية</h3>
              
              <div className="space-y-3 text-blue-800">
                {orderData.item.type === 'car' && (
                  <>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      <span className="text-sm">سيتواصل معك البائع خلال 24 ساعة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm">موعد المعاينة سيتم تحديده قريباً</span>
                    </div>
                  </>
                )}
                
                {orderData.item.type === 'service' && (
                  <>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      <span className="text-sm">سيتواصل معك مقدم الخدمة قريباً</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      <span className="text-sm">مدة الخدمة: {orderData.item.details?.durationAr}</span>
                    </div>
                  </>
                )}
                
                {orderData.item.type === 'part' && (
                  <>
                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-4 h-4" />
                      <span className="text-sm">
                        {orderData.item.details?.shipping?.available 
                          ? `الشحن: ${orderData.item.details.shipping.durationAr}`
                          : 'استلام من المتجر'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      <span className="text-sm">سيتم إشعارك عند توفر القطعة</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/orders" className="flex-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
                >
                  تتبع الطلبات
                </motion.div>
              </Link>
              
              <Link to="/marketplace" className="flex-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors text-center font-medium flex items-center justify-center gap-2"
                >
                  <span>متابعة التسوق</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Help & Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center"
        >
          <h3 className="font-bold text-yellow-800 mb-2">تحتاج مساعدة؟</h3>
          <p className="text-yellow-700 text-sm mb-4">
            إذا كان لديك أي استفسارات حول طلبك، لا تتردد في التواصل معنا
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="tel:+201234567890"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <PhoneIcon className="w-4 h-4" />
              اتصل بنا
            </a>
            <a
              href="https://wa.me/201234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📱 واتساب
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;