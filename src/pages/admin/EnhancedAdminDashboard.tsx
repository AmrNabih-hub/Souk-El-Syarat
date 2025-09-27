import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  EyeIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  ServerIcon,
  CircleStackIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

import { AdminStats, VendorApplication, Vendor, AdminAnalytics } from '@/types';
import { AdminService } from '@/services/admin.service';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

const EnhancedAdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Real-time subscriptions
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const unsubscribeStats = AdminService.subscribeToAnalytics(analyticsData => {
      // Map model shape to app shape
      const mapped = {
        totalUsers: analyticsData?.totalUsers || 0,
        totalVendors: analyticsData?.totalVendors || 0,
        totalProducts: analyticsData?.totalProducts || 0,
        totalOrders: analyticsData?.totalOrders || 0,
        totalRevenue: analyticsData?.totalRevenue || 0,
        pendingVendorApplications: analyticsData?.pendingVendorApplications || 0,
        platformGrowth: analyticsData?.platformGrowth || { usersGrowth: 0, vendorsGrowth: 0, ordersGrowth: 0, revenueGrowth: 0 },
        topCategories: analyticsData?.topCategories || [],
        userActivity: analyticsData?.userActivity || [],
      };
      setAnalytics(mapped);
    });

    const unsubscribeApplications = AdminService.subscribeToApplications('all', apps => {
      const mapped = (apps || []).map((a: any) => ({
        ...a,
        appliedDate: a.appliedDate ? new Date(a.appliedDate) : new Date(),
        reviewedDate: a.reviewedAt ? new Date(a.reviewedAt) : null,
        reviewNotes: a.adminNotes || null,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      }));
      setApplications(mapped);
    });

    const unsubscribeVendors = AdminService.subscribeToVendors('all', vendorsData => {
      const mapped = (vendorsData || []).map((v: any) => ({
        ...v,
        userId: v.userId || '',
        totalReviews: v.totalReviews || 0,
        lastActive: v.lastUpdated ? new Date(v.lastUpdated) : new Date(),
        isVerified: !!v.approvedAt,
        createdAt: v.joinedDate ? new Date(v.joinedDate) : new Date(),
        updatedAt: v.lastUpdated ? new Date(v.lastUpdated) : new Date(),
      }));
      setVendors(mapped);
    });

    return () => {
      unsubscribeStats();
      unsubscribeApplications();
      unsubscribeVendors();
    };
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const adminStats = await AdminService.getAdminStats();
      setStats(adminStats);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error loading dashboard data:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewApplication = async () => {
    if (!selectedApplication || !user) return;

    try {
      setIsProcessing(true);

      await AdminService.processVendorApplication(
        selectedApplication.id,
        user.id,
        reviewStatus,
        reviewNotes
      );

      toast.success(
        language === 'ar'
          ? `تم ${reviewStatus === 'approved' ? 'الموافقة على' : 'رفض'} طلب البائع بنجاح`
          : `Vendor application ${reviewStatus} successfully`
      );

      setReviewModalOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
    } catch (error) {
      toast.error(error.message || 'Failed to process application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVendorStatusToggle = async (vendorId: string, currentStatus: string) => {
    if (!user) return;

    try {
      const newStatus: 'active' | 'inactive' | 'suspended' =
        currentStatus === 'active' ? 'suspended' : 'active';
      await AdminService.toggleVendorStatus(vendorId, user.id, newStatus);

      toast.success(
        language === 'ar'
          ? `تم ${newStatus === 'active' ? 'إعادة تفعيل' : 'تعليق'} حساب البائع`
          : `Vendor account ${newStatus === 'active' ? 'reactivated' : 'suspended'}`
      );
    } catch (error) {
      toast.error(error.message || 'Failed to update vendor status');
    }
  };

  const handleToggleVendorStatus = async (vendorId: string) => {
    if (!user) return;
    try {
      await AdminService.toggleVendorStatus(vendorId, user.id, 'suspended');
      toast.success('Vendor status updated successfully');
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleViewVendorDetails = (vendor: Vendor) => {
    // TODO: Implement vendor details modal
    console.log('View vendor details:', vendor);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!user) return;
    try {
      await AdminService.deleteVendor(vendorId, user.id);
      toast.success('Vendor deleted successfully');
    } catch (error) {
      toast.error('Failed to delete vendor');
    }
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    toast.success('Data export started');
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (searchQuery && !app.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const filteredVendors = vendors.filter(vendor => {
    if (filterStatus !== 'all' && vendor.status !== filterStatus) return false;
    if (searchQuery && !vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const dashboardTabs: DashboardTab[] = [
    {
      id: 'overview',
      label: language === 'ar' ? 'نظرة عامة' : 'Overview',
      icon: ChartBarIcon,
      component: OverviewTab,
    },
    {
      id: 'applications',
      label: language === 'ar' ? 'طلبات البائعين' : 'Vendor Applications',
      icon: DocumentCheckIcon,
      component: ApplicationsTab,
    },
    {
      id: 'vendors',
      label: language === 'ar' ? 'البائعون' : 'Vendors',
      icon: BuildingStorefrontIcon,
      component: VendorsTab,
    },
    {
      id: 'analytics',
      label: language === 'ar' ? 'التحليلات' : 'Analytics',
      icon: ArrowTrendingUpIcon,
      component: AnalyticsTab,
    },
    {
      id: 'system',
      label: language === 'ar' ? 'النظام' : 'System',
      icon: CogIcon,
      component: SystemTab,
    },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <ShieldCheckIcon className='mx-auto h-12 w-12 text-red-500' />
          <h2 className='mt-4 text-xl font-semibold text-gray-900'>
            {language === 'ar' ? 'الوصول مرفوض' : 'Access Denied'}
          </h2>
          <p className='mt-2 text-gray-600'>
            {language === 'ar'
              ? 'يجب أن تكون مسؤولاً للوصول إلى هذه الصفحة'
              : 'You must be an admin to access this page'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const ActiveTabComponent =
    dashboardTabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                {language === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                {language === 'ar'
                  ? 'إدارة المنصة والمراقبة'
                  : 'Platform management and monitoring'}
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <ServerIcon className='h-5 w-5' />
                <span>System Status: Online</span>
              </div>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <CircleStackIcon className='h-5 w-5' />
                <span>DB: Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8'>
            {dashboardTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className='inline-block h-5 w-5 mr-2' />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <ActiveTabComponent
          stats={stats}
          applications={filteredApplications}
          vendors={filteredVendors}
          analytics={analytics}
          onReviewApplication={app => {
            setSelectedApplication(app);
            setReviewModalOpen(true);
          }}
          onVendorStatusToggle={handleVendorStatusToggle}
          onToggleVendorStatus={handleToggleVendorStatus}
          onViewVendorDetails={handleViewVendorDetails}
          onDeleteVendor={handleDeleteVendor}
          onExportData={handleExportData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          language={language}
        />
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='bg-white rounded-lg p-6 max-w-md w-full mx-4'
            >
              <h3 className='text-lg font-semibold mb-4'>
                {language === 'ar' ? 'مراجعة طلب البائع' : 'Review Vendor Application'}
              </h3>

              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value as 'approved' | 'rejected')}
                  className='w-full border border-gray-300 rounded-md px-3 py-2'
                >
                  <option value='approved'>{language === 'ar' ? 'موافقة' : 'Approve'}</option>
                  <option value='rejected'>{language === 'ar' ? 'رفض' : 'Reject'}</option>
                </select>
              </div>

              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  className='w-full border border-gray-300 rounded-md px-3 py-2'
                  placeholder={language === 'ar' ? 'أضف ملاحظاتك هنا...' : 'Add your notes here...'}
                />
              </div>

              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleReviewApplication}
                  disabled={isProcessing}
                  className={`px-4 py-2 text-white rounded-md ${
                    reviewStatus === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {isProcessing ? (
                    <LoadingSpinner size='sm' />
                  ) : language === 'ar' ? (
                    'تأكيد'
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Tab Components
interface OverviewTabProps {
  stats: AdminStats | null;
  analytics: AdminAnalytics | null;
  applications: VendorApplication[];
  vendors: Vendor[];
  onReviewApplication: (app: VendorApplication) => void;
  onToggleVendorStatus: (vendorId: string) => void;
  onVendorStatusToggle: (vendorId: string, currentStatus: string) => void;
  onViewVendorDetails: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  onExportData: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  language: 'ar' | 'en';
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, language }) => {
  if (!stats) return null;

  const platformHealthColor =
    stats.platformHealth.uptime >= 99
      ? 'text-green-600'
      : stats.platformHealth.uptime >= 95
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className='space-y-6'>
      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatsCard
          title={language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
          value={stats.totalUsers.toLocaleString()}
          icon={UsersIcon}
          trend='+12%'
          trendDirection='up'
          color='blue'
        />
        <StatsCard
          title={language === 'ar' ? 'إجمالي البائعين' : 'Total Vendors'}
          value={stats.totalVendors.toLocaleString()}
          icon={BuildingStorefrontIcon}
          trend='+8%'
          trendDirection='up'
          color='green'
        />
        <StatsCard
          title={language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
          value={stats.totalProducts.toLocaleString()}
          icon={ShoppingBagIcon}
          trend='+15%'
          trendDirection='up'
          color='purple'
        />
        <StatsCard
          title={language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          trend='+22%'
          trendDirection='up'
          color='yellow'
        />
      </div>

      {/* Platform Health */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          {language === 'ar' ? 'صحة المنصة' : 'Platform Health'}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className={`text-3xl font-bold ${platformHealthColor}`}>
              {stats.platformHealth.uptime}%
            </div>
            <div className='text-sm text-gray-600'>
              {language === 'ar' ? 'وقت التشغيل' : 'Uptime'}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-600'>
              {stats.platformHealth.responseTime}ms
            </div>
            <div className='text-sm text-gray-600'>
              {language === 'ar' ? 'وقت الاستجابة' : 'Response Time'}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-600'>
              {stats.platformHealth.errorRate}%
            </div>
            <div className='text-sm text-gray-600'>
              {language === 'ar' ? 'معدل الأخطاء' : 'Error Rate'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
        </h3>
        <div className='space-y-4'>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <UsersIcon className='h-5 w-5 text-blue-500' />
              <span className='text-sm'>
                {language === 'ar' ? 'مستخدم جديد انضم' : 'New user joined'}
              </span>
            </div>
            <span className='text-xs text-gray-500'>2 min ago</span>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <BuildingStorefrontIcon className='h-5 w-5 text-green-500' />
              <span className='text-sm'>
                {language === 'ar' ? 'طلب بائع جديد' : 'New vendor application'}
              </span>
            </div>
            <span className='text-xs text-gray-500'>5 min ago</span>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <ShoppingBagIcon className='h-5 w-5 text-purple-500' />
              <span className='text-sm'>
                {language === 'ar' ? 'منتج جديد تم إضافته' : 'New product added'}
              </span>
            </div>
            <span className='text-xs text-gray-500'>10 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationsTab: React.FC<any> = ({
  applications,
  onReviewApplication,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  language,
}) => {
  return (
    <div className='space-y-6'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <input
          type='text'
          placeholder={
            language === 'ar' ? 'البحث في طلبات البائعين...' : 'Search vendor applications...'
          }
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='flex-1 border border-gray-300 rounded-md px-3 py-2'
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className='border border-gray-300 rounded-md px-3 py-2'
        >
          <option value='all'>{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value='pending'>{language === 'ar' ? 'في الانتظار' : 'Pending'}</option>
          <option value='approved'>{language === 'ar' ? 'تمت الموافقة' : 'Approved'}</option>
          <option value='rejected'>{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
        </select>
      </div>

      {/* Applications List */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold'>
            {language === 'ar' ? 'طلبات البائعين' : 'Vendor Applications'}
          </h3>
        </div>
        <div className='divide-y divide-gray-200'>
          {applications.map(application => (
            <div key={application.id} className='p-6 hover:bg-gray-50'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <h4 className='text-lg font-medium text-gray-900'>{application.businessName}</h4>
                  <p className='text-sm text-gray-600 mt-1'>
                    {application.contactPerson} • {application.email}
                  </p>
                  <p className='text-sm text-gray-500 mt-1'>
                    {application.businessType} • {application.experience}
                  </p>
                  <div className='mt-2'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {application.status === 'pending'
                        ? language === 'ar'
                          ? 'في الانتظار'
                          : 'Pending'
                        : application.status === 'approved'
                          ? language === 'ar'
                            ? 'تمت الموافقة'
                            : 'Approved'
                          : language === 'ar'
                            ? 'مرفوض'
                            : 'Rejected'}
                    </span>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  {application.status === 'pending' && (
                    <button
                      onClick={() => onReviewApplication(application)}
                      className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                    >
                      <EyeIcon className='h-4 w-4 mr-2' />
                      {language === 'ar' ? 'مراجعة' : 'Review'}
                    </button>
                  )}
                  <span className='text-sm text-gray-500'>
                    {application.appliedDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VendorsTab: React.FC<any> = ({
  vendors,
  onVendorStatusToggle,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  language,
}) => {
  return (
    <div className='space-y-6'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <input
          type='text'
          placeholder={language === 'ar' ? 'البحث في البائعين...' : 'Search vendors...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='flex-1 border border-gray-300 rounded-md px-3 py-2'
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className='border border-gray-300 rounded-md px-3 py-2'
        >
          <option value='all'>{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value='active'>{language === 'ar' ? 'نشط' : 'Active'}</option>
          <option value='pending'>{language === 'ar' ? 'في الانتظار' : 'Pending'}</option>
          <option value='suspended'>{language === 'ar' ? 'معلق' : 'Suspended'}</option>
        </select>
      </div>

      {/* Vendors List */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold'>{language === 'ar' ? 'البائعون' : 'Vendors'}</h3>
        </div>
        <div className='divide-y divide-gray-200'>
          {vendors.map(vendor => (
            <div key={vendor.id} className='p-6 hover:bg-gray-50'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <h4 className='text-lg font-medium text-gray-900'>{vendor.businessName}</h4>
                  <p className='text-sm text-gray-600 mt-1'>
                    {vendor.contactPerson} • {vendor.email}
                  </p>
                  <p className='text-sm text-gray-500 mt-1'>
                    {vendor.businessType} • {vendor.specializations.join(', ')}
                  </p>
                  <div className='mt-2 flex items-center space-x-4'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vendor.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : vendor.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vendor.status === 'active'
                        ? language === 'ar'
                          ? 'نشط'
                          : 'Active'
                        : vendor.status === 'pending'
                          ? language === 'ar'
                            ? 'في الانتظار'
                            : 'Pending'
                          : language === 'ar'
                            ? 'معلق'
                            : 'Suspended'}
                    </span>
                    <span className='text-sm text-gray-500'>
                      {language === 'ar' ? 'التقييم:' : 'Rating:'} {vendor.rating}/5
                    </span>
                    <span className='text-sm text-gray-500'>
                      {language === 'ar' ? 'المنتجات:' : 'Products:'} {vendor.totalProducts}
                    </span>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <button
                    onClick={() => onVendorStatusToggle(vendor.id, vendor.status)}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                      vendor.status === 'active'
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-white bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {vendor.status === 'active'
                      ? language === 'ar'
                        ? 'تعليق'
                        : 'Suspend'
                      : language === 'ar'
                        ? 'إعادة تفعيل'
                        : 'Reactivate'}
                  </button>
                  <span className='text-sm text-gray-500'>
                    {vendor.joinedDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AnalyticsTabProps {
  analytics: AdminAnalytics | null;
  language: string;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics, language }) => {
  if (!analytics) return null;

  // Mock data for charts - in real app this would come from analytics service
  const revenueData = [
    { month: 'Jan', revenue: 4000, orders: 24 },
    { month: 'Feb', revenue: 3000, orders: 13 },
    { month: 'Mar', revenue: 2000, orders: 18 },
    { month: 'Apr', revenue: 2780, orders: 39 },
    { month: 'May', revenue: 1890, orders: 48 },
    { month: 'Jun', revenue: 2390, orders: 38 },
  ];

  const categoryData = [
    { name: 'Cars', value: 400, color: '#0088FE' },
    { name: 'Parts', value: 300, color: '#00C49F' },
    { name: 'Services', value: 300, color: '#FFBB28' },
    { name: 'Accessories', value: 200, color: '#FF8042' },
  ];

  return (
    <div className='space-y-6'>
      {/* Revenue Chart */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          {language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
        </h3>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='month' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='revenue' stroke='#8884d8' strokeWidth={2} />
            <Line type='monotone' dataKey='orders' stroke='#82ca9d' strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Distribution */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>
            {language === 'ar' ? 'توزيع الفئات' : 'Category Distribution'}
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={(data: any) => `${data.name} ${(data.percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>
            {language === 'ar' ? 'نمو المنصة' : 'Platform Growth'}
          </h3>
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium'>
                {language === 'ar' ? 'نمو المستخدمين' : 'Users Growth'}
              </span>
              <span className='text-lg font-bold text-green-600'>
                +{analytics.platformGrowth.usersGrowth}%
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium'>
                {language === 'ar' ? 'نمو البائعين' : 'Vendors Growth'}
              </span>
              <span className='text-lg font-bold text-blue-600'>
                +{analytics.platformGrowth.vendorsGrowth}%
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium'>
                {language === 'ar' ? 'نمو الطلبات' : 'Orders Growth'}
              </span>
              <span className='text-lg font-bold text-purple-600'>
                +{analytics.platformGrowth.ordersGrowth}%
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium'>
                {language === 'ar' ? 'نمو الإيرادات' : 'Revenue Growth'}
              </span>
              <span className='text-lg font-bold text-yellow-600'>
                +{analytics.platformGrowth.revenueGrowth}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemTab: React.FC<any> = ({ language }) => {
  return (
    <div className='space-y-6'>
      {/* System Status */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          {language === 'ar' ? 'حالة النظام' : 'System Status'}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='text-center p-4 bg-green-50 rounded-lg'>
            <ServerIcon className='h-8 w-8 text-green-600 mx-auto mb-2' />
            <div className='text-sm font-medium text-green-800'>
              {language === 'ar' ? 'الخادم' : 'Server'}
            </div>
            <div className='text-lg font-bold text-green-600'>Online</div>
          </div>
          <div className='text-center p-4 bg-blue-50 rounded-lg'>
            <CircleStackIcon className='h-8 w-8 text-blue-600 mx-auto mb-2' />
            <div className='text-sm font-medium text-blue-800'>
              {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
            </div>
            <div className='text-lg font-bold text-blue-600'>Connected</div>
          </div>
          <div className='text-center p-4 bg-purple-50 rounded-lg'>
            <CloudIcon className='h-8 w-8 text-purple-600 mx-auto mb-2' />
            <div className='text-sm font-medium text-purple-800'>
              {language === 'ar' ? 'التخزين' : 'Storage'}
            </div>
            <div className='text-lg font-bold text-purple-600'>Active</div>
          </div>
          <div className='text-center p-4 bg-yellow-50 rounded-lg'>
            <GlobeAltIcon className='h-8 w-8 text-yellow-600 mx-auto mb-2' />
            <div className='text-sm font-medium text-yellow-800'>
              {language === 'ar' ? 'CDN' : 'CDN'}
            </div>
            <div className='text-lg font-bold text-yellow-600'>Optimal</div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          {language === 'ar' ? 'سجلات النظام' : 'System Logs'}
        </h3>
        <div className='space-y-3'>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <CheckCircleIcon className='h-5 w-5 text-green-500' />
              <span className='text-sm'>
                {language === 'ar'
                  ? 'تم تحديث قاعدة البيانات بنجاح'
                  : 'Database updated successfully'}
              </span>
            </div>
            <span className='text-xs text-gray-500'>2 min ago</span>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <CheckCircleIcon className='h-5 w-5 text-green-500' />
              <span className='text-sm'>
                {language === 'ar' ? 'تم إرسال الإشعارات' : 'Notifications sent'}
              </span>
            </div>
            <span className='text-xs text-gray-500'>5 min ago</span>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <ExclamationTriangleIcon className='h-5 w-5 text-yellow-500' />
              <span className='text-sm'>
                {language === 'ar' ? 'تحذير: استخدام عالي للذاكرة' : 'Warning: High memory usage'}
              </span>
            </div>
            <span className='text-xs text-gray-500'>10 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatsCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  trend: string;
  trendDirection: 'up' | 'down';
  color: string;
}> = ({ title, value, icon: Icon, trend, trendDirection, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} className='bg-white rounded-lg shadow p-6'>
      <div className='flex items-center'>
        <div
          className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} bg-opacity-10`}
        >
          <Icon className={`h-6 w-6 ${colorClasses[color as keyof typeof colorClasses]}`} />
        </div>
        <div className='ml-4 flex-1'>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-semibold text-gray-900'>{value}</p>
        </div>
        <div
          className={`flex items-center text-sm ${
            trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trendDirection === 'up' ? (
            <ArrowTrendingUpIcon className='h-4 w-4 mr-1' />
          ) : (
            <ArrowTrendingDownIcon className='h-4 w-4 mr-1' />
          )}
          {trend}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedAdminDashboard;
