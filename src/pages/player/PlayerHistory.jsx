// src/pages/player/PlayerHistory.jsx - Fixed version with better error handling
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Calendar, Award, TrendingUp, BarChart3, Target, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PlayerHistory = () => {
  const { user } = useAuth();
  const [participatedTournaments, setParticipatedTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchPlayerHistory();
  }, []);

  const fetchPlayerHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let tournamentData = [];
      
      try {
        // Method 1: Try the dedicated participated endpoint
        const participatedResponse = await tournamentAPI.getParticipated();
        
        if (participatedResponse?.data && Array.isArray(participatedResponse.data)) {
          tournamentData = participatedResponse.data;
        }
      } catch (participatedError) {
        
        try {
          // Method 2: Try getting all tournaments and check for participation
          const allTournamentsResponse = await tournamentAPI.getAll();
          
          let allTournaments = [];
          if (Array.isArray(allTournamentsResponse.data)) {
            allTournaments = allTournamentsResponse.data;
          } else if (allTournamentsResponse.data?.tournaments) {
            allTournaments = allTournamentsResponse.data.tournaments;
          }
          
          // Filter tournaments where user has participated
          // This requires checking if the user has scores/attempts in each tournament
          const participatedPromises = allTournaments.map(async (tournament) => {
            try {
              const scoresResponse = await tournamentAPI.getScores(tournament.id);
              const scores = scoresResponse?.data?.scores || scoresResponse?.data || [];
              
              // Check if current user has a score entry
              const userScore = scores.find(score => 
                score.userId === user?.id || 
                score.userName === user?.username ||
                score.playerName === user?.username
              );
              
              if (userScore) {
                return {
                  ...tournament,
                  userScore: userScore.playerScore || userScore.score,
                  userAttempts: userScore.attempts || 1,
                  participationDate: userScore.participationDate || userScore.completedDate || tournament.endDate,
                  passed: userScore.passed || (userScore.playerScore || userScore.score || 0) >= Math.round((tournament.minimumPassingScore || 70) * 10 / 100)
                };
              }
              return null;
            } catch (error) {
              return null;
            }
          });
          
          const participatedResults = await Promise.allSettled(participatedPromises);
          tournamentData = participatedResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
            
        } catch (allTournamentsError) {
          
          try {
            // Method 3: Try getting past tournaments as fallback
            const pastResponse = await tournamentAPI.getPast();
            
            if (pastResponse?.data && Array.isArray(pastResponse.data)) {
              tournamentData = pastResponse.data.filter(tournament => {
                // Basic check if tournament has any indication of user participation
                return tournament.userScore !== undefined || 
                       tournament.participated === true ||
                       tournament.userAttempts > 0;
              });
            }
          } catch (pastError) {
            console.error('❌ All methods failed:', pastError.message);
            throw new Error('Unable to fetch player history. Please try again later.');
          }
        }
      }
      
      // Sort and set the data
      const sortedData = sortTournaments(tournamentData, sortBy);
      setParticipatedTournaments(sortedData);
      
      if (sortedData.length === 0) {
        setError('No tournament history found. Start participating in tournaments to see your history here!');
      }
      
    } catch (error) {
      console.error('❌ Error fetching player history:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load tournament history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sortTournaments = (tournaments, sortType) => {
    const sorted = [...tournaments];
    
    switch (sortType) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.participationDate || b.endDate || b.createdAt) - new Date(a.participationDate || a.endDate || a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.participationDate || a.endDate || a.createdAt) - new Date(b.participationDate || b.endDate || b.createdAt));
      case 'score-high':
        return sorted.sort((a, b) => (b.userScore || 0) - (a.userScore || 0));
      case 'score-low':
        return sorted.sort((a, b) => (a.userScore || 0) - (b.userScore || 0));
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return sorted;
    }
  };

  const filterTournaments = (tournaments, filterType) => {
    switch (filterType) {
      case 'passed':
        return tournaments.filter(t => t.passed === true || (t.userScore || 0) >= Math.round((t.minimumPassingScore || 70) * 10 / 100));
      case 'failed':
        return tournaments.filter(t => t.passed === false || (t.userScore || 0) < Math.round((t.minimumPassingScore || 70) * 10 / 100));
      case 'high-score':
        return tournaments.filter(t => (t.userScore || 0) >= 8);
      default:
        return tournaments;
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    const sorted = sortTournaments(participatedTournaments, newSortBy);
    setParticipatedTournaments(sorted);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchPlayerHistory();
  };

  const getScoreColor = (score, passingScore = 5) => {
    if (score >= 9) return 'text-green-600 bg-green-50';
    if (score >= 7) return 'text-blue-600 bg-blue-50';
    if (score >= passingScore) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (tournament) => {
    const score = tournament.userScore || 0;
    const passingScoreAbsolute = Math.round((tournament.minimumPassingScore || 70) * 10 / 100);
    const passed = tournament.passed !== undefined ? tournament.passed : score >= passingScoreAbsolute;
    
    if (passed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    }
  };

  const calculateStats = () => {
    if (participatedTournaments.length === 0) {
      return { totalParticipated: 0, averageScore: 0, passedCount: 0, passRate: 0, bestScore: 0 };
    }

    const totalParticipated = participatedTournaments.length;
    const totalScore = participatedTournaments.reduce((sum, t) => sum + (t.userScore || 0), 0);
    const averageScore = totalScore / totalParticipated;
    const passedCount = participatedTournaments.filter(t => {
      const score = t.userScore || 0;
      const passingScoreAbsolute = Math.round((t.minimumPassingScore || 70) * 10 / 100);
      return t.passed !== undefined ? t.passed : score >= passingScoreAbsolute;
    }).length;
    const passRate = (passedCount / totalParticipated) * 100;
    const bestScore = Math.max(...participatedTournaments.map(t => t.userScore || 0));

    return { totalParticipated, averageScore, passedCount, passRate, bestScore };
  };

  const stats = calculateStats();
  const filteredTournaments = filterTournaments(participatedTournaments, filter);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your tournament history..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
                My Tournament History
              </h1>
              <p className="text-gray-600 mt-2">Track your quiz performance and achievements</p>
            </div>
            <button
              onClick={handleRetry}
              className="btn-secondary flex items-center"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <XCircle className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load History</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-4">
                <button onClick={handleRetry} className="btn-primary">
                  Try Again
                </button>
                <Link to="/player/tournaments" className="btn-secondary">
                  Browse Tournaments
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!error && participatedTournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Participated</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalParticipated}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}/10</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bestScore}/10</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.passedCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.passRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        {!error && participatedTournaments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
                {[
                  { key: 'all', label: 'All Tournaments' },
                  { key: 'passed', label: 'Passed' },
                  { key: 'failed', label: 'Failed' },
                  { key: 'high-score', label: 'High Score (8+)' }
                ].map(filterOption => (
                  <button
                    key={filterOption.key}
                    onClick={() => handleFilterChange(filterOption.key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="form-input py-1 px-2 text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score-high">Highest Score</option>
                  <option value="score-low">Lowest Score</option>
                  <option value="name">Tournament Name</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tournament History List */}
        {!error && filteredTournaments.length > 0 ? (
          <div className="space-y-4">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                        {getStatusBadge(tournament)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {tournament.participationDate 
                              ? new Date(tournament.participationDate).toLocaleDateString()
                              : tournament.endDate 
                                ? new Date(tournament.endDate).toLocaleDateString()
                                : 'Date not available'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          <span>Category: {tournament.category || 'General'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Difficulty: {tournament.difficulty || 'Mixed'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-2" />
                          <span>Passing Score: {tournament.minimumPassingScore || 70}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <div className={`inline-flex items-center px-3 py-2 rounded-lg font-bold text-lg ${getScoreColor(tournament.userScore || 0, Math.round((tournament.minimumPassingScore || 70) * 10 / 100))}`}>
                        {tournament.userScore || 0}/10
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {tournament.userAttempts && tournament.userAttempts > 1 
                          ? `${tournament.userAttempts} attempts` 
                          : '1 attempt'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {tournament.description && (
                        <p className="line-clamp-2">{tournament.description}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/player/tournaments/${tournament.id}/scores`}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        View Scores
                      </Link>
                      
                      {/* Show retake button if tournament is still ongoing */}
                      {tournament.status === 'ongoing' && (
                        <Link
                          to={`/player/tournaments/${tournament.id}/play`}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Retake Quiz
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !error && participatedTournaments.length > 0 && filteredTournaments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments match your filter</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filter criteria to see more results.</p>
            <button
              onClick={() => handleFilterChange('all')}
              className="btn-primary"
            >
              Show All Tournaments
            </button>
          </div>
        ) : !error && participatedTournaments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tournament History Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't participated in any tournaments yet. Start your quiz journey today!
            </p>
            <Link to="/player/tournaments" className="btn-primary">
              Browse Available Tournaments
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHistory;