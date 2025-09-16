import React, { useState } from 'react';
import { ErrorMonitoringService } from '@/services/error-monitoring.service';
import { EnhancedErrorHandlerService } from '@/services/enhanced-error-handler.service';

const ErrorTestPage: React.FC = () => {
  const [errorLog, setErrorLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setErrorLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testFirebaseError = () => {
    try {
      throw new Error('Firebase: Permission denied (permission-denied)');
    } catch (error) {
      const handledError = EnhancedErrorHandlerService.handleFirebaseError(error);
      addLog(`Firebase Error Handled: ${handledError.message}`);
      ErrorMonitoringService.logError(error as Error, 'firebase-test');
    }
  };

  const testNetworkError = () => {
    try {
      throw new Error('Network Error: Failed to fetch');
    } catch (error) {
      const handledError = EnhancedErrorHandlerService.handleNetworkError(error);
      addLog(`Network Error Handled: ${handledError.message}`);
      ErrorMonitoringService.logError(error as Error, 'network-test');
    }
  };

  const testImageError = () => {
    try {
      throw new Error('Image loading failed');
    } catch (error) {
      const handledError = EnhancedErrorHandlerService.handleImageError(error);
      addLog(`Image Error Handled: ${handledError.message}`);
      ErrorMonitoringService.logError(error as Error, 'image-test');
    }
  };

  const testGenericError = () => {
    try {
      throw new Error('Generic application error');
    } catch (error) {
      const handledError = EnhancedErrorHandlerService.handleGenericError(error);
      addLog(`Generic Error Handled: ${handledError.message}`);
      ErrorMonitoringService.logError(error as Error, 'generic-test');
    }
  };

  const getMetrics = () => {
    const metrics = ErrorMonitoringService.getMetrics();
    addLog(`Current Metrics: ${JSON.stringify(metrics, null, 2)}`);
  };

  const testRetryLogic = async () => {
    const retryOperation = async () => {
      throw new Error('Simulated network failure');
    };

    try {
      await EnhancedErrorHandlerService.retryWithBackoff(retryOperation, 3);
    } catch (error) {
      addLog(`Retry Logic Test: ${(error as Error).message}`);
    }
  };

  const clearLogs = () => {
    setErrorLog([]);
    ErrorMonitoringService.clearErrors();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">اختبار نظام معالجة الأخطاء</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">اختبار أنواع الأخطاء</h2>
            <div className="space-y-3">
              <button
                onClick={testFirebaseError}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                اختبار خطأ Firebase
              </button>
              <button
                onClick={testNetworkError}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                اختبار خطأ الشبكة
              </button>
              <button
                onClick={testImageError}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                اختبار خطأ الصور
              </button>
              <button
                onClick={testGenericError}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                اختبار خطأ عام
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">اختبار الوظائف المتقدمة</h2>
            <div className="space-y-3">
              <button
                onClick={testRetryLogic}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                اختبار منطق إعادة المحاولة
              </button>
              <button
                onClick={getMetrics}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                عرض الإحصائيات
              </button>
              <button
                onClick={clearLogs}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                مسح السجلات
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">سجل الأحداث</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {errorLog.length === 0 ? (
              <p className="text-gray-500">لا توجد أحداث مسجلة</p>
            ) : (
              <div className="space-y-2">
                {errorLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">ملاحظات مهمة</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• جميع الأخطاء يتم تسجيلها في نظام المراقبة</li>
            <li>• يتم تطبيق منطق إعادة المحاولة تلقائياً للأخطاء القابلة للإصلاح</li>
            <li>• توفر البيانات الاحتياطية عند فشل Firebase</li>
            <li>• واجهة المستخدم لا تتأثر بالأخطاء التقنية</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestPage;