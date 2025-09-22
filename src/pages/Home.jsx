// src/pages/Home.jsx - Fixed version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Users, Clock, Award, Play, Shield, AlertCircle } from 'lucide-react';
import { tournamentAPI, checkApiHealth, warmupApi } from '../config/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState({
    totalTournaments: 0,
    ongoingTournaments: 0,
    totalParticipants: 0,
  });
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError('');

      // First check if API is healthy
      const isHealthy = await checkApiHealth();
      
      if (!isHealthy) {
        setIsWarmingUp(true);
        await warmupApi();
        setIsWarmingUp(false);
      }

      await fetchHomeData();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setError('Unable to connect to the server. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
      setIsWarmingUp(false);
    }
  };

  const fetchHomeData = async () => {
    try {
      // Fetch tournaments data 
      const tournamentsResponse = await tournamentAPI.getAll().catch(err => ({ data: [] }));

      // Ensure tournaments is always an array
      let tournaments = tournamentsResponse.data || [];
      
      // Check if tournaments is actually an array
      if (!Array.isArray(tournaments)) {
        console.error('API returned non-array data:', tournaments);
        tournaments = [];
      }
      
      setRecentTournaments(tournaments.slice(0, 3));
      
      // Calculate basic stats
      const now = new Date();
      const ongoing = tournaments.filter(t => 
        new Date(t.startDate) <= now && new Date(t.endDate) >= now
      );
      
      setStats({
        totalTournaments: tournaments.length,
        ongoingTournaments: ongoing.length,
        totalParticipants: tournaments.reduce((sum, t) => sum + (t.attempts?.length || 0), 0),
      });

    } catch (error) {
      console.error('Error fetching home data:', error);
      
      // Set empty arrays as fallback
      setRecentTournaments([]);
      setStats({
        totalTournaments: 0,
        ongoingTournaments: 0,
        totalParticipants: 0,
      });
      
      setError('Some data could not be loaded. Please try refreshing.');
    }
  };

  const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      amber: 'text-amber-600 bg-amber-100',
    };

    return (
      <div className="card">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-600">{label}</p>
          </div>
        </div>
      </div>
    );
  };

  const TournamentCard = ({ tournament }) => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    const getStatus = () => {
      if (now < startDate) return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
      if (now > endDate) return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
      return { label: 'Ongoing', color: 'bg-green-100 text-green-800' };
    };

    const status = getStatus();

    return (
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {tournament.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Trophy size={16} />
            <span>{tournament.category}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={16} />
            <span>
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Award size={16} />
            <span>Pass score: {tournament.minimumPassingScore}%</span>
          </div>
        </div>
        
        {isAuthenticated && user?.role === 'PLAYER' && status.label === 'Ongoing' && (
          <div className="mt-4">
            <Link 
              to={`/player/tournaments/${tournament.id}`}
              className="btn-primary w-full text-center"
            >
              Play Now
            </Link>
          </div>
        )}
      </div>
    );
  };

  // Loading screen with API warmup message
  if (isLoading || isWarmingUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isWarmingUp ? 'Waking up the server... This may take up to 30 seconds.' : 'Loading...'}
          </p>
          {isWarmingUp && (
            <p className="mt-2 text-sm text-gray-500">
              The server was sleeping and is now starting up. Please wait...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error screen with retry option
  if (error && recentTournaments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={initializeApp}
            className="btn-primary mr-4"
          >
            Try Again
          </button>
          <Link to="/login" className="btn-secondary">
            Continue to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show error banner but don't block the page */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Quiz Tournament Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Challenge your knowledge, compete with others, and climb the leaderboards in exciting quiz tournaments
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/register" 
                  className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="border border-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user?.role === 'PLAYER' ? (
                  <>
                    <Link 
                      to="/player/ongoing" 
                      className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                    >
                      <Play size={20} />
                      <span>Play Now</span>
                    </Link>
                    <Link 
                      to="/player/tournaments" 
                      className="border border-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      View All Tournaments
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/admin/tournaments" 
                      className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                    >
                      <Shield size={20} />
                      <span>Manage Tournaments</span>
                    </Link>
                    <Link 
                      to="/admin/create-tournament" 
                      className="border border-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      Create Tournament
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={Trophy} 
            label="Total Tournaments" 
            value={stats.totalTournaments}
            color="blue"
          />
          <StatCard 
            icon={Play} 
            label="Active Now" 
            value={stats.ongoingTournaments}
            color="green"
          />
          <StatCard 
            icon={Users} 
            label="Total Participants" 
            value={stats.totalParticipants}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Tournaments */}
      {Array.isArray(recentTournaments) && recentTournaments.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Tournaments</h2>
            <p className="text-gray-600">Join the excitement and test your knowledge</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {recentTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
          
          <div className="text-center">
            <Link 
              to={isAuthenticated ? (user?.role === 'PLAYER' ? '/player/tournaments' : '/admin/tournaments') : '/login'} 
              className="btn-primary"
            >
              View All Tournaments
            </Link>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
            <p className="text-gray-600">Discover what makes our quiz tournaments special</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Competitive Tournaments</h3>
              <p className="text-gray-600 text-sm">Participate in exciting quiz competitions with players worldwide</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Real-time Results</h3>
              <p className="text-gray-600 text-sm">Get instant feedback and see your scores immediately</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Community Driven</h3>
              <p className="text-gray-600 text-sm">Join a community of quiz enthusiasts and learners</p>
            </div>
            
            <div className="text-center">
              <div className="bg-amber-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="text-amber-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Achievements</h3>
              <p className="text-gray-600 text-sm">Track your progress and earn recognition for your knowledge</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;