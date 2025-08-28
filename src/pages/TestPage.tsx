/**
 * 🧪 COMPREHENSIVE TEST PAGE
 * Tests all features and simulates user interactions
 */

import React from 'react';
import { UserSimulation } from '@/testing/UserSimulation';
import RealtimeVerification from '@/components/realtime/RealtimeVerification';
import ErrorBoundary from '@/components/ErrorBoundary';
import { motion } from 'framer-motion';

const TestPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-8">
          <div className="container mx-auto px-4">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-center"
            >
              🧪 Souk El-Sayarat Testing Center
            </motion.h1>
            <p className="text-center mt-2 text-primary-100">
              Comprehensive testing and validation of all features
            </p>
          </div>
        </div>

        {/* Testing Components */}
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* User Simulation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <UserSimulation />
          </motion.div>

          {/* Real-time Verification */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <RealtimeVerification />
          </motion.div>

          {/* Quick Test Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">⚡ Quick Test Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  console.log('Testing console output');
                  alert('Alert test successful!');
                }}
                className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Test Console & Alert
              </button>
              <button
                onClick={() => {
                  throw new Error('Test error thrown');
                }}
                className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Test Error Boundary
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('test', Date.now().toString());
                  console.log('LocalStorage test:', localStorage.getItem('test'));
                }}
                className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Test LocalStorage
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TestPage;