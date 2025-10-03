/**
 * 🚀 SIMPLE SETUP APP
 * Quick setup interface for Appwrite
 */

import React from 'react';
import AppwriteSetup from './components/AppwriteSetup';
import './index.css';

function SimpleSetupApp() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <AppwriteSetup />
    </div>
  );
}

export default SimpleSetupApp;