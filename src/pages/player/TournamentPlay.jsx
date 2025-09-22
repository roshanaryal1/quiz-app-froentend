// src/pages/player/TournamentPlay.jsx - Fixed quiz participation
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Heart,
  Award,
  Target
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LikeButton from '../../components/common/LikeButton';

const TournamentPlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [tournament, setTournament] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  useEffect(() => {
    // Set up timer if tournament has time limit
    if (tournament?.timeLimit && !result) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [tournament, result]);

  const fetchTournamentData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch tournament details
      const tournamentResponse = await tournamentAPI.getById(id);
      const tournamentData = tournamentResponse.data;
      
      if (!tournamentData) {
        throw new Error('Tournament not found');
      }
      
      setTournament(tournamentData);
      
      // Check tournament status
      const status = getTournamentStatus(tournamentData);
      if (status !== 'ongoing') {
        throw new Error(`Tournament is ${status}. Only ongoing tournaments can be played.`);
      }
      
      // Fetch questions
      const questionsResponse = await tournamentAPI.getQuestions(id);
      const questionsData = questionsResponse.data;
      
      if (!questionsData || !Array.isArray(questionsData) || questionsData.length === 0) {
        throw new Error('No questions available for this tournament');
      }
      
      // Process questions to ensure consistent format
      const processedQuestions = questionsData.map((q, index) => ({
        id: q.id || index,
        question: q.question || q.text || '',
        options: q.options || q.answers || [q.correct_answer, ...(q.incorrect_answers || [])].filter(Boolean),
        correctAnswer: q.correctAnswer || q.correct_answer || '',
        difficulty: q.difficulty || tournamentData?.difficulty || 'medium',
        category: q.category || tournamentData?.category || 'General Knowledge'
      }));
      
      setQuestions(processedQuestions);
      
      // Initialize timer if tournament has time limit
      if (tournamentData.timeLimit) {
        setTimeRemaining(tournamentData.timeLimit * 60); // Convert minutes to seconds
      }
      
    } catch (error) {
      console.error('❌ Error loading tournament:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load tournament';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTournamentStatus = (tournamentData = tournament) => {
    if (!tournamentData) return 'unknown';
    
    const now = new Date();
    const startDate = new Date(tournamentData.startDate);
    const endDate = new Date(tournamentData.endDate);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'past';
    return 'ongoing';
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    // Save current answer
    if (selectedAnswer) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: selectedAnswer
      }));
    }
    
    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Load saved answer for next question if it exists
      setSelectedAnswer(answers[currentQuestionIndex + 1] || '');
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer
      if (selectedAnswer) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestionIndex]: selectedAnswer
        }));
      }
      
      setCurrentQuestionIndex(prev => prev - 1);
      // Load saved answer for previous question
      setSelectedAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Include current answer in final answers
      const finalAnswers = selectedAnswer 
        ? { ...answers, [currentQuestionIndex]: selectedAnswer } 
        : answers;

      // Convert answers object to array in the correct order
      const answersArray = [];
      for (let i = 0; i < questions.length; i++) {
        answersArray.push(finalAnswers[i] || ''); // Use empty string for unanswered questions
      }
      
      const response = await tournamentAPI.participate(id, { answers: answersArray });
      
      setResult(response.data);
      
      // Like the tournament automatically after successful completion
      try {
        await tournamentAPI.like(id);
        setIsLiked(true);
      } catch (likeError) {
        // Silently handle auto-like failures
      }
      
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit quiz';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const getTotalAnswered = () => {
    return Object.keys(answers).length + (selectedAnswer ? 1 : 0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading tournament..." />
      </div>
    );
  }

  // Error state
  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Tournament</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/player/tournaments')}
                className="btn-primary"
              >
                Back to Tournaments
              </button>
              <button
                onClick={fetchTournamentData}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                result.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result.passed ? (
                  <Trophy className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
              
              <h1 className={`text-3xl font-bold mb-2 ${
                result.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.passed ? 'Congratulations!' : 'Better Luck Next Time!'}
              </h1>
              
              <p className="text-gray-600 text-lg">
                You scored <span className="font-bold text-gray-900">{result.score}</span> out of <span className="font-bold text-gray-900">{questions.length}</span>
              </p>
              
              <div className="text-sm text-gray-500 mt-2">
                <span className="text-green-600 font-medium">{result.score} correct</span> • 
                <span className="text-red-600 font-medium"> {questions.length - result.score} incorrect</span>
              </div>
              
              {result.passed && tournament && (
                <p className="text-green-600 font-medium mt-2">
                  🎉 You passed the tournament! (Required: {Math.round((tournament.minimumPassingScore / 10) * 100)}%)
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-xl font-bold text-gray-900">
                  {((result.score / questions.length) * 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-xl font-bold text-gray-900">
                  {result.rank || 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => navigate(`/player/tournaments/${id}/scores`)}
                  className="btn-secondary"
                >
                  View Leaderboard
                </button>
                
                <button
                  onClick={() => navigate('/player/tournaments')}
                  className="btn-primary"
                >
                  Back to Tournaments
                </button>
              </div>
              
              {/* Like Button */}
              <div className="flex justify-center">
                <LikeButton
                  tournamentId={id}
                  className="mt-4"
                />
              </div>
              
              {tournament?.status === 'ongoing' && (
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary flex items-center mx-auto"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz interface
  const currentQuestion = questions[currentQuestionIndex];
  const progress = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tournament?.name}</h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="text-right">
              {timeRemaining && (
                <div className="flex items-center text-orange-600 mb-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                Answered: {getTotalAnswered()}/{questions.length}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentQuestion.category}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Answer options */}
            <div className="space-y-3">
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                        selectedAnswer === option
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === option && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No answer options available for this question.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-4">
              {error && (
                <div className="text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}
              
              <span className="text-sm text-gray-500">
                {selectedAnswer ? 'Answer selected' : 'Select an answer'}
              </span>
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Quiz
                    <Trophy className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="btn-primary flex items-center"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Quiz Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Progress</h3>
          
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 ${
                  index === currentQuestionIndex
                    ? 'bg-blue-500 text-white'
                    : answers[index]
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => {
                  // Save current answer before switching
                  if (selectedAnswer) {
                    setAnswers(prev => ({
                      ...prev,
                      [currentQuestionIndex]: selectedAnswer
                    }));
                  }
                  setCurrentQuestionIndex(index);
                  setSelectedAnswer(answers[index] || '');
                }}
                title={`Question ${index + 1}${answers[index] ? ' (Answered)' : ''}`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Click any number to jump to that question</span>
            <span>{getTotalAnswered()} of {questions.length} answered</span>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Passing Score</p>
              <p className="font-semibold text-gray-900">{tournament?.passingScore || 5} out of {questions.length}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Difficulty</p>
              <p className="font-semibold text-gray-900 capitalize">{tournament?.difficulty || 'Mixed'}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Category</p>
              <p className="font-semibold text-gray-900">{tournament?.category || 'General Knowledge'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentPlay;