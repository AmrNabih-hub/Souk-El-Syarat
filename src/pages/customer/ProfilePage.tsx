import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      governorate: user?.address?.governorate || '',
      country: user?.address?.country || 'Egypt'
    }
  });

  const handleSave = () => {
    // TODO: Implement profile update logic
    toast.success(language === 'ar' ? 'تم حفظ التعديلات' : 'Changes saved successfully');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      displayName: user?.displayName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        governorate: user?.address?.governorate || '',
        country: user?.address?.country || 'Egypt'
      }
    });
    setIsEditing(false);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-8'
        >
          <h1 className='text-4xl font-bold text-neutral-900 mb-4'>
            {language === 'ar' ? 'الملف الشخصي' : 'My Profile'}
          </h1>
          <p className='text-xl text-neutral-600'>
            {language === 'ar'
              ? 'إدارة معلوماتك الشخصية وإعداداتك'
              : 'Manage your personal information and settings'}
          </p>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Profile Picture & Basic Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='lg:col-span-1'
          >
            <div className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200 text-center'>
              <div className='relative inline-block mb-4'>
                <div className='w-32 h-32 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-4xl font-bold'>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <button className='absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-neutral-200 hover:bg-gray-50 transition-colors'>
                  <CameraIcon className='w-4 h-4 text-neutral-600' />
                </button>
              </div>
              
              <h2 className='text-xl font-bold text-neutral-900 mb-2'>
                {user?.displayName || 'User'}
              </h2>
              <p className='text-neutral-600 mb-4'>{user?.email || 'user@example.com'}</p>
              
              <div className='flex items-center justify-center space-x-4 text-sm text-neutral-500'>
                <div className='flex items-center'>
                  <MapPinIcon className='w-4 h-4 mr-1' />
                  <span>{language === 'ar' ? 'مصر' : 'Egypt'}</span>
                </div>
                <div className='w-1 h-1 bg-neutral-300 rounded-full'></div>
                <div className='flex items-center'>
                  <UserCircleIcon className='w-4 h-4 mr-1' />
                  <span>{user?.role || 'customer'}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Details Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className='lg:col-span-2'
          >
            <div className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-neutral-900'>
                  {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                </h3>
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className='flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors'
                  >
                    <PencilIcon className='w-4 h-4' />
                    <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                  </button>
                ) : (
                  <div className='flex space-x-2'>
                    <button
                      onClick={handleSave}
                      className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                    >
                      <CheckIcon className='w-4 h-4' />
                      <span>{language === 'ar' ? 'حفظ' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className='flex items-center space-x-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors'
                    >
                      <XMarkIcon className='w-4 h-4' />
                      <span>{language === 'ar' ? 'إلغاء' : 'Cancel'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className='space-y-6'>
                {/* Display Name */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                      placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    />
                  ) : (
                    <div className='flex items-center p-3 bg-neutral-50 rounded-lg'>
                      <UserCircleIcon className='w-5 h-5 text-neutral-400 mr-3' />
                      <span>{formData.displayName || language === 'ar' ? 'غير محدد' : 'Not specified'}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className='flex items-center p-3 bg-neutral-50 rounded-lg'>
                    <EnvelopeIcon className='w-5 h-5 text-neutral-400 mr-3' />
                    <span>{formData.email || 'user@example.com'}</span>
                    <span className='ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded'>
                      {language === 'ar' ? 'مُتحقق' : 'Verified'}
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  {isEditing ? (
                    <input
                      type='tel'
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                      placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                    />
                  ) : (
                    <div className='flex items-center p-3 bg-neutral-50 rounded-lg'>
                      <PhoneIcon className='w-5 h-5 text-neutral-400 mr-3' />
                      <span>{formData.phoneNumber || language === 'ar' ? 'غير محدد' : 'Not specified'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
