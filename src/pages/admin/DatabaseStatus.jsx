import React, { useState, useEffect } from 'react';
import { testAPI } from '../../config/api';
import { Database, Server, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const DatabaseStatus = () => {
  const [status, setStatus] = useState({
    backend: 'checking',
    database: 'checking',
    lastCheck: null,
    error: null
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      // Check backend health
      const healthResponse = await testAPI.health();
      console.log('🏥 Health check response:', healthResponse);

      // Check database connection
      let dbStatus = 'unknown';
      let dbError = null;
      
      try {
        // Try to get tournaments to test database
        const tournamentsResponse = await fetch('/api/tournaments', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (tournamentsResponse.ok) {
          dbStatus = 'connected';
        } else {
          dbStatus = 'error';
          dbError = `HTTP ${tournamentsResponse.status}`;
        }
      } catch (dbErr) {
        dbStatus = 'error';
        dbError = dbErr.message;
      }

      setStatus({
        backend: 'online',
        database: dbStatus,
        lastCheck: new Date(),
        error: dbError
      });
    } catch (error) {
      console.error('❌ Status check failed:', error);
      setStatus({
        backend: 'offline',
        database: 'unknown',
        lastCheck: new Date(),
        error: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'offline':
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'checking':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
      default:
        return <AlertTriangle className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'text-green-600';
      case 'offline':
      case 'error':
        return 'text-red-600';
      case 'checking':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Database size={24} />
          <span>System Status</span>
        </h3>
        <button
          onClick={checkStatus}
          disabled={isChecking}
          className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Status */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Server size={20} />
            <span className="font-medium">Backend Server</span>
            {getStatusIcon(status.backend)}
          </div>
          <div className={`text-sm ${getStatusColor(status.backend)}`}>
            Status: {status.backend === 'online' ? 'Running' : status.backend === 'offline' ? 'Offline' : 'Checking...'}
          </div>
          {status.backend === 'offline' && (
            <div className="mt-2 text-xs text-red-600">
              Server may be sleeping on Render.com free tier
            </div>
          )}
        </div>

        {/* Database Status */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Database size={20} />
            <span className="font-medium">Database</span>
            {getStatusIcon(status.database)}
          </div>
          <div className={`text-sm ${getStatusColor(status.database)}`}>
            Status: {status.database === 'connected' ? 'Connected' : status.database === 'error' ? 'Error' : status.database}
          </div>
          {status.error && (
            <div className="mt-2 text-xs text-red-600">
              Error: {status.error}
            </div>
          )}
        </div>
      </div>

      {/* Last Check */}
      {status.lastCheck && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last checked: {status.lastCheck.toLocaleTimeString()}
        </div>
      )}

      {/* Database Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">📋 Database Persistence Issue</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• <strong>Current Problem:</strong> Render.com free tier doesn't provide persistent database</p>
          <p>• <strong>Result:</strong> Tournaments are lost when server restarts</p>
          <p>• <strong>Solution:</strong> Set up MySQL database for permanent storage</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">🛠️ Recommended Solutions</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Set up MySQL on PlanetScale</strong> (Free tier available)</p>
          <p>2. <strong>Use Railway.app</strong> with PostgreSQL (Free tier)</p>
          <p>3. <strong>Upgrade Render.com</strong> to paid tier with persistent storage</p>
          <p>4. <strong>Local MySQL</strong> with MySQL Workbench for development</p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStatus;
