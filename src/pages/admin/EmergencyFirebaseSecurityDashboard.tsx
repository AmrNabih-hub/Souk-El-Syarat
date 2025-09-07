/**
 * Emergency Firebase Security Dashboard
 * CRITICAL: Real-time monitoring of Firebase security fixes
 */

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  ShieldCheckIcon, 
  XCircleIcon, 
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  AlertTriangleIcon,
  EyeIcon,
  LockClosedIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface FirebaseSecurityAlert {
  id: string;
  type: 'realtime-database' | 'firestore' | 'storage' | 'auth' | 'functions';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  affectedData: string[];
  riskLevel: number;
  immediateAction: string;
  fixRequired: string;
  timeline: string;
}

interface FirebaseSecurityFix {
  id: string;
  title: string;
  description: string;
  type: 'rules' | 'configuration' | 'authentication' | 'monitoring';
  severity: 'critical' | 'high' | 'medium' | 'low';
  riskReduction: number;
  implementationEffort: number;
  timeline: string;
  status: 'implemented' | 'in-progress' | 'failed' | 'pending';
}

const EmergencyFirebaseSecurityDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<FirebaseSecurityAlert[]>([]);
  const [fixes, setFixes] = useState<FirebaseSecurityFix[]>([]);
  const [isEmergency, setIsEmergency] = useState(true);
  const [riskLevel, setRiskLevel] = useState(100);
  const [fixesCompleted, setFixesCompleted] = useState(0);
  const [totalFixes, setTotalFixes] = useState(0);

  // Mock data for demonstration
  useEffect(() => {
    const mockAlerts: FirebaseSecurityAlert[] = [
      {
        id: 'alert-1',
        type: 'realtime-database',
        severity: 'critical',
        title: 'Realtime Database Insecure Rules - CRITICAL',
        description: 'Realtime Database has insecure rules allowing any logged-in user to read/write entire database',
        impact: 'Complete data breach risk - any authenticated user can access, modify, or delete all data',
        affectedData: ['All user data', 'All product data', 'All order data', 'All vendor data', 'All admin data'],
        riskLevel: 100,
        immediateAction: 'Implement secure rules immediately to prevent data breach',
        fixRequired: 'Replace insecure rules with role-based access control',
        timeline: 'IMMEDIATE - Within 1 hour'
      }
    ];

    const mockFixes: FirebaseSecurityFix[] = [
      {
        id: 'fix-1',
        title: 'Secure Realtime Database Rules - EMERGENCY',
        description: 'Implement secure Realtime Database rules with role-based access control',
        type: 'rules',
        severity: 'critical',
        riskReduction: 95,
        implementationEffort: 8,
        timeline: 'IMMEDIATE - 30 minutes',
        status: 'implemented'
      },
      {
        id: 'fix-2',
        title: 'Firebase Authentication Security Enhancement',
        description: 'Enhance Firebase Authentication with custom claims and role-based access',
        type: 'authentication',
        severity: 'critical',
        riskReduction: 90,
        implementationEffort: 7,
        timeline: 'IMMEDIATE - 1 hour',
        status: 'in-progress'
      },
      {
        id: 'fix-3',
        title: 'Firebase Security Monitoring Setup',
        description: 'Implement comprehensive Firebase security monitoring and alerting',
        type: 'monitoring',
        severity: 'high',
        riskReduction: 85,
        implementationEffort: 6,
        timeline: 'IMMEDIATE - 2 hours',
        status: 'pending'
      }
    ];

    setAlerts(mockAlerts);
    setFixes(mockFixes);
    setTotalFixes(mockFixes.length);
    setFixesCompleted(mockFixes.filter(f => f.status === 'implemented').length);
    setRiskLevel(100 - (mockFixes.filter(f => f.status === 'implemented').length * 30));
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rules':
        return <LockClosedIcon className="h-5 w-5" />;
      case 'authentication':
        return <UserGroupIcon className="h-5 w-5" />;
      case 'monitoring':
        return <EyeIcon className="h-5 w-5" />;
      default:
        return <ShieldCheckIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <FireIcon className="h-8 w-8 text-red-500" />
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-red-900">🚨 EMERGENCY FIREBASE SECURITY ALERT</h1>
            <p className="text-red-700">CRITICAL: Immediate action required to prevent data breach</p>
          </div>
        </div>
      </div>

      {/* Risk Level Indicator */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Risk Level</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              riskLevel > 70 ? 'bg-red-100' : riskLevel > 40 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <span className={`text-2xl font-bold ${
                riskLevel > 70 ? 'text-red-600' : riskLevel > 40 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {riskLevel}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Current Risk Level</div>
              <div className={`text-lg font-semibold ${
                riskLevel > 70 ? 'text-red-600' : riskLevel > 40 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {riskLevel > 70 ? 'CRITICAL' : riskLevel > 40 ? 'HIGH' : 'LOW'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Fixes Completed</div>
            <div className="text-2xl font-bold text-green-600">{fixesCompleted}/{totalFixes}</div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Critical Security Alerts</h2>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={`border-2 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <AlertTriangleIcon className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium">{alert.title}</h3>
                    <p className="text-sm mt-1">{alert.description}</p>
                    <div className="mt-2">
                      <div className="text-sm font-medium">Impact:</div>
                      <div className="text-sm">{alert.impact}</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">Affected Data:</div>
                      <ul className="text-sm list-disc list-inside">
                        {alert.affectedData.map((data, index) => (
                          <li key={index}>{data}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">Immediate Action Required:</div>
                      <div className="text-sm">{alert.immediateAction}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Risk Level</div>
                  <div className="text-2xl font-bold text-red-600">{alert.riskLevel}%</div>
                  <div className="text-sm text-gray-500">Timeline</div>
                  <div className="text-sm font-medium">{alert.timeline}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Fixes */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Security Fixes</h2>
        <div className="space-y-4">
          {fixes.map((fix) => (
            <div key={fix.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(fix.status)}
                  {getTypeIcon(fix.type)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{fix.title}</h3>
                    <p className="text-gray-600">{fix.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(fix.severity)}`}>
                        {fix.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(fix.status)}`}>
                        {fix.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">Timeline: {fix.timeline}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Risk Reduction</div>
                  <div className="text-lg font-bold text-green-600">{fix.riskReduction}%</div>
                  <div className="text-sm text-gray-500">Effort</div>
                  <div className="text-sm font-medium">{fix.implementationEffort}/10</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Implementation Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-green-800">Implemented</div>
                <div className="text-2xl font-bold text-green-900">
                  {fixes.filter(f => f.status === 'implemented').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-blue-800">In Progress</div>
                <div className="text-2xl font-bold text-blue-900">
                  {fixes.filter(f => f.status === 'in-progress').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-800">Pending</div>
                <div className="text-2xl font-bold text-gray-900">
                  {fixes.filter(f => f.status === 'pending').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-red-800">Failed</div>
                <div className="text-2xl font-bold text-red-900">
                  {fixes.filter(f => f.status === 'failed').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Actions Required */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-900 mb-4">🚨 IMMEDIATE ACTIONS REQUIRED</h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <div className="font-medium text-yellow-900">Apply Secure Firebase Rules</div>
              <div className="text-sm text-yellow-700">Copy the rules from FIREBASE_EMERGENCY_SECURITY_RULES.json to your Firebase Console</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <div className="font-medium text-yellow-900">Deploy Security Functions</div>
              <div className="text-sm text-yellow-700">Deploy the emergency-security-functions.js to Firebase Functions</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <div className="font-medium text-yellow-900">Set Up Custom Claims</div>
              <div className="text-sm text-yellow-700">Implement role-based access control with custom claims</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <div className="font-medium text-yellow-900">Monitor Security Events</div>
              <div className="text-sm text-yellow-700">Set up monitoring and alerting for security events</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyFirebaseSecurityDashboard;