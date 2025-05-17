import { useAppContext } from '../context/AppContext';
import MatchCard from '../components/MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ROUND_COLORS from '../lib/roundColors';
import { useState } from 'react';
import BattleOverlay from '../components/BattleOverlay';

export default function TournamentPublicPage() {
  const { tournament, participants, getCurrentRound } = useAppContext();
  const [battleMatch, setBattleMatch] = useState(null);

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
                  {roundMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      publicView={true}
                      onShowBattle={() => setBattleMatch(match)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 