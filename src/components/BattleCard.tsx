import React from 'react';

interface BattleCardProps {
  participant: any;
  align: 'left' | 'right';
}

const BattleCard: React.FC<BattleCardProps> = ({ participant, align }) => {
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
      <div className="flex flex-wrap justify-center gap-4 mt-2 mb-4">
        {participant.team.map((pokemon: any, idx: number) => (
          <div key={idx} className="flex flex-col items-center">
            <img
              src={pokemon.sprite}
              alt={pokemon.name}
              className="w-16 h-16 rounded bg-gray-100 border-2 border-gray-300 shadow"
              onError={e => ((e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png')}
            />
            <span className="text-base font-bold text-gray-800 mt-1 drop-shadow-sm uppercase tracking-tight">
              {pokemon.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleCard; 