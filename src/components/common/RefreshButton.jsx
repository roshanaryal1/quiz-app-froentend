import React from 'react';
import { RefreshCw } from 'lucide-react';
import { clearTournamentCache } from '../../config/api';

const RefreshButton = ({ onRefresh, isLoading = false, className = "" }) => {
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    clearTournamentCache();
    if (onRefresh) onRefresh(true); // Force refresh
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className={`btn-secondary inline-flex items-center space-x-2 disabled:opacity-50 ${className}`}
      title="Clear cache and refresh data"
    >
      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      <span>Refresh</span>
    </button>
  );
};

export default RefreshButton;
