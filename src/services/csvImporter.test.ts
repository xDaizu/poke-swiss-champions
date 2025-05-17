import { describe, it, expect, beforeEach } from 'vitest';
import { CsvImporter } from './csvImporter';
import { Pokemon } from '../types';

// Sample Pokémon data for testing
const validPokemon: Pokemon[] = [
  { id: 1, name: 'Bulbasaur', type: ['Grass', 'Poison'], sprite: 'bulbasaur.png' },
  { id: 2, name: 'Ivysaur', type: ['Grass', 'Poison'], sprite: 'ivysaur.png' },
  { id: 3, name: 'Venusaur', type: ['Grass', 'Poison'], sprite: 'venusaur.png' },
  { id: 4, name: 'Charmander', type: ['Fire'], sprite: 'charmander.png' },
  { id: 5, name: 'Charmeleon', type: ['Fire'], sprite: 'charmeleon.png' },
  { id: 6, name: 'Charizard', type: ['Fire', 'Flying'], sprite: 'charizard.png' },
  { id: 7, name: 'Squirtle', type: ['Water'], sprite: 'squirtle.png' },
  { id: 8, name: 'Wartortle', type: ['Water'], sprite: 'wartortle.png' },
  { id: 9, name: 'Blastoise', type: ['Water'], sprite: 'blastoise.png' },
  { id: 176, name: 'Togetic', type: ['Fairy', 'Flying'], sprite: 'togetic.png' },
  { id: 359, name: 'Absol', type: ['Dark'], sprite: 'absol.png' },
  { id: 620, name: 'Mienshao', type: ['Fighting'], sprite: 'mienshao.png' },
  { id: 354, name: 'Banette', type: ['Ghost'], sprite: 'banette.png' },
  { id: 335, name: 'Zangoose', type: ['Normal'], sprite: 'zangoose.png' },
  { id: 24, name: 'Arbok', type: ['Poison'], sprite: 'arbok.png' },
];

describe('CsvImporter', () => {
  let importer: CsvImporter;
  
  // Mock Pokémon search function that matches by name case-insensitively
  const mockSearchPokemon = async (name: string): Promise<Pokemon[]> => {
    const searchName = name.trim().toLowerCase();
    return validPokemon.filter(p => p.name.toLowerCase() === searchName);
  };
  
  beforeEach(() => {
    importer = new CsvImporter(mockSearchPokemon);
  });
  
  describe('Basic Functionality', () => {
    it('imports valid CSV data with Pokémon as individual fields', async () => {
      const csv = 'Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].name).toBe('Ash');
      expect(result.participants[0].title).toBe('Pokémon Trainer');
      expect(result.participants[0].team).toHaveLength(6);
      expect(result.error).toBeUndefined();
    });
    
    it('handles empty CSV data', async () => {
      const csv = '';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(0);
      expect(result.participants).toHaveLength(0);
      expect(result.error).toBe('CSV data is empty');
    });
  });
  
  describe('CSV Format Handling', () => {
    it('imports Pokémon list in a single quoted field', async () => {
      const csv = 'Lolocha, Personajes de Hazbin Hotel, "Togetic, Absol, Mienshao, Banette, Zangoose, Arbok"';
      
      // Add debug logs to help identify the issue
      const importer = new CsvImporter(async (name) => {
        const results = await mockSearchPokemon(name);
        console.log(`Searching for "${name}": found ${results.length > 0 ? 'yes' : 'no'}`);
        return results;
      });
      
      const result = await importer.importFromCsv(csv);
      
      if (result.error) {
        console.error('Import failed with error:', result.error);
      }
      
      console.log(`Result count: ${result.count}, participants: ${result.participants.length}`);
      if (result.participants[0]) {
        console.log(`Team size: ${result.participants[0].team.length}`);
        console.log(`Team members: ${result.participants[0].team.map(p => p.name).join(', ')}`);
      }
      
      expect(result.count).toBe(1);
      expect(result.participants[0].team).toHaveLength(6);
      expect(result.participants[0].team.map(p => p.name)).toContain('Togetic');
      expect(result.participants[0].team.map(p => p.name)).toContain('Arbok');
      expect(result.error).toBeUndefined();
    });
    
    it('handles CSV with quoted field names', async () => {
      const csv = '"Ash", "Pokémon Trainer", Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.participants[0].name).toBe('Ash');
      expect(result.participants[0].title).toBe('Pokémon Trainer');
    });
    
    it('handles CSV with mixed quotes and spaces', async () => {
      const csv = ' "Ash" , "Pokémon Trainer" , Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.participants[0].name).toBe('Ash');
    });
    
    it('handles multiple lines of CSV data', async () => {
      const csv = `Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise
Misty, Gym Leader, Togetic, Squirtle, Wartortle, Blastoise, Bulbasaur, Charmander`;
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(2);
      expect(result.participants[0].name).toBe('Ash');
      expect(result.participants[1].name).toBe('Misty');
    });
    
    it('skips lines with too few fields', async () => {
      const csv = `Invalid Line
Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise`;
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Not enough fields');
    });
  });
  
  describe('Pokémon Validation', () => {
    it('reports invalid Pokémon names', async () => {
      const csv = 'Ash, Pokémon Trainer, Bulbasaur, NotAPokemon, Squirtle, Charizard, Wartortle, Blastoise';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid Pokémon: NotAPokemon');
    });
    
    it('reports trainers with fewer than 6 Pokémon', async () => {
      const csv = 'Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Missing Pokémon: 3');
    });
    
    it('allows customizing required Pokémon count', async () => {
      const csv = 'Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle';
      
      const result = await importer.importFromCsv(csv, { requiredPokemonCount: 3 });
      
      expect(result.count).toBe(1);
      expect(result.error).toBeUndefined();
    });
    
    it('case-insensitively matches Pokémon names', async () => {
      const csv = 'Ash, Pokémon Trainer, bulbasaur, CHARMANDER, Squirtle, charizard, wartortle, blastoise';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.error).toBeUndefined();
    });
  });
  
  describe('Profile Images', () => {
    it('extracts profile image URL from CSV', async () => {
      const csv = 'Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise, https://example.com/ash.png';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.participants[0].profileImage).toBe('https://example.com/ash.png');
    });
    
    it('assigns default profile image when none is provided', async () => {
      const csv = 'Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.participants[0].profileImage).toContain('ui-avatars.com');
    });
    
    it('handles profile image URL with quotes', async () => {
      const csv = 'Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise, "https://example.com/ash.png"';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.participants[0].profileImage).toBe('https://example.com/ash.png');
    });
  });
  
  describe('Error Handling', () => {
    it('returns warnings for lines with parsing errors', async () => {
      const csv = `Ash, Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise
Invalid, Line With "Unterminated Quote`;
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(1);
      expect(result.warnings).toBeDefined();
    });
    
    it('reports empty trainer names', async () => {
      const csv = ', Pokémon Trainer, Bulbasaur, Charmander, Squirtle, Charizard, Wartortle, Blastoise';
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(0);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Trainer name cannot be empty');
    });
    
    it('reports multiple issues across different trainers', async () => {
      const csv = `Ash, Pokémon Trainer, Bulbasaur, FakeMon, Squirtle, Charizard, Wartortle, Blastoise
Misty, Gym Leader, Togetic, NotReal, Water, Fake, Pokemon, Monster`;
      
      const result = await importer.importFromCsv(csv);
      
      expect(result.count).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Ash');
      expect(result.error).toContain('Misty');
      expect(result.error).toContain('FakeMon');
      expect(result.error).toContain('NotReal');
    });
  });
}); 