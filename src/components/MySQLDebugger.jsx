import React, { useState, useEffect } from 'react';
import { tournamentAPI, testAPI, clearTournamentCache } from '../config/api';
import { Database, RefreshCw, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const MySQLDebugger = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [mysqlStatus, setMysqlStatus] = useState(null);

  const fetchTournaments = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎯 MySQLDebugger: Fetching tournaments...', forceRefresh ? '(force)' : '');
      const response = await tournamentAPI.getAll(forceRefresh);
      setTournaments(response.data || []);
      setLastFetch(new Date());
      console.log('✅ MySQLDebugger: Fetched', response.data?.length || 0, 'tournaments');
    } catch (err) {
      setError(err.message);
      console.error('❌ MySQLDebugger: Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  const testMySQLConnection = async () => {
    try {
      const result = await testAPI.mysql();
      setMysqlStatus(result);
      console.log('🗄️ MySQL test result:', result);
    } catch (err) {
      setMysqlStatus({ success: false, error: err.message });
    }
  };

  const clearCacheAndRefresh = () => {
    clearTournamentCache();
    fetchTournaments(true);
  };

  useEffect(() => {
    fetchTournaments();
    testMySQLConnection();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 flex items-center space-x-2">
          <Database className="text-blue-600" size={24} />
          <span>MySQL Tournament Debugger</span>
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => fetchTournaments(false)}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Fetch</span>
          </button>
          
          <button
            onClick={clearCacheAndRefresh}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            <Trash2 size={16} />
            <span>Clear Cache</span>
          </button>
        </div>
      </div>

      {/* MySQL Connection Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-semibold">MySQL Connection:</span>
          {mysqlStatus?.success === true && <CheckCircle className="text-green-500" size={20} />}
          {mysqlStatus?.success === false && <XCircle className="text-red-500" size={20} />}
          {mysqlStatus === null && <RefreshCw className="text-gray-400" size={20} />}
        </div>
        
        {mysqlStatus?.success === true && (
          <div className="text-sm text-green-700">
            ✅ Connected to MySQL - {Array.isArray(mysqlStatus.data) ? mysqlStatus.data.length : 'Unknown'} tournaments found
          </div>
        )}
        
        {mysqlStatus?.success === false && (
          <div className="text-sm text-red-700">
            ❌ MySQL Connection Failed: {mysqlStatus.error}
          </div>
        )}
      </div>

      {/* Tournament Data */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="bg-blue-50 p-3 rounded">
          <div className="font-semibold text-blue-800">Tournaments Found</div>
          <div className="text-2xl font-bold text-blue-600">{tournaments.length}</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded">
          <div className="font-semibold text-green-800">Last Fetch</div>
          <div className="text-sm text-green-600">
            {lastFetch ? lastFetch.toLocaleTimeString() : 'Never'}
          </div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded">
          <div className="font-semibold text-purple-800">Cache Status</div>
          <div className="text-sm text-purple-600">
            {localStorage.getItem('tournament_cache') ? 'Cached' : 'Empty'}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-semibold text-red-800">Error:</div>
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Tournament List */}
      {tournaments.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Tournaments from MySQL:</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {tournaments.map((tournament, index) => (
              <div key={tournament.id || index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{tournament.name || `Tournament ${index + 1}`}</div>
                <div className="text-gray-600 text-xs">
                  ID: {tournament.id} | Category: {tournament.category} | 
                  Created: {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tournaments.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <Database size={48} className="mx-auto mb-2 text-gray-300" />
          <div>No tournaments found in MySQL database</div>
          <div className="text-sm">Create some tournaments to see them here</div>
        </div>
      )}
    </div>
  );
};

export default MySQLDebugger;
