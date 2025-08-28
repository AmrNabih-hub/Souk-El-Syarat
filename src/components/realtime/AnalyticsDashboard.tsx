/**
 * Real-time Analytics Dashboard Component
 * Displays live analytics and metrics
 */

import React, { useEffect } from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { motion } from 'framer-motion';
import { 
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change >= 0;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className={`flex items-center mt-2 text-sm ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} bg-opacity-10`}>
          <Icon className={`w-8 h-8 ${colorClasses[color as keyof typeof colorClasses]} text-opacity-100`} />
        </div>
      </div>
    </motion.div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const { liveAnalytics, listenToAnalytics } = useRealtimeStore();
  const { language } = useAppStore();

  useEffect(() => {
    listenToAnalytics((analytics) => {
      // Analytics are automatically updated in the store
    });
  }, [listenToAnalytics]);

  // Chart data for real-time traffic
  const trafficData = {
    labels: liveAnalytics?.trafficData?.labels || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [{
      label: language === 'ar' ? 'الزوار' : 'Visitors',
      data: liveAnalytics?.trafficData?.values || [120, 190, 300, 500, 200, 300],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Chart data for sales
  const salesData = {
    labels: liveAnalytics?.salesData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: language === 'ar' ? 'المبيعات' : 'Sales',
      data: liveAnalytics?.salesData?.values || [12000, 19000, 30000, 50000, 20000, 30000],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1
    }]
  };

  // Chart data for device types
  const deviceData = {
    labels: [
      language === 'ar' ? 'سطح المكتب' : 'Desktop',
      language === 'ar' ? 'الهاتف' : 'Mobile',
      language === 'ar' ? 'الجهاز اللوحي' : 'Tablet'
    ],
    datasets: [{
      data: liveAnalytics?.deviceData || [60, 30, 10],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(251, 146, 60, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'لوحة التحليلات المباشرة' : 'Live Analytics Dashboard'}
          </h2>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-green-500 rounded-full"
            />
            <span className="text-sm text-gray-600">
              {language === 'ar' ? 'تحديثات مباشرة' : 'Live Updates'}
            </span>
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
            value={liveAnalytics?.activeUsers || 1234}
            change={12.5}
            icon={UsersIcon}
            color="blue"
          />
          <MetricCard
            title={language === 'ar' ? 'الطلبات الجديدة' : 'New Orders'}
            value={liveAnalytics?.newOrders || 56}
            change={8.2}
            icon={ShoppingCartIcon}
            color="green"
          />
          <MetricCard
            title={language === 'ar' ? 'الإيرادات اليوم' : "Today's Revenue"}
            value={`${liveAnalytics?.revenue || 45678} ${language === 'ar' ? 'ج.م' : 'EGP'}`}
            change={-3.1}
            icon={CurrencyDollarIcon}
            color="purple"
          />
          <MetricCard
            title={language === 'ar' ? 'معدل التحويل' : 'Conversion Rate'}
            value={`${liveAnalytics?.conversionRate || 3.4}%`}
            change={5.7}
            icon={ChartBarIcon}
            color="yellow"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'حركة المرور المباشرة' : 'Live Traffic'}
          </h3>
          <div className="h-64">
            <Line data={trafficData} options={chartOptions} />
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'المبيعات الشهرية' : 'Monthly Sales'}
          </h3>
          <div className="h-64">
            <Bar data={salesData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'توزيع الأجهزة' : 'Device Distribution'}
          </h3>
          <div className="h-48">
            <Doughnut data={deviceData} options={{ ...chartOptions, maintainAspectRatio: true }} />
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'أعلى الدول' : 'Top Countries'}
          </h3>
          <div className="space-y-3">
            {(liveAnalytics?.topCountries || [
              { country: 'Egypt', visitors: 4521, flag: '🇪🇬' },
              { country: 'Saudi Arabia', visitors: 2341, flag: '🇸🇦' },
              { country: 'UAE', visitors: 1876, flag: '🇦🇪' },
              { country: 'Kuwait', visitors: 987, flag: '🇰🇼' }
            ]).map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-2xl">{country.flag}</span>
                  <span className="text-sm font-medium text-gray-900">{country.country}</span>
                </div>
                <span className="text-sm text-gray-600">{country.visitors.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
          </h3>
          <div className="space-y-3">
            {(liveAnalytics?.recentActivity || [
              { action: 'New order', time: '2 min ago', icon: '🛒' },
              { action: 'User registered', time: '5 min ago', icon: '👤' },
              { action: 'Product viewed', time: '7 min ago', icon: '👁️' },
              { action: 'Payment received', time: '10 min ago', icon: '💰' }
            ]).map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-xl">{activity.icon}</span>
                  <span className="text-sm text-gray-900">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'ar' ? 'مقاييس الأداء' : 'Performance Metrics'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">
              {liveAnalytics?.pageLoadTime || '1.2'}s
            </div>
            <p className="text-sm text-gray-600">
              {language === 'ar' ? 'وقت تحميل الصفحة' : 'Page Load Time'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {liveAnalytics?.uptime || '99.9'}%
            </div>
            <p className="text-sm text-gray-600">
              {language === 'ar' ? 'وقت التشغيل' : 'Uptime'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {liveAnalytics?.errorRate || '0.1'}%
            </div>
            <p className="text-sm text-gray-600">
              {language === 'ar' ? 'معدل الأخطاء' : 'Error Rate'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {liveAnalytics?.avgResponseTime || '245'}ms
            </div>
            <p className="text-sm text-gray-600">
              {language === 'ar' ? 'متوسط وقت الاستجابة' : 'Avg Response Time'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;