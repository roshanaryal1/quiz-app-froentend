// src/components/AuthDiagnostics.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { testAPI } from '../config/api';

const AuthDiagnostics = () => {
  const { isAuthenticated, user, token } = useAuth();
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [authTest, setAuthTest] = useState('Checking...');

  useEffect(() => {
    const checkApi = async () => {
      try {
        await testAPI.health();
        setApiStatus('✅ API is healthy');
      } catch (error) {
        setApiStatus('❌ API is not responding');
      }
    };

    const checkAuth = async () => {
      try {
        const response = await fetch('https://quiz-tournament-api.onrender.com/api/tournaments', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
          setAuthTest('✅ Authentication working');
        } else if (response.status === 401) {
          setAuthTest('❌ Not authenticated (401)');
        } else {
          setAuthTest(`❌ API Error (${response.status})`);
        }
      } catch (error) {
        setAuthTest('❌ Network error');
      }
    };

    checkApi();
    if (token) checkAuth();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Authentication Diagnostics</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Authentication Status:</h3>
              <p className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">User Info:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {user ? JSON.stringify(user, null, 2) : 'No user data'}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Token Status:</h3>
              <p className={token ? 'text-green-600' : 'text-red-600'}>
                {token ? '✅ Token present' : '❌ No token'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">API Health:</h3>
              <p>{apiStatus}</p>
            </div>

            <div>
              <h3 className="font-semibold">Tournament API Test:</h3>
              <p>{authTest}</p>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500">
              <p className="text-yellow-800">
                You need to log in to access admin and player features.
                <a href="/login" className="underline ml-2">Go to Login</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDiagnostics;