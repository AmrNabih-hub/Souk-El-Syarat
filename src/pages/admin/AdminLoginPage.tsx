import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { adminAuthService } from '@/services/admin-auth.service';
import { useAppStore } from '@/stores/appStore';

interface AdminLoginForm {
  email: string;
  password: string;
}

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>();

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);

    try {
      const result = await adminAuthService.loginAdmin(data.email, data.password);

      if (result.success) {
        toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
        navigate('/admin/dashboard');
      } else {
        toast.error(language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
      }
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ في تسجيل الدخول' : 'Login error');
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
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-neutral-900 to-yellow-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pyramid-pattern opacity-10"></div>
      
      <motion.div
        className="relative max-w-md w-full space-y-8"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <ShieldCheckIcon className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            {language === 'ar' ? 'دخول المدير' : 'Admin Login'}
          </h2>
          <p className="text-neutral-300">
            {language === 'ar' 
              ? 'لوحة إدارة سوق السيارات' 
              : 'Souk El-Syarat Admin Panel'}
          </p>
        </div>

        <motion.div
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Demo Credentials Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-blue-800 font-medium mb-2">
                {language === 'ar' ? 'بيانات الدخول التجريبية:' : 'Demo Credentials:'}
              </h4>
              <p className="text-blue-700 text-sm">
                <strong>Email:</strong> admin@soukel-syarat.com<br />
                <strong>Password:</strong> SoukAdmin2024!@#
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                {...register('email', {
                  required: language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address',
                  },
                })}
                type="email"
                className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="admin@soukel-syarat.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required',
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary btn-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading 
                ? (language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...')
                : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
              }
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
            >
              {language === 'ar' ? '← العودة إلى الموقع' : '← Back to website'}
            </button>
          </div>
        </motion.div>

        <div className="text-center">
          <p className="text-neutral-400 text-sm">
            {language === 'ar' 
              ? 'محمي بأمان عالي - صالح للمديرين فقط' 
              : 'Secured access - Admins only'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;