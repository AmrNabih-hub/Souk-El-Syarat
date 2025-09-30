/**
 * Cash on Delivery (COD) Checkout Component
 * Complete checkout flow for customer orders with COD payment
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { CODOrder, DeliveryAddress, ContactInfo } from '@/types/payment';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface CODCheckoutProps {
  cartItems: any[]; // Replace with proper cart item type
  totalAmount: number;
  onOrderComplete: (order: CODOrder) => void;
  className?: string;
}

interface CheckoutFormData {
  // Delivery Address
  recipientName: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  buildingNumber?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  
  // Contact Information
  primaryPhone: string;
  alternativePhone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  
  // Order Details
  specialInstructions?: string | null;
  
  // Agreement
  agreeToTerms: boolean;
}

const egyptianGovernorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية', 
  'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية', 'بورسعيد',
  'السويس', 'شمال سيناء', 'جنوب سيناء', 'الفيوم', 'بني سويف', 'المنيا',
  'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'دمياط'
];

const checkoutSchema = yup.object({
  recipientName: yup.string().min(2, 'الاسم قصير جداً').required('اسم المستلم مطلوب'),
  governorate: yup.string().required('المحافظة مطلوبة'),
  city: yup.string().required('المدينة مطلوبة'),
  area: yup.string().required('المنطقة مطلوبة'),
  street: yup.string().required('اسم الشارع مطلوب'),
  buildingNumber: yup.string().nullable(),
  floor: yup.string().nullable(),
  apartment: yup.string().nullable(),
  landmark: yup.string().nullable(),
  primaryPhone: yup.string()
    .matches(/^(\+201|01)[0-9]{9}$/, 'رقم هاتف غير صحيح')
    .required('رقم الهاتف الأساسي مطلوب'),
  alternativePhone: yup.string()
    .matches(/^(\+201|01)[0-9]{9}$/, 'رقم هاتف غير صحيح')
    .nullable(),
  whatsappNumber: yup.string()
    .matches(/^(\+201|01)[0-9]{9}$/, 'رقم واتساب غير صحيح')
    .nullable(),
  email: yup.string().email('بريد إلكتروني غير صحيح').nullable(),
  specialInstructions: yup.string().nullable(),
  agreeToTerms: yup.boolean().oneOf([true], 'يجب الموافقة على الشروط والأحكام'),
});

export const CODCheckout: React.FC<CODCheckoutProps> = ({
  cartItems,
  totalAmount,
  onOrderComplete,
  className,
}) => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(50); // Default delivery fee
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      recipientName: user?.displayName || '',
      email: user?.email || '',
      agreeToTerms: false,
    },
  });

  const selectedGovernorate = watch('governorate');
  const finalTotal = totalAmount + deliveryFee;

  // Update delivery fee based on governorate
  React.useEffect(() => {
    if (selectedGovernorate) {
      // Cairo and Giza have lower delivery fees
      const lowDeliveryFee = ['القاهرة', 'الجيزة'].includes(selectedGovernorate);
      setDeliveryFee(lowDeliveryFee ? 30 : 50);
      
      // Update estimated delivery time
      const daysToAdd = lowDeliveryFee ? 1 : 3;
      setEstimatedDelivery(new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000));
    }
  }, [selectedGovernorate]);

  const onSubmit = useCallback(async (data: CheckoutFormData) => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    setIsSubmitting(true);
    try {
      const deliveryAddress: DeliveryAddress = {
        recipientName: data.recipientName,
        phoneNumber: data.primaryPhone,
        governorate: data.governorate,
        city: data.city,
        area: data.area,
        street: data.street,
        buildingNumber: data.buildingNumber,
        floor: data.floor,
        apartment: data.apartment,
        landmark: data.landmark,
      };

      const contactInfo: ContactInfo = {
        primaryPhone: data.primaryPhone,
        alternativePhone: data.alternativePhone,
        whatsappNumber: data.whatsappNumber,
        email: data.email,
      };

      const order: CODOrder = {
        id: `COD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerId: user.id,
        vendorId: cartItems[0]?.vendorId || 'mixed', // Handle multiple vendors later
        products: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          specifications: item.specifications,
        })),
        totalAmount: finalTotal,
        currency: 'EGP',
        deliveryAddress,
        contactInfo,
        specialInstructions: data.specialInstructions,
        estimatedDeliveryDate: estimatedDelivery,
        paymentMethod: 'cod',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // In a real app, this would be sent to the backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      onOrderComplete(order);
      toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
      
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, cartItems, finalTotal, estimatedDelivery, onOrderComplete]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          {language === 'ar' ? 'يرجى تسجيل الدخول لإتمام عملية الشراء' : 'Please login to complete your purchase'}
        </p>
      </div>
    );
  }

  return (
    <div className={clsx('max-w-4xl mx-auto', className)}>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Delivery Address Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                <MapPinIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {language === 'ar' ? 'عنوان التسليم' : 'Delivery Address'}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {language === 'ar' ? 'اسم المستلم *' : 'Recipient Name *'}
                  </label>
                  <input
                    type="text"
                    {...register('recipientName')}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={language === 'ar' ? 'أدخل اسم المستلم' : 'Enter recipient name'}
                  />
                  {errors.recipientName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.recipientName.message}</p>
                  )}
                </div>

                {/* Governorate */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {language === 'ar' ? 'المحافظة *' : 'Governorate *'}
                  </label>
                  <select
                    {...register('governorate')}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</option>
                    {egyptianGovernorates.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  {errors.governorate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.governorate.message}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {language === 'ar' ? 'المدينة *' : 'City *'}
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={language === 'ar' ? 'أدخل المدينة' : 'Enter city'}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
                  )}
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {language === 'ar' ? 'المنطقة *' : 'Area *'}
                  </label>
                  <input
                    type="text"
                    {...register('area')}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={language === 'ar' ? 'أدخل المنطقة' : 'Enter area'}
                  />
                  {errors.area && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.area.message}</p>
                  )}
                </div>

                {/* Street */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {language === 'ar' ? 'اسم الشارع *' : 'Street Name *'}
                  </label>
                  <input
                    type="text"
                    {...register('street')}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={language === 'ar' ? 'أدخل اسم الشارع' : 'Enter street name'}
                  />
                  {errors.street && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street.message}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                <PhoneIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {language === 'ar' ? 'رقم الهاتف الأساسي *' : 'Primary Phone *'}
                  </label>
                  <input
                    type="tel"
                    {...register('primaryPhone')}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="01xxxxxxxxx"
                  />
                  {errors.primaryPhone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.primaryPhone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {language === 'ar' ? 'رقم واتساب' : 'WhatsApp Number'}
                  </label>
                  <input
                    type="tel"
                    {...register('whatsappNumber')}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>
            </motion.div>

            {/* Terms Agreement */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <input
                type="checkbox"
                {...register('agreeToTerms')}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label className="text-sm text-neutral-900 dark:text-neutral-100">
                {language === 'ar' ? 'أوافق على' : 'I agree to the'}{' '}
                <a href="/terms" className="text-primary-600 hover:text-primary-500">
                  {language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.agreeToTerms.message}</p>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 sticky top-6"
          >
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
              {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            {/* Order Items */}
            <div className="space-y-3 mb-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{item.productName}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">الكمية: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {(item.price * item.quantity).toLocaleString()} جنيه
                  </p>
                </div>
              ))}
            </div>

            {/* Pricing Details */}
            <div className="space-y-2 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
                </span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {totalAmount.toLocaleString()} جنيه
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {language === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}
                </span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {deliveryFee.toLocaleString()} جنيه
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 mb-6">
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {language === 'ar' ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-xl font-bold text-primary-600">
                {finalTotal.toLocaleString()} جنيه
              </span>
            </div>

            {/* Delivery Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <TruckIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {language === 'ar' ? 'معلومات التوصيل' : 'Delivery Info'}
                </span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-blue-800 dark:text-blue-200">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {language === 'ar' ? 'التسليم المتوقع:' : 'Expected delivery:'} {' '}
                  {estimatedDelivery.toLocaleDateString('ar-EG')}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                {language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <CurrencyDollarIcon className="w-5 h-5" />
                  <span>{language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CODCheckout;