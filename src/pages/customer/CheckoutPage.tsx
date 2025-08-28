import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  TruckIcon,
  BanknotesIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import { db } from '@/config/firebase.config';
import { collection, addDoc, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { securityService } from '@/services/security.service';

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  governorate: string;
  postalCode: string;
  landmark?: string;
  notes?: string;
}

interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const CheckoutPage: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: '',
    governorate: '',
    postalCode: '',
    landmark: '',
    notes: ''
  });
  
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  const egyptianGovernorates = [
    'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira',
    'Fayoum', 'Gharbia', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya',
    'New Valley', 'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said',
    'Damietta', 'Sharkia', 'South Sinai', 'Kafr El Sheikh', 'Matrouh',
    'Luxor', 'Qena', 'North Sinai', 'Sohag'
  ];

  useEffect(() => {
    calculateOrderSummary();
  }, [items]);

  const calculateOrderSummary = () => {
    const subtotal = getTotalPrice();
    const shipping = calculateShipping(subtotal);
    const tax = subtotal * 0.14; // 14% VAT in Egypt
    const total = subtotal + shipping + tax;
    
    setOrderSummary({
      subtotal,
      shipping,
      tax,
      total
    });
  };

  const calculateShipping = (subtotal: number): number => {
    // Free shipping for orders over 500 EGP
    if (subtotal >= 500) return 0;
    
    // Standard shipping based on location
    const city = shippingAddress.city.toLowerCase();
    if (city === 'cairo' || city === 'giza') return 50;
    if (city === 'alexandria') return 75;
    return 100; // Other governorates
  };

  const validateShippingAddress = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};
    
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = language === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    }
    
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = language === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone is required';
    } else if (!/^01[0-2,5]\d{8}$/.test(shippingAddress.phone)) {
      newErrors.phone = language === 'ar' ? 'رقم هاتف غير صحيح' : 'Invalid phone number';
    }
    
    if (!shippingAddress.email.trim()) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      newErrors.email = language === 'ar' ? 'بريد إلكتروني غير صحيح' : 'Invalid email';
    }
    
    if (!shippingAddress.address.trim()) {
      newErrors.address = language === 'ar' ? 'العنوان مطلوب' : 'Address is required';
    }
    
    if (!shippingAddress.city.trim()) {
      newErrors.city = language === 'ar' ? 'المدينة مطلوبة' : 'City is required';
    }
    
    if (!shippingAddress.governorate) {
      newErrors.governorate = language === 'ar' ? 'المحافظة مطلوبة' : 'Governorate is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      navigate('/login');
      return;
    }

    if (!validateShippingAddress()) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    if (items.length === 0) {
      toast.error(language === 'ar' ? 'السلة فارغة' : 'Cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Generate order ID
      const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      
      // Prepare order data
      const orderData = {
        id: orderId,
        userId: user.uid,
        userEmail: user.email,
        items: items.map(item => ({
          productId: item.product.id,
          product: {
            title: item.product.title,
            price: item.product.price,
            images: item.product.images
          },
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity
        })),
        shippingAddress: securityService.sanitizeInput(JSON.stringify(shippingAddress)),
        paymentMethod: 'cod', // Cash on Delivery
        paymentStatus: 'pending',
        orderSummary,
        status: 'pending',
        trackingNumber: `TRK${Date.now()}`,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalAmount: orderSummary.total,
        notes: shippingAddress.notes || ''
      };

      // Create order in Firestore
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update product inventory (batch write)
      const batch = writeBatch(db);
      
      for (const item of items) {
        const productRef = doc(db, 'products', item.product.id);
        batch.update(productRef, {
          quantity: item.product.quantity - item.quantity,
          soldCount: (item.product.soldCount || 0) + item.quantity,
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      
      // Log order creation
      await securityService.logSecurityEvent(
        user.uid,
        'order_created',
        'success',
        { orderId: orderRef.id, total: orderSummary.total }
      );
      
      // Clear cart
      clearCart();
      
      // Show success message
      toast.success(
        language === 'ar' 
          ? `تم تأكيد طلبك! رقم الطلب: ${orderId}`
          : `Order confirmed! Order ID: ${orderId}`
      );
      
      // Navigate to order confirmation
      navigate(`/order-confirmation/${orderRef.id}`);
      
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(
        language === 'ar'
          ? 'حدث خطأ في إنشاء الطلب'
          : 'Error creating order'
      );
      
      await securityService.logSecurityEvent(
        user?.uid,
        'order_creation_failed',
        'failure',
        { error: error.message }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, title: language === 'ar' ? 'عنوان الشحن' : 'Shipping Address', icon: MapPinIcon },
    { number: 2, title: language === 'ar' ? 'مراجعة الطلب' : 'Review Order', icon: ShoppingBagIcon },
    { number: 3, title: language === 'ar' ? 'الدفع' : 'Payment', icon: BanknotesIcon }
  ];

  if (items.length === 0 && !isProcessing) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <ShoppingBagIcon className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            {language === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
          </h2>
          <button
            onClick={() => navigate('/marketplace')}
            className='mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600'
          >
            {language === 'ar' ? 'تابع التسوق' : 'Continue Shopping'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className='mb-8'>
            <button
              onClick={() => navigate('/cart')}
              className='flex items-center text-gray-600 hover:text-gray-900 mb-4'
            >
              <ArrowLeftIcon className='w-5 h-5 mr-2' />
              {language === 'ar' ? 'العودة للسلة' : 'Back to Cart'}
            </button>
            <h1 className='text-3xl font-bold text-gray-900'>
              {language === 'ar' ? 'إتمام الطلب' : 'Checkout'}
            </h1>
          </div>

          {/* Progress Steps */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              {steps.map((step, index) => (
                <div key={step.number} className='flex items-center flex-1'>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.number
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircleIcon className='w-6 h-6' />
                    ) : (
                      <span className='font-semibold'>{step.number}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-primary-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className='flex justify-between mt-2'>
              {steps.map(step => (
                <span key={step.number} className='text-sm text-gray-600'>
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Main Content */}
            <div className='lg:col-span-2'>
              {/* Step 1: Shipping Address */}
              {currentStep === 1 && (
                <div className='bg-white rounded-xl shadow-sm p-6'>
                  <h2 className='text-xl font-semibold mb-6'>
                    {language === 'ar' ? 'معلومات الشحن' : 'Shipping Information'}
                  </h2>
                  
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                        </label>
                        <input
                          type='text'
                          value={shippingAddress.fullName}
                          onChange={e => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                            errors.fullName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.fullName && (
                          <p className='text-red-500 text-sm mt-1'>{errors.fullName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                        </label>
                        <input
                          type='tel'
                          value={shippingAddress.phone}
                          onChange={e => setShippingAddress({...shippingAddress, phone: e.target.value})}
                          placeholder='01XXXXXXXXX'
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.phone && (
                          <p className='text-red-500 text-sm mt-1'>{errors.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        {language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
                      </label>
                      <input
                        type='email'
                        value={shippingAddress.email}
                        onChange={e => setShippingAddress({...shippingAddress, email: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && (
                        <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        {language === 'ar' ? 'العنوان *' : 'Street Address *'}
                      </label>
                      <input
                        type='text'
                        value={shippingAddress.address}
                        onChange={e => setShippingAddress({...shippingAddress, address: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.address && (
                        <p className='text-red-500 text-sm mt-1'>{errors.address}</p>
                      )}
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {language === 'ar' ? 'المدينة *' : 'City *'}
                        </label>
                        <input
                          type='text'
                          value={shippingAddress.city}
                          onChange={e => {
                            setShippingAddress({...shippingAddress, city: e.target.value});
                            calculateOrderSummary();
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.city && (
                          <p className='text-red-500 text-sm mt-1'>{errors.city}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {language === 'ar' ? 'المحافظة *' : 'Governorate *'}
                        </label>
                        <select
                          value={shippingAddress.governorate}
                          onChange={e => setShippingAddress({...shippingAddress, governorate: e.target.value})}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                            errors.governorate ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value=''>{language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</option>
                          {egyptianGovernorates.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                        {errors.governorate && (
                          <p className='text-red-500 text-sm mt-1'>{errors.governorate}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {language === 'ar' ? 'الرمز البريدي' : 'Postal Code'}
                        </label>
                        <input
                          type='text'
                          value={shippingAddress.postalCode}
                          onChange={e => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        {language === 'ar' ? 'علامة مميزة (اختياري)' : 'Landmark (Optional)'}
                      </label>
                      <input
                        type='text'
                        value={shippingAddress.landmark}
                        onChange={e => setShippingAddress({...shippingAddress, landmark: e.target.value})}
                        placeholder={language === 'ar' ? 'بجوار...' : 'Near...'}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                      />
                    </div>
                    
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        {language === 'ar' ? 'ملاحظات (اختياري)' : 'Delivery Notes (Optional)'}
                      </label>
                      <textarea
                        value={shippingAddress.notes}
                        onChange={e => setShippingAddress({...shippingAddress, notes: e.target.value})}
                        rows={3}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                      />
                    </div>
                  </div>
                  
                  <div className='mt-6 flex justify-end'>
                    <button
                      onClick={() => {
                        if (validateShippingAddress()) {
                          setCurrentStep(2);
                        }
                      }}
                      className='px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600'
                    >
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Review Order */}
              {currentStep === 2 && (
                <div className='bg-white rounded-xl shadow-sm p-6'>
                  <h2 className='text-xl font-semibold mb-6'>
                    {language === 'ar' ? 'مراجعة الطلب' : 'Review Your Order'}
                  </h2>
                  
                  <div className='space-y-4'>
                    {items.map((item, index) => (
                      <div key={index} className='flex items-center space-x-4 p-4 border rounded-lg'>
                        <img
                          src={item.product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                          alt={item.product.title}
                          className='w-20 h-20 object-cover rounded-lg'
                        />
                        <div className='flex-1'>
                          <h3 className='font-semibold text-gray-900'>{item.product.title}</h3>
                          <p className='text-gray-600'>
                            {language === 'ar' ? 'الكمية:' : 'Quantity:'} {item.quantity}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold text-gray-900'>
                            {(item.product.price * item.quantity).toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                    <h3 className='font-semibold mb-3'>
                      {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}
                    </h3>
                    <p className='text-gray-700'>
                      {shippingAddress.fullName}<br />
                      {shippingAddress.address}<br />
                      {shippingAddress.city}, {shippingAddress.governorate}<br />
                      {shippingAddress.phone}
                    </p>
                  </div>
                  
                  <div className='mt-6 flex justify-between'>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
                    >
                      {language === 'ar' ? 'السابق' : 'Previous'}
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className='px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600'
                    >
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment (COD) */}
              {currentStep === 3 && (
                <div className='bg-white rounded-xl shadow-sm p-6'>
                  <h2 className='text-xl font-semibold mb-6'>
                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </h2>
                  
                  <div className='p-6 border-2 border-primary-500 rounded-lg bg-primary-50'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center'>
                        <BanknotesIcon className='w-8 h-8 text-primary-600 mr-3' />
                        <div>
                          <h3 className='font-semibold text-gray-900'>
                            {language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            {language === 'ar' 
                              ? 'ادفع نقداً عند استلام طلبك'
                              : 'Pay with cash when you receive your order'}
                          </p>
                        </div>
                      </div>
                      <CheckCircleIcon className='w-6 h-6 text-green-500' />
                    </div>
                    
                    <div className='bg-white p-4 rounded-lg'>
                      <div className='flex items-start'>
                        <InformationCircleIcon className='w-5 h-5 text-blue-500 mr-2 mt-0.5' />
                        <div className='text-sm text-gray-600'>
                          <p className='mb-2'>
                            {language === 'ar'
                              ? '• تأكد من توفر المبلغ الكامل عند الاستلام'
                              : '• Please have the exact amount ready upon delivery'}
                          </p>
                          <p className='mb-2'>
                            {language === 'ar'
                              ? '• سيتصل بك مندوب التوصيل قبل الوصول'
                              : '• Our delivery agent will call you before arrival'}
                          </p>
                          <p>
                            {language === 'ar'
                              ? '• احتفظ برقم الطلب للمتابعة'
                              : '• Keep your order ID for tracking'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className='mt-6 flex justify-between'>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
                    >
                      {language === 'ar' ? 'السابق' : 'Previous'}
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className='px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center'
                    >
                      {isProcessing ? (
                        <>
                          <LoadingSpinner size='sm' color='white' />
                          <span className='ml-2'>
                            {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className='w-5 h-5 mr-2' />
                          {language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className='lg:col-span-1'>
              <div className='bg-white rounded-xl shadow-sm p-6 sticky top-4'>
                <h3 className='text-lg font-semibold mb-4'>
                  {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h3>
                
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>
                      {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
                    </span>
                    <span className='font-medium'>
                      {orderSummary.subtotal.toLocaleString()} {language === 'ar' ? 'جنيه' : 'EGP'}
                    </span>
                  </div>
                  
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>
                      {language === 'ar' ? 'الشحن' : 'Shipping'}
                    </span>
                    <span className='font-medium'>
                      {orderSummary.shipping === 0 ? (
                        <span className='text-green-600'>
                          {language === 'ar' ? 'مجاني' : 'FREE'}
                        </span>
                      ) : (
                        `${orderSummary.shipping} ${language === 'ar' ? 'جنيه' : 'EGP'}`
                      )}
                    </span>
                  </div>
                  
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>
                      {language === 'ar' ? 'الضريبة (14%)' : 'Tax (14%)'}
                    </span>
                    <span className='font-medium'>
                      {orderSummary.tax.toFixed(2)} {language === 'ar' ? 'جنيه' : 'EGP'}
                    </span>
                  </div>
                  
                  <div className='pt-3 border-t'>
                    <div className='flex justify-between'>
                      <span className='text-lg font-semibold'>
                        {language === 'ar' ? 'الإجمالي' : 'Total'}
                      </span>
                      <span className='text-lg font-bold text-primary-600'>
                        {orderSummary.total.toFixed(2)} {language === 'ar' ? 'جنيه' : 'EGP'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {orderSummary.shipping === 0 && (
                  <div className='mt-4 p-3 bg-green-50 rounded-lg'>
                    <p className='text-sm text-green-700'>
                      {language === 'ar'
                        ? '✓ شحن مجاني للطلبات فوق 500 جنيه'
                        : '✓ Free shipping on orders over 500 EGP'}
                    </p>
                  </div>
                )}
                
                <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                  <div className='flex items-center'>
                    <TruckIcon className='w-5 h-5 text-gray-600 mr-2' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {language === 'ar' ? 'التوصيل المتوقع' : 'Estimated Delivery'}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {language === 'ar' ? '3-5 أيام عمل' : '3-5 business days'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;