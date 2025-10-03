/**
 * 🚀 APPWRITE SETUP COMPONENT
 * Complete Appwrite setup and testing interface
 */

import React, { useState, useEffect } from 'react';
import { client, account, databases, storage, appwriteConfig } from '../config/appwrite.config';
import { ID, Permission, Role } from 'appwrite';

const AppwriteSetup = () => {
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [setupProgress, setSetupProgress] = useState([]);

  const addToProgress = (message, type = 'info') => {
    setSetupProgress(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      addToProgress('🔍 Testing Appwrite connection...', 'info');
      
      // Test basic connection
      const result = await client.call('GET', '/ping');
      console.log('Connection test result:', result);
      
      setIsConnected(true);
      addToProgress('✅ Connection successful!', 'success');
      
      // Test account service
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        addToProgress(`✅ User logged in: ${currentUser.name}`, 'success');
      } catch (error) {
        if (error.code === 401) {
          addToProgress('ℹ️  No user logged in (this is normal)', 'info');
        } else {
          addToProgress(`⚠️  Account error: ${error.message}`, 'warning');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      addToProgress(`❌ Connection failed: ${error.message}`, 'error');
      setIsConnected(false);
      return false;
    }
  };

  const createAccount = async () => {
    try {
      const email = `test${Date.now()}@souk.test`;
      const password = 'TestPassword123!';
      const name = 'Test User';
      
      addToProgress(`🔐 Creating test account: ${email}`, 'info');
      
      const newUser = await account.create(ID.unique(), email, password, name);
      addToProgress('✅ Account created successfully!', 'success');
      
      // Login with the new account
      await account.createEmailSession(email, password);
      const loggedInUser = await account.get();
      setUser(loggedInUser);
      addToProgress(`✅ Logged in as: ${loggedInUser.name}`, 'success');
      
      return newUser;
    } catch (error) {
      console.error('Account creation failed:', error);
      addToProgress(`❌ Account creation failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const setupDatabase = async () => {
    try {
      addToProgress('🗃️ Setting up database...', 'info');
      
      // Try to list databases first (to test permissions)
      try {
        const dbList = await databases.list();
        addToProgress(`✅ Database service working - Found ${dbList.total} databases`, 'success');
      } catch (error) {
        addToProgress(`⚠️  Database list error: ${error.message}`, 'warning');
      }
      
      // Try to create a test collection (this might fail due to permissions)
      try {
        const collection = await databases.createCollection(
          appwriteConfig.databaseId,
          'test_collection_' + Date.now(),
          'Test Collection',
          [Permission.read(Role.any())]
        );
        addToProgress('✅ Test collection created successfully!', 'success');
      } catch (error) {
        if (error.code === 404) {
          addToProgress('⚠️  Database not found - needs server-side setup', 'warning');
        } else {
          addToProgress(`⚠️  Collection creation error: ${error.message}`, 'warning');
        }
      }
      
    } catch (error) {
      console.error('Database setup failed:', error);
      addToProgress(`❌ Database setup failed: ${error.message}`, 'error');
    }
  };

  const setupStorage = async () => {
    try {
      addToProgress('🪣 Setting up storage...', 'info');
      
      // List existing buckets
      try {
        const buckets = await storage.listBuckets();
        addToProgress(`✅ Storage service working - Found ${buckets.total} buckets`, 'success');
        
        if (buckets.buckets.length > 0) {
          buckets.buckets.forEach(bucket => {
            addToProgress(`📁 Found bucket: ${bucket.name} (${bucket.$id})`, 'info');
          });
        }
        
      } catch (error) {
        addToProgress(`⚠️  Storage list error: ${error.message}`, 'warning');
      }
      
      // Try to create a test bucket (this might fail due to permissions)
      try {
        const bucket = await storage.createBucket(
          'test_bucket_' + Date.now(),
          'Test Bucket',
          [Permission.read(Role.any())]
        );
        addToProgress('✅ Test bucket created successfully!', 'success');
      } catch (error) {
        addToProgress(`⚠️  Bucket creation error: ${error.message}`, 'warning');
      }
      
    } catch (error) {
      console.error('Storage setup failed:', error);
      addToProgress(`❌ Storage setup failed: ${error.message}`, 'error');
    }
  };

  const runFullSetup = async () => {
    setSetupProgress([]);
    addToProgress('🚀 Starting full Appwrite setup for Souk Al-Sayarat...', 'info');
    
    try {
      // Step 1: Test connection
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Connection failed');
      }
      
      // Step 2: Setup database
      await setupDatabase();
      
      // Step 3: Setup storage
      await setupStorage();
      
      // Step 4: Create test account if no user is logged in
      if (!user) {
        await createAccount();
      }
      
      addToProgress('🎉 Setup completed! Your Souk Al-Sayarat backend is ready!', 'success');
      
    } catch (error) {
      addToProgress(`💥 Setup failed: ${error.message}`, 'error');
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      addToProgress('👋 Logged out successfully', 'info');
    } catch (error) {
      addToProgress(`❌ Logout failed: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getMessageColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">🚀 Souk Al-Sayarat</h1>
        <h2 className="text-xl text-center text-gray-600 mb-4">Appwrite Backend Setup</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">📡 Endpoint</h3>
            <p className="text-sm text-blue-600">{appwriteConfig.endpoint}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">🆔 Project</h3>
            <p className="text-sm text-green-600">{appwriteConfig.project}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">🗃️ Database</h3>
            <p className="text-sm text-purple-600">{appwriteConfig.databaseId}</p>
          </div>
        </div>

        {user && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>👤 Logged in as:</strong> {user.name} ({user.email})
            <button
              onClick={logout}
              className="ml-4 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={testConnection}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            🔍 Test Connection
          </button>
          <button
            onClick={createAccount}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors"
            disabled={!!user}
          >
            🔐 Create Test Account
          </button>
          <button
            onClick={setupDatabase}
            className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 transition-colors"
          >
            🗃️ Setup Database
          </button>
          <button
            onClick={setupStorage}
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            🪣 Setup Storage
          </button>
          <button
            onClick={runFullSetup}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors font-bold"
          >
            🚀 Run Full Setup
          </button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">📋 Setup Progress</h3>
        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          {setupProgress.length === 0 ? (
            <p className="text-gray-500 italic">No setup actions yet. Click a button above to start.</p>
          ) : (
            setupProgress.map((item, index) => (
              <div key={index} className="mb-2 flex items-start gap-2">
                <span className="text-xs text-gray-400 w-20 flex-shrink-0">{item.timestamp}</span>
                <span className={`${getMessageColor(item.type)} flex-1`}>{item.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </div>
      </div>
    </div>
  );
};

export default AppwriteSetup;