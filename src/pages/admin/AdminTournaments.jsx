import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { Plus, Edit, Trash2, Eye, Trophy, Users, ThumbsUp, Calendar, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, tournament: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await tournamentAPI.getAll();
      setTournaments(response.data);
    } catch (error) {
      setError('Failed to fetch tournaments');
      console.error('Error fetching tournaments:', error);
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
    } catch (error) {
      setError('Failed to delete tournament');
      console.error('Error deleting tournament:', error);
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
          setLikes(response.data);
        } catch (error) {
          console.error('Error fetching likes:', error);
        }
      };
      fetchLikes();
    }, [tournament.id]);

    return (
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tournament.name}</h3>
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
              <p className="font-medium">{tournament.category}</p>
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span>
              <p className="font-medium capitalize">{tournament.difficulty}</p>
            </div>
          </div>

          <div className="text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar size={16} />
              <span>
                {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Trophy className="text-amber-500" size={16} />
                <span className="text-sm font-medium">{tournament.minimumPassingScore}%</span>
              </div>
              <p className="text-xs text-gray-500">Pass Score</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Users className="text-blue-500" size={16} />
                <span className="text-sm font-medium">{tournament.attempts?.length || 0}</span>
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
                Created by: <span className="font-medium">{tournament.creator?.firstName} {tournament.creator?.lastName}</span>
              </span>
              <button
                onClick={() => navigate(`/admin/tournament-details/${tournament.id}`)}
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
            <Link
              to="/admin/create-tournament"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Tournament</span>
            </Link>
          </div>
        </div>

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
              <div className="bg-yellow