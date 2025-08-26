import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BellIcon,
  KeyIcon,
  CreditCardIcon,
  HeartIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  StarIcon,
  EyeIcon,
  ShoppingBagIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { AuthService } from '@/services/auth.service.fixed';
import toast from 'react-hot-toast';

interface ProfileData {
  displayName: string;
  email: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    governorate: string;
    postalCode: string;
  };
  dateOfBirth: string;
  gender: 'male' | 'female' | '';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  preferences: {
    language: 'ar' | 'en';
    currency: string;
    theme: 'light' | 'dark';
  };
}

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { language, theme } = useAppStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: {
      street: '',
      city: '',
      governorate: 'القاهرة',
      postalCode: '',
    },
    dateOfBirth: '',
    gender: '',
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false,
    },
    preferences: {
      language: 'ar',
      currency: 'EGP',
      theme: 'light',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Egyptian Governorates
  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية', 
    'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية', 'بورسعيد',
    'السويس', 'شمال سيناء', 'جنوب سيناء', 'الفيوم', 'بني سويف', 'المنيا',
    'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
    'مطروح', 'دمياط', 'الإسماعيلية'
  ];

  // Mock realistic Egyptian automotive marketplace data
  const recentOrders = [
    {
      id: '1',
      orderNumber: '#SES-2024-001',
      date: '2024-01-15',
      title: 'تويوتا كامري 2020 - فل كامل',
      price: '285,000',
      status: 'completed',
      statusAr: 'مكتملة',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&h=200&fit=crop',
      vendor: 'شركة الأمان للسيارات',
      location: 'الجيزة',
      type: 'car'
    },
    {
      id: '2',
      orderNumber: '#SES-2024-002',
      date: '2024-01-10',
      title: 'قطع غيار هوندا - فلتر هواء + زيت محرك',
      price: '1,250',
      status: 'pending',
      statusAr: 'قيد المراجعة',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300&h=200&fit=crop',
      vendor: 'معرض النجمة للسيارات',
      location: 'القاهرة',
      type: 'parts'
    },
    {
      id: '3',
      orderNumber: '#SES-2024-003',
      date: '2024-01-05',
      title: 'خدمة صيانة دورية - هونداي إلنترا',
      price: '850',
      status: 'in_progress',
      statusAr: 'جاري التنفيذ',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&h=200&fit=crop',
      vendor: 'مركز خدمة السيارات الحديثة',
      location: 'المعادي',
      type: 'service'
    }
  ];

  const savedVehicles = [
    {
      id: '1',
      title: 'مرسيدس E200 2021 - حالة ممتازة',
      price: '450,000',
      originalPrice: '520,000',
      location: 'القاهرة الجديدة',
      image: 'https://images.unsplash.com/photo-1606016937473-509d8ff3b4a9?w=300&h=200&fit=crop',
      vendor: 'معرض الفخامة للسيارات المميزة',
      rating: 4.8,
      specs: {
        year: '2021',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '45,000 كم'
      },
      features: ['فتحة سقف', 'جلد طبيعي', 'نظام ملاحة', 'كاميرا خلفية'],
      condition: 'used',
      verified: true
    },
    {
      id: '2',
      title: 'BMW 320i 2020 - صيانات توكيل',
      price: '380,000',
      originalPrice: '420,000',
      location: 'الإسكندرية',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=300&h=200&fit=crop',
      vendor: 'الإسكندرية موتورز',
      rating: 4.6,
      specs: {
        year: '2020',
        fuel: 'بنزين',
        transmission: 'أوتوماتيك',
        mileage: '32,000 كم'
      },
      features: ['شاشة تاتش', 'حساسات ركن', 'نظام أمان', 'إطارات جديدة'],
      condition: 'excellent',
      verified: true
    },
    {
      id: '3',
      title: 'تويوتا كورولا 2022 - جديدة بالضمان',
      price: '320,000',
      originalPrice: '350,000',
      location: 'الشيخ زايد',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&h=200&fit=crop',
      vendor: 'وكيل تويوتا المعتمد',
      rating: 5.0,
      specs: {
        year: '2022',
        fuel: 'هايبرد',
        transmission: 'أوتوماتيك CVT',
        mileage: '5,000 كم'
      },
      features: ['اقتصاد وقود', 'ضمان شركة', 'صيانة مجانية', 'نظام هايبرد متطور'],
      condition: 'new',
      verified: true
    }
  ];

  const recentSearches = [
    { query: 'تويوتا كامري 2020', results: 156, date: '2024-01-14' },
    { query: 'مرسيدس C200', results: 89, date: '2024-01-12' },
    { query: 'قطع غيار هوندا', results: 234, date: '2024-01-10' },
    { query: 'BMW X3 2021', results: 67, date: '2024-01-08' },
    { query: 'صيانة تويوتا القاهرة', results: 45, date: '2024-01-06' }
  ];

  const notifications = [
    {
      id: '1',
      title: 'عرض خاص على مرسيدس E200',
      message: 'خصم 15% على السيارة المحفوظة في قائمتك',
      type: 'offer',
      date: '2024-01-15',
      read: false,
      icon: '🎉'
    },
    {
      id: '2',
      title: 'طلبك جاهز للاستلام',
      message: 'قطع غيار هوندا جاهزة في معرض النجمة',
      type: 'order',
      date: '2024-01-14',
      read: false,
      icon: '📦'
    },
    {
      id: '3',
      title: 'تذكير موعد الصيانة',
      message: 'موعد صيانة سيارتك بعد أسبوعين',
      type: 'reminder',
      date: '2024-01-12',
      read: true,
      icon: '⏰'
    }
  ];

  const handleProfileUpdate = async () => {
    if (!user) return;

    if (!profileData.displayName.trim()) {
      toast.error('يرجى إدخال الاسم الكامل');
      return;
    }

    if (profileData.phoneNumber && !/^01[0-2,5]\d{8}$/.test(profileData.phoneNumber)) {
      toast.error('رقم الهاتف غير صحيح - يجب أن يبدأ بـ 01');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.updateUserProfile(user.id, {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        preferences: profileData.preferences,
      });

      setUser({
        ...user,
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        preferences: profileData.preferences,
      });

      toast.success('تم تحديث الملف الشخصي بنجاح');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في تحديث الملف الشخصي');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, validate current password first
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error('حدث خطأ في تغيير كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate deletion
      toast.success('تم حذف الحساب بنجاح');
      // Redirect to home page after deletion
    } catch (error: any) {
      toast.error('حدث خطأ في حذف الحساب');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'profile', name: 'الملف الشخصي', icon: UserIcon },
    { id: 'orders', name: 'طلباتي', icon: ShoppingBagIcon, count: recentOrders.length },
    { id: 'saved', name: 'المحفوظات', icon: HeartIcon, count: savedVehicles.length },
    { id: 'searches', name: 'عمليات البحث', icon: EyeIcon, count: recentSearches.length },
    { id: 'notifications', name: 'الإشعارات', icon: BellIcon, count: notifications.filter(n => !n.read).length },
    { id: 'settings', name: 'الإعدادات', icon: CogIcon },
    { id: 'security', name: 'الأمان', icon: KeyIcon },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div 
          className="text-center bg-white p-8 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">يرجى تسجيل الدخول</h1>
          <p className="text-gray-600 mb-6">تحتاج إلى تسجيل الدخول لعرض الملف الشخصي</p>
          <motion.a
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            تسجيل الدخول
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Profile Header */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 px-8 py-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 md:space-x-reverse">
                <div className="relative">
                  <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-14 h-14 text-white" />
                    )}
                  </div>
                  <motion.button 
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-primary-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white hover:bg-primary-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <CameraIcon className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <div className="text-center md:text-right flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.displayName}</h1>
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-6 md:space-x-reverse text-primary-100">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    {profileData.phoneNumber && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{profileData.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{profileData.address.governorate}</span>
                    </div>
                  </div>
                  <p className="text-primary-100 text-sm mt-2">
                    عضو منذ {new Date(user.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>

                  {/* User Stats */}
                  <div className="flex items-center justify-center md:justify-start space-x-8 space-x-reverse mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{recentOrders.length}</div>
                      <div className="text-xs text-primary-200">طلب</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{savedVehicles.length}</div>
                      <div className="text-xs text-primary-200">محفوظ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{recentSearches.length}</div>
                      <div className="text-xs text-primary-200">بحث</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <tab.icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </div>
                    {tab.count && tab.count > 0 && (
                      <motion.span 
                        className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full min-w-[1.5rem] text-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        {tab.count > 99 ? '99+' : tab.count}
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">المعلومات الشخصية</h2>
                      <p className="text-gray-600">قم بتحديث معلوماتك الشخصية ومعلومات الاتصال</p>
                    </div>
                    <motion.button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isLoading}
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>{isEditing ? 'إلغاء التعديل' : 'تعديل المعلومات'}</span>
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="أدخل اسمك الكامل"
                          required
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg font-medium">
                          {profileData.displayName || 'لم يتم تحديد الاسم'}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-500 relative">
                        {profileData.email}
                        <span className="text-xs block text-gray-400 mt-1">
                          لا يمكن تغيير البريد الإلكتروني
                        </span>
                        <div className="absolute left-3 top-3">
                          <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="01xxxxxxxxx"
                            dir="ltr"
                          />
                          <PhoneIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg relative">
                          {profileData.phoneNumber || 'لم يتم إدخال رقم الهاتف'}
                          <PhoneIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Governorate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المحافظة
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <select
                            value={profileData.address.governorate}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              address: { ...profileData.address, governorate: e.target.value }
                            })}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
                          >
                            <option value="">اختر المحافظة</option>
                            {governorates.map((gov) => (
                              <option key={gov} value={gov}>{gov}</option>
                            ))}
                          </select>
                          <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg relative">
                          {profileData.address.governorate || 'لم يتم اختيار المحافظة'}
                          <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدينة/المنطقة
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.address.city}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            address: { ...profileData.address, city: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="مثال: مدينة نصر، الزمالك، المهندسين"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg">
                          {profileData.address.city || 'لم يتم تحديد المدينة'}
                        </div>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الجنس
                      </label>
                      {isEditing ? (
                        <select
                          value={profileData.gender}
                          onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as 'male' | 'female' | '' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                          <option value="">اختر الجنس</option>
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg">
                          {profileData.gender === 'male' ? 'ذكر' : profileData.gender === 'female' ? 'أنثى' : 'لم يتم التحديد'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Section */}
                  {isEditing && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">العنوان التفصيلي</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            الشارع والعنوان
                          </label>
                          <textarea
                            value={profileData.address.street}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              address: { ...profileData.address, street: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="مثال: شارع التسعين الشمالي، التجمع الخامس، خلف مول القاهرة الجديدة"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            الرقم البريدي
                          </label>
                          <input
                            type="text"
                            value={profileData.address.postalCode}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              address: { ...profileData.address, postalCode: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse mt-8 pt-8 border-t">
                      <motion.button
                        onClick={handleProfileUpdate}
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-2 space-x-reverse px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                        whileHover={{ scale: isLoading ? 1 : 1.05 }}
                        whileTap={{ scale: isLoading ? 1 : 0.95 }}
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>{isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => {
                          setIsEditing(false);
                          setProfileData({
                            ...profileData,
                            displayName: user?.displayName || '',
                            phoneNumber: user?.phoneNumber || '',
                          });
                        }}
                        className="flex items-center justify-center space-x-2 space-x-reverse px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <XMarkIcon className="w-4 h-4" />
                        <span>إلغاء التغييرات</span>
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">طلباتي</h2>
                      <p className="text-gray-600">عرض جميع طلباتك وحالة التنفيذ</p>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option>جميع الطلبات</option>
                        <option>مكتملة</option>
                        <option>قيد المراجعة</option>
                        <option>جاري التنفيذ</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {recentOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6 lg:space-x-reverse">
                          <div className="relative">
                            <img
                              src={order.image}
                              alt={order.title}
                              className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl object-cover shadow-md"
                            />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {order.type === 'car' ? '🚗' : order.type === 'parts' ? '🔧' : '⚙️'}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{order.title}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                                  <div className="flex items-center space-x-1 space-x-reverse">
                                    <span className="font-medium">رقم الطلب:</span>
                                    <span className="text-primary-600 font-mono">{order.orderNumber}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 space-x-reverse">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{new Date(order.date).toLocaleDateString('ar-EG')}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 space-x-reverse">
                                    <MapPinIcon className="w-4 h-4" />
                                    <span>{order.location}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">التاجر:</span> {order.vendor}
                                </p>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary-600 mb-2">
                                  {order.price} <span className="text-sm text-gray-500">جنيه</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                  {order.statusAr}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                              <motion.button 
                                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                عرض التفاصيل
                              </motion.button>
                              
                              {order.status === 'completed' && (
                                <motion.button 
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  إعادة الطلب
                                </motion.button>
                              )}
                              
                              {order.status === 'pending' && (
                                <motion.button 
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  إلغاء الطلب
                                </motion.button>
                              )}
                              
                              <motion.button 
                                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                تنزيل الفاتورة
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {recentOrders.length === 0 && (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
                      <p className="text-gray-600 mb-6">لم تقم بأي طلبات بعد</p>
                      <motion.a
                        href="/marketplace"
                        className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        تصفح السوق
                      </motion.a>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Saved Vehicles Tab */}
              {activeTab === 'saved' && (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">السيارات المحفوظة</h2>
                      <p className="text-gray-600">السيارات التي أضفتها إلى قائمة المفضلة</p>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option>جميع السيارات</option>
                        <option>حديثة</option>
                        <option>مستعملة</option>
                        <option>ممتازة</option>
                      </select>
                      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option>ترتيب بالتاريخ</option>
                        <option>ترتيب بالسعر</option>
                        <option>ترتيب بالنوع</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {savedVehicles.map((vehicle) => (
                      <motion.div
                        key={vehicle.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white"
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="relative">
                          <img
                            src={vehicle.image}
                            alt={vehicle.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 right-4 flex items-center space-x-2 space-x-reverse">
                            {vehicle.verified && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                ✓ موثق
                              </span>
                            )}
                            <span className={`text-white text-xs px-2 py-1 rounded-full font-medium ${
                              vehicle.condition === 'new' ? 'bg-blue-500' : 
                              vehicle.condition === 'excellent' ? 'bg-green-500' : 'bg-orange-500'
                            }`}>
                              {vehicle.condition === 'new' ? 'جديد' : 
                               vehicle.condition === 'excellent' ? 'ممتاز' : 'مستعمل'}
                            </span>
                          </div>
                          <div className="absolute top-4 left-4">
                            <motion.button 
                              className="w-8 h-8 bg-white/90 backdrop-blur-sm text-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-white"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <HeartIcon className="w-4 h-4 fill-current" />
                            </motion.button>
                          </div>
                          {vehicle.originalPrice !== vehicle.price && (
                            <div className="absolute bottom-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              خصم {Math.round((1 - parseInt(vehicle.price.replace(',', '')) / parseInt(vehicle.originalPrice.replace(',', ''))) * 100)}%
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                                {vehicle.title}
                              </h3>
                              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                                <MapPinIcon className="w-4 h-4" />
                                <span>{vehicle.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{vehicle.rating}</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex items-baseline space-x-2 space-x-reverse mb-2">
                              <span className="text-2xl font-bold text-primary-600">
                                {vehicle.price} جنيه
                              </span>
                              {vehicle.originalPrice !== vehicle.price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {vehicle.originalPrice} جنيه
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{vehicle.vendor}</p>
                          </div>
                          
                          {/* Vehicle Specs */}
                          <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-center">
                              <div className="text-xs text-gray-500">السنة</div>
                              <div className="font-semibold">{vehicle.specs.year}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">الوقود</div>
                              <div className="font-semibold">{vehicle.specs.fuel}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">ناقل الحركة</div>
                              <div className="font-semibold">{vehicle.specs.transmission}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">المسافة</div>
                              <div className="font-semibold">{vehicle.specs.mileage}</div>
                            </div>
                          </div>
                          
                          {/* Features */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {vehicle.features.slice(0, 3).map((feature, index) => (
                                <span key={index} className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">
                                  {feature}
                                </span>
                              ))}
                              {vehicle.features.length > 3 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  +{vehicle.features.length - 3} المزيد
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 space-x-reverse">
                            <motion.button 
                              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg transition-colors font-medium text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              عرض التفاصيل
                            </motion.button>
                            <motion.button 
                              className="px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors font-medium text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              اتصال
                            </motion.button>
                            <motion.button 
                              className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {savedVehicles.length === 0 && (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سيارات محفوظة</h3>
                      <p className="text-gray-600 mb-6">لم تحفظ أي سيارات في قائمة المفضلة</p>
                      <motion.a
                        href="/marketplace"
                        className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        تصفح السيارات
                      </motion.a>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Recent Searches Tab */}
              {activeTab === 'searches' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">عمليات البحث الأخيرة</h2>
                      <p className="text-gray-600">تتبع عمليات البحث التي قمت بها مؤخراً</p>
                    </div>
                    <motion.button 
                      className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      مسح الكل
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    {recentSearches.map((search, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                            <EyeIcon className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{search.query}</h3>
                            <p className="text-sm text-gray-500">
                              {search.results} نتيجة • {new Date(search.date).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <motion.button 
                            className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            بحث مرة أخرى
                          </motion.button>
                          <motion.button 
                            className="p-2 text-gray-400 hover:text-red-500"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">الإشعارات</h2>
                      <p className="text-gray-600">تتبع جميع الإشعارات والتحديثات</p>
                    </div>
                    <motion.button 
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      تحديد الكل كمقروء
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        className={`p-4 border rounded-lg transition-all ${
                          notification.read 
                            ? 'border-gray-200 bg-white' 
                            : 'border-primary-200 bg-primary-50'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start space-x-4 space-x-reverse">
                          <div className="text-2xl">{notification.icon}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900">{notification.title}</h3>
                              <span className="text-xs text-gray-500">
                                {new Date(notification.date).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                notification.type === 'offer' ? 'bg-green-100 text-green-800' :
                                notification.type === 'order' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {notification.type === 'offer' ? 'عرض' :
                                 notification.type === 'order' ? 'طلب' : 'تذكير'}
                              </span>
                              {!notification.read && (
                                <motion.button 
                                  className="text-xs text-primary-600 hover:underline"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  تحديد كمقروء
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">إعدادات الحساب</h2>
                  
                  <div className="space-y-8">
                    {/* Notification Settings */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">إعدادات الإشعارات</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'email', label: 'إشعارات البريد الإلكتروني', desc: 'تلقي إشعارات حول الطلبات والعروض الجديدة', checked: profileData.notifications.email },
                          { key: 'sms', label: 'إشعارات SMS', desc: 'تلقي رسائل نصية للطلبات المهمة', checked: profileData.notifications.sms },
                          { key: 'push', label: 'إشعارات الدفع', desc: 'تلقي إشعارات فورية على الهاتف', checked: profileData.notifications.push },
                          { key: 'marketing', label: 'إشعارات تسويقية', desc: 'تلقي عروض وخصومات خاصة', checked: profileData.notifications.marketing }
                        ].map((setting) => (
                          <div key={setting.key} className="flex items-center justify-between p-4 bg-white rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{setting.label}</h4>
                              <p className="text-sm text-gray-600">{setting.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={setting.checked}
                                onChange={(e) => setProfileData({
                                  ...profileData,
                                  notifications: {
                                    ...profileData.notifications,
                                    [setting.key]: e.target.checked
                                  }
                                })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Language & Regional Settings */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">الإعدادات الإقليمية</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">اللغة</label>
                          <select
                            value={profileData.preferences.language}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              preferences: { ...profileData.preferences, language: e.target.value as 'ar' | 'en' }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="ar">العربية</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
                          <select
                            value={profileData.preferences.currency}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              preferences: { ...profileData.preferences, currency: e.target.value }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="EGP">جنيه مصري (EGP)</option>
                            <option value="USD">دولار أمريكي (USD)</option>
                            <option value="EUR">يورو (EUR)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">إعدادات الخصوصية</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">إظهار الملف الشخصي للتجار</h4>
                            <p className="text-sm text-gray-600">السماح للتجار بمشاهدة معلوماتك الأساسية</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">السماح بالاتصال المباشر</h4>
                            <p className="text-sm text-gray-600">السماح للتجار بالاتصال بك مباشرة</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <motion.button 
                        onClick={() => toast.success('تم حفظ الإعدادات بنجاح')}
                        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        حفظ الإعدادات
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">إعدادات الأمان</h2>
                  
                  <div className="space-y-8">
                    {/* Change Password */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">تغيير كلمة المرور</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            كلمة المرور الحالية
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="أدخل كلمة المرور الحالية"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            كلمة المرور الجديدة
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="أدخل كلمة المرور الجديدة"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            تأكيد كلمة المرور الجديدة
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="أعد إدخال كلمة المرور الجديدة"
                          />
                        </div>
                        <motion.button
                          onClick={handlePasswordChange}
                          disabled={isLoading}
                          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                          whileHover={{ scale: isLoading ? 1 : 1.05 }}
                          whileTap={{ scale: isLoading ? 1 : 0.95 }}
                        >
                          {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                        </motion.button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <CheckIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-green-900 mb-2">التحقق الثنائي</h3>
                          <p className="text-green-700 mb-4">
                            قم بتفعيل التحقق الثنائي لحماية إضافية لحسابك
                          </p>
                          <motion.button 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            تفعيل التحقق الثنائي
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Login Sessions */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">جلسات تسجيل الدخول</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <h4 className="font-medium text-gray-900">الجلسة الحالية</h4>
                              <p className="text-sm text-gray-600">Chrome على Windows • القاهرة، مصر</p>
                            </div>
                          </div>
                          <span className="text-sm text-green-600 font-medium">نشط الآن</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <div>
                              <h4 className="font-medium text-gray-900">جلسة سابقة</h4>
                              <p className="text-sm text-gray-600">Safari على iPhone • منذ 3 أيام</p>
                            </div>
                          </div>
                          <motion.button 
                            className="text-sm text-red-600 hover:underline"
                            whileHover={{ scale: 1.05 }}
                          >
                            إنهاء
                          </motion.button>
                        </div>
                      </div>
                      <motion.button 
                        className="mt-4 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        إنهاء جميع الجلسات الأخرى
                      </motion.button>
                    </div>

                    {/* Delete Account */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-red-900 mb-2">حذف الحساب</h3>
                          <p className="text-red-700 mb-4">
                            حذف الحساب عملية لا يمكن التراجع عنها. سيتم حذف جميع بياناتك ولن تتمكن من استردادها.
                          </p>
                          <motion.button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            حذف الحساب نهائياً
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white rounded-xl p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">تأكيد حذف الحساب</h3>
              <p className="text-gray-600 mb-6">
                هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً بما في ذلك:
              </p>
              <ul className="text-sm text-gray-600 text-right mb-6 space-y-1">
                <li>• معلوماتك الشخصية</li>
                <li>• طلباتك السابقة</li>
                <li>• السيارات المحفوظة</li>
                <li>• الإعدادات والتفضيلات</li>
              </ul>
              <div className="flex space-x-4 space-x-reverse">
                <motion.button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  إلغاء
                </motion.button>
                <motion.button 
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  {isLoading ? 'جاري الحذف...' : 'حذف الحساب'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;