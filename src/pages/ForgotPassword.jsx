import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await forgotPassword(email);
    
    if (result.success) {
      setIsSubmitted(true);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) clearError();
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              Reset instructions have been sent to {email}
            </p>
            <Link to="/login" className="btn-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Trophy className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-gray-600">Enter your email to receive reset instructions</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex justify-center items-center"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Send Reset Email'}
          </button>

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-primary-600 hover:text-primary-500"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;