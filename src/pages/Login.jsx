// src/pages/Login.jsx - Optimized for faster login
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Mail, Lock, Eye, EyeOff, AlertCircle, Wifi, WifiOff, Bug } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { debugLogin } from '../utils/debugLogin';

const Login = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = location.state?.from?.pathname || '/';
  const message = location.state?.message || searchParams.get('message');

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect if already authenticated - but don't block render
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) return;
    if (!formData.usernameOrEmail.trim() || !formData.password.trim()) return;
    
    try {
      const result = await login(formData);
      
      if (result.success) {
        // Don't wait for navigation, do it immediately
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Quick login function for testing
  const quickAdminLogin = async () => {
    setFormData({
      usernameOrEmail: 'admin',
      password: 'op@1234'
    });
    
    // Submit immediately
    const result = await login({
      usernameOrEmail: 'admin',
      password: 'op@1234'
    });
    
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const getErrorDisplay = () => {
    if (message) {
      return (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{message}</span>
        </div>
      );
    }
    
    if (!isOnline) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
          <WifiOff size={20} />
          <span>No internet connection</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Quiz Tournament account
          </p>
          
          {/* Connection Status */}
          <div className={`mt-2 flex items-center justify-center space-x-1 text-sm ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {getErrorDisplay()}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="usernameOrEmail" className="form-label">
                Username or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  type="text"
                  required
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  disabled={isLoading || !isOnline}
                  className={`form-input pl-10 ${
                    (!isOnline || isLoading) ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter your username or email"
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading || !isOnline}
                  className={`form-input pl-10 pr-10 ${
                    (!isOnline || isLoading) ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || !isOnline}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isOnline || !formData.usernameOrEmail.trim() || !formData.password.trim()}
            className="w-full btn-primary flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign up here
              </Link>
            </span>
          </div>

          {/* Debug Login */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => debugLogin(formData)}
              disabled={isLoading || !isOnline}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bug size={16} />
              <span>Debug Login Issue</span>
            </button>
          </div>

          {/* Quick Login for Testing */}
          <div className="mt-6 border-t pt-6">
            <div className="text-center text-sm text-gray-500 mb-3">
              <p>Quick Login (for testing):</p>
            </div>
            <button
              type="button"
              onClick={quickAdminLogin}
              disabled={isLoading || !isOnline}
              className="w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Login as Admin (admin / op@1234)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;