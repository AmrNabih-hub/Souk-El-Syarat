import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useMasterAuthStore } from '@/stores/authStore.master';
import { useAppStore } from '@/stores/appStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const SimpleLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading, error, clearError } = useMasterAuthStore();
  const { language } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      await signIn(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const fillTestCredentials = (type: 'admin' | 'vendor' | 'customer') => {
    const credentials = {
      admin: { email: 'admin@souk-el-syarat.com', password: 'Admin123456!' },
      vendor: { email: 'vendor1@souk-el-syarat.com', password: 'Vendor123456!' },
      customer: { email: 'customer1@souk-el-syarat.com', password: 'Customer123456!' }
    };
    
    setEmail(credentials[type].email);
    setPassword(credentials[type].password);
    toast.success(`تم ملء بيانات ${type === 'admin' ? 'المدير' : type === 'vendor' ? 'التاجر' : 'العميل'}`, { duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4">
      <motion.div
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">س</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </h2>
          <p className="text-gray-600 text-sm">
            {language === 'ar' ? 'سوق السيارات المصري' : 'Egyptian Cars Marketplace'}
          </p>
        </div>

        {/* Test Credentials */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">
            🧪 حسابات الاختبار / Test Accounts
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('admin')}
              className="w-full text-left p-2 bg-red-100 hover:bg-red-200 rounded-lg text-xs transition-colors"
            >
              👨‍💼 <strong>مدير:</strong> admin@souk-el-syarat.com
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('vendor')}
              className="w-full text-left p-2 bg-green-100 hover:bg-green-200 rounded-lg text-xs transition-colors"
            >
              🏪 <strong>تاجر:</strong> vendor1@souk-el-syarat.com
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('customer')}
              className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-xs transition-colors"
            >
              👤 <strong>عميل:</strong> customer1@souk-el-syarat.com
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            اضغط على أي حساب لملء البيانات تلقائياً
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="أدخل البريد الإلكتروني"
                required
              />
              <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="أدخل كلمة المرور"
                required
              />
              <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="mr-2">جاري تسجيل الدخول...</span>
              </div>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔐 نظام المصادقة الموحد - يدعم جميع أنواع المستخدمين
          </p>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-400">
            <span>👨‍💼 مديرين</span>
            <span>🏪 تجار</span>
            <span>👤 عملاء</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleLoginPage;