import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCardIcon,
  BanknotesIcon,
  TruckIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingCartIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import RealDataService from '@/services/real-data.service';
import OrderTrackingService from '@/services/order-tracking.service';
import toast from 'react-hot-toast';

type PaymentMethod = 'cod' | 'bank' | 'installment';
type ItemType = 'car' | 'service' | 'part';

interface CheckoutItem {
  id: string;
  type: ItemType;
  name: string;
  price: number;
  image: string;
  details?: any;
  quantity?: number;
}

interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  governorate: string;
  notes: string;
}

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useAppStore();
  const { user } = useAuthStore();

  // Get checkout data from URL parameters
  const itemId = searchParams.get('item');
  const itemType = searchParams.get('type') as ItemType;
  const quantity = parseInt(searchParams.get('qty') || '1');

  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: '',
    governorate: '',
    notes: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Confirmation

  // Load item data based on ID and type
  useEffect(() => {
    if (!itemId || !itemType) {
      toast.error('بيانات غير صحيحة');
      navigate('/marketplace');
      return;
    }

    let foundItem: CheckoutItem | null = null;

    switch (itemType) {
      case 'car':
        const cars = RealDataService.getRealCars();
        const car = cars.find(c => c.id === itemId);
        if (car) {
          foundItem = {
            id: car.id,
            type: 'car',
            name: car.title,
            price: car.price,
            image: car.images[0],
            details: car
          };
        }
        break;

      case 'service':
        const services = RealDataService.getCarServices();
        const service = services.find(s => s.id === itemId);
        if (service) {
          foundItem = {
            id: service.id,
            type: 'service',
            name: service.nameAr,
            price: service.price,
            image: service.image,
            details: service
          };
        }
        break;

      case 'part':
        const parts = RealDataService.getCarParts();
        const part = parts.find(p => p.id === itemId);
        if (part) {
          foundItem = {
            id: part.id,
            type: 'part',
            name: part.nameAr,
            price: part.price,
            image: part.images[0],
            details: part,
            quantity: quantity
          };
        }
        break;
    }

    if (foundItem) {
      setItem(foundItem);
    } else {
      toast.error('العنصر غير موجود');
      navigate('/marketplace');
    }
  }, [itemId, itemType, quantity, navigate]);

  const getTotalPrice = () => {
    if (!item) return 0;
    const basePrice = item.price * (item.quantity || 1);
    
    // Add shipping for parts
    if (item.type === 'part' && item.details?.shipping?.available) {
      return basePrice + item.details.shipping.cost;
    }
    
    return basePrice;
  };

  const handleSubmitOrder = async () => {
    if (!item || !user) return;

    // Validate customer info
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.address) {
      toast.error('يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderId = `ORD-${Date.now()}`;
      const estimatedDelivery = OrderTrackingService.generateEstimatedDelivery(item.type);

      // Create order data for localStorage (backward compatibility)
      const orderData = {
        orderId,
        item,
        customerInfo,
        paymentMethod,
        totalPrice: getTotalPrice(),
        status: 'confirmed',
        createdAt: new Date(),
        estimatedDelivery
      };

      // Store order in localStorage
      const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('userOrders', JSON.stringify(existingOrders));

      // Create order tracking with real-time updates
      const trackingService = OrderTrackingService.getInstance();
      await trackingService.createOrderTracking({
        orderId,
        userId: user.id,
        itemType: item.type,
        itemName: item.name,
        currentStatus: 'confirmed',
        statusHistory: [
          {
            status: 'confirmed',
            timestamp: new Date(),
            notes: 'تم تأكيد الطلب وبدء المعالجة'
          }
        ],
        estimatedDelivery,
        vendorName: item.details?.seller?.name || item.details?.provider?.nameAr || 'سوق السيارات',
        shippingAddress: `${customerInfo.address}, ${customerInfo.governorate}`,
        contactPhone: customerInfo.phone,
        paymentMethod,
        totalAmount: getTotalPrice()
      });

      toast.success('تم تأكيد الطلب بنجاح!');
      
      // Redirect to success page
      navigate(`/order-success?orderId=${orderId}`);

    } catch (error) {
      toast.error('حدث خطأ في معالجة الطلب');
      console.error('Order processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">معلومات العميل</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={customerInfo.fullName}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, fullName: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المحافظة
                </label>
                <select
                  value={customerInfo.governorate}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, governorate: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">اختر المحافظة</option>
                  {RealDataService.getEgyptianGovernorates().map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان التفصيلي *
                </label>
                <textarea
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, address: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="أدخل العنوان التفصيلي..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, notes: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder="أي ملاحظات أو طلبات خاصة..."
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">طريقة الدفع</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('cod')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <BanknotesIcon className="w-8 h-8 text-primary-600 mb-3 mx-auto" />
                <h4 className="font-semibold text-center mb-2">دفع عند الاستلام</h4>
                <p className="text-sm text-gray-600 text-center">
                  ادفع نقداً عند استلام المنتج أو الخدمة
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('bank')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCardIcon className="w-8 h-8 text-primary-600 mb-3 mx-auto" />
                <h4 className="font-semibold text-center mb-2">تحويل بنكي</h4>
                <p className="text-sm text-gray-600 text-center">
                  حول المبلغ على حساب البائع مباشرة
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('installment')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'installment'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CalendarIcon className="w-8 h-8 text-primary-600 mb-3 mx-auto" />
                <h4 className="font-semibold text-center mb-2">تقسيط</h4>
                <p className="text-sm text-gray-600 text-center">
                  اقسط المبلغ على عدة أشهر
                </p>
              </motion.div>
            </div>

            {paymentMethod === 'bank' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">معلومات التحويل البنكي</h4>
                <p className="text-blue-800 text-sm mb-1">البنك: بنك مصر</p>
                <p className="text-blue-800 text-sm mb-1">رقم الحساب: 1234567890123456</p>
                <p className="text-blue-800 text-sm">اسم الحساب: سوق السيارات المصري</p>
              </div>
            )}

            {paymentMethod === 'installment' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">خطة التقسيط</h4>
                <p className="text-green-800 text-sm mb-1">القسط الشهري: {RealDataService.formatEGP(getTotalPrice() / 12)}</p>
                <p className="text-green-800 text-sm mb-1">مدة التقسيط: 12 شهر</p>
                <p className="text-green-800 text-sm">إجمالي المبلغ: {RealDataService.formatEGP(getTotalPrice() * 1.1)}</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">مراجعة الطلب</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4">معلومات العميل</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">الاسم:</span> {customerInfo.fullName}</p>
                <p><span className="font-medium">الهاتف:</span> {customerInfo.phone}</p>
                <p><span className="font-medium">البريد:</span> {customerInfo.email}</p>
                <p><span className="font-medium">المحافظة:</span> {customerInfo.governorate}</p>
                <p className="md:col-span-2"><span className="font-medium">العنوان:</span> {customerInfo.address}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4">طريقة الدفع</h4>
              <p className="text-sm">
                {paymentMethod === 'cod' && '💰 دفع عند الاستلام'}
                {paymentMethod === 'bank' && '🏦 تحويل بنكي'}
                {paymentMethod === 'installment' && '📅 تقسيط - 12 شهر'}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إتمام الطلب</h1>
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNum
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > stepNum ? <CheckCircleIcon className="w-5 h-5" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span className={step >= 1 ? 'text-primary-600 font-medium' : ''}>معلومات العميل</span>
            <span className={step >= 2 ? 'text-primary-600 font-medium' : ''}>طريقة الدفع</span>
            <span className={step >= 3 ? 'text-primary-600 font-medium' : ''}>المراجعة</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {step > 1 && (
                  <motion.button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    السابق
                  </motion.button>
                )}

                {step < 3 ? (
                  <motion.button
                    onClick={() => setStep(step + 1)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors ml-auto"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    التالي
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSubmitOrder}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        تأكيد الطلب
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">ملخص الطلب</h3>
              
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.type === 'car' && '🚗 سيارة'}
                    {item.type === 'service' && '🔧 خدمة'}
                    {item.type === 'part' && '⚙️ قطعة غيار'}
                    {item.quantity && ` × ${item.quantity}`}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>السعر الأساسي:</span>
                  <span>{RealDataService.formatEGP(item.price * (item.quantity || 1))}</span>
                </div>
                
                {item.type === 'part' && item.details?.shipping?.available && (
                  <div className="flex justify-between">
                    <span>الشحن:</span>
                    <span>{RealDataService.formatEGP(item.details.shipping.cost)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 mt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>المجموع:</span>
                    <span className="text-primary-600">{RealDataService.formatEGP(getTotalPrice())}</span>
                  </div>
                </div>
              </div>

              {item.type === 'service' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    <span>مدة الخدمة: {item.details?.durationAr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800 text-sm mt-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>الموقع: {item.details?.provider?.location}</span>
                  </div>
                </div>
              )}

              {item.type === 'part' && item.details?.shipping?.available && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 text-sm">
                    <TruckIcon className="w-4 h-4" />
                    <span>الشحن: {item.details.shipping.durationAr}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;