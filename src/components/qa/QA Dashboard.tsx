/**
 * 🔍 PROFESSIONAL QA DASHBOARD
 * Souk El-Syarat - Comprehensive Quality Assurance Monitoring
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BugAntIcon,
  ShieldCheckIcon,
  EyeIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  RefreshIcon,
} from '@heroicons/react/24/outline';

import { qaMonitoring, QAMetric, QAReport } from '@/services/qa-monitoring.service';
import { automatedTesting, TestReport } from '@/services/automated-testing.service';
import { useAppStore } from '@/stores/appStore';

const QADashboard: React.FC = () => {
  const { language } = useAppStore();
  const [qaReport, setQAReport] = useState<QAReport | null>(null);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'issues' | 'tests' | 'performance'>('overview');

  useEffect(() => {
    // Subscribe to QA updates
    const unsubscribeQA = qaMonitoring.subscribe(setQAReport);
    
    // Subscribe to test updates
    const unsubscribeTests = automatedTesting.subscribe(setTestReport);

    // Get initial reports
    setQAReport(qaMonitoring.getQAReport());
    setTestReport(automatedTesting.generateTestReport());

    return () => {
      unsubscribeQA();
      unsubscribeTests();
    };
  }, []);

  const runAllTests = async () => {
    setIsLoading(true);
    try {
      const report = await automatedTesting.runAllTests();
      setTestReport(report);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'running': return <ClockIcon className="w-5 h-5 text-blue-600" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const tabs = [
    { id: 'overview', label: { ar: 'نظرة عامة', en: 'Overview' }, icon: ChartBarIcon },
    { id: 'issues', label: { ar: 'المشاكل', en: 'Issues' }, icon: BugAntIcon },
    { id: 'tests', label: { ar: 'الاختبارات', en: 'Tests' }, icon: PlayIcon },
    { id: 'performance', label: { ar: 'الأداء', en: 'Performance' }, icon: ShieldCheckIcon },
  ];

  if (!qaReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ar' ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'ar' ? 'لوحة تحكم الجودة' : 'QA Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                {language === 'ar' ? 'مراقبة شاملة لجودة التطبيق' : 'Comprehensive application quality monitoring'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={runAllTests}
                disabled={isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <RefreshIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
                <span>
                  {language === 'ar' ? 'تشغيل الاختبارات' : 'Run Tests'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label[language]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'ar' ? 'المشاكل الحرجة' : 'Critical Issues'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {qaReport.criticalIssues}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BugAntIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'ar' ? 'المشاكل عالية الأولوية' : 'High Priority Issues'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {qaReport.highIssues}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'ar' ? 'المشاكل المحلولة' : 'Resolved Issues'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {qaReport.resolvedIssues}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'ar' ? 'معدل النجاح' : 'Success Rate'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {testReport ? `${testReport.summary.successRate.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'ar' ? 'درجات الجودة' : 'Quality Scores'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{language === 'ar' ? 'الأداء' : 'Performance'}</span>
                        <span>{qaReport.summary.performanceScore.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${qaReport.summary.performanceScore}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{language === 'ar' ? 'إمكانية الوصول' : 'Accessibility'}</span>
                        <span>{qaReport.summary.accessibilityScore.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${qaReport.summary.accessibilityScore}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{language === 'ar' ? 'الأمان' : 'Security'}</span>
                        <span>{qaReport.summary.securityScore.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${qaReport.summary.securityScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'ar' ? 'إحصائيات الاختبارات' : 'Test Statistics'}
                  </h3>
                  {testReport ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {language === 'ar' ? 'إجمالي الاختبارات' : 'Total Tests'}
                        </span>
                        <span className="font-medium">{testReport.totalTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {language === 'ar' ? 'نجح' : 'Passed'}
                        </span>
                        <span className="font-medium text-green-600">{testReport.passedTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {language === 'ar' ? 'فشل' : 'Failed'}
                        </span>
                        <span className="font-medium text-red-600">{testReport.failedTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {language === 'ar' ? 'تخطي' : 'Skipped'}
                        </span>
                        <span className="font-medium text-yellow-600">{testReport.skippedTests}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {language === 'ar' ? 'لا توجد بيانات اختبار' : 'No test data available'}
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'ar' ? 'المشاكل الأخيرة' : 'Recent Issues'}
                  </h3>
                  <div className="space-y-3">
                    {qaReport.metrics.slice(0, 5).map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-3">
                        <div className={`p-1 rounded-full ${getSeverityColor(metric.severity)}`}>
                          <div className="w-2 h-2 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{metric.message}</p>
                          <p className="text-xs text-gray-500">{metric.component}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'issues' && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === 'ar' ? 'جميع المشاكل' : 'All Issues'}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'النوع' : 'Type'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الخطورة' : 'Severity'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'المكون' : 'Component'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الرسالة' : 'Message'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الحالة' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {qaReport.metrics.map((metric) => (
                        <tr key={metric.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(metric.severity)}`}>
                              {metric.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metric.component}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {metric.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {metric.resolved ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-green-800 bg-green-100">
                                {language === 'ar' ? 'محلول' : 'Resolved'}
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-red-800 bg-red-100">
                                {language === 'ar' ? 'غير محلول' : 'Unresolved'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {testReport ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {testReport.suites.map((suite) => (
                    <div key={suite.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{suite.name}</h3>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(suite.status)}
                          <span className="text-sm text-gray-600">{suite.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{suite.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600">{suite.passed}</p>
                          <p className="text-xs text-gray-500">
                            {language === 'ar' ? 'نجح' : 'Passed'}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{suite.failed}</p>
                          <p className="text-xs text-gray-500">
                            {language === 'ar' ? 'فشل' : 'Failed'}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-yellow-600">{suite.skipped}</p>
                          <p className="text-xs text-gray-500">
                            {language === 'ar' ? 'تخطي' : 'Skipped'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PlayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {language === 'ar' ? 'لا توجد اختبارات متاحة' : 'No tests available'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'ar' ? 'مقاييس الأداء' : 'Performance Metrics'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {qaReport.summary.performanceScore.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'درجة الأداء' : 'Performance Score'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {qaReport.summary.accessibilityScore.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'درجة إمكانية الوصول' : 'Accessibility Score'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">
                      {qaReport.summary.securityScore.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'درجة الأمان' : 'Security Score'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {(100 - qaReport.summary.errorRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'معدل الاستقرار' : 'Stability Rate'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QADashboard;
