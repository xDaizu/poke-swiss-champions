import React, { createContext, useState, useEffect, useContext } from 'react';
import { Participant, Match, Tournament, MatchResult } from '../types';
import { CsvImporter } from '../services/csvImporter';
import { storageService } from '../services/storageService';

interface AppContextType {
  participants: Participant[];
  tournament: Tournament;
  addParticipant: (participant: Participant) => void;
  editParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  setRounds: (rounds: number) => void;
  startTournament: () => void;
  updateMatchResult: (matchId: string, result: MatchResult) => void;
  getParticipantById: (id: string | null) => Participant | undefined;
  getParticipantScore: (id: string, maxRound?: number) => { points: number, resistance: number };
  getStandings: (maxRound?: number) => { participant: Participant, points: number, resistance: number }[];
  isMatchReady: (match: Match) => boolean;
  createCustomMatch: (round: number, participant1Id: string, participant2Id: string | null) => void;
  removeMatch: (matchId: string) => void;
  addParticipantsFromCsv: (csvData: string) => Promise<number>;
  havePlayed: (id1: string, id2: string) => boolean;
  getCurrentRound: () => number;
  toggleMatchPublic: (matchId: string) => void;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  createDataBackup: () => void;
  restoreFromBackup: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournament, setTournament] = useState<Tournament>({
    rounds: 4,
    currentRound: 0,
    matches: []
  });

  // Load data from storage service on first mount
  useEffect(() => {
    try {
      // Load participants
      const savedParticipants = storageService.loadParticipants();
      setParticipants(savedParticipants);
      
      // Load tournament data
      const savedTournament = storageService.loadTournament();
      setTournament(savedTournament);
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  }, []);

  // Save data to storage service whenever it changes
  useEffect(() => {
    storageService.saveParticipants(participants);
  }, [participants]);

  useEffect(() => {
    storageService.saveTournament(tournament);
  }, [tournament]);

  // Listen for localStorage changes in other tabs and update state
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'pokemon-tournament-data') {
        try {
          const savedTournament = storageService.loadTournament();
          setTournament(savedTournament);
        } catch (error) {
          console.error('Error handling storage event for tournament:', error);
        }
      }
      if (event.key === 'pokemon-tournament-participants') {
        try {
          const savedParticipants = storageService.loadParticipants();
          setParticipants(savedParticipants);
        } catch (error) {
          console.error('Error handling storage event for participants:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Set up automatic backups
  useEffect(() => {
    // Create an initial backup
    storageService.createBackup();
    
    // Create a backup every 30 minutes
    const backupInterval = setInterval(() => {
      console.log('Creating scheduled backup...');
      storageService.createBackup();
    }, 30 * 60 * 1000); // 30 minutes in milliseconds
    
    return () => clearInterval(backupInterval);
  }, []);

  // Backup functions
  const createDataBackup = () => {
    storageService.createBackup();
  };

  const restoreFromBackup = () => {
    const success = storageService.restoreFromBackup();
    if (success) {
      // Reload the data from storage
      const savedParticipants = storageService.loadParticipants();
      setParticipants(savedParticipants);
      
      const savedTournament = storageService.loadTournament();
      setTournament(savedTournament);
    }
    return success;
  };

  // Participant Management
  const addParticipant = (participant: Participant) => {
    setParticipants(prev => [...prev, participant]);
  };

  const editParticipant = (participant: Participant) => {
    setParticipants(prev => 
      prev.map(p => p.id === participant.id ? participant : p)
    );
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const getParticipantById = (id: string | null) => {
    if (!id) return undefined;
    return participants.find(p => p.id === id);
  };

  // CSV Participant Import
  const addParticipantsFromCsv = async (csvData: string): Promise<number> => {
    if (!csvData.trim()) return 0;

    try {
      // Use the new CsvImporter class
      const { searchPokemon } = await import('../services/pokemonService');
      const importer = new CsvImporter(searchPokemon);
      const result = await importer.importFromCsv(csvData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Add imported participants to the state
      if (result.participants.length > 0) {
        setParticipants(prev => [...prev, ...result.participants]);
      }

      return result.count;
    } catch (error) {
      console.error('Error importing participants:', error);
      throw error;
    }
  };

  // Tournament Management
  const setRounds = (rounds: number) => {
    setTournament(prev => ({
      ...prev,
      rounds
    }));
  };

  // Generate pairings for a new round using Swiss tournament rules
  const generatePairings = () => {
    const nextRound = tournament.currentRound + 1;
    if (nextRound > tournament.rounds) return;

    // Sort participants by points for pairing
    const standings = getStandings();
    const paired: Set<string> = new Set();
    const newMatches: Match[] = [...tournament.matches];

    // Create matches for this round
    for (let i = 0; i < standings.length; i++) {
      const participant1 = standings[i].participant;
      if (paired.has(participant1.id)) continue;
      
      // Find next unpaired participant who hasn't played against participant1
      let j = i + 1;
      while (j < standings.length) {
        const participant2 = standings[j].participant;
        if (!paired.has(participant2.id) && !havePlayed(participant1.id, participant2.id)) {
          paired.add(participant1.id);
          paired.add(participant2.id);
          
          // Create a new match
          newMatches.push({
            id: `match-${nextRound}-${newMatches.length + 1}`,
            round: nextRound,
            participant1Id: participant1.id,
            participant2Id: participant2.id,
            result: null,
            public: false
          });
          
          break;
        }
        j++;
      }
      
      // If no opponent was found, give a bye
      if (!paired.has(participant1.id)) {
        paired.add(participant1.id);
        newMatches.push({
          id: `match-${nextRound}-${newMatches.length + 1}`,
          round: nextRound,
          participant1Id: participant1.id,
          participant2Id: null,
          result: 'bye',
          public: false
        });
      }
    }

    setTournament(prev => ({
      ...prev,
      currentRound: nextRound,
      matches: newMatches
    }));
  };

  const startTournament = () => {
    setTournament(prev => ({
      rounds: prev.rounds,
      currentRound: 0, // will be ignored, kept for legacy
      matches: []
    }));
    // No automatic match generation
  };

  const updateMatchResult = (matchId: string, result: MatchResult) => {
    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map(m => 
        m.id === matchId ? { ...m, result, public: true } : m
      )
    }));
  };

  // Custom Match Management
  const createCustomMatch = (round: number, participant1Id: string, participant2Id: string | null) => {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      round,
      participant1Id,
      participant2Id,
      result: participant2Id ? null : 'bye', // If no participant2, it's a bye
      public: false
    };
    setTournament(prev => ({
      ...prev,
      currentRound: Math.max(prev.currentRound, round),
      matches: [...prev.matches, newMatch]
    }));
  };

  const removeMatch = (matchId: string) => {
    setTournament(prev => ({
      ...prev,
      matches: prev.matches.filter(m => m.id !== matchId)
    }));
  };

  // Helper functions
  const havePlayed = (id1: string, id2: string) => {
    return tournament.matches.some(
      m => 
        (m.participant1Id === id1 && m.participant2Id === id2) || 
        (m.participant1Id === id2 && m.participant2Id === id1)
    );
  };

  const getParticipantMatches = (id: string) => {
    return tournament.matches.filter(
      m => m.participant1Id === id || m.participant2Id === id
    );
  };

  const getParticipantScore = (id: string, maxRound?: number) => {
    let points = 0;
    let opponents: string[] = [];
    tournament.matches.forEach(match => {
      if (maxRound !== undefined && match.round > maxRound) return;
      if (match.participant1Id === id) {
        if (match.result === 'win1') points += 2;
        if (match.result === 'tie' || match.result === 'bye') points += 1;
        if (match.participant2Id) opponents.push(match.participant2Id);
      } else if (match.participant2Id === id) {
        if (match.result === 'win2') points += 2;
        if (match.result === 'tie') points += 1;
        if (match.participant1Id) opponents.push(match.participant1Id);
      }
    });
    // Calculate resistance (sum of opponents' points)
    let resistance = 0;
    opponents.forEach(opponentId => {
      let opponentPoints = 0;
      tournament.matches.forEach(match => {
        if (maxRound !== undefined && match.round > maxRound) return;
        if (match.participant1Id === opponentId) {
          if (match.result === 'win1') opponentPoints += 2;
          if (match.result === 'tie' || match.result === 'bye') opponentPoints += 1;
        } else if (match.participant2Id === opponentId) {
          if (match.result === 'win2') opponentPoints += 2;
          if (match.result === 'tie') opponentPoints += 1;
        }
      });
      resistance += opponentPoints;
    });
    return { points, resistance };
  };

  const getStandings = (maxRound?: number) => {
    const standings = participants.map(participant => {
      const { points, resistance } = getParticipantScore(participant.id, maxRound);
      return { participant, points, resistance };
    });
    // Sort by points, then by resistance
    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.resistance - a.resistance;
    });
  };

  const isMatchReady = (match: Match) => {
    return match.participant1Id !== null && 
           (match.participant2Id !== null || match.result === 'bye');
  };

  // Helper: get the number of rounds that are complete (all matches in that round have a result)
  const getCurrentRound = () => {
    let complete = 0;
    for (let r = 1; r <= tournament.rounds; r++) {
      const matches = tournament.matches.filter(m => m.round === r);
      if (matches.length > 0 && matches.every(m => m.result)) {
        complete++;
      } else {
        break;
      }
    }
    return complete;
  };

  const toggleMatchPublic = (matchId: string) => {
    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map(m =>
        m.id === matchId ? { ...m, public: !m.public } : m
      )
    }));
  };

  const value = {
    participants,
    tournament,
    addParticipant,
    editParticipant,
    removeParticipant,
    setRounds,
    startTournament,
    updateMatchResult,
    getParticipantById,
    getParticipantScore,
    getStandings,
    isMatchReady,
    createCustomMatch,
    removeMatch,
    addParticipantsFromCsv,
    havePlayed,
    getCurrentRound,
    toggleMatchPublic,
    setTournament,
    setParticipants,
    createDataBackup,
    restoreFromBackup
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const addParticipantsFromCsvStandalone = async (csvData: string, searchPokemon: (name: string) => Promise<any[]>): Promise<{count: number, error?: string}> => {
  if (!csvData.trim()) return { count: 0 };

  const lines = csvData.split('\n').filter(line => line.trim());
  const newParticipants: Participant[] = [];
  const trainersWithInvalidTeams: string[] = [];
  const invalidPokemonByTrainer: Record<string, string[]> = {};
  const missingCountByTrainer: Record<string, number> = {};
  
  for (const line of lines) {
    try {
      const parts = parseCsvLine(line);
      if (parts.length < 3) continue; // Need at least name, title, and one pokemon

      // Remove surrounding quotes from name and title if present
      const stripQuotes = (str: string) => str.replace(/^\"|\"$/g, '').replace(/^'|'$/g, '');
      const name = stripQuotes(parts[0]);
      const title = stripQuotes(parts[1]);
      // Find the first part that looks like a URL (http/https), treat as profile image
      let profileImage = undefined;
      let pokemonNames: string[] = [];
      let rest = parts.slice(2);
      const urlIndex = rest.findIndex(p => p.startsWith('http://') || p.startsWith('https://'));
      if (urlIndex !== -1) {
        profileImage = stripQuotes(rest[urlIndex]);
        rest = rest.slice(0, urlIndex);
      }
      // Handle quoted, comma-separated Pokémon list in a single field
      if (rest.length === 1 && (/^\".*\"$/.test(parts[2]) || /^'.*'$/.test(parts[2]))) {
        // Remove quotes and split by comma, then strip quotes from each name
        pokemonNames = stripQuotes(rest[0]).split(',').map(p => stripQuotes(p.trim())).filter(Boolean);
      } else {
        pokemonNames = rest.map(p => stripQuotes(p)).filter(Boolean);
      }
      // Import pokemon from the service
      const pokemonTeam = [];
      const invalidPokemon: string[] = [];
      for (const pokemonName of pokemonNames.slice(0, 6)) { // Max 6
        try {
          const results = await searchPokemon(pokemonName);
          if (results.length > 0) {
            pokemonTeam.push(results[0]);
          } else {
            invalidPokemon.push(pokemonName);
          }
        } catch (error) {
          invalidPokemon.push(pokemonName);
        }
      }
      // Use a default gender-neutral profile image if none provided
      if (!profileImage) {
        profileImage = 'https://ui-avatars.com/api/?name=Trainer&background=random&rounded=true';
      }
      if (pokemonTeam.length < 6) {
        trainersWithInvalidTeams.push(name);
        if (invalidPokemon.length > 0) {
          invalidPokemonByTrainer[name] = invalidPokemon;
        }
        if (pokemonTeam.length < 6) {
          missingCountByTrainer[name] = 6 - pokemonTeam.length;
        }
      } else {
        newParticipants.push({
          id: 'test-id', // For test, id is not important
          name,
          title,
          team: pokemonTeam,
          profileImage,
        });
      }
    } catch (error) {
      // skip
    }
  }

  if (trainersWithInvalidTeams.length > 0) {
    let errorMsg = 'Some trainers have less than 6 valid Pokémon.\n';
    trainersWithInvalidTeams.forEach(name => {
      errorMsg += `\nTrainer: ${name}`;
      if (invalidPokemonByTrainer[name] && invalidPokemonByTrainer[name].length > 0) {
        errorMsg += `\n  Invalid Pokémon: ${invalidPokemonByTrainer[name].join(', ')}`;
      }
      if (missingCountByTrainer[name]) {
        errorMsg += `\n  Missing Pokémon: ${missingCountByTrainer[name]}`;
      }
    });
    return { count: 0, error: errorMsg };
  }
  return { count: newParticipants.length };
};

// Helper to parse a CSV line, handling quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === '\'' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
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
