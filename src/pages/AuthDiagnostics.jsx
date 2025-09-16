// src/pages/AuthDiagnostics.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { testAPI } from '../config/api';

const AuthDiagnostics = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Authentication Status</h1>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium">Authentication Status</h3>
            <p>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            {user && <p>User: {user.username} ({user.role})</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDiagnostics;