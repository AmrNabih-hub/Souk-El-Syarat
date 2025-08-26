import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon, BugAntIcon } from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { useMasterAuthStore } from '@/stores/authStore.master';
import AuthDebugService from '@/services/auth.debug.service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

const loginSchema = yup.object().shape({
  email: yup.string().email('البريد الإلكتروني غير صحيح').required('البريد الإلكتروني مطلوب'),
  password: yup
    .string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .required('كلمة المرور مطلوبة'),
});

const EnhancedLoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useMasterAuthStore();
  const { language } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      console.log('🔐 Master Auth: Login form submitted:', data.email);
      
      // Master auth service handles all user types automatically
      await signIn(data.email, data.password);
      
      // Navigation is handled automatically by the auth store
    } catch (error) {
      // Error toast is already handled by the auth service
      console.error('Login failed:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      clearError();
      await signInWithGoogle();
      // Navigation is handled automatically by the auth store
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  const handleTestLogin = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    toast.success('Test credentials filled! Click Login to proceed.');
  };

  const testFirebaseConnection = async () => {
    const result = await AuthDebugService.testFirebaseConnection();
    if (result) {
      toast.success('✅ Firebase connection is working!');
    } else {
      toast.error('❌ Firebase connection failed!');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      {/* Background Pattern */}
      <div className='absolute inset-0 pyramid-pattern opacity-5'></div>

      <motion.div
        className='relative max-w-md w-full space-y-8'
        variants={pageVariants}
        initial='initial'
        animate='animate'
        exit='exit'
        transition={{ duration: 0.5 }}
      >
        {/* Logo and Header */}
        <div className='text-center'>
          <motion.div
            className='w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <span className='text-white font-bold text-2xl'>س</span>
          </motion.div>

          <motion.h2
            className='text-3xl font-bold gradient-text'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {language === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back'}
          </motion.h2>

          <motion.p
            className='mt-2 text-neutral-600'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {language === 'ar' ? 'سجل دخولك للوصول إلى حسابك' : 'Sign in to access your account'}
          </motion.p>
        </div>

        {/* Debug Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='bg-gray-50 border rounded-xl p-4'
        >
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-bold text-gray-700'>🔧 Debug Controls</h3>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setIsDebugMode(!isDebugMode)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  isDebugMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                }`}
              >
                <BugAntIcon className='w-3 h-3 inline mr-1' />
                Debug {isDebugMode ? 'ON' : 'OFF'}
              </button>
              <button
                type='button'
                onClick={testFirebaseConnection}
                className='px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors'
              >
                Test Firebase
              </button>
            </div>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          className='card p-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Email Field */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-neutral-700 mb-2'>
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className='relative'>
                <input
                  {...register('email')}
                  type='email'
                  id='email'
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <UserIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' />
              </div>
              {errors.email && (
                <motion.p
                  className='mt-1 text-sm text-red-600'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor='password' className='block text-sm font-medium text-neutral-700 mb-2'>
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className='relative'>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  autoComplete='current-password'
                />
                <LockClosedIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className='w-5 h-5' />
                  ) : (
                    <EyeIcon className='w-5 h-5' />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  className='mt-1 text-sm text-red-600'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <input
                  id='remember-me'
                  name='remember-me'
                  type='checkbox'
                  className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded'
                />
                <label htmlFor='remember-me' className='ml-2 block text-sm text-neutral-700'>
                  {language === 'ar' ? 'تذكرني' : 'Remember me'}
                </label>
              </div>

              <Link
                to='/forgot-password'
                className='text-sm text-primary-600 hover:text-primary-500 font-medium'
              >
                {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type='submit'
              disabled={isSubmitting || isLoading}
              className={`btn w-full btn-lg ${
                isDebugMode 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'btn-primary'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting || isLoading ? (
                <LoadingSpinner size='sm' color='neutral' />
              ) : (
                <>
                  {isDebugMode && <BugAntIcon className='w-4 h-4 mr-2' />}
                  {isDebugMode ? 'Debug Login' : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
                </>
              )}
            </motion.button>
          </form>

          {/* Test Accounts Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className='mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4'
          >
            <h3 className='text-sm font-bold text-blue-800 mb-3 text-center'>
              🧪 {language === 'ar' ? 'حسابات تجريبية للاختبار' : 'Test Accounts for Testing'}
            </h3>
            <div className='space-y-2 text-xs'>
              <div className='bg-white rounded-lg p-3 border cursor-pointer hover:bg-blue-25 transition-colors'
                   onClick={() => handleTestLogin('admin@souk-el-syarat.com', 'Admin123456!')}>
                <div className='font-semibold text-red-600 mb-1'>
                  👨‍💼 {language === 'ar' ? 'مدير النظام' : 'Admin'}
                </div>
                <div className='text-gray-700'>
                  📧 admin@souk-el-syarat.com<br/>
                  🔐 Admin123456!
                </div>
              </div>
              <div className='bg-white rounded-lg p-3 border cursor-pointer hover:bg-blue-25 transition-colors'
                   onClick={() => handleTestLogin('vendor1@alamancar.com', 'Vendor123456!')}>
                <div className='font-semibold text-green-600 mb-1'>
                  🏪 {language === 'ar' ? 'تاجر' : 'Vendor'}
                </div>
                <div className='text-gray-700'>
                  📧 vendor1@alamancar.com<br/>
                  🔐 Vendor123456!
                </div>
              </div>
              <div className='bg-white rounded-lg p-3 border cursor-pointer hover:bg-blue-25 transition-colors'
                   onClick={() => handleTestLogin('test@souk-el-syarat.com', 'Test123456!')}>
                <div className='font-semibold text-blue-600 mb-1'>
                  👤 {language === 'ar' ? 'عميل' : 'Customer'}
                </div>
                <div className='text-gray-700'>
                  📧 test@souk-el-syarat.com<br/>
                  🔐 Test123456!
                </div>
              </div>
            </div>
            <p className='text-xs text-blue-600 mt-2 text-center'>
              💡 Click on any test account to auto-fill the form
            </p>
          </motion.div>

          {/* Divider */}
          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-neutral-300' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-neutral-500'>
                  {language === 'ar' ? 'أو' : 'or'}
                </span>
              </div>
            </div>
          </div>

          {/* Google Sign In */}
          <motion.button
            type='button'
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className='w-full mt-4 bg-white border border-neutral-300 text-neutral-700 px-4 py-3 rounded-lg font-medium hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className='flex items-center justify-center'>
              <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                <path
                  fill='#4285F4'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='#34A853'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='#FBBC05'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='#EA4335'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                />
              </svg>
              {language === 'ar' ? 'الدخول بحساب Google' : 'Continue with Google'}
            </div>
          </motion.button>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          className='text-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className='text-neutral-600'>
            {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <Link to='/register' className='text-primary-600 hover:text-primary-500 font-medium'>
              {language === 'ar' ? 'سجل الآن' : 'Sign up now'}
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EnhancedLoginPage;