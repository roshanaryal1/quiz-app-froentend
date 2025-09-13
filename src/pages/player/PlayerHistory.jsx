import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { Trophy, Calendar, Award, TrendingUp, BarChart3, Target, Clock, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PlayerHistory = () => {
  const [participatedTournaments, setParticipatedTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchPlayerHistory();
  }, []);

  const fetchPlayerHistory = async () => {
    try {
      setIsLoading(true);
      const response = await tournamentAPI.getParticipated();
      setParticipatedTournaments(response.data);
    } catch (error) {
      setError('Failed to fetch tournament history');
      console.error('Error fetching player history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    if (participatedTournaments.length === 0) {
      return {
        totalParticipated: 0,
        totalPassed: 0,
        averageScore: 0,
        bestScore: 0,
        passRate: 0,
        favoriteCategory: 'None'
      };
    }

    const tournaments = participatedTournaments;
    const totalParticipated = tournaments.length;
    
    // Get scores from attempts
    const scores = tournaments.map(t => {
      const userAttempt = t.attempts?.find(a => a.user?.id); // Find user's attempt
      return userAttempt ? userAttempt.score : 0;
    });

    const passedTournaments = tournaments.filter(t => {
      const userAttempt = t.attempts?.find(a => a.user?.id);
      const score = userAttempt ? userAttempt.score : 0;
      return score >= t.minimumPassingScore;
    });

    const totalPassed = passedTournaments.length;
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const passRate = totalParticipated > 0 ? Math.round((totalPassed / totalParticipated) * 100) : 0;

    // Calculate favorite category
    const categoryCount = {};
    tournaments.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'None'
    );

    return {
      totalParticipated,
      totalPassed,
      averageScore,
      bestScore,
      passRate,
      favoriteCategory
    };
  };

  const getFilteredAndSortedTournaments = () => {
    let filtered = [...participatedTournaments];

    // Filter
    if (filter === 'passed') {
      filtered = filtered.filter(t => {
        const userAttempt = t.attempts?.find(a => a.user?.id);
        const score = userAttempt ? userAttempt.score : 0;
        return score >= t.minimumPassingScore;
      });
    } else if (filter === 'failed') {
      filtered = filtered.filter(t => {
        const userAttempt = t.attempts?.find(a => a.user?.id);
        const score = userAttempt ? userAttempt.score : 0;
        return score < t.minimumPassingScore;
      });
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    } else if (sortBy === 'score-high') {
      filtered.sort((a, b) => {
        const scoreA = a.attempts?.find(att => att.user?.id)?.score || 0;
        const scoreB = b.attempts?.find(att => att.user?.id)?.score || 0;
        return scoreB - scoreA;
      });
    } else if (sortBy === 'score-low') {
      filtered.sort((a, b) => {
        const scoreA = a.attempts?.find(att => att.user?.id)?.score || 0;
        const scoreB = b.attempts?.find(att => att.user?.id)?.score || 0;
        return scoreA - scoreB;
      });
    }

    return filtered;
  };

  const TournamentHistoryCard = ({ tournament }) => {
    const userAttempt = tournament.attempts?.find(a => a.user?.id);
    const score = userAttempt ? userAttempt.score : 0;
    const totalQuestions = userAttempt ? userAttempt.totalQuestions : 10;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = score >= tournament.minimumPassingScore;
    const completedDate = userAttempt ? new Date(userAttempt.completedAt) : new Date(tournament.endDate);

    return (
      <div className={`card hover:shadow-lg transition-shadow border-l-4 ${
        passed ? 'border-l-green-500' : 'border-l-red-500'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
              {passed ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{tournament.category}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{completedDate.toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-500">{score}/{totalQuestions}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Your Score</span>
            <span className="text-sm text-gray-600">Pass: {tournament.minimumPassingScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
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
          <div>
            <span className="text-gray-500">Participants:</span>
            <p className="font-medium">{tournament.attempts?.length || 0}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <p className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'Passed' : 'Failed'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const stats = calculateStats();
  const filteredTournaments = getFilteredAndSortedTournaments();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your history..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <BarChart3 className="text-purple-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Tournament History</h1>
              <p className="text-gray-600 mt-1">Track your quiz journey and progress</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Trophy className="text-blue-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalParticipated}</p>
                  <p className="text-gray-600">Tournaments</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.passRate}%</p>
                  <p className="text-gray-600">Pass Rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Target className="text-amber-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
                  <p className="text-gray-600">Avg Score</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <TrendingUp className="text-purple-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.bestScore}</p>
                  <p className="text-gray-600">Best Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          {stats.totalParticipated > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="font-medium text-gray-900 mb-4">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.totalPassed}</div>
                  <div className="text-sm text-gray-600">Tournaments Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{stats.totalParticipated - stats.totalPassed}</div>
                  <div className="text-sm text-gray-600">Tournaments Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 mb-2">{stats.favoriteCategory}</div>
                  <div className="text-sm text-gray-600">Favorite Category</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {participatedTournaments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Trophy className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tournament History</h3>
            <p className="text-gray-600 mb-6">
              You haven't participated in any tournaments yet. Start your quiz journey today!
            </p>
            <Link to="/player/tournaments" className="btn-primary">
              Browse Tournaments
            </Link>
          </div>
        ) : (
          <>
            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: participatedTournaments.length },
                  { key: 'passed', label: 'Passed', count: stats.totalPassed },
                  { key: 'failed', label: 'Failed', count: stats.totalParticipated - stats.totalPassed }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filter === tab.key
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="score-high">Highest Score</option>
                <option value="score-low">Lowest Score</option>
              </select>
            </div>

            {/* Tournament History Grid */}
            {filteredTournaments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No tournaments match your current filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map(tournament => (
                  <TournamentHistoryCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}

            {/* Progress Tips */}
            <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-medium text-purple-900 mb-4 flex items-center space-x-2">
                <TrendingUp size={20} />
                <span>Improve Your Performance</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
                <div>
                  <h4 className="font-medium mb-2">Study Tips</h4>
                  <ul className="space-y-1">
                    <li>• Focus on your weakest categories</li>
                    <li>• Review questions after each tournament</li>
                    <li>• Practice regularly to improve scores</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Strategy</h4>
                  <ul className="space-y-1">
                    <li>• Start with easier tournaments to build confidence</li>
                    <li>• Take your time to read questions carefully</li>
                    <li>• Participate consistently to track progress</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerHistory;