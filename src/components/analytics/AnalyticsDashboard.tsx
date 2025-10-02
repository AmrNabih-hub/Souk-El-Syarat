/**
 * Enhanced Analytics Dashboard Component
 * Real-time business intelligence and metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { useAppStore } from '@/stores/appStore';
import { logger } from '@/utils/logger';

interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AnalyticsDashboardProps {
  userId: string;
  role: 'admin' | 'vendor';
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  role,
  timeRange = '30d',
}) => {
  const { language } = useAppStore();
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      logger.info('Loading analytics', { userId, timeRange }, 'ANALYTICS');

      // Mock data - In production, fetch from AWS AppSync/CloudWatch
      const mockMetrics: AnalyticsMetric[] = [
        {
          label: language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales',
          value: 125000,
          change: 12.5,
          changeType: 'increase',
          icon: CurrencyDollarIcon,
          color: '#22c55e',
        },
        {
          label: language === 'ar' ? 'الطلبات' : 'Orders',
          value: 48,
          change: 8.3,
          changeType: 'increase',
          icon: ShoppingBagIcon,
          color: '#3b82f6',
        },
        {
          label: language === 'ar' ? 'العملاء' : 'Customers',
          value: 156,
          change: -2.1,
          changeType: 'decrease',
          icon: UsersIcon,
          color: '#f59e0b',
        },
        {
          label: language === 'ar' ? 'متوسط الطلب' : 'Avg. Order',
          value: 2604,
          change: 5.2,
          changeType: 'increase',
          icon: ChartBarIcon,
          color: '#8b5cf6',
        },
      ];

      const mockSalesData = [
        { date: 'Mon', sales: 12000, orders: 8 },
        { date: 'Tue', sales: 18000, orders: 12 },
        { date: 'Wed', sales: 15000, orders: 10 },
        { date: 'Thu', sales: 22000, orders: 15 },
        { date: 'Fri', sales: 28000, orders: 18 },
        { date: 'Sat', sales: 25000, orders: 16 },
        { date: 'Sun', sales: 20000, orders: 13 },
      ];

      const mockCategoryData = [
        { name: language === 'ar' ? 'سيارات' : 'Cars', value: 45 },
        { name: language === 'ar' ? 'قطع غيار' : 'Parts', value: 30 },
        { name: language === 'ar' ? 'إكسسوارات' : 'Accessories', value: 15 },
        { name: language === 'ar' ? 'خدمات' : 'Services', value: 10 },
      ];

      setMetrics(mockMetrics);
      setSalesData(mockSalesData);
      setCategoryData(mockCategoryData);
    } catch (error) {
      logger.error('Failed to load analytics', error, 'ANALYTICS');
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon className="w-6 h-6" />
              </div>
              
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.changeType === 'increase' ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span>{Math.abs(metric.change)}%</span>
              </div>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              {metric.label}
            </p>
            
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {metric.label.includes('Sales') || metric.label.includes('مبيعات')
                ? new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
                    style: 'currency',
                    currency: 'EGP',
                    minimumFractionDigits: 0,
                  }).format(metric.value)
                : metric.value.toLocaleString()
              }
            </p>
          </motion.div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          {language === 'ar' ? 'المبيعات خلال الأسبوع' : 'Sales This Week'}
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#f59e0b"
              strokeWidth={3}
              name={language === 'ar' ? 'المبيعات' : 'Sales'}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={3}
              name={language === 'ar' ? 'الطلبات' : 'Orders'}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            {language === 'ar' ? 'توزيع الفئات' : 'Category Distribution'}
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Day */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            {language === 'ar' ? 'الإيرادات اليومية' : 'Daily Revenue'}
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar
                dataKey="sales"
                fill="#f59e0b"
                radius={[8, 8, 0, 0]}
                name={language === 'ar' ? 'المبيعات' : 'Sales'}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center gap-2">
        {['7d', '30d', '90d', '1y'].map((range) => (
          <button
            key={range}
            onClick={() => {/* Update time range */}}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeRange === range
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            }`}
          >
            {range === '7d' && (language === 'ar' ? '7 أيام' : '7 Days')}
            {range === '30d' && (language === 'ar' ? '30 يوم' : '30 Days')}
            {range === '90d' && (language === 'ar' ? '90 يوم' : '90 Days')}
            {range === '1y' && (language === 'ar' ? 'سنة' : '1 Year')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
