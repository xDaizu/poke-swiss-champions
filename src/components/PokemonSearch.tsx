import { useState, useEffect } from 'react';
import { Pokemon } from '../types';
import { searchPokemon } from '../services/pokemonService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PokemonSearchProps {
  onSelect: (pokemon: Pokemon) => void;
  excludeIds?: number[];
}

export default function PokemonSearch({ onSelect, excludeIds = [] }: PokemonSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const results = await searchPokemon(debouncedQuery);
        // Filter out already selected pokemon
        const filteredResults = results.filter(
          pokemon => !excludeIds.includes(pokemon.id)
        );
        setResults(filteredResults.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error("Error searching Pokemon:", error);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery, excludeIds]);

  return (
    <div className="w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar Pokémon por nombre o número..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="w-5 h-5 border-2 border-t-transparent border-pokemon-red rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ul className="mt-2 max-h-60 overflow-auto rounded-md bg-white shadow-lg border border-gray-200">
          {results.map((pokemon) => (
            <li
              key={pokemon.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => {
                onSelect(pokemon);
                setQuery('');
                setResults([]);
              }}
            >
              <img
                src={pokemon.sprite}
                alt={pokemon.name}
                className="w-10 h-10 mr-3"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png'; // Fallback to Bulbasaur
                }}
              />
              <div>
                <div className="font-medium">#{pokemon.id.toString().padStart(3, '0')} {pokemon.name}</div>
                <div className="text-xs text-gray-500">{pokemon.type.join(', ')}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
