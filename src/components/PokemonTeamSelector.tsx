import { useState } from 'react';
import { Pokemon } from '../types';
import PokemonSearch from './PokemonSearch';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PokemonTeamSelectorProps {
  team: Pokemon[];
  onChange: (team: Pokemon[]) => void;
  maxTeamSize?: number;
}

export default function PokemonTeamSelector({ 
  team, 
  onChange, 
  maxTeamSize = 6 
}: PokemonTeamSelectorProps) {
  
  const handleAddPokemon = (pokemon: Pokemon) => {
    if (team.length < maxTeamSize) {
      onChange([...team, pokemon]);
    }
  };

  const handleRemovePokemon = (index: number) => {
    const newTeam = [...team];
    newTeam.splice(index, 1);
    onChange(newTeam);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Equipo Pokémon ({team.length}/{maxTeamSize})</h3>
        {team.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onChange([])}
          >
            Limpiar Equipo
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {team.map((pokemon, index) => (
          <div 
            key={`${pokemon.id}-${index}`} 
            className="pokemon-card relative bg-white border rounded-lg p-2 shadow-sm flex flex-col items-center"
          >
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 p-1"
              onClick={() => handleRemovePokemon(index)}
            >
              <X size={12} />
            </Button>
            
            <img 
              src={pokemon.sprite} 
              alt={pokemon.name}
              className="w-16 h-16 object-contain" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
              }}
            />
            <span className="text-sm font-medium truncate w-full text-center">
              {pokemon.name}
            </span>
            <div className="text-xs text-gray-500 truncate w-full text-center">
              {pokemon.type.join(', ')}
            </div>
          </div>
        ))}
        
        {[...Array(maxTeamSize - team.length)].map((_, index) => (
          <div 
            key={`empty-${index}`}
            className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-24"
          >
            <span className="text-gray-400 text-xs">Espacio Vacío</span>
          </div>
        ))}
      </div>

      {team.length < maxTeamSize && (
        <div className="pt-2">
          <PokemonSearch 
            onSelect={handleAddPokemon}
            excludeIds={team.map(p => p.id)}
          />
        </div>
      )}
    </div>
  );
}
