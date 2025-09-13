/**
 * 🔍 BACKEND STATUS COMPONENT
 * Real-time backend connectivity monitor
 */

import React, { useState, useEffect } from 'react';
import { backendService } from '@/services/backend.service';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BackendStatus {
  backend: boolean;
  health: boolean;
  api: boolean;
  realtime: boolean;
}

const BackendStatus: React.FC = () => {
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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Backend Services Status
        </h3>
        <button
          onClick={checkBackendStatus}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.health)}
            <span className="text-sm font-medium text-gray-700">Health Check</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(status.health)}`}>
            {getStatusText(status.health)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.api)}
            <span className="text-sm font-medium text-gray-700">API Status</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(status.api)}`}>
            {getStatusText(status.api)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.realtime)}
            <span className="text-sm font-medium text-gray-700">Real-time Services</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(status.realtime)}`}>
            {getStatusText(status.realtime)}
          </span>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.backend)}
              <span className="text-sm font-bold text-gray-900">Overall Backend</span>
            </div>
            <span className={`text-sm font-bold ${getStatusColor(status.backend)}`}>
              {getStatusText(status.backend)}
            </span>
          </div>
        </div>
      </div>

      {lastChecked && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Backend URL:</strong> https://backend-52vezf5qqa-ew.a.run.app
        </p>
        <p className="text-xs text-blue-800 mt-1">
          <strong>Status:</strong> {status.backend ? 'All services operational' : 'Some services offline'}
        </p>
      </div>
    </div>
  );
};

export default BackendStatus;
