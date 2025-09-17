// Add to src/hooks/useTournamentPersistence.js
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
        } catch (error) {
          console.log('Error preserving tournament data:', error);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
};
