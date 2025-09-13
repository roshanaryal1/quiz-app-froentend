import React, { useState } from 'react';
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

  // Fetch categories when component mounts
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await testAPI.categories();
        setAvailableCategories(response.data);
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
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

      if (startDate <= now) {
        errors.push('Start date must be in the future');
      }
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }

    // Score validation
    const score = parseInt(formData.minimumPassingScore);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.push('Minimum passing score must be between 0 and 100');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Format dates to ISO format
      const tournamentData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        minimumPassingScore: parseInt(formData.minimumPassingScore)
      };

      await tournamentAPI.create(tournamentData);
      
      setSuccess('Tournament created successfully!');
      setTimeout(() => {
        navigate('/admin/tournaments');
      }, 1500);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create tournament';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'hard', label: 'Hard', color: 'text-red-600' }
  ];

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
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/tournaments')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary inline-flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Trophy size={16} />
                    <span>Create Tournament</span>
                  </>
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
            <li>• All registered players will be notified via email when you create a tournament</li>
            <li>• You can edit tournament name and dates after creation, but not category or difficulty</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament;