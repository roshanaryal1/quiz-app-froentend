import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { Play, Trophy, Clock, Award, Users, Calendar, Heart, Zap, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useParticipationStatus } from '../../hooks/useParticipationStatus';

const OngoingTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOngoingTournaments();
    // Refresh every 30 seconds to keep data current
    const interval = setInterval(fetchOngoingTournaments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOngoingTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await tournamentAPI.getOngoing();
      setTournaments(response.data);
    } catch (error) {
      setError('Failed to fetch ongoing tournaments');
      console.error('Error fetching ongoing tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const TournamentCard = ({ tournament }) => {
    const [likes, setLikes] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const { hasParticipated, loading: participationLoading } = useParticipationStatus(tournament.id);

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

      // Calculate time remaining
      const calculateTimeRemaining = () => {
        const now = new Date().getTime();
        const endTime = new Date(tournament.endDate).getTime();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
          setTimeRemaining('Ended');
          return;
        }
        
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h left`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m left`);
        } else {
          setTimeRemaining(`${minutes}m left`);
        }
      };

      calculateTimeRemaining();
      const timer = setInterval(calculateTimeRemaining, 60000); // Update every minute
      
      return () => clearInterval(timer);
    }, [tournament.id, tournament.endDate]);

    return (
      <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
              <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>LIVE</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              by {tournament.creator?.firstName} {tournament.creator?.lastName}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
              <Zap size={14} />
              <span>{timeRemaining}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <p className="font-medium">{tournament.category}</p>
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span>
              <p className={`font-medium capitalize ${
                tournament.difficulty === 'easy' ? 'text-green-600' :
                tournament.difficulty === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {tournament.difficulty}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>
              Started: {new Date(tournament.startDate).toLocaleDateString()} • 
              Ends: {new Date(tournament.endDate).toLocaleDateString()}
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
                <Heart className="text-red-500" size={16} />
                <span className="text-sm font-medium">{likes}</span>
              </div>
              <p className="text-xs text-gray-500">Likes</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            10 questions • Multiple choice
          </div>
          
          {!participationLoading && hasParticipated ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium">
                <CheckCircle size={16} />
                <span>Already Completed</span>
              </div>
              <Link
                to={`/player/tournaments/${tournament.id}/results`}
                className="btn-secondary inline-flex items-center space-x-2 w-full justify-center"
              >
                <Trophy size={16} />
                <span>View Results</span>
              </Link>
            </div>
          ) : (
            <Link
              to={`/player/tournaments/${tournament.id}`}
              className="btn-primary inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Play size={16} />
              <span>Play Now</span>
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading live tournaments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Play className="text-green-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Tournaments</h1>
              <p className="text-gray-600 mt-1">Jump into ongoing quiz competitions</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Zap className="text-green-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
                  <p className="text-gray-600">Live Now</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {tournaments.reduce((sum, t) => sum + (t.attempts?.length || 0), 0)}
                  </p>
                  <p className="text-gray-600">Active Players</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Trophy className="text-purple-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(tournaments.map(t => t.category)).size}
                  </p>
                  <p className="text-gray-600">Categories</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Clock className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Live Tournaments</h3>
            <p className="text-gray-600 mb-6">
              There are no tournaments currently running. Check back later or browse upcoming tournaments.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/player/tournaments" className="btn-primary">
                View All Tournaments
              </Link>
              <button
                onClick={fetchOngoingTournaments}
                className="btn-secondary"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map(tournament => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>

            {/* Tips Section */}
            <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-medium text-green-900 mb-4 flex items-center space-x-2">
                <Zap size={20} />
                <span>Live Tournament Tips</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <div>
                  <h4 className="font-medium mb-2">Quick Start</h4>
                  <ul className="space-y-1">
                    <li>• Click "Play Now" to jump into any live tournament</li>
                    <li>• You can only participate once per tournament</li>
                    <li>• All questions are multiple choice</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Strategy</h4>
                  <ul className="space-y-1">
                    <li>• Check the time remaining before starting</li>
                    <li>• Review the pass score requirement</li>
                    <li>• Start with your strongest categories</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                <Clock size={14} className="inline mr-1" />
                Page refreshes automatically every 30 seconds
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OngoingTournaments;