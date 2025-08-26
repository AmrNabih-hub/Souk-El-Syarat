import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface DeliveryAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  alternativePhone?: string;
  governorate: string;
  city: string;
  district: string;
  street: string;
  buildingNumber: string;
  floorNumber?: string;
  apartmentNumber?: string;
  landmarks?: string;
  isDefault: boolean;
}

interface CODOrder {
  id: string;
  carId: string;
  carTitle: string;
  carPrice: number;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'cash' | 'bank_transfer' | 'installments';
  deliveryDate: Date;
  deliveryTimeSlot: string;
  deliveryFee: number;
  inspectionFee: number;
  totalAmount: number;
  downPayment: number;
  remainingAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
  specialInstructions?: string;
  requiresInspection: boolean;
  insuranceRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CashOnDeliveryProps {
  carId: string;
  carTitle: string;
  carPrice: number;
  sellerId: string;
  sellerName: string;
  onOrderComplete: (order: CODOrder) => void;
  onCancel: () => void;
  className?: string;
}

const egyptianGovernorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
  'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
  'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر',
  'قنا', 'شمال سيناء', 'سوهاج'
];

const timeSlots = [
  { id: 'morning', label: 'صباحاً (9:00 - 12:00)', value: '09:00-12:00' },
  { id: 'afternoon', label: 'ظهراً (12:00 - 15:00)', value: '12:00-15:00' },
  { id: 'evening', label: 'مساءً (15:00 - 18:00)', value: '15:00-18:00' },
  { id: 'night', label: 'ليلاً (18:00 - 21:00)', value: '18:00-21:00' }
];

const CashOnDeliverySystem: React.FC<CashOnDeliveryProps> = ({
  carId,
  carTitle,
  carPrice,
  sellerId,
  sellerName,
  onOrderComplete,
  onCancel,
  className = ''
}) => {
  const { language } = useAppStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    id: '',
    fullName: user?.displayName || '',
    phoneNumber: '',
    alternativePhone: '',
    governorate: '',
    city: '',
    district: '',
    street: '',
    buildingNumber: '',
    floorNumber: '',
    apartmentNumber: '',
    landmarks: '',
    isDefault: false
  });

  const [orderDetails, setOrderDetails] = useState({
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'installments',
    deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    deliveryTimeSlot: '',
    specialInstructions: '',
    requiresInspection: true,
    insuranceRequired: false,
    downPayment: 0
  });

  // Calculate fees and totals
  const calculateFees = () => {
    const baseDeliveryFee = 200; // Base delivery fee in EGP
    const distanceFee = orderDetails.paymentMethod === 'installments' ? 100 : 0;
    const inspectionFee = orderDetails.requiresInspection ? 300 : 0;
    const insuranceFee = orderDetails.insuranceRequired ? carPrice * 0.02 : 0;
    
    const deliveryFee = baseDeliveryFee + distanceFee;
    const totalFees = deliveryFee + inspectionFee + insuranceFee;
    const totalAmount = carPrice + totalFees;
    const remainingAmount = totalAmount - orderDetails.downPayment;

    return {
      deliveryFee,
      inspectionFee,
      insuranceFee,
      totalFees,
      totalAmount,
      remainingAmount
    };
  };

  const fees = calculateFees();

  // Validation
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!deliveryAddress.fullName.trim()) {
        newErrors.fullName = 'الاسم الكامل مطلوب';
      }
      if (!deliveryAddress.phoneNumber.trim()) {
        newErrors.phoneNumber = 'رقم الهاتف مطلوب';
      } else if (!/^01[0-2,5]\d{8}$/.test(deliveryAddress.phoneNumber)) {
        newErrors.phoneNumber = 'رقم هاتف مصري صحيح مطلوب';
      }
      if (!deliveryAddress.governorate) {
        newErrors.governorate = 'المحافظة مطلوبة';
      }
      if (!deliveryAddress.city.trim()) {
        newErrors.city = 'المدينة مطلوبة';
      }
      if (!deliveryAddress.street.trim()) {
        newErrors.street = 'العنوان مطلوب';
      }
      if (!deliveryAddress.buildingNumber.trim()) {
        newErrors.buildingNumber = 'رقم العقار مطلوب';
      }
    }

    if (stepNumber === 2) {
      if (!orderDetails.deliveryTimeSlot) {
        newErrors.deliveryTimeSlot = 'موعد التسليم مطلوب';
      }
      if (orderDetails.paymentMethod === 'installments' && orderDetails.downPayment < carPrice * 0.1) {
        newErrors.downPayment = 'العربون يجب أن يكون 10% على الأقل';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePreviousStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitOrder = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      // Create order object
      const newOrder: CODOrder = {
        id: `cod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        carId,
        carTitle,
        carPrice,
        sellerId,
        sellerName,
        buyerId: user?.id || 'guest',
        buyerName: user?.displayName || 'زائر',
        deliveryAddress,
        paymentMethod: orderDetails.paymentMethod,
        deliveryDate: orderDetails.deliveryDate,
        deliveryTimeSlot: orderDetails.deliveryTimeSlot,
        deliveryFee: fees.deliveryFee,
        inspectionFee: fees.inspectionFee,
        totalAmount: fees.totalAmount,
        downPayment: orderDetails.downPayment,
        remainingAmount: fees.remainingAmount,
        status: 'pending',
        specialInstructions: orderDetails.specialInstructions,
        requiresInspection: orderDetails.requiresInspection,
        insuranceRequired: orderDetails.insuranceRequired,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Store order (in real app, this would be saved to Firebase)
      localStorage.setItem(`cod_order_${newOrder.id}`, JSON.stringify(newOrder));

      toast.success('تم تأكيد طلب الشراء بالدفع عند الاستلام!');
      setStep(3);
      onOrderComplete(newOrder);

    } catch (error) {
      toast.error('فشل في إرسال الطلب. يرجى المحاولة مرة أخرى');
      console.error('Order submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <MapPinIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">عنوان التسليم</h3>
        <p className="text-gray-600">أدخل عنوان التسليم الصحيح لضمان وصول السيارة بأمان</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الاسم الكامل *
          </label>
          <input
            type="text"
            value={deliveryAddress.fullName}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, fullName: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="الاسم الكامل كما هو في الهوية"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم الهاتف *
          </label>
          <input
            type="tel"
            value={deliveryAddress.phoneNumber}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phoneNumber: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="01xxxxxxxxx"
          />
          {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            هاتف بديل (اختياري)
          </label>
          <input
            type="tel"
            value={deliveryAddress.alternativePhone || ''}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, alternativePhone: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="01xxxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المحافظة *
          </label>
          <select
            value={deliveryAddress.governorate}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, governorate: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.governorate ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">اختر المحافظة</option>
            {egyptianGovernorates.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
          {errors.governorate && <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المدينة *
          </label>
          <input
            type="text"
            value={deliveryAddress.city}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="اسم المدينة"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الحي/المنطقة
          </label>
          <input
            type="text"
            value={deliveryAddress.district}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, district: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="اسم الحي أو المنطقة"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الشارع والعنوان التفصيلي *
        </label>
        <input
          type="text"
          value={deliveryAddress.street}
          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.street ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="اسم الشارع والعنوان التفصيلي"
        />
        {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم العقار *
          </label>
          <input
            type="text"
            value={deliveryAddress.buildingNumber}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, buildingNumber: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.buildingNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="رقم العقار"
          />
          {errors.buildingNumber && <p className="text-red-500 text-sm mt-1">{errors.buildingNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم الطابق
          </label>
          <input
            type="text"
            value={deliveryAddress.floorNumber || ''}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, floorNumber: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="رقم الطابق"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم الشقة
          </label>
          <input
            type="text"
            value={deliveryAddress.apartmentNumber || ''}
            onChange={(e) => setDeliveryAddress(prev => ({ ...prev, apartmentNumber: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="رقم الشقة"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          علامات مميزة (اختياري)
        </label>
        <textarea
          value={deliveryAddress.landmarks || ''}
          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, landmarks: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="أي علامات مميزة تساعد في الوصول للموقع (مثل: بجوار مسجد النور، أمام صيدلية العزبي)"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="defaultAddress"
          checked={deliveryAddress.isDefault}
          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="defaultAddress" className="mr-2 text-sm text-gray-700">
          حفظ كعنوان افتراضي للطلبات القادمة
        </label>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <CurrencyDollarIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">تفاصيل الدفع والتسليم</h3>
        <p className="text-gray-600">اختر طريقة الدفع وموعد التسليم المناسب</p>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          طريقة الدفع
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.label
            className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              orderDetails.paymentMethod === 'cash'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={orderDetails.paymentMethod === 'cash'}
              onChange={(e) => setOrderDetails(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              className="sr-only"
            />
            <div className="flex items-center">
              <BanknotesIcon className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <div className="font-medium">نقداً عند الاستلام</div>
                <div className="text-sm text-gray-500">دفع المبلغ كاملاً عند التسليم</div>
              </div>
            </div>
            {orderDetails.paymentMethod === 'cash' && (
              <CheckCircleIcon className="absolute top-2 right-2 w-5 h-5 text-primary-600" />
            )}
          </motion.label>

          <motion.label
            className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              orderDetails.paymentMethod === 'bank_transfer'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              checked={orderDetails.paymentMethod === 'bank_transfer'}
              onChange={(e) => setOrderDetails(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              className="sr-only"
            />
            <div className="flex items-center">
              <CreditCardIcon className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <div className="font-medium">حوالة بنكية</div>
                <div className="text-sm text-gray-500">دفع عن طريق البنك</div>
              </div>
            </div>
            {orderDetails.paymentMethod === 'bank_transfer' && (
              <CheckCircleIcon className="absolute top-2 right-2 w-5 h-5 text-primary-600" />
            )}
          </motion.label>

          <motion.label
            className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              orderDetails.paymentMethod === 'installments'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="installments"
              checked={orderDetails.paymentMethod === 'installments'}
              onChange={(e) => setOrderDetails(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              className="sr-only"
            />
            <div className="flex items-center">
              <DocumentCheckIcon className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <div className="font-medium">عربون + دفعات</div>
                <div className="text-sm text-gray-500">عربون + باقي المبلغ بالتقسيط</div>
              </div>
            </div>
            {orderDetails.paymentMethod === 'installments' && (
              <CheckCircleIcon className="absolute top-2 right-2 w-5 h-5 text-primary-600" />
            )}
          </motion.label>
        </div>
      </div>

      {/* Down Payment for Installments */}
      <AnimatePresence>
        {orderDetails.paymentMethod === 'installments' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ العربون (الحد الأدنى 10%)
            </label>
            <input
              type="number"
              value={orderDetails.downPayment}
              onChange={(e) => setOrderDetails(prev => ({ ...prev, downPayment: Number(e.target.value) }))}
              min={carPrice * 0.1}
              max={carPrice * 0.5}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.downPayment ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`الحد الأدنى: ${formatPrice(carPrice * 0.1)}`}
            />
            {errors.downPayment && <p className="text-red-500 text-sm mt-1">{errors.downPayment}</p>}
            <p className="text-sm text-gray-500 mt-1">
              سيتم دفع باقي المبلغ ({formatPrice(carPrice - orderDetails.downPayment)}) على دفعات شهرية
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تاريخ التسليم
          </label>
          <input
            type="date"
            value={orderDetails.deliveryDate.toISOString().split('T')[0]}
            onChange={(e) => setOrderDetails(prev => ({ ...prev, deliveryDate: new Date(e.target.value) }))}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            موعد التسليم *
          </label>
          <select
            value={orderDetails.deliveryTimeSlot}
            onChange={(e) => setOrderDetails(prev => ({ ...prev, deliveryTimeSlot: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.deliveryTimeSlot ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">اختر الموعد</option>
            {timeSlots.map(slot => (
              <option key={slot.id} value={slot.value}>{slot.label}</option>
            ))}
          </select>
          {errors.deliveryTimeSlot && <p className="text-red-500 text-sm mt-1">{errors.deliveryTimeSlot}</p>}
        </div>
      </div>

      {/* Additional Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          خدمات إضافية
        </label>
        <div className="space-y-3">
          <motion.label
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            whileHover={{ backgroundColor: '#f9fafb' }}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={orderDetails.requiresInspection}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, requiresInspection: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="mr-3">
                <div className="font-medium">فحص تقني شامل</div>
                <div className="text-sm text-gray-500">فحص السيارة قبل التسليم بواسطة فني مختص</div>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900">300 جنيه</span>
          </motion.label>

          <motion.label
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            whileHover={{ backgroundColor: '#f9fafb' }}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={orderDetails.insuranceRequired}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, insuranceRequired: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="mr-3">
                <div className="font-medium">تأمين النقل</div>
                <div className="text-sm text-gray-500">تأمين شامل ضد الأضرار أثناء النقل</div>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900">{formatPrice(carPrice * 0.02)}</span>
          </motion.label>
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ملاحظات خاصة (اختياري)
        </label>
        <textarea
          value={orderDetails.specialInstructions}
          onChange={(e) => setOrderDetails(prev => ({ ...prev, specialInstructions: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="أي ملاحظات أو طلبات خاصة للتسليم"
        />
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">ملخص الطلب</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>سعر السيارة:</span>
            <span className="font-medium">{formatPrice(carPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span>رسوم التسليم:</span>
            <span className="font-medium">{formatPrice(fees.deliveryFee)}</span>
          </div>
          {orderDetails.requiresInspection && (
            <div className="flex justify-between">
              <span>رسوم الفحص:</span>
              <span className="font-medium">{formatPrice(fees.inspectionFee)}</span>
            </div>
          )}
          {orderDetails.insuranceRequired && (
            <div className="flex justify-between">
              <span>تأمين النقل:</span>
              <span className="font-medium">{formatPrice(fees.insuranceFee)}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>المجموع الكلي:</span>
            <span className="text-primary-600">{formatPrice(fees.totalAmount)}</span>
          </div>
          {orderDetails.paymentMethod === 'installments' && (
            <>
              <div className="flex justify-between text-green-600">
                <span>العربون المطلوب:</span>
                <span className="font-medium">{formatPrice(orderDetails.downPayment)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>المبلغ المتبقي:</span>
                <span className="font-medium">{formatPrice(fees.remainingAmount)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircleIcon className="w-12 h-12 text-green-600" />
      </motion.div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        تم تأكيد طلب الشراء!
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        تم إرسال طلبك بنجاح. سيتواصل معك فريق التسليم خلال 24 ساعة لتأكيد موعد التسليم.
      </p>

      <div className="bg-blue-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
        <h4 className="font-semibold text-blue-900 mb-2">الخطوات التالية:</h4>
        <ul className="text-sm text-blue-800 space-y-1 text-right">
          <li>• سيتم التواصل معك لتأكيد الموعد</li>
          <li>• فحص السيارة قبل التسليم (إن أردت)</li>
          <li>• تسليم السيارة والدفع</li>
          <li>• استلام أوراق النقل</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <motion.button
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          تتبع الطلب
        </motion.button>
        <motion.button
          onClick={onCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          العودة للرئيسية
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className={`max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">الدفع عند الاستلام</h2>
            <p className="text-primary-100">تسوق بأمان - ادفع عند استلام السيارة</p>
          </div>
          <TruckIcon className="w-12 h-12 text-primary-200" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mt-6 mb-2">
          {[1, 2, 3].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                step >= stepNumber
                  ? 'bg-white text-primary-600 border-white'
                  : 'border-primary-300 text-primary-300'
              }`}>
                {step > stepNumber ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{stepNumber}</span>
                )}
              </div>
              {stepNumber < 3 && (
                <div className={`flex-1 h-1 mx-2 transition-colors ${
                  step > stepNumber ? 'bg-white' : 'bg-primary-400'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex justify-between text-sm text-primary-100">
          <span>عنوان التسليم</span>
          <span>تفاصيل الدفع</span>
          <span>تأكيد الطلب</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>

        {/* Action Buttons */}
        {step < 3 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              {step > 1 && (
                <motion.button
                  onClick={handlePreviousStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  السابق
                </motion.button>
              )}
              
              <motion.button
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                إلغاء
              </motion.button>
            </div>

            <motion.button
              onClick={step === 2 ? handleSubmitOrder : handleNextStep}
              disabled={loading}
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <span>{step === 2 ? 'تأكيد الطلب' : 'التالي'}</span>
                  {step === 2 && <CheckCircleIcon className="w-5 h-5" />}
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashOnDeliverySystem;