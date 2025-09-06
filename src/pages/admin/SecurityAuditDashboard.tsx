import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CpuChipIcon,
  GlobeAltIcon,
  DatabaseIcon,
  KeyIcon,
  LockClosedIcon,
  EyeIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { FirebaseGoogleCloudSecurityAuditService, SecurityAuditReport, SecurityVulnerability } from '@/services/firebase-google-cloud-security-audit.service';

const SecurityAuditDashboard: React.FC = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [progress, setProgress] = useState(0);

  const securityAuditService = FirebaseGoogleCloudSecurityAuditService.getInstance();

  const runSecurityAudit = async () => {
    setIsAuditing(true);
    setProgress(0);
    setReport(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8, 90));
    }, 1000);

    try {
      const result = await securityAuditService.runComprehensiveSecurityAudit();
      setReport(result);
      setProgress(100);
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      clearInterval(progressInterval);
      setIsAuditing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />;
      case 'medium':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'low':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'firebase': GlobeAltIcon,
      'google-cloud': CpuChipIcon,
      'configuration': KeyIcon,
      'permissions': LockClosedIcon,
      'data': DatabaseIcon,
      'network': ChartBarIcon,
    };
    const Icon = icons[category] || DocumentMagnifyingGlassIcon;
    return <Icon className="w-6 h-6" />;
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            🔒 Firebase & Google Cloud Security Audit
          </h1>
          <p className="text-lg text-neutral-600">
            Comprehensive security analysis and vulnerability detection for your existing setup
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
              <h2 className="text-2xl font-bold text-neutral-900">Security Audit Control Panel</h2>
              <p className="text-neutral-600">Run comprehensive security analysis of your Firebase and Google Cloud setup</p>
            </div>
            <button
              onClick={runSecurityAudit}
              disabled={isAuditing}
              className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                isAuditing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isAuditing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Auditing Security...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ShieldExclamationIcon className="w-5 h-5" />
                  <span>Start Security Audit</span>
                </div>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isAuditing && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Security Audit Progress</span>
                <span className="text-sm font-medium text-neutral-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full"
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
            {/* Security Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center">
                <h3 className="text-3xl font-bold text-neutral-900 mb-4">Security Score</h3>
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <ShieldExclamationIcon className="w-12 h-12 text-red-500" />
                  <span className={`text-6xl font-bold ${getSecurityScoreColor(report.securityScore)}`}>
                    {report.securityScore}
                  </span>
                  <span className="text-2xl text-neutral-600">/ 100</span>
                </div>
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                  report.securityScore >= 90 ? 'bg-green-100 text-green-800' :
                  report.securityScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                  report.securityScore >= 50 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {report.securityScore >= 90 ? 'SECURE' :
                   report.securityScore >= 70 ? 'MODERATE RISK' :
                   report.securityScore >= 50 ? 'HIGH RISK' :
                   'CRITICAL RISK'}
                </div>
              </div>
            </motion.div>

            {/* Vulnerability Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <span className="text-3xl font-bold text-red-600">{report.criticalVulnerabilities}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Critical</h3>
                <p className="text-neutral-600">Immediate action required</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
                  </div>
                  <span className="text-3xl font-bold text-orange-600">{report.highVulnerabilities}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">High</h3>
                <p className="text-neutral-600">Address within 24 hours</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <ClockIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                  <span className="text-3xl font-bold text-yellow-600">{report.mediumVulnerabilities}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Medium</h3>
                <p className="text-neutral-600">Address within a week</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-green-600">{report.lowVulnerabilities}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Low</h3>
                <p className="text-neutral-600">Address when possible</p>
              </div>
            </motion.div>

            {/* Vulnerabilities List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Security Vulnerabilities</h3>
              <div className="space-y-4">
                {report.vulnerabilities.map((vulnerability, index) => (
                  <motion.div
                    key={vulnerability.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-xl p-6 ${
                      vulnerability.severity === 'critical' ? 'border-red-200 bg-red-50' :
                      vulnerability.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                      vulnerability.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${getSeverityColor(vulnerability.severity)}`}>
                          {getCategoryIcon(vulnerability.category)}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-neutral-900">{vulnerability.title}</h4>
                          <p className="text-neutral-600">{vulnerability.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-neutral-900">{vulnerability.riskLevel}/10</span>
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(vulnerability.severity)}
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            vulnerability.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            vulnerability.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            vulnerability.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {vulnerability.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Impact and Evidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="text-sm font-semibold text-red-700 mb-2">Impact:</h5>
                        <p className="text-sm text-red-600">{vulnerability.impact}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-blue-700 mb-2">Evidence:</h5>
                        <ul className="text-sm text-blue-600 space-y-1">
                          {vulnerability.evidence.map((evidence, evidenceIndex) => (
                            <li key={evidenceIndex}>• {evidence}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Remediation Steps */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-green-700 mb-2">Remediation Steps:</h5>
                      <ul className="text-sm text-green-600 space-y-1">
                        {vulnerability.remediation.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>• {step}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Remediation Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-neutral-700">Estimated Time:</span>
                        <span className="ml-2 text-neutral-600">{vulnerability.remediation.estimatedTime}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-700">Complexity:</span>
                        <span className="ml-2 text-neutral-600">{vulnerability.remediation.complexity}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-700">Dependencies:</span>
                        <span className="ml-2 text-neutral-600">{vulnerability.remediation.dependencies.length}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
            >
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Security Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-red-700 mb-2">Immediate Actions</h4>
                  <ul className="space-y-1">
                    {report.recommendations.immediate.map((rec, index) => (
                      <li key={index} className="text-sm text-red-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-orange-700 mb-2">Short Term</h4>
                  <ul className="space-y-1">
                    {report.recommendations.shortTerm.map((rec, index) => (
                      <li key={index} className="text-sm text-orange-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-700 mb-2">Long Term</h4>
                  <ul className="space-y-1">
                    {report.recommendations.longTerm.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAuditDashboard;