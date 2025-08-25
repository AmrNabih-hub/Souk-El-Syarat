/**
 * Advanced User Profile - 2025 Edition
 * Comprehensive user profile with rich features and modern UI
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  UserCircleIcon,
  CameraIcon,
  PencilIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  StarIcon,
  HeartIcon,
  ShoppingBagIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

import { useAuthStore } from '@/stores/authStore.v2';
import { Button } from '@/components/ui/Button/Button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { User, Address } from '@/types';

// Validation schema
const profileSchema = yup.object({
  displayName: yup
    .string()
    .required('الاسم مطلوب')
    .min(2, 'الاسم قصير جداً')
    .max(50, 'الاسم طويل جداً'),
  phoneNumber: yup
    .string()
    .required('رقم الهاتف مطلوب')
    .matches(/^(\+201|01)[0-9]{9}$/, 'رقم الهاتف غير صحيح'),
  bio: yup
    .string()
    .max(500, 'النبذة طويلة جداً'),
  dateOfBirth: yup
    .date()
    .nullable()
    .max(new Date(), 'تاريخ الميلاد لا يمكن أن يكون في المستقبل'),
});

const addressSchema = yup.object({
  street: yup.string().required('اسم الشارع مطلوب'),
  city: yup.string().required('اسم المدينة مطلوب'),
  governorate: yup.string().required('المحافظة مطلوبة'),
  postalCode: yup.string(),
  country: yup.string().required('الدولة مطلوبة').default('مصر'),
});

// Stats data
const getUserStats = (user: User) => ({
  totalOrders: 24,
  totalSpent: 125000,
  favoriteItems: 12,
  reviewsCount: 8,
  averageRating: 4.5,
  joinedDays: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
});

// Profile Image Upload Component
const ProfileImageUpload: React.FC<{
  currentImage?: string;
  onImageChange: (file: File) => void;
}> = ({ currentImage, onImageChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صحيح');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      onImageChange(file);
    }
  };

  return (
    <div className="relative group">
      <div className="w-32 h-32 mx-auto relative">
        {preview || currentImage ? (
          <img
            src={preview || currentImage}
            alt="Profile"
            className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-white shadow-lg">
            <UserCircleIcon className="w-16 h-16 text-white" />
          </div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
        >
          <CameraIcon className="w-5 h-5" />
        </motion.button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

// Address Card Component
const AddressCard: React.FC<{
  address: Address;
  isDefault?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}> = ({ address, isDefault, onEdit, onDelete, onSetDefault }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'p-4 rounded-xl border-2 transition-all duration-200',
        isDefault
          ? 'border-blue-300 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <MapPinIcon className="w-5 h-5 text-gray-500 mr-2" />
          {isDefault && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              العنوان الافتراضي
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="text-gray-900 mb-2">
        <div className="font-medium">{address.street}</div>
        <div className="text-sm text-gray-600">
          {address.city}, {address.governorate}
        </div>
        {address.postalCode && (
          <div className="text-sm text-gray-600">
            الرمز البريدي: {address.postalCode}
          </div>
        )}
      </div>
      
      {!isDefault && (
        <button
          onClick={onSetDefault}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          تعيين كافتراضي
        </button>
      )}
    </motion.div>
  );
};

// Main Profile Component
export const AdvancedUserProfile: React.FC = () => {
  const { user, updateProfile, _isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'addresses'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([
    {
      street: '123 شارع النيل',
      city: 'القاهرة',
      governorate: 'القاهرة',
      postalCode: '12345',
      country: 'مصر',
    },
  ]);

  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      phoneNumber: user?.phoneNumber || '',
      bio: '',
      dateOfBirth: null,
    },
  });

  const stats = user ? getUserStats(user) : null;

  const handleProfileUpdate = async (data: any) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleImageUpload = async (file: File) => {
    // Here you would upload to Firebase Storage
    console.log('Uploading image:', file);
  };

  if (!user || !stats) {
    return <div>Loading...</div>;
  }

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: UserCircleIcon },
    { id: 'security', label: 'الأمان', icon: ShieldCheckIcon },
    { id: 'preferences', label: 'التفضيلات', icon: BellIcon },
    { id: 'addresses', label: 'العناوين', icon: MapPinIcon },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
              <div className="flex flex-col md:flex-row items-center">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <ProfileImageUpload
                    currentImage={user.photoURL || undefined}
                    onImageChange={handleImageUpload}
                  />
                </div>
                
                <div className="text-center md:text-right text-white flex-1">
                  <h1 className="text-3xl font-bold mb-2">{user.displayName}</h1>
                  <p className="text-blue-100 mb-4">{user.email}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{stats.totalOrders}</div>
                      <div className="text-sm text-blue-100">إجمالي الطلبات</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {(stats.totalSpent / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-blue-100">إجمالي الإنفاق</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.favoriteItems}</div>
                      <div className="text-sm text-blue-100">المفضلات</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.joinedDays}</div>
                      <div className="text-sm text-blue-100">يوم معنا</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                          'w-full flex items-center px-4 py-3 text-right rounded-xl transition-all duration-200',
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        <Icon className="w-5 h-5 ml-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <AnimatePresence mode="wait">
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                          المعلومات الشخصية
                        </h2>
                        <Button
                          variant={isEditing ? 'secondary' : 'primary'}
                          onClick={() => setIsEditing(!isEditing)}
                          leftIcon={isEditing ? <XMarkIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                        >
                          {isEditing ? 'إلغاء' : 'تعديل'}
                        </Button>
                      </div>

                      {isEditing ? (
                        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                الاسم الكامل
                              </label>
                              <input
                                {...profileForm.register('displayName')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              {profileForm.formState.errors.displayName && (
                                <p className="text-red-600 text-sm mt-1">
                                  {profileForm.formState.errors.displayName.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم الهاتف
                              </label>
                              <input
                                {...profileForm.register('phoneNumber')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                dir="ltr"
                              />
                              {profileForm.formState.errors.phoneNumber && (
                                <p className="text-red-600 text-sm mt-1">
                                  {profileForm.formState.errors.phoneNumber.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              نبذة شخصية
                            </label>
                            <textarea
                              {...profileForm.register('bio')}
                              rows={4}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="اكتب نبذة مختصرة عن نفسك..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              تاريخ الميلاد
                            </label>
                            <input
                              {...profileForm.register('dateOfBirth')}
                              type="date"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <Button
                              type="submit"
                              isLoading={_isLoading}
                              loadingText="جاري الحفظ..."
                            >
                              حفظ التغييرات
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center">
                              <UserCircleIcon className="w-5 h-5 text-gray-400 ml-3" />
                              <div>
                                <div className="text-sm text-gray-600">الاسم</div>
                                <div className="font-medium">{user.displayName}</div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <EnvelopeIcon className="w-5 h-5 text-gray-400 ml-3" />
                              <div>
                                <div className="text-sm text-gray-600">البريد الإلكتروني</div>
                                <div className="font-medium">{user.email}</div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <PhoneIcon className="w-5 h-5 text-gray-400 ml-3" />
                              <div>
                                <div className="text-sm text-gray-600">رقم الهاتف</div>
                                <div className="font-medium">{user.phoneNumber || 'غير محدد'}</div>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <CalendarIcon className="w-5 h-5 text-gray-400 ml-3" />
                              <div>
                                <div className="text-sm text-gray-600">تاريخ الانضمام</div>
                                <div className="font-medium">
                                  {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <CheckCircleIcon className={clsx(
                              'w-5 h-5 ml-3',
                              user.emailVerified ? 'text-green-500' : 'text-gray-400'
                            )} />
                            <div>
                              <div className="text-sm text-gray-600">حالة التحقق</div>
                              <div className={clsx(
                                'font-medium',
                                user.emailVerified ? 'text-green-600' : 'text-gray-600'
                              )}>
                                {user.emailVerified ? 'تم التحقق' : 'لم يتم التحقق'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Addresses Tab */}
                  {activeTab === 'addresses' && (
                    <motion.div
                      key="addresses"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                          العناوين المحفوظة
                        </h2>
                        <Button
                          leftIcon={<PlusIcon className="w-4 h-4" />}
                        >
                          إضافة عنوان جديد
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addresses.map((address, index) => (
                          <AddressCard
                            key={index}
                            address={address}
                            isDefault={index === 0}
                            onEdit={() => console.log('Edit address', index)}
                            onDelete={() => console.log('Delete address', index)}
                            onSetDefault={() => console.log('Set default', index)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h2 className="text-2xl font-bold text-gray-900 mb-8">
                        الأمان والخصوصية
                      </h2>

                      <div className="space-y-6">
                        <div className="border border-gray-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold mb-4">تغيير كلمة المرور</h3>
                          <p className="text-gray-600 mb-4">
                            يُنصح بتغيير كلمة المرور بانتظام للحفاظ على أمان حسابك
                          </p>
                          <Button variant="outline">
                            تغيير كلمة المرور
                          </Button>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold mb-4">المصادقة الثنائية</h3>
                          <p className="text-gray-600 mb-4">
                            أضف طبقة حماية إضافية لحسابك باستخدام المصادقة الثنائية
                          </p>
                          <Button variant="outline">
                            تفعيل المصادقة الثنائية
                          </Button>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold mb-4">جلسات النشاط</h3>
                          <p className="text-gray-600 mb-4">
                            راجع الأجهزة التي تم تسجيل الدخول منها إلى حسابك
                          </p>
                          <Button variant="outline">
                            عرض الجلسات النشطة
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Preferences Tab */}
                  {activeTab === 'preferences' && (
                    <motion.div
                      key="preferences"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h2 className="text-2xl font-bold text-gray-900 mb-8">
                        التفضيلات والإشعارات
                      </h2>

                      <div className="space-y-6">
                        <div className="border border-gray-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold mb-4">إعدادات الإشعارات</h3>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">إشعارات البريد الإلكتروني</div>
                                <div className="text-sm text-gray-600">تلقي إشعارات عبر البريد الإلكتروني</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">إشعارات الهاتف</div>
                                <div className="text-sm text-gray-600">تلقي رسائل SMS</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">الإشعارات الفورية</div>
                                <div className="text-sm text-gray-600">تلقي إشعارات فورية في المتصفح</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold mb-4">التفضيلات العامة</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                اللغة
                              </label>
                              <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="ar">العربية</option>
                                <option value="en">English</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                العملة
                              </label>
                              <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="EGP">جنيه مصري (EGP)</option>
                                <option value="USD">دولار أمريكي (USD)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedUserProfile;