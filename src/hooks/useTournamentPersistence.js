// Add to src/hooks/useTournamentPersistence.js
import { useEffect } from 'react';

export const useTournamentPersistence = () => {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const tournamentsData = localStorage.getItem('tournaments_backup');
      if (tournamentsData) {
        try {
          const tournaments = JSON.parse(tournamentsData);
          if (tournaments.length > 0) {
            e.preventDefault();
            return 'Tournament data will be preserved';
          }
        } catch (_error) {
          // Silently handle preservation errors
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
};
