import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await resetPassword(token, formData.newPassword);
    
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Updated!</h2>
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
          <Link to="/login" className="btn-primary">
            Continue to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">This reset link is invalid or expired.</p>
          <Link to="/forgot-password" className="btn-primary">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Trophy className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="form-input pl-10 pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex justify-center items-center"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;