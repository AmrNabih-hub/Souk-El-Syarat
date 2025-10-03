import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { appwriteAuthService } from '@/services/appwrite-auth.service';
import { adminAuthService } from '@/services/admin-auth.service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface AdminLoginFormData {
  email: string;
  password: string;
  adminCode: string;
}

const adminLoginSchema = yup.object().shape({
  email: yup.string().email('البريد الإلكتروني غير صحيح').required('البريد الإلكتروني مطلوب'),
  password: yup
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .required('كلمة المرور مطلوبة'),
  adminCode: yup
    .string()
    .min(6, 'رمز المسؤول يجب أن يكون 6 أحرف على الأقل')
    .required('رمز المسؤول مطلوب'),
});

const AdminLoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { language } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AdminLoginFormData>({
    resolver: yupResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      setIsLoading(true);
      setError('root', { message: '' });

      // Attempt admin authentication
      const adminResult = await adminAuthService.loginAdmin(data.email, data.password, data.adminCode);
      
      if (adminResult.success && adminResult.admin) {
        const user = adminResult.admin;
        if (user.role === 'admin') {
          toast.success(
            language === 'ar' ? 'تم تسجيل الدخول كمسؤول بنجاح!' : 'Admin login successful!'
          );
          navigate('/admin/dashboard');
        } else {
          setError('root', {
            message:
              language === 'ar'
                ? 'هذا الحساب ليس لديه صلاحيات المسؤول'
                : 'This account does not have admin privileges',
          });
        }
      } else {
        setError('root', {
          message:
            language === 'ar'
              ? 'بيانات الدخول غير صحيحة'
              : 'Invalid credentials',
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development') console.error('Admin login error:', error);

      if (error.message.includes('admin')) {
        setError('adminCode', { message: error.message });
      } else if (error.message.includes('password')) {
        setError('password', { message: error.message });
      } else if (error.message.includes('email')) {
        setError('email', { message: error.message });
      } else {
        setError('root', { message: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <motion.div
        variants={pageVariants}
        initial='initial'
        animate='animate'
        exit='exit'
        className='max-w-md w-full space-y-8'
      >
        {/* Header */}
        <div className='text-center'>
          <div className='mx-auto h-16 w-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4'>
            <ShieldCheckIcon className='h-8 w-8 text-white' />
          </div>
          <h2 className='text-3xl font-extrabold text-gray-900 mb-2'>
            {language === 'ar' ? 'تسجيل دخول المسؤول' : 'Admin Login'}
          </h2>
          <p className='text-sm text-gray-600'>
            {language === 'ar' ? 'الوصول إلى لوحة تحكم المسؤول' : 'Access to admin dashboard'}
          </p>
        </div>

        {/* Admin Login Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='mt-8 space-y-6 bg-white p-8 rounded-xl shadow-2xl border border-gray-100'
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Email Field */}
          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className='relative'>
              <input
                {...register('email')}
                type='email'
                id='email'
                autoComplete='email'
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
              />
            </div>
            {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className='relative'>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id='password'
                autoComplete='current-password'
                className={`appearance-none relative block w-full px-3 py-3 pr-12 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                ) : (
                  <EyeIcon className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                )}
              </button>
            </div>
            {errors.password && (
              <p className='mt-1 text-sm text-red-600'>{errors.password.message}</p>
            )}
          </div>

          {/* Admin Code Field */}
          <div>
            <label htmlFor='adminCode' className='block text-sm font-medium text-gray-700 mb-2'>
              {language === 'ar' ? 'رمز المسؤول' : 'Admin Code'}
            </label>
            <div className='relative'>
              <input
                {...register('adminCode')}
                type={showAdminCode ? 'text' : 'password'}
                id='adminCode'
                autoComplete='off'
                className={`appearance-none relative block w-full px-3 py-3 pr-12 border ${
                  errors.adminCode ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                placeholder={language === 'ar' ? 'أدخل رمز المسؤول' : 'Enter admin code'}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowAdminCode(!showAdminCode)}
              >
                {showAdminCode ? (
                  <EyeSlashIcon className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                ) : (
                  <LockClosedIcon className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                )}
              </button>
            </div>
            {errors.adminCode && (
              <p className='mt-1 text-sm text-red-600'>{errors.adminCode.message}</p>
            )}
          </div>

          {/* Root Error */}
          {errors.root && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <ShieldCheckIcon className='h-5 w-5 text-red-400' />
                </div>
                <div className='ml-3'>
                  <p className='text-sm text-red-800'>{errors.root.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type='submit'
              disabled={isLoading || isSubmitting}
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105'
            >
              {isLoading ? (
                <LoadingSpinner size='sm' />
              ) : (
                <>
                  <LockClosedIcon className='h-5 w-5 mr-2' />
                  {language === 'ar' ? 'تسجيل الدخول كمسؤول' : 'Sign in as Admin'}
                </>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className='rounded-md bg-yellow-50 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <ShieldCheckIcon className='h-5 w-5 text-yellow-400' />
              </div>
              <div className='ml-3'>
                <p className='text-sm text-yellow-800'>
                  {language === 'ar'
                    ? 'هذه الصفحة مخصصة للمسؤولين فقط. يرجى التأكد من أن لديك الصلاحيات المطلوبة.'
                    : 'This page is for administrators only. Please ensure you have the required privileges.'}
                </p>
              </div>
            </div>
          </div>
        </motion.form>

        {/* Footer */}
        <div className='text-center'>
          <button
            onClick={() => navigate('/login')}
            className='text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200'
          >
            {language === 'ar' ? 'العودة إلى تسجيل الدخول العادي' : 'Back to regular login'}
          </button>
        </div>

        {/* Background Pattern */}
        <div className='absolute inset-0 -z-10 overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-red-100/20 via-orange-100/20 to-yellow-100/20' />
          <div className='absolute inset-0 opacity-30'>
            <svg
              width='60'
              height='60'
              viewBox='0 0 60 60'
              xmlns='http://www.w3.org/2000/svg'
              className='w-full h-full'
            >
              <g fill='none' fillRule='evenodd'>
                <g fill='#fef3c7' fillOpacity='0.1'>
                  <circle cx='30' cy='30' r='2' />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
