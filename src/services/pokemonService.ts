
import { Pokemon } from '../types';

const GITHUB_URL = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master';
const POKEMON_COUNT = 649; // Expanded to include Pokemon up to Gen 5 (Black & White)

export async function fetchPokemonList(): Promise<Pokemon[]> {
  try {
    const response = await fetch(`${GITHUB_URL}/pokedex.json`);
    if (!response.ok) throw new Error('Failed to fetch Pokemon list');
    
    const data = await response.json();
    
    return data.slice(0, POKEMON_COUNT).map((pokemon: any) => ({
      id: pokemon.id,
      name: pokemon.name.english,
      type: pokemon.type,
      sprite: `${GITHUB_URL}/sprites/${String(pokemon.id).padStart(3, '0')}MS.png`
    }));
  } catch (error) {
    console.error('Error fetching Pokemon list:', error);
    return [];
  }
}

export async function fetchPokemonById(id: number): Promise<Pokemon | null> {
  if (id < 1 || id > POKEMON_COUNT) return null;
  
  try {
    const response = await fetch(`${GITHUB_URL}/pokedex/${id}.json`);
    if (!response.ok) throw new Error(`Failed to fetch Pokemon #${id}`);
    
    const pokemon = await response.json();
    
    return {
      id: pokemon.id,
      name: pokemon.name.english,
      type: pokemon.type,
      sprite: `${GITHUB_URL}/sprites/${String(pokemon.id).padStart(3, '0')}MS.png`
    };
  } catch (error) {
    console.error(`Error fetching Pokemon #${id}:`, error);
    return null;
  }
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  try {
    const allPokemon = await fetchPokemonList();
    const lowercaseQuery = query.toLowerCase();
    
    return allPokemon.filter(pokemon => 
      pokemon.name.toLowerCase().includes(lowercaseQuery) ||
      String(pokemon.id) === query
    );
  } catch (error) {
    console.error('Error searching Pokemon:', error);
    return [];
  }
}
