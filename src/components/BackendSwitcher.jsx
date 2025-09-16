// src/components/BackendSwitcher.jsx - Development backend switcher component
import React, { useState, useEffect } from 'react';
import { getCurrentApiUrl, switchBackend, checkApiHealth } from '../config/api';
import { Server, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const BackendSwitcher = () => {
  const [currentBackend, setCurrentBackend] = useState('');
  const [isHealthy, setIsHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const updateStatus = async () => {
    const url = getCurrentApiUrl();
    setCurrentBackend(url);
    
    setIsChecking(true);
    const healthy = await checkApiHealth();
    setIsHealthy(healthy);
    setIsChecking(false);
  };

  useEffect(() => {
    updateStatus();
  }, []);

  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      await switchBackend(true);
      await updateStatus();
    } catch (error) {
      console.error('Failed to switch backend:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const getBackendName = (url) => {
    if (url.includes('localhost')) {
      return 'Local';
    }
    if (url.includes('onrender.com')) {
      return 'Deployed';
    }
    return 'Unknown';
  };

  const getBackendColor = () => {
    if (isChecking) return 'text-yellow-600';
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    return isHealthy ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg border border-gray-200 p-3 z-50">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Backend:</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getBackendColor()}`}>
            {getBackendName(currentBackend)}
          </span>
          {getStatusIcon()}
        </div>
        
        <button
          onClick={handleSwitch}
          disabled={isSwitching}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {isSwitching ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span>{isSwitching ? 'Switching...' : 'Switch'}</span>
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 max-w-xs truncate" title={currentBackend}>
        {currentBackend}
      </div>
    </div>
  );
};

export default BackendSwitcher;
