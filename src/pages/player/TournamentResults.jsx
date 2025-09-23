import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { Trophy, ArrowLeft, Medal, Users, Calendar, Award, Star, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TournamentResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [scores, setScores] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTournamentResults();
  }, [id]);

  const fetchTournamentResults = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [tournamentResponse, scoresResponse] = await Promise.all([
        tournamentAPI.getById(id),
        tournamentAPI.getScores(id).catch(() => ({ data: [] }))
      ]);

      setTournament(tournamentResponse.data);
      
      const scoresData = Array.isArray(scoresResponse.data) ? scoresResponse.data : [];
      setScores(scoresData);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userAttempt = tournamentResponse.data.attempts?.find(attempt => 
        attempt.user?.id === currentUser.id
      );
      
      if (userAttempt) {
        setUserScore({
          score: userAttempt.score,
          totalQuestions: userAttempt.totalQuestions || 10,
          percentage: Math.round((userAttempt.score / (userAttempt.totalQuestions || 10)) * 100),
          completedAt: userAttempt.completedAt,
          passed: userAttempt.score >= Math.round((tournamentResponse.data.minimumPassingScore || 70) * 10 / 100)
        });
      }

    } catch (error) {
      console.error('Error fetching tournament results:', error);
      setError('Failed to load tournament results');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Medal className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-amber-600" size={24} />;
      default:
        return <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">{rank}</div>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading results..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tournament Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The tournament results could not be loaded.'}</p>
            <button
              onClick={() => navigate('/player/tournaments')}
              className="btn-primary"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalParticipants = tournament.attempts?.length || 0;
  const averageScore = totalParticipants > 0 
    ? Math.round(tournament.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalParticipants)
    : 0;
  const passedCount = tournament.attempts?.filter(attempt => 
    attempt.score >= Math.round(tournament.minimumPassingScore * 10 / 100)
  ).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/player/tournaments')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Tournaments
          </button>
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <Trophy className="text-purple-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
              <p className="text-gray-600 mt-1">Tournament Results & Statistics</p>
            </div>
          </div>

          {/* Tournament Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalParticipants}</div>
                <div className="text-sm text-gray-600">Total Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{averageScore}</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{tournament.minimumPassingScore}%</div>
                <div className="text-sm text-gray-600">Pass Score</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User's Performance */}
          {userScore && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <Star className="text-yellow-500" size={20} />
                  <span>Your Performance</span>
                </h3>
                
                <div className={`text-center p-6 rounded-lg ${
                  userScore.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`text-4xl font-bold mb-2 ${
                    userScore.passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {userScore.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {userScore.score}/{userScore.totalQuestions} correct
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    userScore.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userScore.passed ? '✓ Passed' : '✗ Failed'}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">{formatDate(userScore.completedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Required to pass:</span>
                    <span className="font-medium">{tournament.minimumPassingScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className={userScore ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="text-blue-500" size={20} />
                  <span>Leaderboard</span>
                </h3>
              </div>

              {totalParticipants === 0 ? (
                <div className="p-12 text-center">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h4>
                  <p className="text-gray-600">This tournament hasn't had any participants yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {tournament.attempts
                      ?.sort((a, b) => b.score - a.score)
                      .map((attempt, index) => {
                        const rank = index + 1;
                        const percentage = Math.round((attempt.score / (attempt.totalQuestions || 10)) * 100);
                        const passed = attempt.score >= Math.round(tournament.minimumPassingScore * 10 / 100);
                        
                        return (
                          <div key={attempt.id || index} className={`p-4 border-b border-gray-100 flex items-center space-x-4 ${
                            rank <= 3 ? 'bg-yellow-50' : ''
                          }`}>
                            <div className="flex-shrink-0">
                              {getRankIcon(rank)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attempt.user?.firstName} {attempt.user?.lastName}
                                </p>
                                {passed && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Passed
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                Completed {formatDate(attempt.completedAt)}
                              </p>
                            </div>
                            
                            <div className="flex-shrink-0 text-right">
                              <div className="text-lg font-bold text-gray-900">{percentage}%</div>
                              <div className="text-sm text-gray-500">
                                {attempt.score}/{attempt.totalQuestions || 10}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Details */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="text-gray-500" size={20} />
            <span>Tournament Details</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="text-gray-500 text-sm">Category:</span>
              <p className="font-medium">{tournament.category}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Difficulty:</span>
              <p className="font-medium capitalize">{tournament.difficulty}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Duration:</span>
              <p className="font-medium">
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Created by:</span>
              <p className="font-medium">
                {tournament.creator?.firstName} {tournament.creator?.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/player/tournaments" className="btn-secondary">
            Browse More Tournaments
          </Link>
          <Link to="/player/history" className="btn-primary">
            View My History
          </Link>
          {!userScore && (
            <Link to={`/player/tournaments/${id}`} className="btn-primary">
              Take This Tournament
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentResults;
