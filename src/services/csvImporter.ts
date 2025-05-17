import { Participant, Pokemon } from '../types';

/**
 * Result of a CSV import operation
 */
export interface CsvImportResult {
  /** Number of successfully imported participants */
  count: number;
  /** Successfully imported participants */
  participants: Participant[];
  /** Error message if the import failed */
  error?: string;
  /** Warnings that didn't prevent import but indicate issues */
  warnings?: string[];
}

/**
 * Options for the CSV importer
 */
export interface CsvImportOptions {
  /** If true, only validate the CSV but don't create participants */
  validateOnly?: boolean;
  /** Required number of Pokémon per trainer (default: 6) */
  requiredPokemonCount?: number;
}

/**
 * Handles importing participants from CSV data
 */
export class CsvImporter {
  /**
   * Create a new CSV importer
   * @param searchPokemon Function to search for Pokémon by name
   */
  constructor(
    private searchPokemon: (name: string) => Promise<Pokemon[]>,
    private defaultProfileImage: string = 'https://ui-avatars.com/api/?name=Trainer&background=random&rounded=true'
  ) {}

  /**
   * Import participants from CSV data
   * @param csvData CSV data in the format "Name, Title, Pokemon1, Pokemon2, ..., [ProfileImageUrl]"
   * @param options Import options
   */
  async importFromCsv(csvData: string, options: CsvImportOptions = {}): Promise<CsvImportResult> {
    const requiredPokemonCount = options.requiredPokemonCount ?? 6;
    
    if (!csvData.trim()) {
      return { count: 0, participants: [], error: 'CSV data is empty' };
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const newParticipants: Participant[] = [];
    const trainersWithInvalidTeams: string[] = [];
    const invalidPokemonByTrainer: Record<string, string[]> = {};
    const missingCountByTrainer: Record<string, number> = {};
    const warnings: string[] = [];
    
    for (const [lineIndex, line] of lines.entries()) {
      try {
        // Parse the CSV line, properly handling quoted fields
        const parts = this.parseCsvLine(line);
        if (parts.length < 3) {
          warnings.push(`Line ${lineIndex + 1}: Not enough fields (minimum: Name, Title, at least one Pokémon)`);
          continue;
        }

        // Remove surrounding quotes from name and title if present
        const stripQuotes = (str: string) => str.replace(/^["']|["']$/g, '');
        const name = stripQuotes(parts[0]);
        const title = stripQuotes(parts[1]);
        
        if (!name) {
          warnings.push(`Line ${lineIndex + 1}: Trainer name cannot be empty`);
          continue;
        }

        // Find the first part that looks like a URL (http/https), treat as profile image
        let profileImage: string | undefined = undefined;
        let pokemonNames: string[] = [];
        let rest = parts.slice(2);
        
        const urlIndex = rest.findIndex(p => p.startsWith('http://') || p.startsWith('https://'));
        if (urlIndex !== -1) {
          profileImage = stripQuotes(rest[urlIndex]);
          rest = rest.slice(0, urlIndex);
        }
        
        // Handle both formats: quotes around entire list or individual items
        // Always strip quotes from the field before checking and splitting
        if (rest.length === 1) {
          const stripped = stripQuotes(rest[0]);
          if ((stripped.startsWith('"') && stripped.endsWith('"')) || (stripped.startsWith("'") && stripped.endsWith("'"))) {
            // Remove quotes and split by comma, then strip quotes from each name
            const inner = stripQuotes(stripped);
            pokemonNames = inner.split(',').map(p => stripQuotes(p.trim())).filter(Boolean);
            console.log(`Parsed ${pokemonNames.length} Pokémon from quoted field`);
          } else {
            // Split by comma if not quoted, or treat as a single name
            if (stripped.includes(',')) {
              pokemonNames = stripped.split(',').map(p => stripQuotes(p.trim())).filter(Boolean);
            } else {
              pokemonNames = [stripped];
            }
          }
        } else {
          // Individual entries, strip quotes from each
          pokemonNames = rest.map(p => stripQuotes(p.trim())).filter(Boolean);
        }
        
        // Make sure we have Pokémon names
        if (pokemonNames.length === 0) {
          warnings.push(`Line ${lineIndex + 1}: No Pokémon listed for trainer ${name}`);
          continue;
        }

        // Look up Pokémon in the database
        const pokemonTeam: Pokemon[] = [];
        const invalidPokemon: string[] = [];
        
        for (const pokemonName of pokemonNames) {
          try {
            const results = await this.searchPokemon(pokemonName);
            if (results.length > 0) {
              pokemonTeam.push(results[0]);
            } else {
              invalidPokemon.push(pokemonName);
            }
          } catch (error) {
            console.error(`Error adding Pokémon ${pokemonName}:`, error);
            invalidPokemon.push(pokemonName);
          }
        }

        // Use a default gender-neutral profile image if none provided
        if (!profileImage) {
          // Use initials from the trainer's name for the avatar
          const initials = name
            .split(' ')
            .filter(Boolean)
            .map(word => word[0]?.toUpperCase() || '')
            .join('')
            .slice(0, 2) || 'TR';
          profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&rounded=true`;
        }

        // Check if we have all required Pokémon
        if (pokemonTeam.length < requiredPokemonCount) {
          trainersWithInvalidTeams.push(name);
          if (invalidPokemon.length > 0) {
            invalidPokemonByTrainer[name] = invalidPokemon;
          }
          missingCountByTrainer[name] = requiredPokemonCount - pokemonTeam.length;
        } else {
          // Create a participant object
          newParticipants.push({
            id: options.validateOnly ? 'test-id' : crypto.randomUUID(),
            name,
            title,
            team: pokemonTeam,
            profileImage,
          });
        }
      } catch (error) {
        warnings.push(`Line ${lineIndex + 1}: Error parsing line: ${(error as Error).message || String(error)}`);
      }
    }

    // Generate error message if any trainers have invalid teams
    if (trainersWithInvalidTeams.length > 0) {
      let errorMsg = `Some trainers have less than ${requiredPokemonCount} valid Pokémon:\n`;
      trainersWithInvalidTeams.forEach(name => {
        errorMsg += `\nTrainer: ${name}`;
        if (invalidPokemonByTrainer[name]?.length) {
          errorMsg += `\n  Invalid Pokémon: ${invalidPokemonByTrainer[name].join(', ')}`;
        }
        if (missingCountByTrainer[name]) {
          errorMsg += `\n  Missing Pokémon: ${missingCountByTrainer[name]}`;
        }
      });
      return { count: 0, participants: [], error: errorMsg, warnings };
    }

    return { 
      count: newParticipants.length, 
      participants: newParticipants,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Parse a CSV line, properly handling quoted fields
   * @param line CSV line to parse
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Handle quotes, but not escaped quotes (\")
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === "'" && (i === 0 || line[i-1] !== '\\')) {
        // Also handle single quotes
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of field when not in quotes
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.length > 0) {
      result.push(current);
    }
    
    return result.map(part => part.trim());
  }
} 