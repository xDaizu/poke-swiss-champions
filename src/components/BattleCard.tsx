import React from 'react';
import { generateAvatarUrl } from '@/lib/avatar';

interface BattleCardProps {
  participant: any;
  align: 'left' | 'right';
}

const SPRITE_FALLBACK = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';

const formatPokemonId = (id: number | string): string => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return numId.toString().padStart(3, '0');
};

const getPokemonSpriteUrl = (pokemon: any): string => {
  if (pokemon.sprite) return pokemon.sprite;
  if (pokemon.id) {
    const formattedId = formatPokemonId(pokemon.id);
    return `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/${formattedId}MS.png`;
  }
  return SPRITE_FALLBACK;
};

const BattleCard: React.FC<BattleCardProps> = ({ participant, align }) => {
  if (!participant) return null;
  
  // Generate dynamic avatar URL if profile image is missing
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (participant.team) {
      e.currentTarget.src = generateAvatarUrl(participant.name, participant.team);
    } else {
      // Fallback if no team data is available
      e.currentTarget.src = 'https://ui-avatars.com/api/?name=Trainer&background=random&rounded=true';
    }
  };
  
  return (
    <div
      className={`bg-white rounded-2xl shadow-xl border-4 border-pokemon-red px-2 pt-4 pb-4 flex flex-col items-center justify-between
        transition-all duration-500 ease-out
        opacity-0
        ${align === 'left' ? 'animate-fadeInLeft' : 'animate-fadeInRight'}
      `}
      style={{ width: 300, height: 500, minWidth: 300, minHeight: 500, maxWidth: 300, maxHeight: 500 }}
    >
      <img
        src={participant.profileImage}
        alt={participant.name}
        className="w-20 h-20 rounded-full border-2 border-gray-300 mb-1 object-cover shadow"
        onError={handleAvatarError}
      />
      <div className="flex flex-col items-center mb-1">
        <div className="font-extrabold text-2xl text-center tracking-wide text-pokemon-red drop-shadow-lg uppercase">
          {participant.name}
        </div>
        <div className="text-sm text-gray-700 text-center font-semibold italic">
          {participant.title}
        </div>
      </div>
      {/* New Pokemon grid: takes more vertical space */}
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="w-full h-3/5 grid grid-rows-2 grid-cols-3 gap-1 items-center justify-items-center">
          {participant.team.map((pokemon: any, idx: number) => {
            const src = getPokemonSpriteUrl(pokemon);
            return (
              <div key={idx} className="flex flex-col items-center justify-center h-full">
                <img
                  src={src}
                  alt={pokemon.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded bg-gray-100 border border-gray-300 shadow object-contain mb-0.5"
                  onError={e => ((e.target as HTMLImageElement).src = SPRITE_FALLBACK)}
                />
                <span className="text-xs font-bold text-gray-800 drop-shadow-sm uppercase tracking-tight truncate max-w-full text-center">
                  {pokemon.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BattleCard; 