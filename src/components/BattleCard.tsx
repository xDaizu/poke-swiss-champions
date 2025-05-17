import React, { useEffect, useState } from 'react';

interface BattleCardProps {
  participant: any;
  align: 'left' | 'right';
}

const SPRITE_FALLBACK = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
const IMAGE_FALLBACK = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/001.png';

/**
 * Formats a Pokemon ID to the 3-digit format used in the image repository
 */
const formatPokemonId = (id: number | string): string => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return numId.toString().padStart(3, '0');
};

/**
 * Gets a Pokemon image URL from the GitHub repository
 */
const getPokemonImageUrl = (pokemon: any): string => {
  if (pokemon.image) return pokemon.image;
  if (pokemon.id) {
    const formattedId = formatPokemonId(pokemon.id);
    return `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/${formattedId}.png`;
  }
  return IMAGE_FALLBACK;
};

const getPokemonSpriteUrl = (pokemon: any): string => {
  if (pokemon.sprite) return pokemon.sprite;
  if (pokemon.id) {
    const formattedId = formatPokemonId(pokemon.id);
    return `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/${formattedId}MS.png`;
  }
  return SPRITE_FALLBACK;
};

const STORAGE_KEY = 'battlecard-image-mode';

type ImageMode = 'image' | 'sprite';

const BattleCard: React.FC<BattleCardProps> = ({ participant, align }) => {
  const [imageMode, setImageMode] = useState<ImageMode>('image');

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'sprite' || stored === 'image') {
      setImageMode(stored);
    }
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, imageMode);
  }, [imageMode]);

  if (!participant) return null;
  return (
    <div
      className={`w-96 h-[70vh] bg-white rounded-3xl shadow-2xl border-8 border-pokemon-red p-8 flex flex-col items-center justify-between
        transition-all duration-500 ease-out
        opacity-0
        ${align === 'left' ? 'animate-fadeInLeft' : 'animate-fadeInRight'}
      `}
      style={{ minHeight: 480, maxHeight: '90vh' }}
    >
      {/* Toggle Button */}
      <div className="w-full flex justify-end mb-2">
        <button
          className={`px-3 py-1 rounded-l-full border border-gray-300 text-xs font-bold mr-1 ${imageMode === 'image' ? 'bg-pokemon-red text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setImageMode('image')}
        >
          Images
        </button>
        <button
          className={`px-3 py-1 rounded-r-full border border-gray-300 text-xs font-bold ${imageMode === 'sprite' ? 'bg-pokemon-red text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setImageMode('sprite')}
        >
          Sprites
        </button>
      </div>
      <img
        src={participant.profileImage}
        alt={participant.name}
        className="w-40 h-40 rounded-full border-4 border-gray-300 mb-4 object-cover shadow-lg"
        onError={e => ((e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Trainer&background=random&rounded=true')}
      />
      <div className="font-extrabold text-4xl text-center mb-2 tracking-wide text-pokemon-red drop-shadow-lg uppercase">
        {participant.name}
      </div>
      <div className="text-lg text-gray-700 mb-4 text-center font-semibold italic">
        {participant.title}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2 mb-4 w-full">
        {participant.team.map((pokemon: any, idx: number) => {
          const src = imageMode === 'image' ? getPokemonImageUrl(pokemon) : getPokemonSpriteUrl(pokemon);
          const fallback = imageMode === 'image' ? IMAGE_FALLBACK : SPRITE_FALLBACK;
          return (
            <div key={idx} className="flex flex-col items-center group">
              <div className="relative overflow-visible">
                <img
                  src={src}
                  alt={pokemon.name}
                  className="w-18 h-18 rounded bg-gray-100 border-2 border-gray-300 shadow transition-transform duration-300 group-hover:scale-125 group-hover:z-10 object-contain"
                  style={{ width: '4.5rem', height: '4.5rem' }}
                  onError={e => ((e.target as HTMLImageElement).src = fallback)}
                />
                <div className="absolute inset-0 rounded bg-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 group-hover:scale-150"></div>
              </div>
              <span className="text-xs font-bold text-gray-800 mt-1 drop-shadow-sm uppercase tracking-tight truncate max-w-full">
                {pokemon.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BattleCard; 