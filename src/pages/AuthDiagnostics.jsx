// ================================
// 1. src/pages/AuthDiagnostics.jsx - NEW FILE
// ================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { testAPI, getCurrentApiUrl, checkApiHealth } from '../config/api';
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Server, User, Shield } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthDiagnostics = () => {
  const { isAuthenticated, user, token } = useAuth();
  const [apiHealth, setApiHealth] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const healthy = await checkApiHealth();
      setApiHealth(healthy);
    } catch (error) {
      setApiHealth(false);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runTest = async (testName, testFn, description) => {
    setIsRunningTests(true);
    try {
      const startTime = Date.now();
      const result = await testFn();
      const endTime = Date.now();
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: result.data || result,
          duration: endTime - startTime,
          description
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          status: error.response?.status,
          description
        }
      }));
    } finally {
      setIsRunningTests(false);
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    await Promise.all([
      runTest('health', testAPI.health, 'API Health Check'),
      runTest('categories', testAPI.categories, 'Get Categories'),
      runTest('info', testAPI.info, 'API Info')
    ]);
  };

  const StatusIndicator = ({ status, label }) => (
    <div className="flex items-center space-x-2">
      {status === null ? (
        <AlertCircle className="text-yellow-500" size={20} />
      ) : status ? (
        <CheckCircle className="text-green-500" size={20} />
      ) : (
        <XCircle className="text-red-500" size={20} />
      )}
      <span className={`font-medium ${
        status === null ? 'text-yellow-700' : 
        status ? 'text-green-700' : 'text-red-700'
      }`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connection Diagnostics</h1>
          <p className="text-gray-600">Check your authentication status and API connectivity</p>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-2">
              {navigator.onLine ? (
                <Wifi className="text-green-500" size={24} />
              ) : (
                <WifiOff className="text-red-500" size={24} />
              )}
              <h3 className="ml-2 font-medium">Internet</h3>
            </div>
            <p className={`text-sm ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>
              {navigator.onLine ? 'Connected' : 'Offline'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-2">
              <Server className={`${apiHealth ? 'text-green-500' : 'text-red-500'}`} size={24} />
              <h3 className="ml-2 font-medium">API Server</h3>
            </div>
            <div className="flex items-center space-x-2">
              {isCheckingHealth ? (
                <LoadingSpinner size="sm" />
              ) : (
                <p className={`text-sm ${apiHealth ? 'text-green-600' : 'text-red-600'}`}>
                  {apiHealth ? 'Healthy' : 'Unavailable'}
                </p>
              )}
              <button
                onClick={checkHealth}
                disabled={isCheckingHealth}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-2">
              <User className={`${isAuthenticated ? 'text-green-500' : 'text-red-500'}`} size={24} />
              <h3 className="ml-2 font-medium">Authentication</h3>
            </div>
            <p className={`text-sm ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
              {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-2">
              <Shield className="text-blue-500" size={24} />
              <h3 className="ml-2 font-medium">Role</h3>
            </div>
            <p className="text-sm text-gray-600">
              {user?.role || 'None'}
            </p>
          </div>
        </div>

        {/* Detailed Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Authentication Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication Status</h3>
            <div className="space-y-3">
              <StatusIndicator 
                status={isAuthenticated} 
                label={isAuthenticated ? 'Authenticated' : 'Not authenticated'} 
              />
              <StatusIndicator 
                status={!!token} 
                label={token ? 'Token present' : 'No token'} 
              />
              {user && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">User Details</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Username:</span> {user.username}</p>
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">Role:</span> {user.role}</p>
                    <p><span className="font-medium">ID:</span> {user.id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
            <div className="space-y-3">
              <StatusIndicator 
                status={apiHealth} 
                label={apiHealth ? 'API is healthy' : 'API unavailable'} 
              />
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Current Settings</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">API URL:</span> {getCurrentApiUrl()}</p>
                  <p><span className="font-medium">Environment:</span> {import.meta.env.DEV ? 'Development' : 'Production'}</p>
                  <p><span className="font-medium">Mode:</span> {import.meta.env.VITE_API_BASE_URL ? 'Manual Override' : 'Auto-detect'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Tests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">API Tests</h3>
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="btn-primary disabled:opacity-50"
            >
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          {Object.keys(testResults).length === 0 ? (
            <p className="text-gray-500 text-center py-8">Click "Run All Tests" to test API endpoints</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(testResults).map(([testName, result]) => (
                <div key={testName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <XCircle className="text-red-500" size={20} />
                      )}
                      <span className="font-medium">{result.description}</span>
                    </div>
                    {result.duration && (
                      <span className="text-sm text-gray-500">{result.duration}ms</span>
                    )}
                  </div>

                  {result.success ? (
                    <div className="bg-green-50 p-3 rounded text-sm">
                      <p className="text-green-800">✓ Success</p>
                      {result.data && (
                        <pre className="mt-2 text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2).slice(0, 200)}
                          {JSON.stringify(result.data, null, 2).length > 200 && '...'}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 p-3 rounded text-sm">
                      <p className="text-red-800">✗ Failed: {result.error}</p>
                      {result.status && (
                        <p className="text-red-600">Status: {result.status}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-medium text-blue-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
              }}
              className="btn-secondary"
            >
              Clear Storage & Login
            </button>
            <button
              onClick={() => window.open(getCurrentApiUrl() + '/health', '_blank')}
              className="btn-secondary"
            >
              Test API Directly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDiagnostics;