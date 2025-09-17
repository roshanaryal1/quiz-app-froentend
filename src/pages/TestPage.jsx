// src/pages/TestPage.jsx - Test page to verify all functionality
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import FunctionalityTester from '../utils/testFunctionality';
import { Play, Download, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const TestPage = () => {
  const { user } = useContext(AuthContext);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tester, setTester] = useState(null);

  const runTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults(null);
    setLogs([]);
    
    try {
      const newTester = new FunctionalityTester();
      setTester(newTester);
      
      // Override the log method to capture logs in real-time
      const originalLog = newTester.log.bind(newTester);
      newTester.log = (message, type = 'info') => {
        originalLog(message, type);
        setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
      };
      
      const results = await newTester.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
      setLogs(prev => [...prev, { 
        message: `Test execution failed: ${error.message}`, 
        type: 'error', 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadResults = () => {
    if (tester) {
      tester.exportResults();
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setLogs([]);
    setTester(null);
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-blue-500" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧪 Application Test Suite</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive testing of all quiz tournament features
              </p>
              {user && (
                <p className="text-sm text-gray-500 mt-1">
                  Testing as: <span className="font-medium">{user.username}</span> ({user.role})
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run All Tests
                  </>
                )}
              </button>
              
              {testResults && (
                <button
                  onClick={downloadResults}
                  className="btn-secondary flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </button>
              )}
              
              {(testResults || logs.length > 0) && (
                <button
                  onClick={clearResults}
                  className="btn-secondary flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        {testResults && (
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Test Results Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(testResults).length}
                </div>
                <div className="text-sm text-blue-700">Total Tests</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(testResults).filter(r => r === true).length}
                </div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(testResults).filter(r => r === false).length}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {(Object.values(testResults).filter(r => r === true).length / Object.keys(testResults).length * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-purple-700">Success Rate</div>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.entries(testResults).map(([testName, passed]) => (
                <div
                  key={testName}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center">
                    {passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mr-3" />
                    )}
                    <span className={`font-medium ${
                      passed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testName}
                    </span>
                  </div>
                  
                  <span className={`text-sm font-medium ${
                    passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Logs */}
        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📋 Test Execution Log</h2>
              <span className="text-sm text-gray-500">
                {logs.length} log entries
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start p-3 rounded-lg border text-sm ${getLogColor(log.type)}`}
                >
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {getStatusIcon(log.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{log.message}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!testResults && logs.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🚀 Ready to Test Your Application
              </h2>
              
              <p className="text-gray-600 mb-6">
                This test suite will verify all major functionality of your quiz tournament application, 
                including authentication, tournament operations, quiz participation, like functionality, 
                and player history.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">What will be tested:</h3>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Backend connectivity and health</li>
                  <li>• User authentication (registration and login)</li>
                  <li>• Tournament CRUD operations</li>
                  <li>• Tournament like/unlike functionality</li>
                  <li>• Player history endpoints</li>
                  <li>• Quiz participation flow</li>
                  <li>• User profile operations</li>
                </ul>
              </div>
              
              <button
                onClick={runTests}
                className="btn-primary flex items-center mx-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Testing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;