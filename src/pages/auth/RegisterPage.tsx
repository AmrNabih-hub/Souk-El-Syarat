import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import * as yup from 'yup';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface RegisterFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'vendor';
  agreeToTerms: boolean;
}

const registerSchema = yup.object().shape({
  displayName: yup.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').required('الاسم مطلوب'),
  email: yup.string().email('البريد الإلكتروني غير صحيح').required('البريد الإلكتروني مطلوب'),
  password: yup
    .string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .required('كلمة المرور مطلوبة'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'كلمات المرور غير متطابقة')
    .required('تأكيد كلمة المرور مطلوب'),
  role: yup
    .mixed<'customer' | 'vendor'>()
    .oneOf(['customer', 'vendor'] as const, 'يجب اختيار نوع الحساب')
    .required('نوع الحساب مطلوب'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'يجب الموافقة على الشروط والأحكام')
    .required('يجب الموافقة على الشروط والأحكام'),
}) as yup.ObjectSchema<RegisterFormData>;

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, isLoading, error, clearError } = useAuthStore();
  const { language } = useAppStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      role: 'customer',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      await signUp(data.email, data.password, data.displayName);
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');

      if (data.role === 'vendor') {
        navigate('/vendor/apply');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create account');
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      clearError();
      await signInWithGoogle();
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to sign up with Google');
    }
  };

  const roleOptions = {
    ar: {
      customer: {
        title: 'عميل',
        description: 'أبحث عن شراء سيارة أو قطع غيار',
        icon: UserIcon,
      },
      vendor: {
        title: 'تاجر',
        description: 'أريد بيع السيارات أو قطع الغيار',
        icon: UserCircleIcon,
      },
    },
    en: {
      customer: {
        title: 'Customer',
        description: 'Looking to buy cars or parts',
        icon: UserIcon,
      },
      vendor: {
        title: 'Vendor',
        description: 'Want to sell cars or parts',
        icon: UserCircleIcon,
      },
    },
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
        className='relative max-w-lg w-full space-y-8'
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
            {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
          </motion.h2>

          <motion.p
            className='mt-2 text-neutral-600'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {language === 'ar'
              ? 'انضم إلى أكبر سوق للسيارات في مصر'
              : "Join Egypt's largest automotive marketplace"}
          </motion.p>
        </div>

        {/* Registration Form */}
        <motion.div
          className='card p-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Role Selection */}
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-3'>
                {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
              </label>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {Object.entries(roleOptions[language]).map(([role, option]) => (
                  <motion.label
                    key={role}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedRole === role
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input {...register('role')} type='radio' value={role} className='sr-only' />
                    <div className='text-center'>
                      <option.icon
                        className={`w-8 h-8 mx-auto mb-2 ${
                          selectedRole === role ? 'text-primary-600' : 'text-neutral-400'
                        }`}
                      />
                      <div
                        className={`font-medium ${
                          selectedRole === role ? 'text-primary-600' : 'text-neutral-700'
                        }`}
                      >
                        {option.title}
                      </div>
                      <div className='text-xs text-neutral-500 mt-1'>{option.description}</div>
                    </div>
                  </motion.label>
                ))}
              </div>
              {errors.role && (
                <motion.p
                  className='mt-1 text-sm text-red-600'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.role.message}
                </motion.p>
              )}
            </div>

            {/* Name Field */}
            <div>
              <label
                htmlFor='displayName'
                className='block text-sm font-medium text-neutral-700 mb-2'
              >
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className='relative'>
                <input
                  {...register('displayName')}
                  type='text'
                  id='displayName'
                  className={`input pl-10 ${errors.displayName ? 'input-error' : ''}`}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <UserIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' />
              </div>
              {errors.displayName && (
                <motion.p
                  className='mt-1 text-sm text-red-600'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.displayName.message}
                </motion.p>
              )}
            </div>

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
                <EnvelopeIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' />
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
                  autoComplete='new-password'
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

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-neutral-700 mb-2'
              >
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className='relative'>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id='confirmPassword'
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder={
                    language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'
                  }
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  autoComplete='new-password'
                />
                <LockClosedIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className='w-5 h-5' />
                  ) : (
                    <EyeIcon className='w-5 h-5' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  className='mt-1 text-sm text-red-600'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className='flex items-start'>
              <input
                {...register('agreeToTerms')}
                id='agreeToTerms'
                type='checkbox'
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded mt-1'
              />
              <label htmlFor='agreeToTerms' className='ml-3 block text-sm text-neutral-700'>
                {language === 'ar' ? (
                  <>
                    أوافق على{' '}
                    <Link
                      to='/terms'
                      className='text-primary-600 hover:text-primary-500 font-medium'
                    >
                      الشروط والأحكام
                    </Link>{' '}
                    و{' '}
                    <Link
                      to='/privacy'
                      className='text-primary-600 hover:text-primary-500 font-medium'
                    >
                      سياسة الخصوصية
                    </Link>
                  </>
                ) : (
                  <>
                    I agree to the{' '}
                    <Link
                      to='/terms'
                      className='text-primary-600 hover:text-primary-500 font-medium'
                    >
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      to='/privacy'
                      className='text-primary-600 hover:text-primary-500 font-medium'
                    >
                      Privacy Policy
                    </Link>
                  </>
                )}
              </label>
            </div>
            {errors.agreeToTerms && (
              <motion.p
                className='text-sm text-red-600'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.agreeToTerms.message}
              </motion.p>
            )}

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
              className='btn btn-primary w-full btn-lg'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting || isLoading ? (
                <LoadingSpinner size='sm' color='neutral' />
              ) : language === 'ar' ? (
                'إنشاء الحساب'
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

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

          {/* Google Sign Up */}
          <motion.button
            type='button'
            onClick={handleGoogleSignUp}
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
              {language === 'ar' ? 'التسجيل بحساب Google' : 'Sign up with Google'}
            </div>
          </motion.button>
        </motion.div>

        {/* Sign In Link */}
        <motion.div
          className='text-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className='text-neutral-600'>
            {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link to='/login' className='text-primary-600 hover:text-primary-500 font-medium'>
              {language === 'ar' ? 'سجل دخولك' : 'Sign in'}
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
