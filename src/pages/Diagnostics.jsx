import React, { useState, useEffect } from 'react';
import { testAPI, tournamentAPI, getCurrentApiUrl, checkApiHealth } from '../config/api';
import { Server, Globe, Database, Settings, Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Diagnostics = () => {
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState({});

  useEffect(() => {
    gatherSystemInfo();
  }, []);

  const gatherSystemInfo = () => {
    setSystemInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      currentUrl: window.location.href,
      apiUrl: getCurrentApiUrl(),
      timestamp: new Date().toISOString()
    });
  };

  const runTest = async (testName, testFn, description) => {
    setResults(prev => ({
      ...prev,
      [testName]: { status: 'running', description }
    }));

    try {
      const startTime = Date.now();
      const result = await testFn();
      const endTime = Date.now();
      
      setResults(prev => ({
        ...prev,
        [testName]: {
          status: 'success',
          description,
          data: result.data || result,
          duration: endTime - startTime,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          status: 'error',
          description,
          error: error.message,
          statusCode: error.response?.status,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults({});

    const tests = [
      ['connectivity', () => checkApiHealth(), 'API Connectivity Test'],
      ['health', testAPI.health, 'Health Endpoint'],
      ['info', testAPI.info, 'API Info Endpoint'],
      ['categories', testAPI.categories, 'Categories Endpoint'],
      ['tournaments', tournamentAPI.getAll, 'Tournaments Endpoint']
    ];

    for (const [name, fn, description] of tests) {
      await runTest(name, fn, description);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <LoadingSpinner size="sm" />;
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Diagnostics</h1>
          <p className="text-gray-600">Test API endpoints and system connectivity</p>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Settings size={20} />
            <span>System Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">API URL:</span>
              <p className="text-gray-600 break-all">{systemInfo.apiUrl}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Environment:</span>
              <p className="text-gray-600">{import.meta.env.DEV ? 'Development' : 'Production'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Online Status:</span>
              <p className={`font-medium ${systemInfo.onLine ? 'text-green-600' : 'text-red-600'}`}>
                {systemInfo.onLine ? 'Online' : 'Offline'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Platform:</span>
              <p className="text-gray-600">{systemInfo.platform}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Language:</span>
              <p className="text-gray-600">{systemInfo.language}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Cookies:</span>
              <p className="text-gray-600">{systemInfo.cookieEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">API Tests</h3>
              <p className="text-gray-600">Test all available API endpoints</p>
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="btn-primary disabled:opacity-50 inline-flex items-center space-x-2"
            >
              <Play size={16} />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {Object.keys(results).length === 0 && !isRunning ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Database className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Run Yet</h3>
              <p className="text-gray-600">Click "Run All Tests" to test API connectivity and endpoints</p>
            </div>
          ) : (
            Object.entries(results).map(([testName, result]) => (
              <div key={testName} className={`bg-white border rounded-lg p-6 ${getStatusColor(result.status)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{result.description}</h4>
                      <p className="text-sm text-gray-600">Test: {testName}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {result.duration && <p>{result.duration}ms</p>}
                    {result.timestamp && <p>{new Date(result.timestamp).toLocaleTimeString()}</p>}
                  </div>
                </div>

                {result.status === 'success' && result.data && (
                  <div className="bg-white border rounded p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Response Data:</h5>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {result.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h5 className="font-medium text-red-900 mb-2">Error Details:</h5>
                    <p className="text-red-700 text-sm">{result.error}</p>
                    {result.statusCode && (
                      <p className="text-red-600 text-sm mt-1">Status Code: {result.statusCode}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-medium text-blue-900 mb-4 flex items-center space-x-2">
            <Globe size={20} />
            <span>Quick Diagnostics</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => runTest('ping', () => fetch(getCurrentApiUrl() + '/health'), 'Manual Health Check')}
              className="btn-secondary"
            >
              Ping API
            </button>
            <button
              onClick={() => window.open(getCurrentApiUrl(), '_blank')}
              className="btn-secondary"
            >
              Open API URL
            </button>
            <button
              onClick={() => {
                const results = Object.entries(results).map(([name, result]) => 
                  `${name}: ${result.status} (${result.duration || 0}ms)`
                ).join('\n');
                navigator.clipboard.writeText(`API Diagnostics Report\n\n${results}`);
                alert('Results copied to clipboard!');
              }}
              className="btn-secondary"
            >
              Copy Results
            </button>
            <button
              onClick={gatherSystemInfo}
              className="btn-secondary"
            >
              Refresh System Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
