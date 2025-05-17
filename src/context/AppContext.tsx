
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Participant, Match, Tournament, MatchResult } from '../types';

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
  getParticipantScore: (id: string) => { points: number, resistance: number };
  getStandings: () => { participant: Participant, points: number, resistance: number }[];
  isMatchReady: (match: Match) => boolean;
  createCustomMatch: (round: number, participant1Id: string, participant2Id: string | null) => void;
  removeMatch: (matchId: string) => void;
  addParticipantsFromCsv: (csvData: string) => Promise<number>;
  havePlayed: (id1: string, id2: string) => boolean;
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

  // Load data from localStorage on first mount
  useEffect(() => {
    const savedParticipants = localStorage.getItem('pokemon-tournament-participants');
    const savedTournament = localStorage.getItem('pokemon-tournament-data');
    
    if (savedParticipants) {
      try {
        setParticipants(JSON.parse(savedParticipants));
      } catch (error) {
        console.error('Error parsing participants data:', error);
      }
    }
    
    if (savedTournament) {
      try {
        setTournament(JSON.parse(savedTournament));
      } catch (error) {
        console.error('Error parsing tournament data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pokemon-tournament-participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('pokemon-tournament-data', JSON.stringify(tournament));
  }, [tournament]);

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

    const lines = csvData.split('\n').filter(line => line.trim());
    const newParticipants: Participant[] = [];
    
    for (const line of lines) {
      try {
        // Format: Name, Title, Pokemon1, Pokemon2, ... 
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 3) continue; // Need at least name, title, and one pokemon
        
        const name = parts[0];
        const title = parts[1];
        const pokemonNames = parts.slice(2).filter(p => p);
        
        // Import pokemon from the service
        const pokemonTeam = [];
        for (const pokemonName of pokemonNames.slice(0, 6)) { // Max 6
          try {
            const { searchPokemon } = await import('../services/pokemonService');
            const results = await searchPokemon(pokemonName);
            if (results.length > 0) {
              pokemonTeam.push(results[0]);
            }
          } catch (error) {
            console.error(`Error adding pokemon ${pokemonName}:`, error);
          }
        }
        
        if (pokemonTeam.length > 0) {
          newParticipants.push({
            id: crypto.randomUUID(),
            name,
            title,
            team: pokemonTeam
          });
        }
      } catch (error) {
        console.error('Error parsing line:', line, error);
      }
    }
    
    if (newParticipants.length > 0) {
      setParticipants(prev => [...prev, ...newParticipants]);
    }
    
    return newParticipants.length;
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
            result: null
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
          result: 'bye'
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
      ...prev,
      currentRound: 0,
      matches: []
    }));
    generatePairings();
  };

  const updateMatchResult = (matchId: string, result: MatchResult) => {
    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map(m => 
        m.id === matchId ? { ...m, result } : m
      )
    }));
  };

  // Custom Match Management
  const createCustomMatch = (round: number, participant1Id: string, participant2Id: string | null) => {
    const newMatch: Match = {
      id: `match-custom-${Date.now()}`,
      round,
      participant1Id,
      participant2Id,
      result: participant2Id ? null : 'bye' // If no participant2, it's a bye
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

  const getParticipantScore = (id: string) => {
    let points = 0;
    let opponents: string[] = [];
    
    tournament.matches.forEach(match => {
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

  const getStandings = () => {
    const standings = participants.map(participant => {
      const { points, resistance } = getParticipantScore(participant.id);
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
    havePlayed
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
