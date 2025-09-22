import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI, clearTournamentCache } from '../../config/api';
import { Trophy, Clock, Award, Play, Heart, Users, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PlayerTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [refreshTrigger]);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await tournamentAPI.getAll();
      
      // Check if there's an error in the response
      if (response.error) {
        setError(`Failed to load tournaments: ${response.error}`);
        setTournaments([]);
        return;
      }
      
      // Handle different possible response structures
      let tournamentsData = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response
        tournamentsData = response.data;
      } else if (Array.isArray(response.data?.tournaments)) {
        // Nested array in tournaments property
        tournamentsData = response.data.tournaments;
      } else if (response.data && typeof response.data === 'object') {
        // Try to find arrays in the response object
        const keys = Object.keys(response.data);
        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            tournamentsData = response.data[key];
            break;
          }
        }
      }
      
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Player: Error fetching tournaments:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tournaments';
      setError(errorMessage);
      
      // Set empty array as fallback
      setTournaments([]);
      
      // If it's a network error, show a more helpful message
      if (!navigator.onLine) {
        setError('You appear to be offline. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. The server might be busy or unavailable.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTournamentStatus = (tournament) => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'ongoing';
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === 'all') return true;
    return getTournamentStatus(tournament) === filter;
  });

  const TournamentCard = ({ tournament }) => {
    const status = getTournamentStatus(tournament);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

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

    const getStatusColor = () => {
      switch (status) {
        case 'upcoming': return 'bg-yellow-100 text-yellow-800';
        case 'ongoing': return 'bg-green-100 text-green-800';
        case 'completed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusLabel = () => {
      switch (status) {
        case 'upcoming': return 'Upcoming';
        case 'ongoing': return 'Live Now';
        case 'completed': return 'Completed';
        default: return 'Unknown';
      }
    };

    return (
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {tournament.name || 'Unnamed Tournament'}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
          
          {status === 'ongoing' && (
            <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>LIVE</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
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

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>
              {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'} - {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Award className="text-amber-500" size={16} />
                <span className="text-sm font-medium">{tournament.minimumPassingScore || 70}%</span>
              </div>
              <p className="text-xs text-gray-500">Pass Score</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Users className="text-blue-500" size={16} />
                <span className="text-sm font-medium">{tournament.attempts?.length || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Players</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Heart className={`${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} size={16} />
                <span className="text-sm font-medium">{likes}</span>
              </div>
              <p className="text-xs text-gray-500">Likes</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            by {tournament.creator?.firstName || 'Unknown'} {tournament.creator?.lastName || 'Creator'}
          </div>
          
          {status === 'ongoing' ? (
            <Link
              to={`/player/tournaments/${tournament.id}`}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Play size={16} />
              <span>Play Now</span>
            </Link>
          ) : status === 'upcoming' ? (
            <button
              disabled
              className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed inline-flex items-center space-x-2"
            >
              <Clock size={16} />
              <span>Coming Soon</span>
            </button>
          ) : (
            <Link
              to={`/player/tournaments/${tournament.id}/results`}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Trophy size={16} />
              <span>View Results</span>
            </Link>
          )}
        </div>
      </div>
    );
  };

  // Function to manually refresh tournaments
  const refreshTournaments = () => {
    clearTournamentCache(); // Clear cache before fetching
    setRefreshTrigger(prev => prev + 1);
  };

  // Refresh when component becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshTournaments();
      }
    };

    const handleFocus = () => {
      refreshTournaments();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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
              <h1 className="text-3xl font-bold text-gray-900">Quiz Tournaments</h1>
              <p className="text-gray-600 mt-1">Challenge yourself with exciting quiz competitions</p>
            </div>
            <button
              onClick={refreshTournaments}
              disabled={isLoading}
              className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
              title="Refresh tournaments list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all', label: 'All Tournaments', count: tournaments.length },
            { key: 'ongoing', label: 'Live Now', count: tournaments.filter(t => getTournamentStatus(t) === 'ongoing').length },
            { key: 'upcoming', label: 'Upcoming', count: tournaments.filter(t => getTournamentStatus(t) === 'upcoming').length },
            { key: 'completed', label: 'Completed', count: tournaments.filter(t => getTournamentStatus(t) === 'completed').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No tournaments available' : `No ${filter} tournaments`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Check back later for new quiz tournaments'
                : `There are no ${filter} tournaments at the moment`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn-primary"
              >
                View All Tournaments
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerTournaments;