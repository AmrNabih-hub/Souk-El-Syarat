import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChartBarIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

import { VendorApplication, Vendor } from '@/types';
import { VendorService } from '@/services/vendor.service';
import { EgyptianLoader, LoadingSpinner } from '@/components/ui/CustomIcons';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingApplications: number;
  monthlyRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'vendors' | 'analytics'>(
    'overview'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load vendor statistics
      const vendorStats = await VendorService.getVendorStats();

      // Load pending applications
      const { applications: pendingApps } = await VendorService.getAllApplications('pending', 10);

      // Load recent vendors
      const { vendors: recentVendors } = await VendorService.getAllVendors('active', 10);

      // Get REAL stats from database - NO MOCK DATA
      const realStats = await AdminStatsService.getPlatformStats();
      setStats({
        totalUsers: realStats.totalUsers,
        totalVendors: realStats.totalVendors,
        totalProducts: realStats.totalProducts,
        totalOrders: realStats.totalOrders,
        pendingApplications: realStats.pendingVendorApplications,
        monthlyRevenue: realStats.monthlyRevenue,
      });

      setApplications(pendingApps);
      setVendors(recentVendors);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading dashboard data:', error);
      }
      toast.error(language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewApplication = async () => {
    if (!selectedApplication || !user?.id) return;

    try {
      setIsProcessing(true);

      await VendorService.reviewApplication(
        selectedApplication.id,
        user.id,
        reviewStatus,
        reviewNotes
      );

      toast.success(
        language === 'ar'
          ? `تم ${reviewStatus === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`
          : `Application ${reviewStatus === 'approved' ? 'approved' : 'rejected'} successfully`
      );

      setReviewModalOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
      loadDashboardData(); // Reload data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reviewing application:', error);
      }
      toast.error(language === 'ar' ? 'خطأ في معالجة الطلب' : 'Error processing application');
    } finally {
      setIsProcessing(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }> = ({ title, value, icon, color, trend }) => (
    <motion.div
      className='bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow'
      whileHover={{ y: -2 }}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        {trend && (
          <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}
            {trend}%
          </div>
        )}
      </div>
      <h3 className='text-2xl font-bold text-neutral-900 mb-1'>{value}</h3>
      <p className='text-neutral-600 text-sm'>{title}</p>
    </motion.div>
  );

  const ApplicationCard: React.FC<{ application: VendorApplication }> = ({ application }) => (
    <motion.div
      className='bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow'
      whileHover={{ scale: 1.01 }}
    >
      <div className='flex justify-between items-start mb-3'>
        <div>
          <h4 className='font-semibold text-neutral-900'>{application.businessName}</h4>
          <p className='text-sm text-neutral-600'>{application.contactPerson}</p>
        </div>
        <span className='px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full'>
          {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
        </span>
      </div>

      <div className='space-y-2 mb-4'>
        <div className='flex items-center text-sm text-neutral-600'>
          <BuildingStorefrontIcon className='w-4 h-4 mr-2' />
          {application.businessType}
        </div>
        <div className='flex items-center text-sm text-neutral-600'>
          <ClockIcon className='w-4 h-4 mr-2' />
          {application.appliedDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
        </div>
      </div>

      <div className='flex space-x-2'>
        <button
          onClick={() => {
            setSelectedApplication(application);
            setReviewStatus('approved');
            setReviewModalOpen(true);
          }}
          className='flex-1 btn btn-sm bg-green-500 text-white hover:bg-green-600'
        >
          <CheckCircleIcon className='w-4 h-4 mr-1' />
          {language === 'ar' ? 'قبول' : 'Approve'}
        </button>

        <button
          onClick={() => {
            setSelectedApplication(application);
            setReviewStatus('rejected');
            setReviewModalOpen(true);
          }}
          className='flex-1 btn btn-sm bg-red-500 text-white hover:bg-red-600'
        >
          <XCircleIcon className='w-4 h-4 mr-1' />
          {language === 'ar' ? 'رفض' : 'Reject'}
        </button>

        <button className='btn btn-sm btn-outline'>
          <EyeIcon className='w-4 h-4' />
        </button>
      </div>
    </motion.div>
  );

  const VendorCard: React.FC<{ vendor: Vendor }> = ({ vendor }) => (
    <motion.div
      className='bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow'
      whileHover={{ scale: 1.01 }}
    >
      <div className='flex items-center mb-3'>
        <div className='w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3'>
          <BuildingStorefrontIcon className='w-6 h-6 text-primary-600' />
        </div>
        <div>
          <h4 className='font-semibold text-neutral-900'>{vendor.businessName}</h4>
          <p className='text-sm text-neutral-600'>{vendor.businessType}</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-3'>
        <div className='text-center'>
          <p className='text-lg font-bold text-neutral-900'>{vendor.totalProducts}</p>
          <p className='text-xs text-neutral-600'>{language === 'ar' ? 'المنتجات' : 'Products'}</p>
        </div>
        <div className='text-center'>
          <p className='text-lg font-bold text-neutral-900'>{vendor.rating.toFixed(1)}</p>
          <p className='text-xs text-neutral-600'>{language === 'ar' ? 'التقييم' : 'Rating'}</p>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {vendor.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : vendor.status}
        </span>

        <button className='btn btn-sm btn-outline'>
          <EyeIcon className='w-4 h-4 mr-1' />
          {language === 'ar' ? 'عرض' : 'View'}
        </button>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <EgyptianLoader
          size='xl'
          text={language === 'ar' ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard...'}
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <div className='bg-white border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-neutral-900'>
                  {language === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
                </h1>
                <p className='text-neutral-600 mt-1'>
                  {language === 'ar' ? 'إدارة المنصة والتجار' : 'Manage platform and vendors'}
                </p>
              </div>

              <div className='text-right'>
                <p className='text-sm text-neutral-600'>
                  {language === 'ar' ? 'مرحباً،' : 'Welcome,'} {user?.displayName}
                </p>
                <p className='text-xs text-neutral-500'>
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='bg-white border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8'>
            {[
              {
                id: 'overview',
                label: language === 'ar' ? 'نظرة عامة' : 'Overview',
                icon: ChartBarIcon,
              },
              {
                id: 'applications',
                label: language === 'ar' ? 'طلبات التجار' : 'Applications',
                icon: DocumentCheckIcon,
              },
              {
                id: 'vendors',
                label: language === 'ar' ? 'التجار' : 'Vendors',
                icon: BuildingStorefrontIcon,
              },
              {
                id: 'analytics',
                label: language === 'ar' ? 'التحليلات' : 'Analytics',
                icon: ChartBarIcon,
              },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                <tab.icon className='w-5 h-5 mr-2' />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-8'
          >
            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <StatCard
                title={language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
                value={stats?.totalUsers || 0}
                icon={<UsersIcon className='w-6 h-6 text-blue-600' />}
                color='bg-blue-100'
                trend={12}
              />

              <StatCard
                title={language === 'ar' ? 'إجمالي التجار' : 'Total Vendors'}
                value={stats?.totalVendors || 0}
                icon={<BuildingStorefrontIcon className='w-6 h-6 text-green-600' />}
                color='bg-green-100'
                trend={8}
              />

              <StatCard
                title={language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
                value={stats?.totalProducts || 0}
                icon={<ShoppingBagIcon className='w-6 h-6 text-purple-600' />}
                color='bg-purple-100'
                trend={15}
              />

              <StatCard
                title={language === 'ar' ? 'الطلبات قيد المراجعة' : 'Pending Applications'}
                value={stats?.pendingApplications || 0}
                icon={<ClockIcon className='w-6 h-6 text-yellow-600' />}
                color='bg-yellow-100'
              />

              <StatCard
                title={language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                value={stats?.totalOrders || 0}
                icon={<ShoppingBagIcon className='w-6 h-6 text-indigo-600' />}
                color='bg-indigo-100'
                trend={22}
              />

              <StatCard
                title={language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
                value={`${stats?.monthlyRevenue?.toLocaleString() || 0} ${language === 'ar' ? 'ج.م' : 'EGP'}`}
                icon={<CurrencyDollarIcon className='w-6 h-6 text-green-600' />}
                color='bg-green-100'
                trend={18}
              />
            </div>

            {/* Recent Applications */}
            {applications.length > 0 && (
              <div>
                <h2 className='text-xl font-bold text-neutral-900 mb-4'>
                  {language === 'ar' ? 'طلبات التجار الحديثة' : 'Recent Applications'}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {applications.slice(0, 3).map(application => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'applications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-6'
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-2xl font-bold text-neutral-900'>
                {language === 'ar' ? 'طلبات التجار' : 'Vendor Applications'}
              </h2>
              <div className='flex items-center space-x-4'>
                <select className='input'>
                  <option value='all'>
                    {language === 'ar' ? 'جميع الطلبات' : 'All Applications'}
                  </option>
                  <option value='pending'>{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</option>
                  <option value='approved'>{language === 'ar' ? 'مقبولة' : 'Approved'}</option>
                  <option value='rejected'>{language === 'ar' ? 'مرفوضة' : 'Rejected'}</option>
                </select>
              </div>
            </div>

            {applications.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {applications.map(application => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <DocumentCheckIcon className='w-16 h-16 text-neutral-400 mx-auto mb-4' />
                <p className='text-neutral-600'>
                  {language === 'ar' ? 'لا توجد طلبات قيد المراجعة' : 'No pending applications'}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'vendors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-6'
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-2xl font-bold text-neutral-900'>
                {language === 'ar' ? 'التجار' : 'Vendors'}
              </h2>
              <div className='flex items-center space-x-4'>
                <input
                  type='search'
                  placeholder={language === 'ar' ? 'البحث في التجار...' : 'Search vendors...'}
                  className='input'
                />
                <select className='input'>
                  <option value='all'>{language === 'ar' ? 'جميع التجار' : 'All Vendors'}</option>
                  <option value='active'>{language === 'ar' ? 'نشط' : 'Active'}</option>
                  <option value='suspended'>{language === 'ar' ? 'معلق' : 'Suspended'}</option>
                </select>
              </div>
            </div>

            {vendors.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {vendors.map(vendor => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <BuildingStorefrontIcon className='w-16 h-16 text-neutral-400 mx-auto mb-4' />
                <p className='text-neutral-600'>
                  {language === 'ar' ? 'لا يوجد تجار' : 'No vendors found'}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-12'
          >
            <ChartBarIcon className='w-16 h-16 text-neutral-400 mx-auto mb-4' />
            <p className='text-neutral-600'>
              {language === 'ar' ? 'قريباً - تحليلات مفصلة' : 'Coming Soon - Detailed Analytics'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedApplication && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <motion.div
            className='bg-white rounded-xl max-w-md w-full mx-4 p-6'
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className='text-lg font-bold text-neutral-900 mb-4'>
              {reviewStatus === 'approved'
                ? language === 'ar'
                  ? 'قبول الطلب'
                  : 'Approve Application'
                : language === 'ar'
                  ? 'رفض الطلب'
                  : 'Reject Application'}
            </h3>

            <div className='mb-4'>
              <p className='text-sm text-neutral-600 mb-2'>
                <strong>{selectedApplication.businessName}</strong>
              </p>
              <p className='text-sm text-neutral-600'>
                {selectedApplication.contactPerson} - {selectedApplication.email}
              </p>
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {language === 'ar' ? 'ملاحظات المراجعة' : 'Review Notes'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={4}
                className='input w-full'
                placeholder={
                  language === 'ar'
                    ? 'أضف ملاحظات حول قرار المراجعة...'
                    : 'Add notes about the review decision...'
                }
              />
            </div>

            <div className='flex space-x-4'>
              <button
                onClick={() => {
                  setReviewModalOpen(false);
                  setSelectedApplication(null);
                  setReviewNotes('');
                }}
                className='flex-1 btn btn-outline'
                disabled={isProcessing}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleReviewApplication}
                disabled={isProcessing}
                className={`flex-1 btn ${
                  reviewStatus === 'approved'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isProcessing ? (
                  <LoadingSpinner size='sm' />
                ) : reviewStatus === 'approved' ? (
                  language === 'ar' ? (
                    'قبول'
                  ) : (
                    'Approve'
                  )
                ) : language === 'ar' ? (
                  'رفض'
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
