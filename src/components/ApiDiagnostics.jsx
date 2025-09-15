import React, { useState } from 'react';
import { tournamentAPI, testAPI } from '../config/api';

const ApiDiagnostics = () => {
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const testResults = {};

    try {
      // Test API health
      const health = await testAPI.health();
      testResults.health = { success: true, data: health.data };
    } catch (error) {
      testResults.health = { success: false, error: error.message };
    }

    try {
      // Test categories
      const categories = await testAPI.categories();
      testResults.categories = { success: true, data: categories.data };
    } catch (error) {
      testResults.categories = { success: false, error: error.message };
    }

    try {
      // Test tournament fetch
      const tournaments = await tournamentAPI.getAll();
      testResults.tournaments = { success: true, data: tournaments.data };
    } catch (error) {
      testResults.tournaments = { success: false, error: error.message };
    }

    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    testResults.auth = {
      hasToken: !!token,
      hasUser: !!user,
      user: user ? JSON.parse(user) : null
    };

    setResults(testResults);
    setIsRunning(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Diagnostics</h2>
      
      <button 
        onClick={runDiagnostics}
        disabled={isRunning}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {isRunning ? 'Running...' : 'Run Diagnostics'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {Object.entries(results).map(([key, result]) => (
            <div key={key} className="border p-4 rounded">
              <h3 className="font-bold text-lg">{key.toUpperCase()}</h3>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostics;
