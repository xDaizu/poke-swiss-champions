import { Pokemon } from '../types';
import pokedex from '../data/pokedex.json';

const POKEMON_COUNT = 649; // Expanded to include Pokemon up to Gen 5 (Black & White)

export async function fetchPokemonList(): Promise<Pokemon[]> {
  // Use the locally imported pokedex data
  return pokedex.slice(0, POKEMON_COUNT).map((pokemon: any) => ({
    id: pokemon.id,
    name: pokemon.name.english,
    type: pokemon.type,
    sprite: `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/${String(pokemon.id).padStart(3, '0')}MS.png`
  }));
}

export async function fetchPokemonById(id: number): Promise<Pokemon | null> {
  if (id < 1 || id > POKEMON_COUNT) return null;
  const pokemon = pokedex.find((p: any) => p.id === id);
  if (!pokemon) return null;
  return {
    id: pokemon.id,
    name: pokemon.name.english,
    type: pokemon.type,
    sprite: `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/${String(pokemon.id).padStart(3, '0')}MS.png`
  };
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  const allPokemon = await fetchPokemonList();
  const trimmedQuery = query.trim().toLowerCase();
  return allPokemon.filter(pokemon => 
    pokemon.name.toLowerCase() === trimmedQuery ||
    String(pokemon.id) === trimmedQuery
  );
}
