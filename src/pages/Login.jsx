import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Mail, Lock, Eye, EyeOff, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

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

  const from = location.state?.from?.pathname || '/';
  const message = location.state?.message;

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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      return;
    }
    
    if (!formData.usernameOrEmail.trim() || !formData.password.trim()) {
      return;
    }
    
    console.log('Submitting login form');
    const result = await login(formData);
    
    if (result.success) {
      console.log('Login successful, redirecting to:', from);
      navigate(from, { replace: true });
    }
  };

  const getErrorDisplay = () => {
    if (!isOnline) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
          <WifiOff size={20} />
          <span>No internet connection. Please check your network and try again.</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
          <AlertCircle size={20} />
          <div>
            <p>{error}</p>
            {error.includes('connect') && (
              <p className="text-sm mt-1">
                The server might be starting up. Please wait a moment and try again.
              </p>
            )}
          </div>
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
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {message}
            </div>
          )}
          
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
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isOnline || !formData.usernameOrEmail.trim() || !formData.password.trim()}
            className="w-full btn-primary flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <span>Sign In</span>
              </>
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

          <div className="mt-6 border-t pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>Default Admin Credentials (for testing):</p>
              <p className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                Username: admin | Password: op@1234
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;