// ================================
// 1. src/pages/admin/AdminTournaments.jsx
// ================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { tournamentAPI, clearTournamentCache } from '../../config/api';
import { Plus, Edit, Trash2, Eye, Trophy, Users, ThumbsUp, Calendar, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, tournament: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    
    // Always fetch tournaments when component mounts or location changes
    fetchTournaments(true); // Force refresh on mount
    
    // Listen for tournament creation events via localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'tournament_created') {
        fetchTournaments(true);
        localStorage.removeItem('tournament_created');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]); // Dependency on location.pathname ensures refresh on navigation

  const fetchTournaments = async (forceClear = false) => {
    try {
      setIsLoading(true);
      setError('');
      
      
      // Force clear cache if requested
      if (forceClear) {
        clearTournamentCache();
      }
      
      
      // Fetch tournaments with force refresh to bypass cache
      const response = await tournamentAPI.getAll(forceClear);
      
      // Handle different possible response structures more robustly
      let tournamentsData = [];
      
      if (Array.isArray(response.data)) {
        tournamentsData = response.data;
      } else if (response.data && response.data.tournaments) {
        tournamentsData = response.data.tournaments;
      } else if (response.data && response.data.content) {
        tournamentsData = response.data.content;
      } else if (response.data && response.data.data) {
        tournamentsData = response.data.data;
      } else if (response.data) {
        // Try to find any array in the response
        const keys = Object.keys(response.data);
        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            tournamentsData = response.data[key];
            break;
          }
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(tournamentsData)) {
        console.warn('⚠️ Admin: No valid tournament array found, using empty array');
        tournamentsData = [];
      }
      
      
      // Update state with fetched tournaments
      setTournaments(tournamentsData);
      
      // Clear any previous errors
      setError('');
      
    } catch (error) {
      console.error('❌ Admin: Error fetching tournaments:', error);
      console.error('❌ Admin: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      // Set user-friendly error message based on error type
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view tournaments.');
      } else if (error.response?.status === 404) {
        setError('Tournament service not found. Please check your connection.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Failed to fetch tournaments. Please try again.');
      }
      
      // Set empty array on error to prevent undefined issues
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!deleteModal.tournament) return;

    setIsDeleting(true);
    try {
      await tournamentAPI.delete(deleteModal.tournament.id);
      setTournaments(prev => prev.filter(t => t.id !== deleteModal.tournament.id));
      setDeleteModal({ isOpen: false, tournament: null });
      setSuccessMessage('Tournament deleted successfully');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error deleting tournament:', error);
      setError(error.response?.data?.message || 'Failed to delete tournament');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTournamentStatus = (tournament) => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    if (now < startDate) {
      return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (now > endDate) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    }
    return { label: 'Ongoing', color: 'bg-green-100 text-green-800' };
  };

  const TournamentCard = ({ tournament }) => {
    const status = getTournamentStatus(tournament);
    const [likes, setLikes] = useState(0);

    useEffect(() => {
      const fetchLikes = async () => {
        try {
          const response = await tournamentAPI.getLikes(tournament.id);
          setLikes(response.data || 0);
        } catch (error) {
          console.error('Error fetching likes:', error);
          setLikes(0);
        }
      };
      fetchLikes();
    }, [tournament.id]);

    const participantCount = Array.isArray(tournament.attempts) ? tournament.attempts.length : 0;

    return (
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {tournament.name || 'Unnamed Tournament'}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/admin/edit-tournament/${tournament.id}`)}
              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit Tournament"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, tournament })}
              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Tournament"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <p className="font-medium">{tournament.category || 'General'}</p>
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span>
              <p className="font-medium capitalize">{tournament.difficulty || 'medium'}</p>
            </div>
          </div>

          <div className="text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar size={16} />
              <span>
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'} - {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Trophy className="text-amber-500" size={16} />
                <span className="text-sm font-medium">{tournament.minimumPassingScore || 70}%</span>
              </div>
              <p className="text-xs text-gray-500">Pass Score</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Users className="text-blue-500" size={16} />
                <span className="text-sm font-medium">{participantCount}</span>
              </div>
              <p className="text-xs text-gray-500">Participants</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <ThumbsUp className="text-green-500" size={16} />
                <span className="text-sm font-medium">{likes}</span>
              </div>
              <p className="text-xs text-gray-500">Likes</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                Created by: <span className="font-medium">
                  {tournament.creator?.firstName || 'Unknown'} {tournament.creator?.lastName || 'Creator'}
                </span>
              </span>
              <button
                onClick={() => {
                  // Navigate to tournament details or show more info
                }}
                className="text-primary-600 hover:text-primary-800 inline-flex items-center space-x-1"
              >
                <Eye size={16} />
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Check for success message from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tournaments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournament Management</h1>
              <p className="text-gray-600 mt-1">Create, edit, and manage quiz tournaments</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchTournaments}
                disabled={isLoading}
                className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
                title="Refresh tournaments list"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <Link
                to="/admin/create-tournament"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Tournament</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Trophy className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
                <p className="text-gray-600">Total Tournaments</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Trophy className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments.filter(t => getTournamentStatus(t).label === 'Ongoing').length}
                </p>
                <p className="text-gray-600">Active Now</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Calendar className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments.filter(t => getTournamentStatus(t).label === 'Upcoming').length}
                </p>
                <p className="text-gray-600">Upcoming</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments.reduce((sum, t) => sum + (Array.isArray(t.attempts) ? t.attempts.length : 0), 0)}
                </p>
                <p className="text-gray-600">Total Participants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments created yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first tournament to get started with the quiz platform
            </p>
            <Link
              to="/admin/create-tournament"
              className="btn-primary"
            >
              Create Your First Tournament
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, tournament: null })}
          title="Delete Tournament"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
              <div>
                <h4 className="font-medium text-red-800">Are you sure?</h4>
                <p className="text-sm text-red-700">This action cannot be undone.</p>
              </div>
            </div>

            {deleteModal.tournament && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Tournament Details:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {deleteModal.tournament.name}</p>
                  <p><span className="font-medium">Category:</span> {deleteModal.tournament.category}</p>
                  <p><span className="font-medium">Participants:</span> {Array.isArray(deleteModal.tournament.attempts) ? deleteModal.tournament.attempts.length : 0}</p>
                  <p><span className="font-medium">Status:</span> {getTournamentStatus(deleteModal.tournament).label}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setDeleteModal({ isOpen: false, tournament: null })}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTournament}
                disabled={isDeleting}
                className="btn-danger inline-flex items-center space-x-2"
              >
                {isDeleting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Tournament</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Quick Actions */}
        {tournaments.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-4">Quick Actions & Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Management Tips</h4>
                <ul className="space-y-1">
                  <li>• Monitor ongoing tournaments regularly</li>
                  <li>• Check participant engagement and scores</li>
                  <li>• Update tournament details as needed</li>
                  <li>• Create tournaments across different categories</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Best Practices</h4>
                <ul className="space-y-1">
                  <li>• Set appropriate difficulty levels for your audience</li>
                  <li>• Schedule tournaments at peak engagement times</li>
                  <li>• Review and analyze tournament results</li>
                  <li>• Gather feedback from participants</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTournaments;
