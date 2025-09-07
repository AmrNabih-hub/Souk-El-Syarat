import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChartBarIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BoltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ComprehensiveAppSimulationService, ComprehensiveSimulationReport } from '@/services/comprehensive-app-simulation.service';

const ComprehensiveTestingDashboard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ComprehensiveSimulationReport | null>(null);
  const [progress, setProgress] = useState(0);

  const simulationService = ComprehensiveAppSimulationService.getInstance();

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setReport(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 10, 90));
    }, 500);

    try {
      const result = await simulationService.runComprehensiveSimulation();
      setReport(result);
      setProgress(100);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      clearInterval(progressInterval);
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon className="w-5 h-5 text-green-500" />
    ) : (
      <XCircleIcon className="w-5 h-5 text-red-500" />
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      authentication: ShieldCheckIcon,
      realtime: BoltIcon,
      api: GlobeAltIcon,
      database: CpuChipIcon,
      frontend: ChartBarIcon,
    };
    const Icon = icons[category] || ChartBarIcon;
    return <Icon className="w-6 h-6" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      authentication: 'bg-blue-500',
      realtime: 'bg-purple-500',
      api: 'bg-green-500',
      database: 'bg-orange-500',
      frontend: 'bg-pink-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            🧪 Comprehensive App Testing Dashboard
          </h1>
          <p className="text-lg text-neutral-600">
            Deep analysis and simulation of all app areas, integrations, and real-time functions
          </p>
        </div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Test Control Panel</h2>
              <p className="text-neutral-600">Run comprehensive simulations and analysis</p>
            </div>
            <button
              onClick={runComprehensiveTest}
              disabled={isRunning}
              className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isRunning ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Running Tests...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <PlayIcon className="w-5 h-5" />
                  <span>Start Comprehensive Test</span>
                </div>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Test Progress</span>
                <span className="text-sm font-medium text-neutral-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Results */}
        {report && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-green-600">{report.passedTests}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Passed Tests</h3>
                <p className="text-neutral-600">Successfully completed</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <span className="text-3xl font-bold text-red-600">{report.failedTests}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Failed Tests</h3>
                <p className="text-neutral-600">Need attention</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <ChartBarIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600">{report.successRate.toFixed(1)}%</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Success Rate</h3>
                <p className="text-neutral-600">Overall performance</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <ClockIcon className="w-8 h-8 text-purple-600" />
                  </div>
                  <span className="text-3xl font-bold text-purple-600">{(report.totalDuration / 1000).toFixed(1)}s</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Total Duration</h3>
                <p className="text-neutral-600">Test execution time</p>
              </div>
            </motion.div>

            {/* Category Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Category Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.summary).map(([category, stats]) => (
                  <div key={category} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                        {getCategoryIcon(category)}
                      </div>
                      <h4 className="text-lg font-semibold text-neutral-900 capitalize">
                        {category}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Passed:</span>
                        <span className="text-sm font-semibold text-green-600">{stats.passed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-600">Failed:</span>
                        <span className="text-sm font-semibold text-red-600">{stats.failed}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(1)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Detailed Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Detailed Test Results</h3>
              <div className="space-y-4">
                {report.results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-xl p-4 ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.success)}
                        <h4 className="text-lg font-semibold text-neutral-900">{result.testName}</h4>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-neutral-600">{result.duration}ms</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            result.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.success ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                    {result.details && (
                      <div className="mt-2">
                        <pre className="text-sm text-neutral-600 bg-white p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-700">Errors:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {result.errors.map((error, errorIndex) => (
                            <li key={errorIndex}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveTestingDashboard;