import { useAppContext } from '../context/AppContext';
import MatchCard from '../components/MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ROUND_COLORS from '../lib/roundColors';
import { useState } from 'react';
import { X } from 'lucide-react';
import BattleCard from '../components/BattleCard';

export default function TournamentPublicPage() {
  const { tournament, participants, getCurrentRound } = useAppContext();
  const [battleMatch, setBattleMatch] = useState(null);
  const [battleAnimatingOut, setBattleAnimatingOut] = useState(false);

  // Helper to get participant by id
  const getParticipant = (id) => participants.find(p => p.id === id);

  // Battle overlay component
  const BattleOverlay = ({ match, onClose }) => {
    if (!match) return null;
    const p1 = getParticipant(match.participant1Id);
    const p2 = getParticipant(match.participant2Id);
    return (
      <div className="fixed inset-0 z-50 flex flex-col min-h-screen bg-black/70">
        {/* Battle cards container - positioned at exactly 1/4 of screen height */}
        <div className="relative w-full flex-1">
          {/* Left card */}
          <div
            className={`fixed transition-transform duration-700 ${battleAnimatingOut ? '-translate-x-full opacity-0' : ''}`}
            style={{ zIndex: 2, top: '25vh', left: '15%' }}
          >
            <BattleCard participant={p1} align="left" />
          </div>
          {/* Right card */}
          <div
            className={`fixed transition-transform duration-700 ${battleAnimatingOut ? 'translate-x-full opacity-0' : ''}`}
            style={{ zIndex: 2, top: '25vh', right: '15%' }}
          >
            <BattleCard participant={p2} align="right" />
          </div>
        </div>
        <div className="flex justify-center pb-8">
          <button
            className="mt-4 bg-white rounded-full shadow-lg p-3 flex items-center justify-center hover:bg-gray-200 transition-colors fixed bottom-4"
            onClick={() => {
              setBattleAnimatingOut(true);
              setTimeout(() => {
                setBattleMatch(null);
                setBattleAnimatingOut(false);
              }, 700);
              if (onClose) onClose();
            }}
            aria-label="Cerrar batalla"
          >
            <X size={32} className="text-pokemon-red" />
          </button>
        </div>
      </div>
    );
  };

  // Animations (add to global CSS or Tailwind config)
  // .animate-battle-left-in, .animate-battle-right-in, .animate-bounce-left, .animate-bounce-right

  return (
    <div className="space-y-6">
      {battleMatch && <BattleOverlay match={battleMatch} onClose={() => setBattleMatch(null)} />}
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