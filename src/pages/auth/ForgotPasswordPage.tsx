import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ForgotPasswordFormData {
  email: string;
}

const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email('البريد الإلكتروني غير صحيح').required('البريد الإلكتروني مطلوب'),
});

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const { language } = useAppStore();
  const [emailSent, setEmailSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      clearError();
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success(
        language === 'ar'
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
          : 'Password reset link sent to your email'
      );
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  if (emailSent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='absolute inset-0 pyramid-pattern opacity-5'></div>

        <motion.div
          className='relative max-w-md w-full text-center'
          variants={pageVariants}
          initial='initial'
          animate='animate'
          exit='exit'
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className='w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          >
            <EnvelopeIcon className='w-10 h-10 text-white' />
          </motion.div>

          <motion.h2
            className='text-3xl font-bold text-neutral-900 mb-4'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {language === 'ar' ? 'تم إرسال البريد الإلكتروني' : 'Email Sent'}
          </motion.h2>

          <motion.p
            className='text-neutral-600 mb-8 leading-relaxed'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {language === 'ar'
              ? `لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى ${getValues('email')}. يرجى التحقق من صندوق الوارد الخاص بك.`
              : `We've sent a password reset link to ${getValues('email')}. Please check your inbox.`}
          </motion.p>

          <motion.div
            className='space-y-4'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to='/login' className='btn btn-primary w-full btn-lg'>
              {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </Link>

            <button onClick={() => setEmailSent(false)} className='btn btn-ghost w-full'>
              {language === 'ar' ? 'إرسال البريد مرة أخرى' : 'Send Again'}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

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
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            to='/login'
            className='inline-flex items-center text-primary-600 hover:text-primary-500 font-medium'
          >
            <ArrowLeftIcon className='w-4 h-4 mr-2' />
            {language === 'ar' ? 'العودة للخلف' : 'Back'}
          </Link>
        </motion.div>

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
            {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </motion.h2>

          <motion.p
            className='mt-2 text-neutral-600'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {language === 'ar'
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور'
              : "Enter your email and we'll send you a password reset link"}
          </motion.p>
        </div>

        {/* Reset Form */}
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
                'إرسال رابط الإعادة'
              ) : (
                'Send Reset Link'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Login Link */}
        <motion.div
          className='text-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className='text-neutral-600'>
            {language === 'ar' ? 'تذكرت كلمة المرور؟' : 'Remember your password?'}{' '}
            <Link to='/login' className='text-primary-600 hover:text-primary-500 font-medium'>
              {language === 'ar' ? 'سجل دخولك' : 'Sign in'}
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
