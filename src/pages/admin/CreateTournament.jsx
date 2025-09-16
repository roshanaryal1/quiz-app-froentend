// src/pages/admin/CreateTournament.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, testAPI } from '../../config/api';
import { Calendar, Trophy, Tag, Target, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CreateTournament = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    difficulty: 'medium',
    startDate: '',
    endDate: '',
    minimumPassingScore: 70
  });

  // Add error boundary to catch React errors
  const [hasError, setHasError] = useState(false);

  // Fetch categories when component mounts - FIXED API CALL
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from API...');
        
        // FIXED: Use testAPI.categories() instead of tournamentAPI.getCategories()
        const response = await testAPI.categories();
        console.log('Categories response:', response);
        
        if (response.data && Array.isArray(response.data)) {
          setAvailableCategories(response.data);
        } else {
          // Fallback categories if API response is not as expected
          setAvailableCategories([
            'General Knowledge',
            'Science & Nature',
            'Sports',
            'History',
            'Entertainment',
            'Geography',
            'Art',
            'Politics'
          ]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        
        // Fallback categories if API fails
        setAvailableCategories([
          'General Knowledge',
          'Science & Nature',
          'Sports',
          'History',
          'Entertainment',
          'Geography',
          'Art',
          'Politics'
        ]);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    try {
      const { name, value } = e.target;
      console.log(`Form field changed: ${name} = ${value}`);
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (error) setError('');
      if (success) setSuccess('');
    } catch (error) {
      console.error('Error in handleChange:', error);
      setError(`Form error: ${error.message}`);
    }
  };

  const validateForm = () => {
    try {
      console.log('Validating form data:', formData);
      const errors = [];

      if (!formData.name.trim()) {
        errors.push('Tournament name is required');
      }
      if (!formData.category) {
        errors.push('Category is required');
      }
      if (!formData.startDate) {
        errors.push('Start date is required');
      }
      if (!formData.endDate) {
        errors.push('End date is required');
      }

      // Date validation
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        console.log('Date validation:', { startDate, endDate, now, fiveMinutesFromNow });

        // Allow start date to be up to 5 minutes in the past (for timezone issues)
        if (startDate < new Date(now.getTime() - 5 * 60 * 1000)) {
          errors.push('Start date cannot be more than 5 minutes in the past');
        }
        if (endDate <= startDate) {
          errors.push('End date must be after start date');
        }
        // Ensure tournament duration is at least 30 minutes
        const duration = endDate.getTime() - startDate.getTime();
        if (duration < 30 * 60 * 1000) { // 30 minutes
          errors.push('Tournament must be at least 30 minutes long');
        }
      }

      // Score validation
      const score = parseInt(formData.minimumPassingScore);
      if (isNaN(score) || score < 0 || score > 100) {
        errors.push('Minimum passing score must be between 0 and 100');
      }

      console.log('Validation errors:', errors);
      return errors;
    } catch (error) {
      console.error('Error in validateForm:', error);
      return [`Validation error: ${error.message}`];
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      console.log('Form submitted, starting validation...');
      console.log('Current form data:', formData);
      
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        console.log('Validation failed:', validationErrors);
        setError(validationErrors[0]);
        return;
      }

      setIsLoading(true);
      setError('');
      setSuccess('');

      console.log('Sending tournament data to API:', formData);

      // Format dates to ISO format
      const tournamentData = {
        name: formData.name.trim(),
        category: formData.category,
        difficulty: formData.difficulty,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        minimumPassingScore: parseInt(formData.minimumPassingScore)
      };

      console.log('Formatted tournament data:', tournamentData);

      const response = await tournamentAPI.create(tournamentData);
      console.log('Tournament creation response:', response);
      console.log('Response data:', response.data);
      
      setSuccess(`Tournament "${response.data.name || tournamentData.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        difficulty: 'medium',
        startDate: '',
        endDate: '',
        minimumPassingScore: 70
      });
      
      // Navigate back after a short delay
      setTimeout(() => {
        console.log('Navigating to tournaments page...');
        navigate('/admin/tournaments');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating tournament:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to create tournament';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create tournaments.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid tournament data. Please check all fields.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. The tournament may have been created but not visible yet. Please refresh the tournaments page.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors)[0];
      } else if (error.message) {
        errorMessage = error.message;
      } else if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-red-800 mb-4">Something went wrong</h2>
            <p className="text-red-700 mb-4">The component encountered an error. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'hard', label: 'Hard', color: 'text-red-600' }
  ];

  // Check if form is ready for submission
  const isFormReady = availableCategories.length > 0 && !hasError;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Tournaments
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-full">
              <Trophy className="text-primary-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Tournament</h1>
              <p className="text-gray-600 mt-1">Set up a new quiz tournament for players</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div>
              <label htmlFor="name" className="form-label">
                Tournament Name *
              </label>
              <div className="relative">
                <Trophy className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder="Enter tournament name"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Category and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="form-label">
                  Category *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="form-input pl-10"
                  >
                    <option value="">Select a category</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="difficulty" className="form-label">
                  Difficulty *
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  required
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="form-input"
                >
                  {difficulties.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start and End Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="form-label">
                  Start Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input pl-10"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endDate" className="form-label">
                  End Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={handleChange}
                    className="form-input pl-10"
                    min={formData.startDate || new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            </div>

            {/* Minimum Passing Score */}
            <div>
              <label htmlFor="minimumPassingScore" className="form-label">
                Minimum Passing Score (%)
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="minimumPassingScore"
                  name="minimumPassingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minimumPassingScore}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder="70"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Players need to score at least this percentage to pass the tournament
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Tournament Preview</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {formData.name || 'Not set'}</p>
                <p><span className="font-medium">Category:</span> {formData.category || 'Not set'}</p>
                <p><span className="font-medium">Difficulty:</span> {formData.difficulty}</p>
                <p><span className="font-medium">Duration:</span> {
                  formData.startDate && formData.endDate
                    ? `${new Date(formData.startDate).toLocaleString()} - ${new Date(formData.endDate).toLocaleString()}`
                    : 'Not set'
                }</p>
                <p><span className="font-medium">Pass Score:</span> {formData.minimumPassingScore}%</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-2 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/tournaments')}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !isFormReady}
                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Create Tournament'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Tournament Creation Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Questions will be automatically fetched from the selected category</li>
            <li>• Each tournament will have exactly 10 questions</li>
            <li>• Players can only participate once per tournament</li>
            <li>• You can edit tournament name and dates after creation, but not category or difficulty</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament;