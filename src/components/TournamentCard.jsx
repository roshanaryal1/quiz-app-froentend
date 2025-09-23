// React.memo wrapper for tournament cards to prevent unnecessary re-renders
import React, { memo } from 'react';

const TournamentCard = memo(({ tournament, onLike, onJoin, isLiked }) => {
  return (
    <div className="tournament-card">
      {/* Tournament card content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to determine if re-render is needed
  return (
    prevProps.tournament.id === nextProps.tournament.id &&
    prevProps.tournament.likesCount === nextProps.tournament.likesCount &&
    prevProps.isLiked === nextProps.isLiked
  );
});

TournamentCard.displayName = 'TournamentCard';

export default TournamentCard;
