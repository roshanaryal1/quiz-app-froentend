import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { Trophy, Clock, Award, Play, Heart, Users, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PlayerTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

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
              {tournament.name}
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
              <p className="font-medium">{tournament.category}</p>
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span>
              <p className="font-medium capitalize">{tournament.difficulty}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>
              {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Award className="text-amber-500" size={16} />
                <span className="text-sm font-medium">{tournament.minimumPassingScore}%</span>
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
            by {tournament.creator?.firstName} {tournament.creator?.lastName}
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
          <h1 className="text-3xl font-bold text-gray-900">Quiz Tournaments</h1>
          <p className="text-gray-600 mt-1">Challenge yourself with exciting quiz competitions</p>
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