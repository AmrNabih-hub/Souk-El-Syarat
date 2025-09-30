/**
 * Subscription Plans Component
 * Displays vendor subscription plans with Instapay payment information
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  StarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { SubscriptionPlan, VendorSubscriptionPlan } from '@/types/payment';
import { useAppStore } from '@/stores/appStore';
import clsx from 'clsx';

interface SubscriptionPlansProps {
  selectedPlan?: VendorSubscriptionPlan;
  onPlanSelect: (plan: VendorSubscriptionPlan) => void;
  onPaymentInfoShow: (plan: SubscriptionPlan) => void;
  className?: string;
}

// Subscription plans data
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    nameAr: 'الخطة الأساسية',
    price: 500,
    currency: 'EGP',
    duration: 1,
    instapayNumber: '01234567890', // Souk El-Syarat Instapay number
    features: [
      {
        id: 'products',
        name: 'Product Listings',
        nameAr: 'عرض المنتجات',
        description: 'Up to 50 product listings',
        descriptionAr: 'حتى 50 منتج',
        included: true,
      },
      {
        id: 'images',
        name: 'Images per Product',
        nameAr: 'صور لكل منتج',
        description: 'Up to 5 images per product',
        descriptionAr: 'حتى 5 صور لكل منتج',
        included: true,
      },
      {
        id: 'featured',
        name: 'Featured Listings',
        nameAr: 'منتجات مميزة',
        description: '2 featured listings per month',
        descriptionAr: 'منتجان مميزان شهرياً',
        included: true,
      },
      {
        id: 'analytics',
        name: 'Basic Analytics',
        nameAr: 'تحليلات أساسية',
        description: 'Basic sales and view analytics',
        descriptionAr: 'تحليلات أساسية للمبيعات والمشاهدات',
        included: true,
      },
      {
        id: 'support',
        name: 'Email Support',
        nameAr: 'دعم عبر البريد',
        description: 'Email support during business hours',
        descriptionAr: 'دعم عبر البريد الإلكتروني',
        included: true,
      },
      {
        id: 'priority',
        name: 'Priority Support',
        nameAr: 'دعم عالي الأولوية',
        description: '24/7 priority support',
        descriptionAr: 'دعم عالي الأولوية على مدار الساعة',
        included: false,
      },
      {
        id: 'branding',
        name: 'Custom Branding',
        nameAr: 'علامة تجارية مخصصة',
        description: 'Custom store branding',
        descriptionAr: 'علامة تجارية مخصصة للمتجر',
        included: false,
      },
    ],
    limits: {
      maxProducts: 50,
      maxImages: 5,
      featuredListings: 2,
      analyticsAccess: true,
      prioritySupport: false,
      customBranding: false,
    },
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    nameAr: 'الخطة المميزة',
    price: 1000,
    currency: 'EGP',
    duration: 1,
    instapayNumber: '01234567890',
    isPopular: true,
    features: [
      {
        id: 'products',
        name: 'Product Listings',
        nameAr: 'عرض المنتجات',
        description: 'Up to 200 product listings',
        descriptionAr: 'حتى 200 منتج',
        included: true,
      },
      {
        id: 'images',
        name: 'Images per Product',
        nameAr: 'صور لكل منتج',
        description: 'Up to 10 images per product',
        descriptionAr: 'حتى 10 صور لكل منتج',
        included: true,
      },
      {
        id: 'featured',
        name: 'Featured Listings',
        nameAr: 'منتجات مميزة',
        description: '10 featured listings per month',
        descriptionAr: '10 منتجات مميزة شهرياً',
        included: true,
      },
      {
        id: 'analytics',
        name: 'Advanced Analytics',
        nameAr: 'تحليلات متقدمة',
        description: 'Advanced sales and marketing analytics',
        descriptionAr: 'تحليلات متقدمة للمبيعات والتسويق',
        included: true,
      },
      {
        id: 'support',
        name: 'Priority Support',
        nameAr: 'دعم عالي الأولوية',
        description: '24/7 priority phone and email support',
        descriptionAr: 'دعم عالي الأولوية على مدار الساعة',
        included: true,
      },
      {
        id: 'priority',
        name: 'Priority Support',
        nameAr: 'دعم عالي الأولوية',
        description: '24/7 priority support',
        descriptionAr: 'دعم عالي الأولوية على مدار الساعة',
        included: true,
      },
      {
        id: 'branding',
        name: 'Custom Branding',
        nameAr: 'علامة تجارية مخصصة',
        description: 'Custom store branding and logo',
        descriptionAr: 'علامة تجارية مخصصة وشعار للمتجر',
        included: true,
      },
    ],
    limits: {
      maxProducts: 200,
      maxImages: 10,
      featuredListings: 10,
      analyticsAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    nameAr: 'خطة المؤسسات',
    price: 2000,
    currency: 'EGP',
    duration: 1,
    instapayNumber: '01234567890',
    features: [
      {
        id: 'products',
        name: 'Product Listings',
        nameAr: 'عرض المنتجات',
        description: 'Unlimited product listings',
        descriptionAr: 'منتجات غير محدودة',
        included: true,
      },
      {
        id: 'images',
        name: 'Images per Product',
        nameAr: 'صور لكل منتج',
        description: 'Up to 20 images per product',
        descriptionAr: 'حتى 20 صورة لكل منتج',
        included: true,
      },
      {
        id: 'featured',
        name: 'Featured Listings',
        nameAr: 'منتجات مميزة',
        description: 'Unlimited featured listings',
        descriptionAr: 'منتجات مميزة غير محدودة',
        included: true,
      },
      {
        id: 'analytics',
        name: 'Enterprise Analytics',
        nameAr: 'تحليلات المؤسسات',
        description: 'Full business intelligence suite',
        descriptionAr: 'مجموعة كاملة من ذكاء الأعمال',
        included: true,
      },
      {
        id: 'support',
        name: 'Dedicated Support',
        nameAr: 'دعم مخصص',
        description: 'Dedicated account manager',
        descriptionAr: 'مدير حساب مخصص',
        included: true,
      },
      {
        id: 'priority',
        name: 'Priority Support',
        nameAr: 'دعم عالي الأولوية',
        description: '24/7 priority support',
        descriptionAr: 'دعم عالي الأولوية على مدار الساعة',
        included: true,
      },
      {
        id: 'branding',
        name: 'Full Custom Branding',
        nameAr: 'علامة تجارية كاملة',
        description: 'Complete custom branding solution',
        descriptionAr: 'حل علامة تجارية مخصص كامل',
        included: true,
      },
    ],
    limits: {
      maxProducts: 'unlimited',
      maxImages: 20,
      featuredListings: 999,
      analyticsAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
];

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  selectedPlan,
  onPlanSelect,
  onPaymentInfoShow,
  className,
}) => {
  const { language } = useAppStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={clsx('space-y-8', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {language === 'ar' ? 'خطط الاشتراك' : 'Subscription Plans'}
        </h2>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          {language === 'ar' 
            ? 'اختر الخطة المناسبة لعملك وادفع عبر InstaPay' 
            : 'Choose the right plan for your business and pay via InstaPay'
          }
        </p>
      </div>

      {/* Instapay Payment Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
          <CreditCardIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {language === 'ar' ? 'معلومات الدفع' : 'Payment Information'}
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              {language === 'ar' ? 'رقم InstaPay:' : 'InstaPay Number:'}
            </p>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <PhoneIcon className="w-4 h-4 text-blue-600" />
              <span className="font-mono text-lg font-bold text-blue-900 dark:text-blue-100">
                01234567890
              </span>
            </div>
          </div>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              {language === 'ar' ? 'اسم الحساب:' : 'Account Name:'}
            </p>
            <p className="text-blue-900 dark:text-blue-100">سوق السيارات - Souk El-Syarat</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {language === 'ar' 
              ? '💡 بعد الدفع، قم بإرفاق صورة إيصال InstaPay مع طلب التقديم'
              : '💡 After payment, attach your InstaPay receipt screenshot with your application'
            }
          </p>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={clsx(
              'relative rounded-2xl border-2 p-6 transition-all duration-200',
              selectedPlan === plan.id
                ? 'border-primary-500 ring-4 ring-primary-500/20 shadow-lg'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600',
              plan.isPopular && 'ring-2 ring-primary-500/50 shadow-lg'
            )}
          >
            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="flex items-center space-x-1 rtl:space-x-reverse bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <StarIcon className="w-4 h-4" />
                  <span>{language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}</span>
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {language === 'ar' ? plan.nameAr : plan.name}
              </h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400 ml-2">
                  {language === 'ar' ? '/شهر' : '/month'}
                </span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <div key={feature.id} className="flex items-start space-x-3 rtl:space-x-reverse">
                  {feature.included ? (
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XMarkIcon className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={clsx(
                      'text-sm font-medium',
                      feature.included 
                        ? 'text-neutral-900 dark:text-neutral-100' 
                        : 'text-neutral-400 dark:text-neutral-600'
                    )}>
                      {language === 'ar' ? feature.nameAr : feature.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Select Button */}
            <motion.button
              onClick={() => onPlanSelect(plan.id)}
              className={clsx(
                'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200',
                selectedPlan === plan.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : plan.isPopular
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 shadow-lg'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {selectedPlan === plan.id 
                ? (language === 'ar' ? 'مختار' : 'Selected')
                : (language === 'ar' ? 'اختيار الخطة' : 'Select Plan')
              }
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;