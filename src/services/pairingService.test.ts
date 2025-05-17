/// <reference types="vitest" />
import { PairingService } from './pairingService';
import { describe, it, expect } from 'vitest';

describe('PairingService.autoPairRound', () => {
  function makeParticipant(id, name = '', team = []) {
    return { id, name, team };
  }
  function makeMatch(round, p1, p2, result = null) {
    return { id: `${p1}-${p2}-${round}`, round, participant1Id: p1, participant2Id: p2, result };
  }

  it('assigns bye to lowest score, and next lowest without a bye if needed', () => {
    const participants = [
      makeParticipant('A'),
      makeParticipant('B'),
      makeParticipant('C'),
    ];
    // Standings: C (0), B (1), A (2)
    const standings = [
      { participant: participants[2], points: 0, resistance: 0 }, // C
      { participant: participants[1], points: 1, resistance: 0 }, // B
      { participant: participants[0], points: 2, resistance: 0 }, // A
    ];
    // C already had a bye in round 1
    const matches = [makeMatch(1, 'C', null, 'bye')];
    const getStandings = () => standings;
    const havePlayed = () => false;
    // Should give bye to B (next lowest without a bye)
    const pairs = PairingService.autoPairRound(participants, matches, 2, getStandings, havePlayed);
    expect(pairs).toContainEqual(['B', null]);
    // The other two should be paired
    const pair = pairs.find(p => p[1] !== null);
    expect(pair).toBeDefined();
    expect(['A', 'C']).toContain(pair[0]);
    expect(['A', 'C']).toContain(pair[1]);
    expect(pair[0]).not.toBe(pair[1]);
  });

  it('avoids rematches', () => {
    const participants = [makeParticipant('A'), makeParticipant('B'), makeParticipant('C'), makeParticipant('D')];
    // Standings: A, B, C, D
    const standings = [
      { participant: participants[0], points: 2, resistance: 0 },
      { participant: participants[1], points: 2, resistance: 0 },
      { participant: participants[2], points: 1, resistance: 0 },
      { participant: participants[3], points: 1, resistance: 0 },
    ];
    // A and B already played
    const matches = [makeMatch(1, 'A', 'B', 'win1')];
    const getStandings = () => standings;
    const havePlayed = (id1, id2) => (id1 === 'A' && id2 === 'B') || (id1 === 'B' && id2 === 'A');
    const pairs = PairingService.autoPairRound(participants, matches, 2, getStandings, havePlayed);
    // A and B should not be paired again
    expect(pairs.some(([p1, p2]) => (p1 === 'A' && p2 === 'B') || (p1 === 'B' && p2 === 'A'))).toBe(false);
  });

  it('pairs by similar score (points, then resistance)', () => {
    const participants = [makeParticipant('A'), makeParticipant('B'), makeParticipant('C'), makeParticipant('D')];
    // Standings: A(3), B(2), C(1), D(0)
    const standings = [
      { participant: participants[0], points: 3, resistance: 5 },
      { participant: participants[1], points: 2, resistance: 4 },
      { participant: participants[2], points: 1, resistance: 2 },
      { participant: participants[3], points: 0, resistance: 1 },
    ];
    const matches = [];
    const getStandings = () => standings;
    const havePlayed = () => false;
    const pairs = PairingService.autoPairRound(participants, matches, 1, getStandings, havePlayed);
    // Should pair A-B and C-D
    expect(pairs).toContainEqual(['A', 'B']);
    expect(pairs).toContainEqual(['C', 'D']);
  });

  it('ensures no participant is left without a match or bye', () => {
    const participants = [
      { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }
    ];
    // Standings: E, D, C, B, A
    const standings = [
      { participant: participants[4], points: 4, resistance: 0 },
      { participant: participants[3], points: 3, resistance: 0 },
      { participant: participants[2], points: 2, resistance: 0 },
      { participant: participants[1], points: 1, resistance: 0 },
      { participant: participants[0], points: 0, resistance: 0 },
    ];
    const matches = [];
    const getStandings = () => standings;
    const havePlayed = () => false;
    const pairs = PairingService.autoPairRound(participants, matches, 1, getStandings, havePlayed);
    // Collect all participant IDs in pairs (including byes)
    const pairedIds = new Set();
    pairs.forEach(([p1, p2]) => {
      pairedIds.add(p1);
      if (p2) pairedIds.add(p2);
    });
    // All participants should be included
    expect(Array.from(pairedIds).sort()).toEqual(participants.map(p => p.id).sort());
  });

  it('assigns BYE to lowest score participant who has not had a BYE', () => {
    const participants = [
      { id: 'A' }, { id: 'B' }, { id: 'C' }
    ];
    // Standings: A(2), B(1), C(0)
    const standings = [
      { participant: participants[0], points: 2, resistance: 0 },
      { participant: participants[1], points: 1, resistance: 0 },
      { participant: participants[2], points: 0, resistance: 0 },
    ];
    // C already had a BYE
    const matches = [
      { id: 'C-null-1', round: 1, participant1Id: 'C', participant2Id: null, result: 'bye' }
    ];
    const getStandings = () => standings;
    const havePlayed = () => false;
    const pairs = PairingService.autoPairRound(participants, matches, 2, getStandings, havePlayed);
    // BYE should go to B (lowest score without a BYE)
    expect(pairs).toContainEqual(['B', null]);
  });

  it('assigns BYE to lowest score even if all have had a BYE', () => {
    const participants = [
      { id: 'A' }, { id: 'B' }, { id: 'C' }
    ];
    // Standings: A(2), B(1), C(0)
    const standings = [
      { participant: participants[0], points: 2, resistance: 0 },
      { participant: participants[1], points: 1, resistance: 0 },
      { participant: participants[2], points: 0, resistance: 0 },
    ];
    // All have had a BYE
    const matches = [
      { id: 'A-null-1', round: 1, participant1Id: 'A', participant2Id: null, result: 'bye' },
      { id: 'B-null-2', round: 2, participant1Id: 'B', participant2Id: null, result: 'bye' },
      { id: 'C-null-3', round: 3, participant1Id: 'C', participant2Id: null, result: 'bye' }
    ];
    const getStandings = () => standings;
    const havePlayed = () => false;
    const pairs = PairingService.autoPairRound(participants, matches, 4, getStandings, havePlayed);
    // BYE should go to C (lowest score)
    expect(pairs).toContainEqual(['C', null]);
  });

  it('assigns BYE to lowest resistance if points are tied', () => {
    const participants = [
      { id: 'A' }, { id: 'B' }, { id: 'C' }
    ];
    // Standings: A(1,2), B(1,1), C(0,0)
    const standings = [
      { participant: participants[0], points: 1, resistance: 2 },
      { participant: participants[1], points: 1, resistance: 1 },
      { participant: participants[2], points: 0, resistance: 0 },
    ];
    // C already had a BYE
    const matches = [
      { id: 'C-null-1', round: 1, participant1Id: 'C', participant2Id: null, result: 'bye' }
    ];
    const getStandings = () => standings;
    const havePlayed = () => false;
    const pairs = PairingService.autoPairRound(participants, matches, 2, getStandings, havePlayed);
    // BYE should go to B (lowest resistance among tied points, and hasn't had a BYE)
    expect(pairs).toContainEqual(['B', null]);
  });
}); 