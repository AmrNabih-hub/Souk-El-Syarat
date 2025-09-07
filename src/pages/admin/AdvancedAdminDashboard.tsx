/**
 * Advanced Admin Dashboard
 * Enterprise-level admin features with real-time monitoring and analytics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ShieldCheckIcon,
  EyeIcon,
  DocumentTextIcon,
  ServerIcon,
  GlobeAltIcon,
  BellIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import AnalyticsService from '@/services/analytics.service';
import ErrorHandlingService from '@/services/error-handling.service';
import RealTimeOrderService from '@/services/realtime-order.service';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  errorRate: number;
  systemUptime: number;
  averageResponseTime: number;
  securityAlerts: number;
}

interface RealTimeData {
  activeUsers: number;
  currentPageViews: number;
  topPages: Array<{ page: string; views: number }>;
  recentErrors: Array<{ message: string; timestamp: Date; level: string }>;
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    functions: 'healthy' | 'warning' | 'error';
  };
}

const AdvancedAdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    errorRate: 0,
    systemUptime: 100,
    averageResponseTime: 0,
    securityAlerts: 0,
  });
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    activeUsers: 0,
    currentPageViews: 0,
    topPages: [],
    recentErrors: [],
    systemHealth: {
      database: 'healthy',
      api: 'healthy',
      storage: 'healthy',
      functions: 'healthy',
    },
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'errors' | 'security' | 'system'>('overview');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
      initializeServices();
    }
  }, [user?.id, selectedTimeRange]);

  const initializeServices = async () => {
    try {
      // Initialize analytics service
      const analyticsService = AnalyticsService.getInstance();
      await analyticsService.initialize(user?.id);

      // Initialize error handling service
      const errorService = ErrorHandlingService.getInstance();
      await errorService.initialize(user?.id);

      // Initialize real-time order service
      const orderService = RealTimeOrderService.getInstance();
      await orderService.initialize();

      // Subscribe to real-time analytics
      analyticsService.subscribeToRealTimeAnalytics((analytics) => {
        setRealTimeData(prev => ({
          ...prev,
          activeUsers: analytics.activeUsers,
          currentPageViews: analytics.currentPageViews,
          topPages: analytics.topPages,
        }));
      });

    } catch (error) {
      console.error('Error initializing admin services:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);

      // Load analytics metrics
      const analyticsService = AnalyticsService.getInstance();
      const analyticsMetrics = await analyticsService.getAnalyticsMetrics(selectedTimeRange);

      // Load error metrics
      const errorService = ErrorHandlingService.getInstance();
      const errorMetrics = await errorService.getErrorMetrics(selectedTimeRange);

      // Load real-time order stats
      const orderService = RealTimeOrderService.getInstance();
      const orderStats = await orderService.getRealTimeOrderStats();

      // Update metrics
      setMetrics({
        totalUsers: analyticsMetrics.totalUsers,
        activeUsers: analyticsMetrics.activeUsers,
        totalOrders: orderStats.totalOrders,
        totalRevenue: analyticsMetrics.revenue,
        errorRate: errorMetrics.errorRate,
        systemUptime: 100, // This would come from system monitoring
        averageResponseTime: 0, // This would come from performance monitoring
        securityAlerts: 0, // This would come from security monitoring
      });

      // Load recent errors
      const recentErrors = await errorService.getUnresolvedErrors();
      setRealTimeData(prev => ({
        ...prev,
        recentErrors: recentErrors.slice(0, 10).map(error => ({
          message: error.message,
          timestamp: error.timestamp,
          level: error.level,
        })),
      }));

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
    }
  };

  const getHealthStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const tabs = [
    { id: 'overview', name: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: ChartBarIcon },
    { id: 'analytics', name: language === 'ar' ? 'التحليلات' : 'Analytics', icon: TrendingUpIcon },
    { id: 'errors', name: language === 'ar' ? 'الأخطاء' : 'Errors', icon: ExclamationTriangleIcon },
    { id: 'security', name: language === 'ar' ? 'الأمان' : 'Security', icon: ShieldCheckIcon },
    { id: 'system', name: language === 'ar' ? 'النظام' : 'System', icon: ServerIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{language === 'ar' ? 'جاري تحميل لوحة الإدارة...' : 'Loading admin dashboard...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'ar' ? 'لوحة الإدارة المتقدمة' : 'Advanced Admin Dashboard'}
              </h1>
              <p className="mt-2 text-gray-600">
                {language === 'ar' ? 'مراقبة النظام في الوقت الفعلي والتحليلات المتقدمة' : 'Real-time system monitoring and advanced analytics'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hour">{language === 'ar' ? 'آخر ساعة' : 'Last Hour'}</option>
                <option value="day">{language === 'ar' ? 'آخر يوم' : 'Last Day'}</option>
                <option value="week">{language === 'ar' ? 'آخر أسبوع' : 'Last Week'}</option>
                <option value="month">{language === 'ar' ? 'آخر شهر' : 'Last Month'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <ShoppingCartIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {language === 'ar' ? 'معدل الأخطاء' : 'Error Rate'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.errorRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? 'البيانات في الوقت الفعلي' : 'Real-time Data'}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
                    </span>
                    <span className="text-lg font-semibold text-green-600">{realTimeData.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {language === 'ar' ? 'مشاهدات الصفحة الحالية' : 'Current Page Views'}
                    </span>
                    <span className="text-lg font-semibold text-blue-600">{realTimeData.currentPageViews}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? 'صحة النظام' : 'System Health'}
                </h3>
                <div className="space-y-4">
                  {Object.entries(realTimeData.systemHealth).map(([service, status]) => (
                    <div key={service} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{service}</span>
                      <div className="flex items-center space-x-2">
                        {getHealthStatusIcon(status)}
                        <span className={`text-sm font-medium ${getHealthStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Pages */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? 'أكثر الصفحات زيارة' : 'Top Pages'}
              </h3>
              <div className="space-y-3">
                {realTimeData.topPages.slice(0, 5).map((page, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{page.page}</span>
                    <span className="text-sm font-semibold text-gray-900">{page.views}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? 'التحليلات المتقدمة' : 'Advanced Analytics'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' ? 'تحليلات مفصلة ومؤشرات الأداء الرئيسية' : 'Detailed analytics and key performance indicators'}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'errors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? 'الأخطاء الأخيرة' : 'Recent Errors'}
              </h3>
              <div className="space-y-3">
                {realTimeData.recentErrors.map((error, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{error.message}</p>
                      <p className="text-xs text-gray-500">
                        {error.timestamp.toLocaleString()} - {error.level}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? 'مراقبة الأمان' : 'Security Monitoring'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' ? 'مراقبة الأمان والتنبيهات الأمنية' : 'Security monitoring and security alerts'}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? 'مراقبة النظام' : 'System Monitoring'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' ? 'مراقبة أداء النظام والموارد' : 'System performance and resource monitoring'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAdminDashboard;