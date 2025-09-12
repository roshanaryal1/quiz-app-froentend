import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../config/api';
import { User, Mail, Phone, Calendar, Trophy, Save, Edit } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    preferredCategory: '',
    picture: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      setUser(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
        phoneNumber: response.data.phoneNumber || '',
        dateOfBirth: response.data.dateOfBirth || '',
        preferredCategory: response.data.preferredCategory || '',
        picture: response.data.picture || '',
      });
    } catch (error) {
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await userAPI.updateProfile(formData);
      setUser(response.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      preferredCategory: user.preferredCategory || '',
      picture: user.picture || '',
    });
    setIsEditing(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-3 rounded-full">
                  <User className="text-primary-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  <p className="text-gray-600">Manage your account information</p>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Edit size={16} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="form-label">First Name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="form-label">Last Name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="form-label">Username</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="form-input bg-gray-50"
                    />
                    <p className="mt-1 text-sm text-gray-500">Username cannot be changed</p>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="form-label">Role</label>
                    <input
                      id="role"
                      name="role"
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="form-input bg-gray-50"
                    />
                    <p className="mt-1 text-sm text-gray-500">Role cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="preferredCategory" className="form-label">Preferred Quiz Category</label>
                    <div className="relative">
                      <Trophy className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select
                        id="preferredCategory"
                        name="preferredCategory"
                        value={formData.preferredCategory}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`form-input pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                      >
                        <option value="">Select a category</option>
                        <option value="General Knowledge">General Knowledge</option>
                        <option value="Science & Nature">Science & Nature</option>
                        <option value="Sports">Sports</option>
                        <option value="History">History</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Geography">Geography</option>
                        <option value="Art">Art</option>
                        <option value="Politics">Politics</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="picture" className="form-label">Profile Picture URL</label>
                    <input
                      id="picture"
                      name="picture"
                      type="url"
                      value={formData.picture}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`form-input ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="https://example.com/your-picture.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;