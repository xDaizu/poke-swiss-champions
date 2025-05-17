import { useAppContext } from '../context/AppContext';
import MatchCard from '../components/MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ROUND_COLORS from '../lib/roundColors';
import { useState } from 'react';
import { X } from 'lucide-react';

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
            className={`fixed left-0 transition-transform duration-700 ${battleAnimatingOut ? '-translate-x-full opacity-0' : 'translate-x-1/3 animate-battle-left-in'}`}
            style={{ zIndex: 2, top: '25vh' }}
          >
            <BattleCard participant={p1} align="left" />
          </div>
          {/* Right card */}
          <div
            className={`fixed right-0 transition-transform duration-700 ${battleAnimatingOut ? 'translate-x-full opacity-0' : '-translate-x-1/3 animate-battle-right-in'}`}
            style={{ zIndex: 2, top: '25vh' }}
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

  // BattleCard component
  const BattleCard = ({ participant, align }) => {
    if (!participant) return null;
    return (
      <div className={`w-96 h-[70vh] bg-white rounded-3xl shadow-2xl border-8 border-pokemon-red p-8 flex flex-col items-center justify-between ${align === 'left' ? 'animate-bounce-left' : 'animate-bounce-right'}`}
        style={{ minHeight: 480, maxHeight: '90vh' }}
      >
        <img
          src={participant.profileImage}
          alt={participant.name}
          className="w-40 h-40 rounded-full border-4 border-gray-300 mb-4 object-cover shadow-lg"
          onError={e => ((e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Trainer&background=random&rounded=true')}
        />
        <div className="font-extrabold text-4xl text-center mb-2 tracking-wide text-pokemon-red drop-shadow-lg uppercase">{participant.name}</div>
        <div className="text-lg text-gray-700 mb-4 text-center font-semibold italic">{participant.title}</div>
        <div className="flex flex-wrap justify-center gap-4 mt-2 mb-4">
          {participant.team.map((pokemon, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <img
                src={pokemon.sprite}
                alt={pokemon.name}
                className="w-16 h-16 rounded bg-gray-100 border-2 border-gray-300 shadow"
                onError={e => ((e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png')}
              />
              <span className="text-base font-bold text-gray-800 mt-1 drop-shadow-sm uppercase tracking-tight">{pokemon.name}</span>
            </div>
          ))}
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