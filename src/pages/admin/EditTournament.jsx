import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { Calendar, Trophy, ArrowLeft, AlertCircle, CheckCircle, Info } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EditTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setIsLoading(true);
      const response = await tournamentAPI.getById(id);
      const tournamentData = response.data;
      
      setTournament(tournamentData);
      setFormData({
        name: tournamentData.name,
        startDate: new Date(tournamentData.startDate).toISOString().slice(0, 16),
        endDate: new Date(tournamentData.endDate).toISOString().slice(0, 16)
      });
    } catch (error) {
      setError('Failed to load tournament details');
      console.error('Error fetching tournament:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
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

    setIsSaving(true);
    setError('');

    try {
      const updateData = {
        name: formData.name,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      await tournamentAPI.update(id, updateData);
      
      setSuccess('Tournament updated successfully!');
      setTimeout(() => {
        navigate('/admin/tournaments');
      }, 1500);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update tournament';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getTournamentStatus = () => {
    if (!tournament) return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    if (now < startDate) return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    if (now > endDate) return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    return { label: 'Ongoing', color: 'bg-green-100 text-green-800' };
  };

  const status = getTournamentStatus();
  const canEdit = tournament && status.label !== 'Completed';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tournament..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tournament Not Found</h1>
            <p className="text-gray-600 mb-6">The tournament you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/admin/tournaments')}
              className="btn-primary"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-3 rounded-full">
                <Trophy className="text-primary-600" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Tournament</h1>
                <p className="text-gray-600 mt-1">Update tournament details</p>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Tournament Info Card */}
        <div className="card mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Current Tournament Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <p className="font-medium">{tournament.category}</p>
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span>
              <p className="font-medium capitalize">{tournament.difficulty}</p>
            </div>
            <div>
              <span className="text-gray-500">Minimum Passing Score:</span>
              <p className="font-medium">{tournament.minimumPassingScore}%</p>
            </div>
            <div>
              <span className="text-gray-500">Created by:</span>
              <p className="font-medium">{tournament.creator?.firstName} {tournament.creator?.lastName}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-500">Participants:</span>
              <p className="font-medium">{tournament.attempts?.length || 0} players</p>
            </div>
          </div>
        </div>

        {!canEdit && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <Info size={20} />
            <span>This tournament has been completed and cannot be edited.</span>
          </div>
        )}

        {/* Edit Form */}
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
                  disabled={!canEdit}
                  className={`form-input pl-10 ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter tournament name"
                  maxLength={100}
                />
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
                    disabled={!canEdit}
                    className={`form-input pl-10 ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
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
                    disabled={!canEdit}
                    className={`form-input pl-10 ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    min={formData.startDate}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Updated Tournament Preview</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {formData.name}</p>
                <p><span className="font-medium">Category:</span> {tournament.category} <span className="text-gray-500">(cannot be changed)</span></p>
                <p><span className="font-medium">Difficulty:</span> {tournament.difficulty} <span className="text-gray-500">(cannot be changed)</span></p>
                <p><span className="font-medium">Duration:</span> {
                  formData.startDate && formData.endDate
                    ? `${new Date(formData.startDate).toLocaleString()} - ${new Date(formData.endDate).toLocaleString()}`
                    : 'Not set'
                }</p>
                <p><span className="font-medium">Pass Score:</span> {tournament.minimumPassingScore}% <span className="text-gray-500">(cannot be changed)</span></p>
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
              {canEdit && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Trophy size={16} />
                      <span>Update Tournament</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Editing Limitations</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You can only edit the tournament name and dates</li>
            <li>• Category, difficulty, and minimum passing score cannot be changed after creation</li>
            <li>• Completed tournaments cannot be edited</li>
            <li>• If players have already participated, consider the impact of date changes</li>
            <li>• All registered players will be notified of significant changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditTournament;