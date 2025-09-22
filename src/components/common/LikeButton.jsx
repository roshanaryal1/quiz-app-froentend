// src/components/common/LikeButton.jsx - Fixed tournament like functionality
import React, { useState, useEffect, useContext } from 'react';
import { Heart } from 'lucide-react';
import { tournamentAPI } from '../../config/api';
import { AuthContext } from '../../contexts/AuthContext';

const LikeButton = ({ tournamentId, initialLiked = false, initialLikesCount = 0, className = "" }) => {
  const { user } = useContext(AuthContext);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch current like status and count when component mounts
    fetchLikeStatus();
  }, [tournamentId]);

  const fetchLikeStatus = async () => {
    if (!tournamentId) return;
    
    try {
      // Get likes count - this is public information
      const likesResponse = await tournamentAPI.getLikes(tournamentId);
      const count = likesResponse?.data?.count ?? likesResponse?.data ?? 0;
      setLikesCount(count);
      
      // Note: Backend should ideally provide user's like status
      // For now, we'll rely on the initialLiked prop or local state
      console.log(`✅ Tournament ${tournamentId} has ${count} likes`);
    } catch (error) {
      console.error('Failed to fetch like status:', error);
      // Don't show error to user for like status fetch failures
    }
  };

  const handleLikeToggle = async () => {
    if (!user) {
      setError('Please log in to like tournaments');
      return;
    }

    if (user.role !== 'player') {
      setError('Only players can like tournaments');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      if (isLiked) {
        // Unlike the tournament
        console.log(`💔 Unliking tournament ${tournamentId}...`);
        await tournamentAPI.unlike(tournamentId);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        console.log('✅ Tournament unliked successfully');
      } else {
        // Like the tournament
        console.log(`❤️ Liking tournament ${tournamentId}...`);
        await tournamentAPI.like(tournamentId);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        console.log('✅ Tournament liked successfully');
      }
    } catch (error) {
      console.error('Like/unlike error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('Please log in to like tournaments');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to like tournaments');
      } else if (error.response?.status === 404) {
        setError('Tournament not found');
      } else if (error.response?.status === 409) {
        // Conflict - tournament already liked/unliked
        // Refresh the status
        await fetchLikeStatus();
        setError('Like status updated');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to update like status';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render for non-players
  if (!user || user.role !== 'player') {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleLikeToggle}
        disabled={isLoading}
        className={`
          flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${isLiked 
            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isLiked ? 'Unlike this tournament' : 'Like this tournament'}
      >
        <Heart 
          className={`w-4 h-4 transition-all duration-200 ${
            isLiked ? 'fill-current text-red-500' : 'text-gray-400'
          } ${isLoading ? 'animate-pulse' : ''}`}
        />
        <span className="min-w-[1rem] text-center">
          {likesCount}
        </span>
      </button>
      
      {error && (
        <div className="absolute z-10 mt-1 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-600 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

// Higher-order component for tournament cards with like functionality
export const WithLikeButton = ({ children, tournament, user }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    // Initialize like status from tournament data if available
    if (tournament) {
      setLikesCount(tournament.likesCount || tournament.likes || 0);
      // Check if user has liked this tournament (if backend provides this info)
      setIsLiked(tournament.isLikedByUser || false);
    }
  }, [tournament]);

  return (
    <div className="relative">
      {children}
      {tournament && (
        <div className="absolute top-4 right-4">
          <LikeButton
            tournamentId={tournament.id}
            initialLiked={isLiked}
            initialLikesCount={likesCount}
          />
        </div>
      )}
    </div>
  );
};

export default LikeButton;