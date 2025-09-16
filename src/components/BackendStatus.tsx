/**
 * 🔍 BACKEND STATUS COMPONENT
 * Real-time backend connectivity monitor
 */

import React, { useState, useEffect } from 'react';
import { backendService } from '@/services/backend.service';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

interface BackendStatus {
  backend: boolean;
  health: boolean;
  api: boolean;
  realtime: boolean;
}

const BackendStatus: React.FC = () => {
  const { language } = useAppStore();
  const [status, setStatus] = useState<BackendStatus>({
    backend: false,
    health: false,
    api: false,
    realtime: false,
  });
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    setLoading(true);
    try {
      const results = await backendService.testConnectivity();
      setStatus(results);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Backend status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isHealthy: boolean) => {
    if (loading) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
    return isHealthy ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusText = (isHealthy: boolean) => {
    if (loading) return 'Checking...';
    return isHealthy ? 'Operational' : 'Offline';
  };

  const getStatusColor = (isHealthy: boolean) => {
    if (loading) return 'text-yellow-600';
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-gray-200/50 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Backend Status
        </h3>
        <button
          onClick={checkBackendStatus}
          disabled={loading}
          className="px-2 py-1 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          title={language === 'ar' ? 'تحديث الحالة' : 'Refresh Status'}
          aria-label={language === 'ar' ? 'تحديث الحالة' : 'Refresh Status'}
        >
          {loading ? '...' : '↻'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            {getStatusIcon(status.health)}
            <span className="text-gray-700">Health</span>
          </div>
          <span className={`font-medium ${getStatusColor(status.health)}`}>
            {getStatusText(status.health)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            {getStatusIcon(status.api)}
            <span className="text-gray-700">API</span>
          </div>
          <span className={`font-medium ${getStatusColor(status.api)}`}>
            {getStatusText(status.api)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            {getStatusIcon(status.realtime)}
            <span className="text-gray-700">Real-time</span>
          </div>
          <span className={`font-medium ${getStatusColor(status.realtime)}`}>
            {getStatusText(status.realtime)}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5">
              {getStatusIcon(status.backend)}
              <span className="font-semibold text-gray-900">Overall</span>
            </div>
            <span className={`font-semibold ${getStatusColor(status.backend)}`}>
              {getStatusText(status.backend)}
            </span>
          </div>
        </div>
      </div>

      {lastChecked && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          {lastChecked.toLocaleTimeString()}
        </div>
      )}

      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          {status.backend ? 'All services operational' : 'Some services offline'}
        </p>
      </div>
    </div>
  );
};

export default BackendStatus;
