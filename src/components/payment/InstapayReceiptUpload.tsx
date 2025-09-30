/**
 * InstaPay Receipt Upload Component
 * Upload and preview InstaPay payment receipt for vendor subscription
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { VendorSubscriptionPlan } from '@/types/payment';
import clsx from 'clsx';

interface InstapayReceiptUploadProps {
  selectedPlan: VendorSubscriptionPlan;
  planPrice: number;
  onFileSelect: (file: File | null) => void;
  error?: string;
  className?: string;
}

export const InstapayReceiptUpload: React.FC<InstapayReceiptUploadProps> = ({
  selectedPlan,
  planPrice,
  onFileSelect,
  error,
  className,
}) => {
  const { language } = useAppStore();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    onFileSelect(file);

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, [onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);

  const removeFile = useCallback(() => {
    handleFileSelect(null);
  }, [handleFileSelect]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Payment Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
          <PhotoIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {language === 'ar' ? 'إرفاق إيصال الدفع' : 'Attach Payment Receipt'}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                {language === 'ar' ? 'الخطة المختارة:' : 'Selected Plan:'}
              </p>
              <p className="text-blue-900 dark:text-blue-100 font-semibold">
                {selectedPlan === 'basic' && (language === 'ar' ? 'الخطة الأساسية' : 'Basic Plan')}
                {selectedPlan === 'premium' && (language === 'ar' ? 'الخطة المميزة' : 'Premium Plan')}
                {selectedPlan === 'enterprise' && (language === 'ar' ? 'خطة المؤسسات' : 'Enterprise Plan')}
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                {language === 'ar' ? 'المبلغ المطلوب:' : 'Amount Required:'}
              </p>
              <p className="text-blue-900 dark:text-blue-100 font-bold text-lg">
                {formatPrice(planPrice)}
              </p>
            </div>
          </div>

          <div className="bg-blue-100 dark:bg-blue-800/30 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {language === 'ar' ? 'خطوات الدفع:' : 'Payment Steps:'}
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>{language === 'ar' ? '1. افتح تطبيق InstaPay' : '1. Open InstaPay app'}</li>
              <li>{language === 'ar' ? '2. أرسل المبلغ إلى الرقم: 01234567890' : '2. Send amount to: 01234567890'}</li>
              <li>{language === 'ar' ? '3. التقط صورة للإيصال' : '3. Take screenshot of receipt'}</li>
              <li>{language === 'ar' ? '4. أرفق الصورة هنا' : '4. Upload the image here'}</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* File Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {!selectedFile ? (
          <div
            className={clsx(
              'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200',
              dragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : error
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-neutral-800'
            )}
            onDragOver={handleDrag}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className={clsx(
                'mx-auto w-16 h-16 rounded-full flex items-center justify-center',
                error
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-primary-100 dark:bg-primary-900/30'
              )}>
                {error ? (
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                ) : (
                  <CloudArrowUpIcon className="w-8 h-8 text-primary-600" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {language === 'ar' ? 'اسحب وأسقط صورة الإيصال هنا' : 'Drag and drop receipt image here'}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {language === 'ar' ? 'أو انقر للاختيار من جهازك' : 'or click to select from your device'}
                </p>
                <motion.button
                  type="button"
                  className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PhotoIcon className="w-5 h-5" />
                  <span>{language === 'ar' ? 'اختيار صورة' : 'Select Image'}</span>
                </motion.button>
              </div>
              
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {language === 'ar' ? 'الصيغ المدعومة: JPG, PNG, WEBP (حد أقصى 5MB)' : 'Supported formats: JPG, PNG, WEBP (max 5MB)'}
              </p>
            </div>
          </div>
        ) : (
          /* File Preview */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {language === 'ar' ? 'تم إرفاق الإيصال' : 'Receipt Attached'}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={removeFile}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </div>

            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {language === 'ar' ? 'معاينة الإيصال:' : 'Receipt Preview:'}
                </p>
                <div className="max-w-md mx-auto">
                  <img
                    src={previewUrl}
                    alt="InstaPay Receipt"
                    className="w-full h-auto rounded-lg border border-neutral-200 dark:border-neutral-600"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Important Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
      >
        <div className="flex items-start space-x-3 rtl:space-x-reverse">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">
              {language === 'ar' ? 'مهم:' : 'Important:'}
            </p>
            <p>
              {language === 'ar' 
                ? 'تأكد من وضوح تفاصيل الدفع في الإيصال (المبلغ، التاريخ، رقم العملية). سيتم مراجعة الإيصال من قبل فريق الإدارة.'
                : 'Make sure payment details are clear in the receipt (amount, date, transaction number). The receipt will be reviewed by our admin team.'
              }
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InstapayReceiptUpload;