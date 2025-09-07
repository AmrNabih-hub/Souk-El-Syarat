import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  CogIcon,
  BeakerIcon,
  EyeIcon,
  ScaleIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { ComprehensiveAnalysisService, ComprehensiveAnalysisReport } from '@/services/comprehensive-analysis.service';

const ComprehensiveAnalysisDashboard: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ComprehensiveAnalysisReport | null>(null);
  const [progress, setProgress] = useState(0);

  const analysisService = ComprehensiveAnalysisService.getInstance();

  const runComprehensiveAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setReport(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8, 90));
    }, 800);

    try {
      const result = await analysisService.runComprehensiveAnalysis();
      setReport(result);
      setProgress(100);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'good':
        return <CheckCircleIcon className="w-6 h-6 text-blue-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Authentication': ShieldCheckIcon,
      'Real-time Features': BoltIcon,
      'API Endpoints': GlobeAltIcon,
      'Database Integration': CpuChipIcon,
      'Frontend Integration': ChartBarIcon,
      'Security Features': ShieldCheckIcon,
      'Performance Optimization': CogIcon,
      'Error Handling': ExclamationTriangleIcon,
      'User Workflows': WrenchScrewdriverIcon,
      'Real-time Synchronization': BoltIcon,
      'Microservices Architecture': CpuChipIcon,
      'AI/ML Features': SparklesIcon,
      'Testing Framework': BeakerIcon,
      'Monitoring & Observability': EyeIcon,
      'Scalability & Reliability': ScaleIcon,
    };
    const Icon = icons[category] || ChartBarIcon;
    return <Icon className="w-6 h-6" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            🔍 Comprehensive Analysis Dashboard
          </h1>
          <p className="text-lg text-neutral-600">
            Deep analysis of all app areas, integrations, and real-time functions
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
              <h2 className="text-2xl font-bold text-neutral-900">Analysis Control Panel</h2>
              <p className="text-neutral-600">Run comprehensive analysis of all app components</p>
            </div>
            <button
              onClick={runComprehensiveAnalysis}
              disabled={isAnalyzing}
              className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                isAnalyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ChartPieIcon className="w-5 h-5" />
                  <span>Start Comprehensive Analysis</span>
                </div>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Analysis Progress</span>
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
            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center">
                <h3 className="text-3xl font-bold text-neutral-900 mb-4">Overall Analysis Score</h3>
                <div className="flex items-center justify-center space-x-4 mb-6">
                  {getStatusIcon(report.overallStatus)}
                  <span className={`text-6xl font-bold ${getScoreColor(report.overallScore)}`}>
                    {report.overallScore.toFixed(1)}
                  </span>
                  <span className="text-2xl text-neutral-600">/ 100</span>
                </div>
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                  report.overallStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                  report.overallStatus === 'good' ? 'bg-blue-100 text-blue-800' :
                  report.overallStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {report.overallStatus.toUpperCase()}
                </div>
              </div>
            </motion.div>

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
                  <span className="text-3xl font-bold text-green-600">{report.summary.excellentCategories}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Excellent</h3>
                <p className="text-neutral-600">Categories performing excellently</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600">{report.summary.goodCategories}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Good</h3>
                <p className="text-neutral-600">Categories performing well</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                  <span className="text-3xl font-bold text-yellow-600">{report.summary.warningCategories}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Warning</h3>
                <p className="text-neutral-600">Categories needing attention</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <span className="text-3xl font-bold text-red-600">{report.summary.criticalCategories}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Critical</h3>
                <p className="text-neutral-600">Categories requiring immediate action</p>
              </div>
            </motion.div>

            {/* Category Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Category Analysis</h3>
              <div className="space-y-4">
                {report.categories.map((category, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${getStatusColor(category.status)}`}>
                          {getCategoryIcon(category.category)}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-neutral-900">{category.category}</h4>
                          <p className="text-neutral-600">Detailed analysis results</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`text-3xl font-bold ${getScoreColor(category.score)}`}>
                          {category.score.toFixed(1)}
                        </span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(category.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            category.status === 'excellent' ? 'bg-green-100 text-green-800' :
                            category.status === 'good' ? 'bg-blue-100 text-blue-800' :
                            category.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {category.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getStatusColor(category.status)}`}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Issues */}
                    {category.issues.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-red-700 mb-2">Issues Found:</h5>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {category.issues.map((issue, issueIndex) => (
                            <li key={issueIndex}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {category.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-blue-700 mb-2">Recommendations:</h5>
                        <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                          {category.recommendations.map((recommendation, recIndex) => (
                            <li key={recIndex}>{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Details */}
                    <div className="mt-4">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-neutral-700 hover:text-neutral-900">
                          View Technical Details
                        </summary>
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                          <pre className="text-xs text-neutral-600 overflow-x-auto">
                            {JSON.stringify(category.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Critical Issues */}
            {report.criticalIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6"
              >
                <h3 className="text-2xl font-bold text-red-900 mb-4">Critical Issues</h3>
                <ul className="space-y-2">
                  {report.criticalIssues.map((issue, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <XCircleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-800">{issue}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
            >
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Key Recommendations</h3>
              <ul className="space-y-2">
                {report.recommendations.slice(0, 10).map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-6"
            >
              <h3 className="text-2xl font-bold text-green-900 mb-4">Next Steps</h3>
              <ul className="space-y-2">
                {report.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <ClockIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-green-800">{step}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveAnalysisDashboard;