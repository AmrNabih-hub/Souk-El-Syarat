/**
 * Enhanced Authentication Modal - 2025 Edition
 * Modern, secure, and beautiful authentication experience
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';
import { clsx } from 'clsx';

import { useAuthStore } from '@/stores/authStore.v2';
import { Button } from '@/components/ui/Button/Button';
import { ErrorHandler } from '@/lib/errors';
import type { LoginCredentials, CreateUserData } from '@/types';

// Validation schemas
const loginSchema = yup.object({
  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .email('تنسيق البريد الإلكتروني غير صحيح'),
  password: yup
    .string()
    .required('كلمة المرور مطلوبة')
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  rememberMe: yup.boolean().default(false),
});

const signupSchema = yup.object({
  displayName: yup
    .string()
    .required('الاسم مطلوب')
    .min(2, 'الاسم قصير جداً')
    .max(50, 'الاسم طويل جداً'),
  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .email('تنسيق البريد الإلكتروني غير صحيح'),
  phoneNumber: yup
    .string()
    .required('رقم الهاتف مطلوب')
    .matches(/^(\+201|01)[0-9]{9}$/, 'رقم الهاتف غير صحيح'),
  password: yup
    .string()
    .required('كلمة المرور مطلوبة')
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص'
    ),
  confirmPassword: yup
    .string()
    .required('تأكيد كلمة المرور مطلوب')
    .oneOf([yup.ref('password')], 'كلمات المرور غير متطابقة'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'يجب الموافقة على الشروط والأحكام'),
});

// Password strength checker
const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'ضعيف جداً', color: 'bg-red-500' },
    { score: 2, label: 'ضعيف', color: 'bg-orange-500' },
    { score: 3, label: 'متوسط', color: 'bg-yellow-500' },
    { score: 4, label: 'قوي', color: 'bg-blue-500' },
    { score: 5, label: 'قوي جداً', color: 'bg-green-500' },
  ];

  return levels[score] || levels[0];
};

// Input Field Component
const InputField: React.FC<{
  label: string;
  name: string;
  type?: string;
  icon: React.ComponentType<any>;
  placeholder: string;
  register: any;
  error?: string;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
}> = ({
  label,
  name,
  type = 'text',
  icon: Icon,
  placeholder,
  register,
  error,
  showPasswordToggle,
  onPasswordToggle,
  showPassword,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...register(name)}
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          className={clsx(
            'block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          )}
          placeholder={placeholder}
          dir="ltr"
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onPasswordToggle}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 flex items-center"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Main Modal Component
interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const {
    signIn,
    signInWithGoogle,
    signUp,
    resetPassword,
    _isLoading,
    _error,
    clearError,
  } = useAuthStore();

  // Form setup
  const loginForm = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const signupForm = useForm<CreateUserData & { confirmPassword: string; agreeToTerms: boolean }>({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  // Watch password for strength indicator
  const watchedPassword = signupForm.watch('password');
  useEffect(() => {
    if (mode === 'signup') {
      setPasswordStrength(getPasswordStrength(watchedPassword || ''));
    }
  }, [watchedPassword, mode]);

  // Clear error when switching modes
  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  // Handle form submissions
  const handleLogin = async (data: LoginCredentials) => {
    try {
      await signIn(data);
      onClose();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleSignup = async (data: CreateUserData & { confirmPassword: string; agreeToTerms: boolean }) => {
    try {
      const { confirmPassword, agreeToTerms, ...signupData } = data;
      await signUp(signupData);
      onClose();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await resetPassword(email);
      setMode('login');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.5,
        bounce: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <ShieldCheckIcon className="h-8 w-8" />
                </motion.div>
                
                <h2 className="text-2xl font-bold mb-2">
                  {mode === 'login' && 'تسجيل الدخول'}
                  {mode === 'signup' && 'إنشاء حساب جديد'}
                  {mode === 'forgot' && 'استعادة كلمة المرور'}
                </h2>
                
                <p className="text-blue-100">
                  {mode === 'login' && 'أهلاً بعودتك إلى سوق السيارات'}
                  {mode === 'signup' && 'انضم إلى أكبر منصة للسيارات في مصر'}
                  {mode === 'forgot' && 'سنرسل لك رابط استعادة كلمة المرور'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Error Display */}
              <AnimatePresence>
                {_error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{_error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              {mode === 'login' && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <InputField
                    label="البريد الإلكتروني"
                    name="email"
                    type="email"
                    icon={EnvelopeIcon}
                    placeholder="your@email.com"
                    register={loginForm.register}
                    error={loginForm.formState.errors.email?.message}
                  />

                  <InputField
                    label="كلمة المرور"
                    name="password"
                    icon={LockClosedIcon}
                    placeholder="********"
                    register={loginForm.register}
                    error={loginForm.formState.errors.password?.message}
                    showPasswordToggle
                    showPassword={showPassword}
                    onPasswordToggle={() => setShowPassword(!showPassword)}
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        {...loginForm.register('rememberMe')}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="mr-2 text-sm text-gray-700">تذكرني</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  <Button
                    type="submit"
                    isFullWidth
                    isLoading={_isLoading}
                    loadingText="جاري تسجيل الدخول..."
                    className="h-12"
                  >
                    تسجيل الدخول
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">أو</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    isFullWidth
                    onClick={handleGoogleSignIn}
                    leftIcon={<FcGoogle className="w-5 h-5" />}
                    className="h-12"
                  >
                    تسجيل الدخول بواسطة Google
                  </Button>

                  <p className="text-center text-sm text-gray-600">
                    ليس لديك حساب؟{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      إنشاء حساب جديد
                    </button>
                  </p>
                </form>
              )}

              {/* Signup Form */}
              {mode === 'signup' && (
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <InputField
                    label="الاسم الكامل"
                    name="displayName"
                    icon={UserIcon}
                    placeholder="الاسم الكامل"
                    register={signupForm.register}
                    error={signupForm.formState.errors.displayName?.message}
                  />

                  <InputField
                    label="البريد الإلكتروني"
                    name="email"
                    type="email"
                    icon={EnvelopeIcon}
                    placeholder="your@email.com"
                    register={signupForm.register}
                    error={signupForm.formState.errors.email?.message}
                  />

                  <InputField
                    label="رقم الهاتف"
                    name="phoneNumber"
                    type="tel"
                    icon={PhoneIcon}
                    placeholder="01012345678"
                    register={signupForm.register}
                    error={signupForm.formState.errors.phoneNumber?.message}
                  />

                  <div className="space-y-2">
                    <InputField
                      label="كلمة المرور"
                      name="password"
                      icon={LockClosedIcon}
                      placeholder="********"
                      register={signupForm.register}
                      error={signupForm.formState.errors.password?.message}
                      showPasswordToggle
                      showPassword={showPassword}
                      onPasswordToggle={() => setShowPassword(!showPassword)}
                    />
                    
                    {/* Password Strength Indicator */}
                    {watchedPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">قوة كلمة المرور</span>
                          <span className={clsx(
                            'font-medium',
                            passwordStrength.score <= 2 ? 'text-red-600' :
                            passwordStrength.score === 3 ? 'text-yellow-600' :
                            passwordStrength.score === 4 ? 'text-blue-600' :
                            'text-green-600'
                          )}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={clsx(
                              'h-2 rounded-full transition-all duration-300',
                              passwordStrength.color
                            )}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <InputField
                    label="تأكيد كلمة المرور"
                    name="confirmPassword"
                    icon={LockClosedIcon}
                    placeholder="********"
                    register={signupForm.register}
                    error={signupForm.formState.errors.confirmPassword?.message}
                    showPasswordToggle
                    showPassword={showConfirmPassword}
                    onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />

                  <div className="space-y-3">
                    <label className="flex items-start">
                      <input
                        {...signupForm.register('agreeToTerms')}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                      />
                      <span className="mr-2 text-sm text-gray-700 leading-5">
                        أوافق على{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500">
                          الشروط والأحكام
                        </a>{' '}
                        و{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500">
                          سياسة الخصوصية
                        </a>
                      </span>
                    </label>
                    {signupForm.formState.errors.agreeToTerms && (
                      <p className="text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {signupForm.formState.errors.agreeToTerms.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    isFullWidth
                    isLoading={_isLoading}
                    loadingText="جاري إنشاء الحساب..."
                    className="h-12"
                  >
                    إنشاء حساب
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">أو</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    isFullWidth
                    onClick={handleGoogleSignIn}
                    leftIcon={<FcGoogle className="w-5 h-5" />}
                    className="h-12"
                  >
                    التسجيل بواسطة Google
                  </Button>

                  <p className="text-center text-sm text-gray-600">
                    لديك حساب بالفعل؟{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      تسجيل الدخول
                    </button>
                  </p>
                </form>
              )}

              {/* Forgot Password Form */}
              {mode === 'forgot' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-gray-600">
                      أدخل بريدك الإلكتروني وسنرسل لك رابط استعادة كلمة المرور
                    </p>
                  </div>

                  <InputField
                    label="البريد الإلكتروني"
                    name="email"
                    type="email"
                    icon={EnvelopeIcon}
                    placeholder="your@email.com"
                    register={loginForm.register}
                    error={loginForm.formState.errors.email?.message}
                  />

                  <Button
                    type="button"
                    isFullWidth
                    isLoading={_isLoading}
                    loadingText="جاري الإرسال..."
                    onClick={() => {
                      const email = loginForm.getValues('email');
                      if (email) {
                        handleForgotPassword(email);
                      }
                    }}
                    className="h-12"
                  >
                    إرسال رابط الاستعادة
                  </Button>

                  <p className="text-center text-sm text-gray-600">
                    تذكرت كلمة المرور؟{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      تسجيل الدخول
                    </button>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedAuthModal;