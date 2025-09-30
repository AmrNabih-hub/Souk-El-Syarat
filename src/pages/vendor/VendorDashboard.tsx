import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingStorefrontIcon,
  ChartBarIcon,
  CogIcon,
  SquaresPlusIcon,
  ShoppingBagIcon,
  UsersIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { vendorApplicationService } from '@/services/vendor-application.service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const VendorDashboard: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [vendorApplication, setVendorApplication] = useState(null);

  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Check if user has vendor application
        const applications = vendorApplicationService.getUserApplications(user.id);
        const latestApplication = applications[0];
        
        if (!latestApplication) {
          // No application found, redirect to application page
          navigate('/vendor/apply');
          return;
        }

        setVendorApplication(latestApplication);
        
        if (latestApplication.status === 'pending') {
          // Application is pending, show pending status
          setIsLoading(false);
          return;
        } else if (latestApplication.status === 'rejected') {
          // Application was rejected, show rejection message and option to reapply
          setIsLoading(false);
          return; 
        } else if (latestApplication.status === 'approved') {
          // Application approved, show full vendor dashboard
          setIsLoading(false);
          return;
        }
        
      } catch (error) {
        console.error('Error checking vendor status:', error);
        toast.error('Error loading vendor dashboard');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkVendorStatus();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Pending Application Status
  if (vendorApplication?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white rounded-lg shadow-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="w-10 h-10 text-yellow-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'طلبك قيد المراجعة' : 'Your Application is Under Review'}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              {language === 'ar' 
                ? 'شكراً لتقديم طلب الانضمام كتاجر. فريق الإدارة يراجع طلبك حالياً وسنتواصل معك خلال 3-5 أيام عمل.'
                : 'Thank you for submitting your vendor application. Our admin team is currently reviewing your request and will contact you within 3-5 business days.'
              }
            </p>

            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                {language === 'ar' ? 'تفاصيل طلبك' : 'Your Application Details'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-sm text-blue-600">{language === 'ar' ? 'اسم النشاط:' : 'Business Name:'}</span>
                  <p className="font-medium">{vendorApplication.applicationData.businessName}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-600">{language === 'ar' ? 'نوع النشاط:' : 'Business Type:'}</span>
                  <p className="font-medium">{vendorApplication.applicationData.businessType}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-600">{language === 'ar' ? 'تاريخ التقديم:' : 'Submitted:'}</span>
                  <p className="font-medium">{vendorApplication.submittedAt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-600">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                  <p className="font-medium text-yellow-600">{language === 'ar' ? 'قيد المراجعة' : 'Under Review'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link 
                to="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
              </Link>
              <button
                onClick={() => {
                  // Refresh page to check status
                  window.location.reload();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {language === 'ar' ? 'تحديث الحالة' : 'Refresh Status'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Rejected Application Status
  if (vendorApplication?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white rounded-lg shadow-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'تم رفض طلبك' : 'Application Rejected'}
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              {language === 'ar' 
                ? 'للأسف، لم يتم قبول طلب انضمامك كتاجر في الوقت الحالي.'
                : 'Unfortunately, your vendor application was not approved at this time.'
              }
            </p>

            {vendorApplication.reviewComments && (
              <div className="bg-red-50 p-6 rounded-lg mb-8 text-left">
                <h3 className="text-lg font-semibold text-red-900 mb-3">
                  {language === 'ar' ? 'أسباب الرفض' : 'Rejection Reason'}
                </h3>
                <p className="text-red-700">{vendorApplication.reviewComments}</p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Link 
                to="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
              </Link>
              <Link
                to="/vendor/apply"
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {language === 'ar' ? 'إعادة التقديم' : 'Reapply'}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Approved Vendor Dashboard
  const menuItems = [
    {
      icon: SquaresPlusIcon,
      title: { ar: 'منتجاتي', en: 'My Products' },
      description: { ar: 'إدارة السيارات وقطع الغيار', en: 'Manage cars and spare parts' },
      href: '/vendor/products',
      color: 'bg-blue-500',
      badge: '0'
    },
    {
      icon: ShoppingBagIcon,
      title: { ar: 'الطلبات', en: 'Orders' },
      description: { ar: 'متابعة طلبات العملاء', en: 'Track customer orders' },
      href: '/vendor/orders',
      color: 'bg-green-500',
      badge: '0'
    },
    {
      icon: ChartBarIcon,
      title: { ar: 'التحليلات', en: 'Analytics' },
      description: { ar: 'مبيعات وإحصائيات', en: 'Sales and statistics' },
      href: '/vendor/analytics',
      color: 'bg-purple-500'
    },
    {
      icon: UsersIcon,
      title: { ar: 'العملاء', en: 'Customers' },
      description: { ar: 'إدارة قاعدة العملاء', en: 'Manage customer base' },
      href: '/vendor/customers',
    },
    {
      icon: BanknotesIcon,
      title: { ar: 'الماليات', en: 'Finances' },
      description: { ar: 'المدفوعات والعمولات', en: 'Payments and commissions' },
      href: '/vendor/finances',
      color: 'bg-green-500'
    },
    {
      icon: CogIcon,
      title: { ar: 'الإعدادات', en: 'Settings' },
      description: { ar: 'إعدادات المتجر والحساب', en: 'Store and account settings' },
      href: '/vendor/settings',
      color: 'bg-gray-500'
    }
  ];

  const stats = [
    { label: { ar: 'إجمالي المبيعات', en: 'Total Sales' }, value: '0 EGP', color: 'text-green-600' },
    { label: { ar: 'المنتجات النشطة', en: 'Active Products' }, value: '0', color: 'text-blue-600' },
    { label: { ar: 'الطلبات الجديدة', en: 'New Orders' }, value: '0', color: 'text-orange-600' },
    { label: { ar: 'التقييم', en: 'Rating' }, value: 'جديد', color: 'text-yellow-600' }
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-8'
        >
          <div className='flex items-center justify-center mb-6'>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <CheckCircleIcon className='w-8 h-8 text-green-600' />
            </div>
            <div>
              <h1 className='text-4xl font-bold text-neutral-900'>
                {language === 'ar' ? `مبروك ${vendorApplication?.applicationData.contactPerson}!` : `Congratulations ${vendorApplication?.applicationData.contactPerson}!`}
              </h1>
              <p className='text-lg text-green-600 mt-2 font-semibold'>
                {language === 'ar' ? 'تم قبول طلبك كتاجر بنجاح' : 'Your vendor application has been approved'}
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-800 mb-3">
              {language === 'ar' ? `أهلاً وسهلاً في ${vendorApplication?.applicationData.businessName}` : `Welcome to ${vendorApplication?.applicationData.businessName}`}
            </h2>
            <p className='text-green-700'>
              {language === 'ar' 
                ? 'يمكنك الآن البدء في إضافة منتجاتك وإدارة متجرك الإلكتروني. استخدم الأدوات أدناه للبدء.' 
                : 'You can now start adding your products and managing your online store. Use the tools below to get started.'
              }
            </p>
          </div>
        </motion.div>

        {/* Business Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
            <BuildingStorefrontIcon className="w-6 h-6 text-primary-500 mr-3" />
            {language === 'ar' ? 'معلومات نشاطك التجاري' : 'Your Business Information'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-500">{language === 'ar' ? 'اسم النشاط' : 'Business Name'}</label>
              <p className="font-semibold text-lg">{vendorApplication?.applicationData.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">{language === 'ar' ? 'نوع النشاط' : 'Business Type'}</label>
              <p className="font-semibold">{vendorApplication?.applicationData.businessType}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">{language === 'ar' ? 'المحافظة' : 'Governorate'}</label>
              <p className="font-semibold">{vendorApplication?.applicationData.address.governorate}</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm text-gray-500">{language === 'ar' ? 'التخصصات' : 'Specializations'}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {vendorApplication?.applicationData.specializations.map((spec, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className='bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'
            >
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className='text-sm text-neutral-600'>{stat.label[language]}</div>
            </motion.div>
          ))}
        </div>

        {/* Get Started Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-8 text-white mb-8"
        >
          <h2 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'ابدأ رحلتك الآن!' : 'Start Your Journey Now!'}
          </h2>
          <p className="text-xl opacity-90 mb-6">
            {language === 'ar' 
              ? 'اتبع هذه الخطوات البسيطة لإعداد متجرك وبدء البيع'
              : 'Follow these simple steps to set up your store and start selling'
            }
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">
                {language === 'ar' ? 'أضف منتجاتك' : 'Add Your Products'}
              </h4>
              <p className="text-sm opacity-90">
                {language === 'ar' ? 'ابدأ بإضافة المنتجات والخدمات التي تقدمها' : 'Start by adding the products and services you offer'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">
                {language === 'ar' ? 'اضبط الإعدادات' : 'Configure Settings'}
              </h4>
              <p className="text-sm opacity-90">
                {language === 'ar' ? 'حدد إعدادات الدفع والشحن والضرائب' : 'Set up payment, shipping, and tax settings'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">
                {language === 'ar' ? 'ابدأ البيع' : 'Start Selling'}
              </h4>
              <p className="text-sm opacity-90">
                {language === 'ar' ? 'متجرك جاهز لاستقبال أول طلب!' : 'Your store is ready to receive the first order!'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Menu */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <Link
                to={item.href}
                className='block bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group'
              >
                <div className='flex items-start'>
                  <div className={`${item.color} group-hover:scale-110 transition-transform p-3 rounded-lg mr-4`}>
                    <item.icon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors'>
                        {item.title[language]}
                      </h3>
                      {item.badge && (
                        <span className='bg-primary-500 text-white text-xs px-2 py-1 rounded-full'>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className='text-neutral-600 text-sm'>
                      {item.description[language]}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Start Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white'
          >
            <div className="flex items-center mb-4">
              <PlusIcon className='w-8 h-8 mr-3' />
              <h3 className='text-xl font-bold'>
                {language === 'ar' ? 'إضافة أول منتج' : 'Add Your First Product'}
              </h3>
            </div>
            <p className='opacity-90 mb-4'>
              {language === 'ar' 
                ? 'ابدأ رحلتك بإضافة أول سيارة أو قطعة غيار لمتجرك'
                : 'Start your journey by adding your first car or spare part'
              }
            </p>
            <Link
              to='/vendor/products/new'
              className='inline-flex items-center bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors'
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className='bg-white rounded-xl p-6 border border-neutral-200 shadow-sm'
          >
            <div className="flex items-center mb-4">
              <EyeIcon className='w-6 h-6 text-purple-500 mr-3' />
              <h3 className='text-lg font-semibold text-neutral-900'>
                {language === 'ar' ? 'استعراض متجرك' : 'Preview Your Store'}
              </h3>
            </div>
            <p className='text-neutral-600 mb-4'>
              {language === 'ar' 
                ? 'شاهد كيف سيبدو متجرك للعملاء'
                : 'See how your store will look to customers'
              }
            </p>
            <Link
              to={`/vendor/${user?.id}/store`}
              className='inline-flex items-center text-purple-600 font-semibold hover:text-purple-700 transition-colors'
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'عرض المتجر' : 'View Store'}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
