// ================================
// 2. src/pages/player/TournamentPlay.jsx
// ================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { Clock, Trophy, ArrowLeft, CheckCircle, AlertCircle, Play, Heart, Zap } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TournamentPlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  useEffect(() => {
    if (tournament && gameStarted) {
      calculateTimeRemaining();
      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [tournament, gameStarted]);

  const fetchTournamentData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching tournament data for ID:', id);
      
      const [tournamentResponse, questionsResponse] = await Promise.all([
        tournamentAPI.getById(id),
        tournamentAPI.getQuestions(id)
      ]);
      
      console.log('Tournament response:', tournamentResponse.data);
      console.log('Questions response:', questionsResponse.data);
      
      if (!tournamentResponse.data) {
        throw new Error('Tournament not found');
      }
      
      setTournament(tournamentResponse.data);
      
      // Ensure questions is an array
      const questionsData = Array.isArray(questionsResponse.data) 
        ? questionsResponse.data 
        : [];
      
      if (questionsData.length === 0) {
        throw new Error('No questions available for this tournament');
      }
      
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      let errorMessage = 'Failed to load tournament data';
      
      if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The server might be busy or unavailable.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Redirecting to login...';
        setTimeout(() => {
          window.location.href = '/login?message=Your session has expired. Please log in again.';
        }, 2000);
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to access this tournament.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Tournament not found. It may have been deleted or the link is incorrect.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeRemaining = () => {
    if (!tournament) return;
    
    const now = new Date().getTime();
    const endTime = new Date(tournament.endDate).getTime();
    const remaining = endTime - now;
    
    if (remaining <= 0) {
      setTimeRemaining('Tournament has ended');
      return;
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }
  };

  const getTournamentStatus = () => {
    if (!tournament) return 'loading';
    
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'ongoing';
  };

  const handleStartQuiz = () => {
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer('');
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: selectedAnswer
      }));
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        handleSubmitQuiz();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: selectedAnswer
      }));
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Include current answer if selected
      const finalAnswers = {
        ...answers,
        ...(selectedAnswer ? { [currentQuestionIndex]: selectedAnswer } : {})
      };

      // Convert answers object to array in correct order
      const answersArray = [];
      for (let i = 0; i < questions.length; i++) {
        answersArray.push(finalAnswers[i] || '');
      }

      console.log('Submitting answers:', answersArray);
      const response = await tournamentAPI.participate(id, { answers: answersArray });
      console.log('Participation result:', response.data);
      
      setResult(response.data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit quiz';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeTournament = async () => {
    try {
      await tournamentAPI.like(id);
      console.log('Tournament liked successfully');
    } catch (error) {
      console.error('Error liking tournament:', error);
    }
  };

  const status = getTournamentStatus();
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const totalAnswered = Object.keys(answers).length + (selectedAnswer ? 1 : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tournament..." />
      </div>
    );
  }

  if (!tournament || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error ? 'Error Loading Tournament' : 'Tournament Not Available'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'This tournament cannot be loaded or has no questions available.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/player/tournaments')}
                className="btn-primary"
              >
                Back to Tournaments
              </button>
              {error && (
                <button
                  onClick={fetchTournamentData}
                  className="btn-secondary"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center">
            <div className="mb-6">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                result.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Trophy className={`${result.passed ? 'text-green-600' : 'text-red-600'}`} size={32} />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
              <p className="text-gray-600">{result.message}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{result.score}</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{result.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round((result.score / result.totalQuestions) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLikeTournament}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <Heart size={16} />
                <span>Like This Tournament</span>
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/player/tournaments')}
                  className="btn-secondary flex-1"
                >
                  More Tournaments
                </button>
                <button
                  onClick={() => navigate('/player/history')}
                  className="btn-primary flex-1"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tournament Info Screen (before starting)
  if (!gameStarted) {
    const canStart = status === 'ongoing';
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/player/tournaments')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Tournaments
          </button>

          <div className="card">
            <div className="text-center mb-8">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-primary-600" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.name || 'Unnamed Tournament'}</h1>
              <p className="text-gray-600">Ready to test your knowledge?</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Tournament Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{tournament.category || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium capitalize">{tournament.difficulty || 'medium'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pass Score:</span>
                    <span className="font-medium">{tournament.minimumPassingScore || 70}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Tournament Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      status === 'ongoing' ? 'text-green-600' : 
                      status === 'upcoming' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {status === 'ongoing' ? 'Live Now' : 
                       status === 'upcoming' ? 'Starting Soon' : 'Ended'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className="font-medium">{timeRemaining || 'Calculating...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span className="font-medium">{Array.isArray(tournament.attempts) ? tournament.attempts.length : 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Quiz Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Answer all {questions.length} questions to complete the quiz</li>
                <li>• You can navigate between questions using Previous/Next buttons</li>
                <li>• Your answers are saved automatically as you progress</li>
                <li>• You can only submit once, so review your answers carefully</li>
                <li>• You need {tournament.minimumPassingScore || 70}% to pass this tournament</li>
              </ul>
            </div>

            <div className="text-center">
              {!canStart ? (
                <div className="text-gray-600">
                  {status === 'upcoming' && 'This tournament hasn\'t started yet'}
                  {status === 'ended' && 'This tournament has ended'}
                </div>
              ) : (
                <button
                  onClick={handleStartQuiz}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Play size={20} />
                  <span>Start Quiz</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Interface
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <Trophy className="text-primary-600" size={24} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{tournament.name || 'Unnamed Tournament'}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>{timeRemaining}</span>
              </div>
              <div className="text-sm text-gray-600">
                {totalAnswered}/{questions.length} answered
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="card">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {currentQuestion.category || 'General'}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty || 'medium'}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.question || 'Question not available'}
              </h2>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === option
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === option
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswer === option && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No answer options available for this question.
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index === currentQuestionIndex
                        ? 'bg-primary-600'
                        : answers[index]
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!selectedAnswer || isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Submit Quiz</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswer}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentPlay;