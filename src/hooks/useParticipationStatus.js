import { useState, useEffect } from 'react';
import { tournamentAPI } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to check if the current user has participated in a tournament
 * @param {string|number} tournamentId - The tournament ID to check
 * @returns {object} - { hasParticipated, loading, error, checkAgain }
 */
export const useParticipationStatus = (tournamentId) => {
  const [hasParticipated, setHasParticipated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  const checkParticipation = async () => {
    if (!tournamentId || !isAuthenticated || !user?.id) {
      setHasParticipated(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await tournamentAPI.checkParticipationStatus(tournamentId, user.id);
      setHasParticipated(response.data.hasParticipated);
      
    } catch (error) {
      console.error('Error checking participation status:', error);
      setError(error.response?.data?.message || 'Failed to check participation status');
      // On error, assume not participated to allow attempt (backend will handle the check)
      setHasParticipated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkParticipation();
  }, [tournamentId, isAuthenticated, user?.id]);

  return {
    hasParticipated,
    loading,
    error,
    checkAgain: checkParticipation
  };
};

export default useParticipationStatus;
