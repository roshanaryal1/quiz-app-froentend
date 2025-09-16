// src/hooks/useTournaments.js - Custom hook for tournament state management
import { useState, useEffect, useCallback } from 'react';
import { tournamentAPI, clearTournamentCache } from '../config/api';

export const useTournaments = (autoFetch = true) => {
  // State management
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);

  // Fetch tournaments function with enhanced error handling
  const fetchTournaments = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🎯 useTournaments: Starting tournament fetch...');
      console.log('🎯 useTournaments: Force refresh:', forceRefresh);
      
      // Clear cache if force refresh requested
      if (forceRefresh) {
        console.log('🧹 useTournaments: Force clearing cache...');
        clearTournamentCache();
      }
      
      // Fetch from API
      const response = await tournamentAPI.getAll(forceRefresh);
      console.log('🎯 useTournaments: API response received:', response);
      
      // Handle response data structure
      let tournamentsData = [];
      
      if (Array.isArray(response.data)) {
        tournamentsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Try common property names
        const possibleKeys = ['tournaments', 'data', 'content', 'items', 'list'];
        for (const key of possibleKeys) {
          if (Array.isArray(response.data[key])) {
            tournamentsData = response.data[key];
            break;
          }
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(tournamentsData)) {
        console.warn('⚠️ useTournaments: No valid array found, using empty array');
        tournamentsData = [];
      }
      
      console.log(`✅ useTournaments: Fetched ${tournamentsData.length} tournaments`);
      
      // Update state
      setTournaments(tournamentsData);
      setLastFetch(new Date());
      setError('');
      
      return tournamentsData;
      
    } catch (error) {
      console.error('❌ useTournaments: Fetch error:', error);
      
      // Set user-friendly error message
      let errorMessage = 'Failed to fetch tournaments';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view tournaments.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Tournament service not found.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setTournaments([]);
      throw error;
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create tournament function
  const createTournament = useCallback(async (tournamentData) => {
    try {
      console.log('🎯 useTournaments: Creating tournament:', tournamentData);
      
      const response = await tournamentAPI.create(tournamentData);
      console.log('✅ useTournaments: Tournament created:', response.data);
      
      // Refresh tournaments list
      await fetchTournaments(true);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ useTournaments: Create error:', error);
      throw error;
    }
  }, [fetchTournaments]);

  // Delete tournament function
  const deleteTournament = useCallback(async (tournamentId) => {
    try {
      console.log('🎯 useTournaments: Deleting tournament:', tournamentId);
      
      await tournamentAPI.delete(tournamentId);
      console.log('✅ useTournaments: Tournament deleted');
      
      // Remove from local state immediately for better UX
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      
      // Also refresh from server to ensure consistency
      setTimeout(() => fetchTournaments(true), 1000);
      
    } catch (error) {
      console.error('❌ useTournaments: Delete error:', error);
      throw error;
    }
  }, [fetchTournaments]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      console.log('🎯 useTournaments: Auto-fetching tournaments on mount');
      fetchTournaments(true);
    }
  }, [autoFetch, fetchTournaments]);

  // Listen for tournament creation events
  useEffect(() => {
    const handleTournamentCreated = () => {
      console.log('🎯 useTournaments: Tournament creation event detected');
      fetchTournaments(true);
    };

    // Listen for custom events
    window.addEventListener('tournament-created', handleTournamentCreated);
    
    // Listen for localStorage changes (for cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'tournament_created') {
        console.log('🎯 useTournaments: Tournament creation via storage detected');
        fetchTournaments(true);
        localStorage.removeItem('tournament_created');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('tournament-created', handleTournamentCreated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchTournaments]);

  // Utility functions
  const refreshTournaments = useCallback(() => {
    return fetchTournaments(true);
  }, [fetchTournaments]);

  const getTournamentById = useCallback((id) => {
    return tournaments.find(t => t.id === id || t.id === parseInt(id));
  }, [tournaments]);

  const getTournamentsByStatus = useCallback((status) => {
    const now = new Date();
    return tournaments.filter(tournament => {
      const startDate = new Date(tournament.startDate);
      const endDate = new Date(tournament.endDate);
      
      switch (status) {
        case 'upcoming':
          return startDate > now;
        case 'ongoing':
          return startDate <= now && endDate >= now;
        case 'past':
          return endDate < now;
        default:
          return true;
      }
    });
  }, [tournaments]);

  return {
    // State
    tournaments,
    isLoading,
    error,
    lastFetch,
    
    // Actions
    fetchTournaments,
    createTournament,
    deleteTournament,
    refreshTournaments,
    
    // Utilities
    getTournamentById,
    getTournamentsByStatus,
    
    // Stats
    totalTournaments: tournaments.length,
    upcomingTournaments: getTournamentsByStatus('upcoming').length,
    ongoingTournaments: getTournamentsByStatus('ongoing').length,
    pastTournaments: getTournamentsByStatus('past').length
  };
};

export default useTournaments;
