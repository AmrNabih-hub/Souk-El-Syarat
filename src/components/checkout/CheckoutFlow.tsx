import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon,
  TruckIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  UserIcon,
  HomeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import PaymentService, { PaymentMethod, PaymentDetails, Order } from '@/services/payment.service';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
  seller: {
    id: string;
    name: string;
    verified: boolean;
  };
}

interface CheckoutFlowProps {
  car: Car;
  onSuccess: (order: Order) => void;
  onClose: () => void;
}

interface CheckoutFormData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  
  // Delivery Address
  street: string;
  city: string;
  governorate: string;
  postalCode?: string;
  landmark?: string;
  
  // Payment
  paymentMethodId: string;
  installmentMonths?: number;
  
  // COD Specific
  preferredTimeSlot?: string;
  specialInstructions?: string;
  
  // Terms
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

const egyptianGovernorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
  'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
  'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر',
  'قنا', 'شمال سيناء', 'سوهاج'
];

const timeSlots = [
  { value: 'morning', label: 'صباحاً (9ص - 12ظ)', labelEn: 'Morning (9 AM - 12 PM)' },
  { value: 'afternoon', label: 'بعد الظهر (12ظ - 5م)', labelEn: 'Afternoon (12 PM - 5 PM)' },
  { value: 'evening', label: 'مساءً (5م - 8م)', labelEn: 'Evening (5 PM - 8 PM)' },
  { value: 'flexible', label: 'مرن (أي وقت)', labelEn: 'Flexible (Any time)' }
];

const schema = yup.object({
  fullName: yup.string().required('الاسم مطلوب').min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: yup.string().email('البريد الإلكتروني غير صحيح').required('البريد الإلكتروني مطلوب'),
  phone: yup.string()
    .required('رقم الهاتف مطلوب')
    .matches(/^(010|011|012|015)\d{8}$/, 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 010, 011, 012, أو 015)'),
  street: yup.string().required('عنوان الشارع مطلوب').min(10, 'العنوان يجب أن يكون مفصلاً أكثر'),
  city: yup.string().required('المدينة مطلوبة'),
  governorate: yup.string().required('المحافظة مطلوبة'),
  paymentMethodId: yup.string().required('طريقة الدفع مطلوبة'),
  agreeToTerms: yup.boolean().oneOf([true], 'يجب الموافقة على الشروط والأحكام'),
  agreeToPrivacy: yup.boolean().oneOf([true], 'يجب الموافقة على سياسة الخصوصية')
});

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ car, onSuccess, onClose }) => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethods] = useState<PaymentMethod[]>(PaymentService.getPaymentMethods());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [installmentDetails, setInstallmentDetails] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: car.price,
    fees: 0,
    total: car.price
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<CheckoutFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: user?.displayName || '',
      email: user?.email || '',
      paymentMethodId: 'cod', // Default to Cash on Delivery
      agreeToTerms: false,
      agreeToPrivacy: false
    }
  });

  const watchedPaymentMethod = watch('paymentMethodId');
  const watchedInstallmentMonths = watch('installmentMonths');

  useEffect(() => {
    const method = paymentMethods.find(m => m.id === watchedPaymentMethod);
    setSelectedPaymentMethod(method || null);

    if (method) {
      let fees = method.fees;
      let total = car.price + fees;

      // Calculate installment if applicable
      if (method.type === 'installment' && watchedInstallmentMonths) {
        const months = watchedInstallmentMonths;
        const installment = PaymentService.calculateInstallment(car.price, months);
        setInstallmentDetails(installment);
        total = installment.totalAmount + fees;
      } else {
        setInstallmentDetails(null);
      }

      setOrderSummary({
        subtotal: car.price,
        fees,
        total
      });
    }
  }, [watchedPaymentMethod, watchedInstallmentMonths, car.price, paymentMethods]);

  const steps = [
    { id: 1, title: 'معلومات شخصية', titleEn: 'Personal Info', icon: UserIcon },
    { id: 2, title: 'عنوان التسليم', titleEn: 'Delivery Address', icon: HomeIcon },
    { id: 3, title: 'طريقة الدفع', titleEn: 'Payment Method', icon: CreditCardIcon },
    { id: 4, title: 'مراجعة وتأكيد', titleEn: 'Review & Confirm', icon: CheckCircleIcon }
  ];

  const nextStep = async () => {
    const fieldsToValidate: (keyof CheckoutFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate.push('fullName', 'email', 'phone');
        break;
      case 2:
        fieldsToValidate.push('street', 'city', 'governorate');
        break;
      case 3:
        fieldsToValidate.push('paymentMethodId');
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!user || !selectedPaymentMethod) {
      toast.error('خطأ في البيانات');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentDetails: PaymentDetails = {
        method: selectedPaymentMethod,
        amount: orderSummary.total,
        currency: 'EGP' as const
      };

      // Add specific details based on payment method
      if (selectedPaymentMethod.type === 'cash_on_delivery') {
        paymentDetails.codDetails = {
          deliveryAddress: `${data.street}, ${data.city}, ${data.governorate}`,
          contactPhone: data.phone,
          preferredTimeSlot: data.preferredTimeSlot || 'flexible',
          specialInstructions: data.specialInstructions
        };
      } else if (selectedPaymentMethod.type === 'installment' && installmentDetails) {
        paymentDetails.installmentPlan = {
          months: data.installmentMonths || 6,
          monthlyAmount: installmentDetails.monthlyAmount,
          interestRate: 0.08,
          totalAmount: installmentDetails.totalAmount
        };
      }

      const order = await PaymentService.createOrder({
        buyerId: user.id,
        sellerId: car.seller.id,
        carId: car.id,
        carDetails: {
          title: car.title,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price,
          images: car.images
        },
        deliveryAddress: {
          street: data.street,
          city: data.city,
          governorate: data.governorate,
          postalCode: data.postalCode,
          coordinates: undefined // Could be added with geocoding
        },
        contactInfo: {
          phone: data.phone,
          email: data.email,
          alternatePhone: data.alternatePhone
        },
        paymentDetails
      });

      toast.success('تم إنشاء الطلب بنجاح!');
      onSuccess(order);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'حدث خطأ في إتمام الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'إتمام الشراء' : 'Checkout'}
            </h2>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              ✕
            </motion.button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= step.id
                    ? 'bg-white text-primary-600 border-white'
                    : 'bg-transparent text-white border-white border-opacity-50'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <div className="mr-3 text-sm">
                  <div className={`font-medium ${currentStep >= step.id ? 'text-white' : 'text-white text-opacity-70'}`}>
                    {language === 'ar' ? step.title : step.titleEn}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-white' : 'bg-white bg-opacity-30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الاسم الكامل *
                        </label>
                        <input
                          {...register('fullName')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="أدخل اسمك الكامل"
                        />
                        {errors.fullName && (
                          <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          البريد الإلكتروني *
                        </label>
                        <input
                          {...register('email')}
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="example@email.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رقم الهاتف *
                        </label>
                        <input
                          {...register('phone')}
                          type="tel"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="01012345678"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رقم هاتف بديل
                        </label>
                        <input
                          {...register('alternatePhone')}
                          type="tel"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="01012345678"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Delivery Address */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {language === 'ar' ? 'عنوان التسليم' : 'Delivery Address'}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان الشارع *
                        </label>
                        <input
                          {...register('street')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="أدخل العنوان التفصيلي (الشارع، رقم المبنى، الحي)"
                        />
                        {errors.street && (
                          <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            المدينة *
                          </label>
                          <input
                            {...register('city')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="المدينة"
                          />
                          {errors.city && (
                            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            المحافظة *
                          </label>
                          <select
                            {...register('governorate')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">اختر المحافظة</option>
                            {egyptianGovernorates.map(gov => (
                              <option key={gov} value={gov}>{gov}</option>
                            ))}
                          </select>
                          {errors.governorate && (
                            <p className="text-red-500 text-sm mt-1">{errors.governorate.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            الرمز البريدي
                          </label>
                          <input
                            {...register('postalCode')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="12345"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            علامة مميزة
                          </label>
                          <input
                            {...register('landmark')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="بجوار، أمام، خلف..."
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment Method */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                    </h3>

                    <div className="space-y-4">
                      {paymentMethods.map(method => (
                        <motion.label
                          key={method.id}
                          className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            watchedPaymentMethod === method.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            {...register('paymentMethodId')}
                            type="radio"
                            value={method.id}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-4">
                              <div className="text-3xl">{method.icon}</div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {language === 'ar' ? method.nameAr : method.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {language === 'ar' ? method.descriptionAr : method.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {language === 'ar' ? method.processingTimeAr : method.processingTime}
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              {method.fees > 0 && (
                                <div className="text-sm text-gray-600">
                                  رسوم: {PaymentService.formatCurrency(method.fees)}
                                </div>
                              )}
                              <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                watchedPaymentMethod === method.id
                                  ? 'border-primary-500 bg-primary-500'
                                  : 'border-gray-300'
                              }`} />
                            </div>
                          </div>
                        </motion.label>
                      ))}
                    </div>

                    {/* Cash on Delivery specific options */}
                    {selectedPaymentMethod?.type === 'cash_on_delivery' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-50 p-4 rounded-xl border border-yellow-200"
                      >
                        <h4 className="font-semibold text-gray-900 mb-3">خيارات الدفع عند الاستلام</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              الوقت المفضل للتسليم
                            </label>
                            <select
                              {...register('preferredTimeSlot')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                              {timeSlots.map(slot => (
                                <option key={slot.value} value={slot.value}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              تعليمات خاصة (اختياري)
                            </label>
                            <textarea
                              {...register('specialInstructions')}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="أي تعليمات خاصة للتسليم..."
                            />
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 mt-4 p-3 bg-blue-50 rounded-lg">
                          <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div className="text-sm text-blue-700">
                            <strong>ملاحظة:</strong> ستحتاج لدفع المبلغ كاملاً عند استلام السيارة. 
                            يرجى التأكد من توفر المبلغ نقداً أو إمكانية التحويل البنكي الفوري.
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Installment options */}
                    {selectedPaymentMethod?.type === 'installment' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 p-4 rounded-xl border border-green-200"
                      >
                        <h4 className="font-semibold text-gray-900 mb-3">خيارات التقسيط</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              عدد الأقساط
                            </label>
                            <select
                              {...register('installmentMonths')}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                              <option value={6}>6 أشهر</option>
                              <option value={12}>12 شهر</option>
                              <option value={18}>18 شهر</option>
                              <option value={24}>24 شهر</option>
                            </select>
                          </div>

                          {installmentDetails && (
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-900 mb-2">تفاصيل التقسيط</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>القسط الشهري:</span>
                                  <span className="font-medium">
                                    {PaymentService.formatCurrency(installmentDetails.monthlyAmount)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>المبلغ الإجمالي:</span>
                                  <span className="font-medium">
                                    {PaymentService.formatCurrency(installmentDetails.totalAmount)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                  <span>الفوائد:</span>
                                  <span className="font-medium">
                                    {PaymentService.formatCurrency(installmentDetails.interestAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 4: Review & Confirm */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {language === 'ar' ? 'مراجعة وتأكيد' : 'Review & Confirm'}
                    </h3>

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-4">ملخص الطلب</h4>
                      
                      <div className="flex items-center space-x-4 mb-4 pb-4 border-b">
                        <img
                          src={car.images[0] || '/placeholder-car.jpg'}
                          alt={car.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{car.title}</h5>
                          <p className="text-sm text-gray-600">
                            {car.make} {car.model} - {car.year}
                          </p>
                          <p className="text-lg font-bold text-primary-600">
                            {PaymentService.formatCurrency(car.price)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>السعر الأساسي:</span>
                          <span>{PaymentService.formatCurrency(orderSummary.subtotal)}</span>
                        </div>
                        {orderSummary.fees > 0 && (
                          <div className="flex justify-between">
                            <span>رسوم الخدمة:</span>
                            <span>{PaymentService.formatCurrency(orderSummary.fees)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>الإجمالي:</span>
                          <span className="text-primary-600">
                            {PaymentService.formatCurrency(orderSummary.total)}
                          </span>
                        </div>
                      </div>

                      {installmentDetails && (
                        <div className="mt-4 p-4 bg-green-100 rounded-lg">
                          <div className="text-sm">
                            <div className="flex justify-between mb-1">
                              <span>القسط الشهري:</span>
                              <span className="font-medium">
                                {PaymentService.formatCurrency(installmentDetails.monthlyAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>عدد الأقساط:</span>
                              <span className="font-medium">{watchedInstallmentMonths} شهر</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <input
                          {...register('agreeToTerms')}
                          type="checkbox"
                          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label className="text-sm text-gray-700">
                          أوافق على <a href="#" className="text-primary-600 hover:underline">الشروط والأحكام</a> *
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <p className="text-red-500 text-sm">{errors.agreeToTerms.message}</p>
                      )}

                      <div className="flex items-start space-x-3">
                        <input
                          {...register('agreeToPrivacy')}
                          type="checkbox"
                          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label className="text-sm text-gray-700">
                          أوافق على <a href="#" className="text-primary-600 hover:underline">سياسة الخصوصية</a> *
                        </label>
                      </div>
                      {errors.agreeToPrivacy && (
                        <p className="text-red-500 text-sm">{errors.agreeToPrivacy.message}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={currentStep === 1 ? onClose : prevStep}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  {currentStep === 1 ? 'إلغاء' : 'السابق'}
                </motion.button>

                {currentStep < 4 ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    التالي
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري التأكيد...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>تأكيد الطلب</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-80 bg-gray-50 p-6 border-l">
            <h4 className="font-semibold text-gray-900 mb-4">ملخص الطلب</h4>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <img
                  src={car.images[0] || '/placeholder-car.jpg'}
                  alt={car.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {car.title}
                  </h5>
                  <p className="text-xs text-gray-600 mt-1">
                    {car.year} - {car.seller.name}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>السعر:</span>
                  <span>{PaymentService.formatCurrency(orderSummary.subtotal)}</span>
                </div>
                {orderSummary.fees > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>رسوم الخدمة:</span>
                    <span>{PaymentService.formatCurrency(orderSummary.fees)}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-primary-600">
                    {PaymentService.formatCurrency(orderSummary.total)}
                  </span>
                </div>
              </div>

              {selectedPaymentMethod && (
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{selectedPaymentMethod.icon}</span>
                    <span className="font-medium text-sm">
                      {selectedPaymentMethod.nameAr}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedPaymentMethod.descriptionAr}
                  </p>
                  {installmentDetails && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <div>القسط الشهري: {PaymentService.formatCurrency(installmentDetails.monthlyAmount)}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedPaymentMethod?.type === 'cash_on_delivery' && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <TruckIcon className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-xs text-yellow-700">
                      <div className="font-medium mb-1">الدفع عند الاستلام</div>
                      <div>سيتم التواصل معك لتحديد موعد التسليم</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutFlow;