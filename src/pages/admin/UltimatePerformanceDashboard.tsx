/**
 * Ultimate Performance Dashboard
 * Comprehensive performance monitoring and optimization management
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

// Import services
import UltimatePerformanceAnalysisService from '../../services/ultimate-performance-analysis.service';
import ComprehensiveAPIAuditService from '../../services/comprehensive-api-audit.service';

interface PerformanceData {
  overallScore: number;
  apiPerformance: number;
  databasePerformance: number;
  realtimePerformance: number;
  memoryPerformance: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  metrics: any[];
  recommendations: any;
}

export default function UltimatePerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState<any>(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'apis', label: 'APIs', icon: ServerIcon },
    { id: 'database', label: 'Database', icon: CpuChipIcon },
    { id: 'realtime', label: 'Real-time', icon: BoltIcon },
    { id: 'memory', label: 'Memory', icon: CpuChipIcon },
    { id: 'recommendations', label: 'Recommendations', icon: ArrowTrendingUpIcon }
  ];

  const runPerformanceAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting Ultimate Performance Analysis...');

      const [performanceAnalysis, apiAudit] = await Promise.all([
        UltimatePerformanceAnalysisService.getInstance().conductDeepPerformanceAnalysis(),
        ComprehensiveAPIAuditService.getInstance().conductComprehensiveAPIAudit()
      ]);

      setData({
        overallScore: performanceAnalysis.overallScore,
        apiPerformance: performanceAnalysis.performanceScore,
        databasePerformance: performanceAnalysis.performanceScore,
        realtimePerformance: performanceAnalysis.performanceScore,
        memoryPerformance: performanceAnalysis.performanceScore,
        criticalIssues: performanceAnalysis.criticalIssues,
        highIssues: performanceAnalysis.highIssues,
        mediumIssues: performanceAnalysis.mediumIssues,
        lowIssues: performanceAnalysis.lowIssues,
        metrics: performanceAnalysis.metrics,
        recommendations: performanceAnalysis.recommendations
      });

      console.log('✅ Ultimate Performance Analysis Completed');
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeMonitoring = () => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData({
        timestamp: new Date(),
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        requestsPerSecond: Math.floor(Math.random() * 100) + 50,
        averageResponseTime: Math.floor(Math.random() * 200) + 100,
        errorRate: Math.random() * 0.05,
        memoryUsage: Math.floor(Math.random() * 100) + 200,
        cpuUsage: Math.floor(Math.random() * 30) + 20
      });
    }, 2000);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    const cleanup = startRealTimeMonitoring();
    return cleanup;
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ultimate Performance Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Comprehensive performance monitoring and optimization
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={runPerformanceAnalysis}
                disabled={loading}
                className="btn btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Run Analysis
                  </>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Real-time Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Performance Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(data?.overallScore || 0)}`}>
                      {data?.overallScore || 0}/100
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${getScoreBgColor(data?.overallScore || 0)}`}>
                    <ChartBarIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data?.overallScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Performance</p>
                    <p className={`text-3xl font-bold ${getScoreColor(data?.apiPerformance || 0)}`}>
                      {data?.apiPerformance || 0}/100
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${getScoreBgColor(data?.apiPerformance || 0)}`}>
                    <ServerIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data?.apiPerformance || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Database Performance</p>
                    <p className={`text-3xl font-bold ${getScoreColor(data?.databasePerformance || 0)}`}>
                      {data?.databasePerformance || 0}/100
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${getScoreBgColor(data?.databasePerformance || 0)}`}>
                    <CpuChipIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data?.databasePerformance || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Real-time Performance</p>
                    <p className={`text-3xl font-bold ${getScoreColor(data?.realtimePerformance || 0)}`}>
                      {data?.realtimePerformance || 0}/100
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${getScoreBgColor(data?.realtimePerformance || 0)}`}>
                    <BoltIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data?.realtimePerformance || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Metrics */}
            {realTimeData && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{realTimeData.activeUsers}</p>
                    <p className="text-sm text-gray-600">Active Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{realTimeData.requestsPerSecond}</p>
                    <p className="text-sm text-gray-600">Requests/sec</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{realTimeData.averageResponseTime}ms</p>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{(realTimeData.errorRate * 100).toFixed(2)}%</p>
                    <p className="text-sm text-gray-600">Error Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Issues Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Issues Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{data?.criticalIssues || 0}</p>
                  <p className="text-sm text-gray-600">Critical Issues</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{data?.highIssues || 0}</p>
                  <p className="text-sm text-gray-600">High Priority</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{data?.mediumIssues || 0}</p>
                  <p className="text-sm text-gray-600">Medium Priority</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{data?.lowIssues || 0}</p>
                  <p className="text-sm text-gray-600">Low Priority</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* APIs Tab */}
        {activeTab === 'apis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Performance Analysis</h3>
              <div className="space-y-4">
                {data?.metrics?.filter(m => m.category === 'api').map((metric, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(metric.priority)}`}>
                        {metric.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.currentValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.targetValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gap</p>
                        <p className="text-lg font-semibold text-red-600">
                          {Math.abs(metric.currentValue - metric.targetValue)} {metric.unit}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Bottlenecks:</p>
                      <div className="flex flex-wrap gap-2">
                        {metric.bottlenecks.map((bottleneck, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {bottleneck}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Database Performance Analysis</h3>
              <div className="space-y-4">
                {data?.metrics?.filter(m => m.category === 'database').map((metric, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(metric.priority)}`}>
                        {metric.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.currentValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.targetValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gap</p>
                        <p className="text-lg font-semibold text-red-600">
                          {Math.abs(metric.currentValue - metric.targetValue)} {metric.unit}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Optimizations:</p>
                      <div className="flex flex-wrap gap-2">
                        {metric.optimizations.map((optimization, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {optimization}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Real-time Tab */}
        {activeTab === 'realtime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Performance Analysis</h3>
              <div className="space-y-4">
                {data?.metrics?.filter(m => m.category === 'realtime').map((metric, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(metric.priority)}`}>
                        {metric.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.currentValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.targetValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gap</p>
                        <p className="text-lg font-semibold text-red-600">
                          {Math.abs(metric.currentValue - metric.targetValue)} {metric.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Performance Analysis</h3>
              <div className="space-y-4">
                {data?.metrics?.filter(m => m.category === 'memory').map((metric, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(metric.priority)}`}>
                        {metric.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.currentValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Value</p>
                        <p className="text-lg font-semibold text-gray-900">{metric.targetValue} {metric.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gap</p>
                        <p className="text-lg font-semibold text-red-600">
                          {Math.abs(metric.currentValue - metric.targetValue)} {metric.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && data?.recommendations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Immediate Recommendations</h3>
              <div className="space-y-3">
                {data.recommendations.immediate.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Short-term Recommendations</h3>
              <div className="space-y-3">
                {data.recommendations.shortTerm.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <ClockIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Long-term Recommendations</h3>
              <div className="space-y-3">
                {data.recommendations.longTerm.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}