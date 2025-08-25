/**
 * Futuristic Admin Dashboard - 2025 Edition
 * Advanced data visualizations with modern UI/UX
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  EyeIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { clsx } from 'clsx';

import { useAuthStore } from '@/stores/authStore.v2';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button/Button';
import { ErrorHandler } from '@/lib/errors';

// Mock data for demonstration
const generateMockData = () => ({
  overview: {
    totalUsers: 45678,
    totalVendors: 1234,
    totalProducts: 89012,
    totalRevenue: 12345678,
    growthRate: 23.5,
    activeUsers: 8901,
    conversionRate: 4.2,
    avgOrderValue: 1250,
  },
  revenueData: Array.from({ length: 12 }, (_, i) => ({
    month: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][i],
    revenue: Math.floor(Math.random() * 1000000) + 500000,
    orders: Math.floor(Math.random() * 5000) + 2000,
    users: Math.floor(Math.random() * 10000) + 5000,
  })),
  categoryData: [
    { name: 'سيارات', value: 45, color: '#3B82F6' },
    { name: 'قطع غيار', value: 30, color: '#10B981' },
    { name: 'خدمات', value: 15, color: '#F59E0B' },
    { name: 'إكسسوارات', value: 10, color: '#EF4444' },
  ],
  deviceData: [
    { device: 'Mobile', users: 65, sessions: 125000 },
    { device: 'Desktop', users: 25, sessions: 48000 },
    { device: 'Tablet', users: 10, sessions: 19000 },
  ],
  performanceMetrics: {
    uptime: 99.9,
    avgLoadTime: 1.2,
    errorRate: 0.01,
    apiResponseTime: 245,
  },
  realTimeData: {
    activeUsers: 1247,
    onlineVendors: 89,
    currentOrders: 23,
    serverLoad: 45,
  },
});

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, change, icon: Icon, color, trend = 'neutral' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      {/* Background Gradient */}
      <div className={clsx(
        'absolute inset-0 opacity-5',
        color === 'blue' && 'bg-gradient-to-br from-blue-500 to-blue-600',
        color === 'green' && 'bg-gradient-to-br from-green-500 to-green-600',
        color === 'yellow' && 'bg-gradient-to-br from-yellow-500 to-yellow-600',
        color === 'purple' && 'bg-gradient-to-br from-purple-500 to-purple-600',
        color === 'red' && 'bg-gradient-to-br from-red-500 to-red-600',
      )} />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={clsx(
            'p-3 rounded-xl',
            color === 'blue' && 'bg-blue-100 text-blue-600',
            color === 'green' && 'bg-green-100 text-green-600',
            color === 'yellow' && 'bg-yellow-100 text-yellow-600',
            color === 'purple' && 'bg-purple-100 text-purple-600',
            color === 'red' && 'bg-red-100 text-red-600',
          )}>
            <Icon className="w-6 h-6" />
          </div>
          
          {change !== undefined && (
            <div className={clsx(
              'flex items-center text-sm font-medium',
              trend === 'up' && 'text-green-600',
              trend === 'down' && 'text-red-600',
              trend === 'neutral' && 'text-gray-600',
            )}>
              <TrendingUpIcon className={clsx(
                'w-4 h-4 mr-1',
                trend === 'down' && 'rotate-180'
              )} />
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString('ar-EG') : value}
          </div>
          <div className="text-sm text-gray-600">{title}</div>
        </div>
      </div>
    </motion.div>
  );
};

// Chart Container Component
const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, children, actions, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'bg-white rounded-2xl shadow-lg border border-gray-100 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      <div className="h-80">
        {children}
      </div>
    </motion.div>
  );
};

// Real-time Metrics Component
const RealTimeMetrics: React.FC<{ data: any }> = ({ data }) => {
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setIsLive(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
        <motion.div
          animate={{ x: [0, 100, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl"
        />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">البيانات المباشرة</h3>
          <div className="flex items-center">
            <div className={clsx(
              'w-2 h-2 rounded-full mr-2',
              isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            )} />
            <span className="text-sm opacity-90">مباشر</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-3xl font-bold mb-1">
              {data.activeUsers.toLocaleString('ar-EG')}
            </div>
            <div className="text-sm opacity-90">المستخدمون النشطون</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold mb-1">
              {data.onlineVendors.toLocaleString('ar-EG')}
            </div>
            <div className="text-sm opacity-90">البائعون المتصلون</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold mb-1">
              {data.currentOrders.toLocaleString('ar-EG')}
            </div>
            <div className="text-sm opacity-90">الطلبات الحالية</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold mb-1">
              {data.serverLoad}%
            </div>
            <div className="text-sm opacity-90">حمولة الخادم</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Performance Monitor Component
const PerformanceMonitor: React.FC<{ metrics: any }> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <ShieldCheckIcon className="w-5 h-5 text-green-600" />
          <span className="text-xs text-green-600 font-medium">ممتاز</span>
        </div>
        <div className="text-2xl font-bold text-green-900 mb-1">
          {metrics.uptime}%
        </div>
        <div className="text-sm text-green-700">وقت التشغيل</div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <BoltIcon className="w-5 h-5 text-blue-600" />
          <span className="text-xs text-blue-600 font-medium">سريع</span>
        </div>
        <div className="text-2xl font-bold text-blue-900 mb-1">
          {metrics.avgLoadTime}s
        </div>
        <div className="text-sm text-blue-700">متوسط التحميل</div>
      </div>

      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <div className="flex items-center justify-between mb-2">
          <ClockIcon className="w-5 h-5 text-yellow-600" />
          <span className="text-xs text-yellow-600 font-medium">جيد</span>
        </div>
        <div className="text-2xl font-bold text-yellow-900 mb-1">
          {metrics.apiResponseTime}ms
        </div>
        <div className="text-sm text-yellow-700">استجابة API</div>
      </div>

      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
        <div className="flex items-center justify-between mb-2">
          <EyeIcon className="w-5 h-5 text-red-600" />
          <span className="text-xs text-red-600 font-medium">منخفض</span>
        </div>
        <div className="text-2xl font-bold text-red-900 mb-1">
          {metrics.errorRate}%
        </div>
        <div className="text-sm text-red-700">معدل الأخطاء</div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export const FuturisticAdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState(generateMockData());

  // Generate data based on time range
  useEffect(() => {
    const newData = generateMockData();
    setData(newData);
  }, [timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  لوحة التحكم المتقدمة
                </h1>
                <p className="text-lg text-gray-600">
                  مرحباً {user.displayName}، إليك نظرة شاملة على منصة سوق السيارات
                </p>
              </div>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeRange('7d')}
                  className={timeRange === '7d' ? 'bg-blue-50 border-blue-300' : ''}
                >
                  7 أيام
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeRange('30d')}
                  className={timeRange === '30d' ? 'bg-blue-50 border-blue-300' : ''}
                >
                  30 يوم
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeRange('12m')}
                  className={timeRange === '12m' ? 'bg-blue-50 border-blue-300' : ''}
                >
                  12 شهر
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="إجمالي المستخدمين"
              value={data.overview.totalUsers}
              change={12.5}
              trend="up"
              icon={UsersIcon}
              color="blue"
            />
            <StatCard
              title="إجمالي الإيرادات"
              value={formatCurrency(data.overview.totalRevenue)}
              change={23.1}
              trend="up"
              icon={CurrencyDollarIcon}
              color="green"
            />
            <StatCard
              title="إجمالي المنتجات"
              value={data.overview.totalProducts}
              change={8.3}
              trend="up"
              icon={ShoppingBagIcon}
              color="yellow"
            />
            <StatCard
              title="معدل التحويل"
              value={`${data.overview.conversionRate}%`}
              change={-2.1}
              trend="down"
              icon={ChartBarIcon}
              color="purple"
            />
          </div>

          {/* Real-time Data and Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RealTimeMetrics data={data.realTimeData} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">مراقبة الأداء</h3>
              <PerformanceMonitor metrics={data.performanceMetrics} />
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <ChartContainer title="الإيرادات الشهرية">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `${value / 1000}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Category Distribution */}
            <ChartContainer title="توزيع الفئات">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'النسبة']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Device Analytics and User Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Usage */}
            <ChartContainer title="استخدام الأجهزة">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.deviceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis 
                    dataKey="device" 
                    type="category" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="users" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* User Growth */}
            <ChartContainer title="نمو المستخدمين">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `${value / 1000}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default FuturisticAdminDashboard;