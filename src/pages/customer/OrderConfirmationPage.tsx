import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  TruckIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  ShoppingBagIcon,
  PrinterIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import { db } from '@/config/firebase.config';
import { doc, getDoc } from 'firebase/firestore';
import { Order } from '@/types';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams();
  const { language } = useAppStore();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() } as Order);
      } else {
        toast.error(language === 'ar' ? 'الطلب غير موجود' : 'Order not found');
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل الطلب' : 'Error loading order');
    } finally {
      setIsLoading(false);
    }
  };

  const copyOrderId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      toast.success(language === 'ar' ? 'تم نسخ رقم الطلب' : 'Order ID copied');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const printOrder = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!order) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            {language === 'ar' ? 'الطلب غير موجود' : 'Order not found'}
          </h2>
          <Link
            to='/orders'
            className='text-primary-600 hover:text-primary-700'
          >
            {language === 'ar' ? 'عرض جميع الطلبات' : 'View all orders'}
          </Link>
        </div>
      </div>
    );
  }

  const shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : {};

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='bg-white rounded-2xl shadow-xl overflow-hidden'
        >
          {/* Success Header */}
          <div className='bg-gradient-to-r from-green-500 to-green-600 text-white p-8 text-center'>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircleIcon className='w-20 h-20 mx-auto mb-4' />
            </motion.div>
            <h1 className='text-3xl font-bold mb-2'>
              {language === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order Confirmed Successfully!'}
            </h1>
            <p className='text-green-100'>
              {language === 'ar' 
                ? 'شكراً لك على طلبك. سنقوم بمعالجته في أقرب وقت ممكن.'
                : 'Thank you for your order. We will process it as soon as possible.'}
            </p>
          </div>

          {/* Order Details */}
          <div className='p-8'>
            {/* Order ID Section */}
            <div className='bg-gray-50 rounded-xl p-6 mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>
                    {language === 'ar' ? 'رقم الطلب' : 'Order Number'}
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    #{order.id?.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={copyOrderId}
                  className='flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <DocumentDuplicateIcon className='w-5 h-5 mr-2' />
                  {copied 
                    ? (language === 'ar' ? 'تم النسخ!' : 'Copied!')
                    : (language === 'ar' ? 'نسخ' : 'Copy')}
                </button>
              </div>
              
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <p className='text-gray-600'>
                    {language === 'ar' ? 'تاريخ الطلب' : 'Order Date'}
                  </p>
                  <p className='font-medium text-gray-900'>
                    {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
                <div>
                  <p className='text-gray-600'>
                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </p>
                  <p className='font-medium text-gray-900'>
                    {language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                  </p>
                </div>
                <div>
                  <p className='text-gray-600'>
                    {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
                  </p>
                  <p className='font-medium text-gray-900 text-lg'>
                    {order.totalAmount?.toFixed(2)} {language === 'ar' ? 'جنيه' : 'EGP'}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              <div className='bg-blue-50 rounded-xl p-6'>
                <div className='flex items-center mb-4'>
                  <TruckIcon className='w-6 h-6 text-blue-600 mr-3' />
                  <h3 className='font-semibold text-gray-900'>
                    {language === 'ar' ? 'معلومات التوصيل' : 'Delivery Information'}
                  </h3>
                </div>
                <p className='text-sm text-gray-600 mb-2'>
                  {language === 'ar' ? 'التوصيل المتوقع:' : 'Expected Delivery:'}
                </p>
                <p className='font-semibold text-gray-900 mb-3'>
                  {language === 'ar' ? '3-5 أيام عمل' : '3-5 Business Days'}
                </p>
                <p className='text-sm text-gray-700'>
                  {shippingAddress.fullName}<br />
                  {shippingAddress.address}<br />
                  {shippingAddress.city}, {shippingAddress.governorate}<br />
                  {shippingAddress.postalCode && `${shippingAddress.postalCode}`}
                </p>
              </div>

              <div className='bg-yellow-50 rounded-xl p-6'>
                <div className='flex items-center mb-4'>
                  <PhoneIcon className='w-6 h-6 text-yellow-600 mr-3' />
                  <h3 className='font-semibold text-gray-900'>
                    {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                  </h3>
                </div>
                <div className='space-y-3'>
                  <div>
                    <p className='text-sm text-gray-600'>
                      {language === 'ar' ? 'رقم الهاتف:' : 'Phone:'}
                    </p>
                    <p className='font-medium text-gray-900'>{shippingAddress.phone}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>
                      {language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}
                    </p>
                    <p className='font-medium text-gray-900'>{shippingAddress.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className='mb-6'>
              <h3 className='font-semibold text-gray-900 mb-4'>
                {language === 'ar' ? 'المنتجات المطلوبة' : 'Order Items'}
              </h3>
              <div className='border rounded-lg overflow-hidden'>
                {order.items?.map((item, index) => (
                  <div key={index} className='flex items-center p-4 border-b last:border-b-0'>
                    <img
                      src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                      alt={item.product?.title}
                      className='w-16 h-16 object-cover rounded-lg mr-4'
                    />
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900'>{item.product?.title}</h4>
                      <p className='text-sm text-gray-600'>
                        {language === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}
                      </p>
                    </div>
                    <p className='font-medium text-gray-900'>
                      {item.subtotal?.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notes */}
            <div className='bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6'>
              <div className='flex items-start'>
                <EnvelopeIcon className='w-6 h-6 text-amber-600 mr-3 mt-0.5' />
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>
                    {language === 'ar' ? 'معلومات مهمة' : 'Important Information'}
                  </h3>
                  <ul className='text-sm text-gray-700 space-y-2'>
                    <li>
                      {language === 'ar'
                        ? '• ستتلقى رسالة تأكيد على بريدك الإلكتروني'
                        : '• You will receive a confirmation email shortly'}
                    </li>
                    <li>
                      {language === 'ar'
                        ? '• سيتصل بك مندوب التوصيل قبل الوصول'
                        : '• Our delivery agent will call before arrival'}
                    </li>
                    <li>
                      {language === 'ar'
                        ? '• يرجى تجهيز المبلغ المطلوب عند الاستلام'
                        : '• Please have the exact amount ready for payment'}
                    </li>
                    <li>
                      {language === 'ar'
                        ? '• يمكنك تتبع طلبك من صفحة الطلبات'
                        : '• You can track your order from the orders page'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-4'>
              <Link
                to='/orders'
                className='flex-1 flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors'
              >
                <ShoppingBagIcon className='w-5 h-5 mr-2' />
                {language === 'ar' ? 'عرض طلباتي' : 'View My Orders'}
              </Link>
              
              <Link
                to='/marketplace'
                className='flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
              >
                <ShoppingBagIcon className='w-5 h-5 mr-2' />
                {language === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
              </Link>
              
              <button
                onClick={printOrder}
                className='flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
              >
                <PrinterIcon className='w-5 h-5 mr-2' />
                {language === 'ar' ? 'طباعة' : 'Print'}
              </button>
            </div>

            {/* Customer Support */}
            <div className='mt-8 pt-6 border-t text-center'>
              <p className='text-sm text-gray-600 mb-2'>
                {language === 'ar' 
                  ? 'هل تحتاج إلى مساعدة؟ اتصل بنا'
                  : 'Need help? Contact us'}
              </p>
              <div className='flex items-center justify-center space-x-4'>
                <a href='tel:+201234567890' className='text-primary-600 hover:text-primary-700 font-medium'>
                  +20 123 456 7890
                </a>
                <span className='text-gray-400'>|</span>
                <a href='mailto:support@souk-el-syarat.com' className='text-primary-600 hover:text-primary-700 font-medium'>
                  support@souk-el-syarat.com
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;