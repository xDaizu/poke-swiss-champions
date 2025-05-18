import { useAppContext } from '../context/AppContext';
import MatchCard from '../components/MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ROUND_COLORS from '../lib/roundColors';
import { useState, useEffect, useRef } from 'react';
import BattleOverlay from '../components/BattleOverlay';

export default function TournamentPublicPage() {
  const { tournament, participants, getCurrentRound } = useAppContext();
  const [battleMatch, setBattleMatch] = useState(null);
  const [shownMatchIds, setShownMatchIds] = useState<string[]>([]);
  const prevMatchIdsRef = useRef<string[]>([]);
  const [justAppeared, setJustAppeared] = useState<string[]>([]);

  useEffect(() => {
    // Collect all public match IDs
    const allPublicMatchIds = tournament.matches.filter(m => m.public).map(m => m.id);

    // Find new matches (now public)
    const newMatches = allPublicMatchIds.filter(id => !shownMatchIds.includes(id));
    if (newMatches.length > 0) {
      setJustAppeared(prev => [...prev, ...newMatches]);
      setShownMatchIds(prev => [...prev, ...newMatches]);
    }

    // Find matches that were public but are now hidden
    const nowHidden = shownMatchIds.filter(id => !allPublicMatchIds.includes(id));
    if (nowHidden.length > 0) {
      setShownMatchIds(prev => prev.filter(id => allPublicMatchIds.includes(id)));
    }

    prevMatchIdsRef.current = allPublicMatchIds;
  }, [tournament.matches, shownMatchIds]);

  return (
    <div className="space-y-6">
      {battleMatch && (
        <BattleOverlay 
          match={battleMatch} 
          onClose={() => setBattleMatch(null)} 
          participants={participants}
        />
      )}
      <h2 className="text-2xl font-bold text-center mb-2">Torneo KYL de Lolochaa!!</h2>
      <div className="flex justify-center gap-6 mb-4">
        <div className="bg-gray-100 rounded px-4 py-2 text-sm">
          <span className="font-semibold">Rondas:</span> {tournament.rounds}
        </div>
        <div className="bg-gray-100 rounded px-4 py-2 text-sm">
          <span className="font-semibold">Participantes:</span> {participants.length}
        </div>
      </div>
      <div className="space-y-8">
        <h3 className="text-xl font-bold text-center">Rondas del Torneo</h3>
        {Array.from({ length: tournament.rounds || 4 }).map((_, index) => {
          const roundNumber = index + 1;
          const roundMatches = tournament.matches.filter(m => m.round === roundNumber && m.public);
          if (roundMatches.length === 0) return null;
          const roundColor = ROUND_COLORS[index % ROUND_COLORS.length];
          return (
            <Card key={roundNumber} className={`${roundColor} border-2 border-pokemon-red`}>
              <CardHeader className="pb-2">
                <CardTitle>Ronda {roundNumber}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roundMatches.map(match => {
                    const isBouncing = justAppeared.includes(match.id);
                    return (
                      <div
                        key={match.id}
                        className={isBouncing ? 'animate-bounce-in' : ''}
                        onAnimationEnd={() => {
                          if (isBouncing) setJustAppeared(prev => prev.filter(id => id !== match.id));
                        }}
                      >
                        <MatchCard
                          match={match}
                          publicView={true}
                          onShowBattle={() => setBattleMatch(match)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 