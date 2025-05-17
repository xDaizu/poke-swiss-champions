import { useAppContext } from '../context/AppContext';
import { Match, MatchResult } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Moon, Pencil } from 'lucide-react';
import { useState } from 'react';

interface MatchCardProps {
  match: Match;
  publicView?: boolean;
  onShowBattle?: () => void;
}

export default function MatchCard({ match, publicView = false, onShowBattle }: MatchCardProps) {
  const { getParticipantById, updateMatchResult, toggleMatchPublic } = useAppContext();
  
  const participant1 = getParticipantById(match.participant1Id);
  const participant2 = getParticipantById(match.participant2Id);
  
  const isBye = !match.participant2Id;
  
  const handleResultClick = (result: MatchResult) => {
    updateMatchResult(match.id, result);
  };
  
  const getResultLabel = () => {
    switch (match.result) {
      case 'win1':
        return `${participant1?.name} Ganó`;
      case 'win2':
        return `${participant2?.name} Ganó`;
      case 'tie':
        return 'Empate';
      case 'bye':
        return 'Bye';
      default:
        return 'Pendiente';
    }
  };

  // Determine card background gradient based on result
  let cardBg = '';
  if (isBye) {
    cardBg = 'bg-gradient-to-t from-blue-200 to-white';
  } else if (match.result === 'win1') {
    cardBg = 'bg-gradient-to-r from-green-200 via-white to-white';
  } else if (match.result === 'win2') {
    cardBg = 'bg-gradient-to-l from-green-200 via-white to-white';
  } else if (match.result === 'tie') {
    cardBg = 'bg-gradient-to-r from-white via-yellow-200 to-white';
  }

  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className={`pokemon-card w-full relative ${cardBg}`}>
      {/* BYE sleep icon */}
      {isBye && (
        <div className="absolute left-2 top-2 z-10 flex items-center text-blue-400">
          <Moon size={22} className="mr-1" />
          <span className="font-bold text-blue-400 text-xs">ZZZ</span>
        </div>
      )}
      
      <CardContent>
        <div className="flex items-center justify-between mb-4 pt-3">
          <div className="w-[45%] text-center">
            <div className="flex flex-col items-center">
              {participant1 && (
                <>
                  <span className="font-medium truncate max-w-full">{participant1.name}</span>
                  <span className="text-xs text-gray-500 truncate max-w-full">{participant1.title}</span>
                  
                  {participant1.team.length > 0 && (
                    <div className="flex space-x-1 mt-1">
                      {participant1.team.slice(0, 3).map((pokemon, index) => (
                        <img
                          key={index}
                          src={pokemon.sprite}
                          alt={pokemon.name}
                          className="w-6 h-6"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="text-center w-[10%] flex flex-col items-center justify-center">
            {/* VS button for public view */}
            {publicView ? (
              <button
                type="button"
                className="text-2xl font-bold text-pokemon-red hover:scale-125 transition-transform duration-200"
                style={{ outline: 'none', border: 'none', background: 'none', cursor: 'pointer' }}
                onClick={onShowBattle}
                aria-label="Mostrar batalla"
              >
                VS
              </button>
            ) : (
              <span>VS</span>
            )}
            {/* Eye icon for public/hidden toggle (admin only) */}
            {!publicView && (
              <button
                type="button"
                className="mt-2 text-gray-400 hover:text-gray-700"
                title={match.public ? 'Ocultar del público' : 'Mostrar al público'}
                onClick={() => toggleMatchPublic(match.id)}
                aria-label={match.public ? 'Ocultar del público' : 'Mostrar al público'}
              >
                {match.public ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            )}
          </div>
          
          <div className="w-[45%] text-center">
            {isBye ? (
              <span className="text-gray-500">— BYE —</span>
            ) : participant2 ? (
              <div className="flex flex-col items-center">
                <span className="font-medium truncate max-w-full">{participant2.name}</span>
                <span className="text-xs text-gray-500 truncate max-w-full">{participant2.title}</span>
                
                {participant2.team.length > 0 && (
                  <div className="flex space-x-1 mt-1">
                    {participant2.team.slice(0, 3).map((pokemon, index) => (
                      <img
                        key={index}
                        src={pokemon.sprite}
                        alt={pokemon.name}
                        className="w-6 h-6"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500">Esperando...</span>
            )}
          </div>
        </div>
        
        {/* Result section */}
        {publicView ? (
          <div className="text-center p-1 bg-gray-100 rounded-md">
            {isBye ? (
              <span className="font-medium text-gray-500">Duerme esta ronda...</span>
            ) : match.result ? (
              <span className="font-medium">{getResultLabel()}</span>
            ) : (
              <span className="font-medium text-gray-400">Aún sin decidir</span>
            )}
          </div>
        ) : isEditing || !match.result ? (
          <div className="flex w-full mt-2">
            {/* Player 1 win button */}
            <div className="w-2/5 flex justify-center">
              <Button
                size="sm"
                variant="outline"
                className="text-xs py-1 h-auto"
                onClick={() => { handleResultClick('win1'); setIsEditing(false); }}
                disabled={isBye}
              >
                {participant1?.name.split(' ')[0]} Gana
              </Button>
            </div>
            {/* Tie button */}
            <div className="w-1/5 flex justify-center">
              <Button
                size="sm"
                variant="outline"
                className="text-xs py-1 h-auto"
                onClick={() => { handleResultClick('tie'); setIsEditing(false); }}
                disabled={isBye}
              >
                Empate
              </Button>
            </div>
            {/* Player 2 win button */}
            <div className="w-2/5 flex justify-center">
              {!isBye && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs py-1 h-auto"
                  onClick={() => { handleResultClick('win2'); setIsEditing(false); }}
                >
                  {participant2?.name.split(' ')[0]} Gana
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <div className="text-center p-1 bg-gray-100 rounded-md">
              <span className="font-medium">{getResultLabel()}</span>
            </div>
            {/* Edit button (admin only, if result is set) */}
            {!publicView && match.result && (
              <Button
                size="icon"
                variant="ghost"
                className="ml-2"
                title="Editar resultado"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
