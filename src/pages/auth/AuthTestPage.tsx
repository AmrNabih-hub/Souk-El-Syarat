import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { unifiedAuthService } from '@/services/unified-auth.service';
import toast from 'react-hot-toast';

const AuthTestPage: React.FC = () => {
  const { user, isLoading, error } = useAuthStore();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testDisplayName, setTestDisplayName] = useState('Test User');
  const [authStatus, setAuthStatus] = useState<string>('Not authenticated');

  useEffect(() => {
    if (user) {
      setAuthStatus(`Authenticated as ${user.displayName} (${user.role})`);
    } else {
      setAuthStatus('Not authenticated');
    }
  }, [user]);

  const testSignUp = async () => {
    try {
      console.log('🧪 Testing sign up...');
      await unifiedAuthService.signUp(testEmail, testPassword, testDisplayName);
      toast.success('Sign up test successful!');
    } catch (error) {
      console.error('❌ Sign up test failed:', error);
      toast.error(`Sign up test failed: ${(error as Error).message}`);
    }
  };

  const testSignIn = async () => {
    try {
      console.log('🧪 Testing sign in...');
      await unifiedAuthService.signIn(testEmail, testPassword);
      toast.success('Sign in test successful!');
    } catch (error) {
      console.error('❌ Sign in test failed:', error);
      toast.error(`Sign in test failed: ${(error as Error).message}`);
    }
  };

  const testGoogleSignIn = async () => {
    try {
      console.log('🧪 Testing Google sign in...');
      await unifiedAuthService.signInWithGoogle();
      toast.success('Google sign in test successful!');
    } catch (error) {
      console.error('❌ Google sign in test failed:', error);
      toast.error(`Google sign in test failed: ${(error as Error).message}`);
    }
  };

  const testSignOut = async () => {
    try {
      console.log('🧪 Testing sign out...');
      await unifiedAuthService.signOut();
      toast.success('Sign out test successful!');
    } catch (error) {
      console.error('❌ Sign out test failed:', error);
      toast.error(`Sign out test failed: ${(error as Error).message}`);
    }
  };

  const testResetPassword = async () => {
    try {
      console.log('🧪 Testing password reset...');
      await unifiedAuthService.resetPassword(testEmail);
      toast.success('Password reset test successful!');
    } catch (error) {
      console.error('❌ Password reset test failed:', error);
      toast.error(`Password reset test failed: ${(error as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
          
          {/* Auth Status */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Current Status</h2>
            <p className="text-blue-700">Status: {authStatus}</p>
            <p className="text-blue-700">Loading: {isLoading ? 'Yes' : 'No'}</p>
            {error && <p className="text-red-700">Error: {error}</p>}
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-8 p-4 bg-green-50 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-2">User Information</h2>
              <div className="space-y-2 text-green-700">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Display Name:</strong> {user.displayName}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                <p><strong>Active:</strong> {user.isActive ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {user.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* Test Form */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={testDisplayName}
                  onChange={(e) => setTestDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={testSignUp}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Sign Up
            </button>
            
            <button
              onClick={testSignIn}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Sign In
            </button>
            
            <button
              onClick={testGoogleSignIn}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Google Sign In
            </button>
            
            <button
              onClick={testSignOut}
              disabled={isLoading || !user}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Sign Out
            </button>
            
            <button
              onClick={testResetPassword}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Reset Password
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-yellow-700">
              <li>First, test sign up with a new email address</li>
              <li>Then test sign in with the same credentials</li>
              <li>Test Google sign in (will open a popup)</li>
              <li>Test sign out to clear the session</li>
              <li>Test password reset (check your email)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTestPage;