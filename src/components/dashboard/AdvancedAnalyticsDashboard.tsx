/**
 * Advanced Analytics Dashboard
 * Comprehensive business intelligence and real-time analytics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { businessIntelligenceService } from '@/services/business-intelligence.service';
import { performanceMonitoringService } from '@/services/performance-monitoring.service';
import { useAppStore } from '@/stores/appStore';
import clsx from 'clsx';

interface DashboardMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useAppStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load business metrics
      const businessMetrics = await businessIntelligenceService.getBusinessMetrics();
      
      // Load performance data
      const performanceMetrics = performanceMonitoringService.getPerformanceMetrics();
      
      // Transform data for dashboard
      const dashboardMetrics: DashboardMetric[] = [
        {
          title: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
          value: new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            style: 'currency',
            currency: 'EGP'
          }).format(businessMetrics.revenue.total),
          change: businessMetrics.revenue.growth,
          trend: businessMetrics.revenue.growth > 0 ? 'up' : 'down',
          icon: CurrencyDollarIcon,
          color: 'text-green-600',
          description: language === 'ar' ? 'نمو الإيرادات الشهري' : 'Monthly revenue growth'
        },
        {
          title: language === 'ar' ? 'العملاء النشطون' : 'Active Customers',
          value: businessMetrics.customers.active.toLocaleString(),
          change: businessMetrics.customers.new,
          trend: 'up',
          icon: UsersIcon,
          color: 'text-blue-600',
          description: language === 'ar' ? 'عملاء جدد هذا الشهر' : 'New customers this month'
        },
        {
          title: language === 'ar' ? 'الطلبات المكتملة' : 'Completed Orders',
          value: businessMetrics.orders.completed.toLocaleString(),
          change: Number(((businessMetrics.orders.completed / businessMetrics.orders.total) * 100).toFixed(1)),
          trend: 'up',
          icon: CheckCircleIcon,
          color: 'text-emerald-600',
          description: language === 'ar' ? 'معدل إكمال الطلبات' : 'Order completion rate'
        },
        {
          title: language === 'ar' ? 'البائعون النشطون' : 'Active Vendors',
          value: businessMetrics.vendors.active.toLocaleString(),
          change: businessMetrics.vendors.pending,
          trend: 'stable',
          icon: ShoppingCartIcon,
          color: 'text-purple-600',
          description: language === 'ar' ? 'طلبات انتظار الموافقة' : 'Pending approval requests'
        }
      ];
      
      setMetrics(dashboardMetrics);
      
      // Generate chart data
      const revenueChartData: ChartData[] = [
        { name: language === 'ar' ? 'سيارات فاخرة' : 'Luxury Cars', value: 45, color: '#3B82F6' },
        { name: language === 'ar' ? 'سيارات مستعملة' : 'Used Cars', value: 30, color: '#10B981' },
        { name: language === 'ar' ? 'قطع غيار' : 'Parts', value: 15, color: '#F59E0B' },
        { name: language === 'ar' ? 'خدمات' : 'Services', value: 10, color: '#EF4444' }
      ];
      
      setChartData(revenueChartData);
      
      // Generate time series data
      const timeSeries: TimeSeriesData[] = [
        { date: '2024-01', value: 1800000, category: 'revenue' },
        { date: '2024-02', value: 2100000, category: 'revenue' },
        { date: '2024-03', value: 2400000, category: 'revenue' },
        { date: '2024-04', value: 2500000, category: 'revenue' }
      ];
      
      setTimeSeriesData(timeSeries);
      
      // Load insights
      const businessInsights = await businessIntelligenceService.getPredictiveInsights();
      setInsights(businessInsights);
      
      setPerformanceData(performanceMetrics);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {language === 'ar' ? 'لوحة التحكم المتقدمة' : 'Advanced Analytics Dashboard'}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              {language === 'ar' 
                ? 'تحليلات شاملة وذكاء أعمال في الوقت الفعلي'
                : 'Comprehensive analytics and real-time business intelligence'
              }
            </p>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color.replace('text-', 'bg-').replace('-600', '-100')} dark:${metric.color.replace('text-', 'bg-').replace('-600', '-900/30')}`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-neutral-500'
              }`}>
                {metric.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : metric.trend === 'down' ? (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 bg-neutral-400 rounded-full" />
                )}
                {typeof metric.change === 'number' ? `${metric.change > 0 ? '+' : ''}${metric.change}%` : metric.change}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                {metric.value}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {metric.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            {language === 'ar' ? 'توزيع الإيرادات حسب الفئة' : 'Revenue Distribution by Category'}
          </h3>
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        backgroundColor: item.color,
                        width: `${item.value}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white w-12 text-right">
                    {item.value}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            {language === 'ar' ? 'مقاييس الأداء' : 'Performance Metrics'}
          </h3>
          {performanceData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {language === 'ar' ? 'سرعة تحميل الصفحة' : 'Page Load Speed'}
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {performanceData.pageLoad?.average?.toFixed(0)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {language === 'ar' ? 'سرعة استجابة API' : 'API Response Time'}
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {performanceData.api?.average?.toFixed(0)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {language === 'ar' ? 'معدل الأخطاء' : 'Error Rate'}
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {performanceData.errors?.total || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          {language === 'ar' ? 'رؤى الذكاء الاصطناعي' : 'AI Insights & Predictions'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {insight.prediction}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                    {language === 'ar' ? 'الثقة:' : 'Confidence:'} {Math.round(insight.confidence * 100)}%
                  </p>
                  <div className="text-xs text-neutral-500 dark:text-neutral-500">
                    {insight.timeframe}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Real-time Activity */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          {language === 'ar' ? 'النشاط في الوقت الفعلي' : 'Real-time Activity'}
        </h3>
        <div className="space-y-3">
          {[
            { action: language === 'ar' ? 'طلب جديد من العميل أحمد' : 'New order from customer Ahmed', time: '2 minutes ago', type: 'order' },
            { action: language === 'ar' ? 'بائع جديد ينتظر الموافقة' : 'New vendor awaiting approval', time: '5 minutes ago', type: 'vendor' },
            { action: language === 'ar' ? 'دفعة مكتملة بقيمة 15,000 جنيه' : 'Payment completed for 15,000 EGP', time: '8 minutes ago', type: 'payment' },
            { action: language === 'ar' ? 'تسجيل دخول مدير النظام' : 'Admin login detected', time: '12 minutes ago', type: 'security' }
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
            >
              <div className={`p-2 rounded-full ${
                activity.type === 'order' ? 'bg-green-100 text-green-600' :
                activity.type === 'vendor' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {activity.type === 'order' ? <ShoppingCartIcon className="w-4 h-4" /> :
                 activity.type === 'vendor' ? <UsersIcon className="w-4 h-4" /> :
                 activity.type === 'payment' ? <CurrencyDollarIcon className="w-4 h-4" /> :
                 <ExclamationTriangleIcon className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {activity.action}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {activity.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
