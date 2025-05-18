// PairingService: handles automatic pairing logic for tournament rounds
export class PairingService {
  /**
   * Returns an array of [participant1Id, participant2Id|null] pairs for the given round
   * @param participants All participants
   * @param matches All matches
   * @param roundNumber The round to pair
   * @param getStandings Function to get standings (should be sorted by points, resistance)
   * @param havePlayed Function to check if two participants have already played
   */
  static autoPairRound(participants, matches, roundNumber, getStandings, havePlayed) {
    // Get participants not already in a match for this round
    const matchesInRound = matches.filter(m => m.round === roundNumber);
    const pairedIds = new Set();
    matchesInRound.forEach(m => {
      if (m.participant1Id) pairedIds.add(m.participant1Id);
      if (m.participant2Id) pairedIds.add(m.participant2Id);
    });
    // Get standings (sorted by points, then resistance)
    const standings = getStandings().filter(s => !pairedIds.has(s.participant.id));
    let unpaired = standings.map(s => s.participant);
    const pairs = [];
    // BYE logic
    if (unpaired.length % 2 === 1) {
      // Find participants who have already had a bye
      const hadBye = new Set(
        matches.filter(m => m.result === 'bye' && m.participant2Id === null && m.participant1Id)
          .map(m => m.participant1Id)
      );
      // Get standings for unpaired
      const standingsForUnpaired = getStandings().filter(s => unpaired.some(p => p.id === s.participant.id));
      // Filter out those who already had a BYE
      let byeCandidates = unpaired.filter(p => !hadBye.has(p.id));
      // If all have had a BYE, use all
      if (byeCandidates.length === 0) byeCandidates = [...unpaired];
      // Sort by lowest points, then lowest resistance
      byeCandidates.sort((a, b) => {
        const sa = standingsForUnpaired.find(s => s.participant.id === a.id);
        const sb = standingsForUnpaired.find(s => s.participant.id === b.id);
        if (!sa || !sb) return 0;
        if (sa.points !== sb.points) return sa.points - sb.points;
        return sa.resistance - sb.resistance;
      });
      // Find all with the lowest points and resistance
      if (byeCandidates.length > 1) {
        const standingsSorted = byeCandidates.map(p => standingsForUnpaired.find(s => s.participant.id === p.id));
        const minPoints = Math.min(...standingsSorted.map(s => s?.points ?? 0));
        const minResistance = Math.min(...standingsSorted.filter(s => (s?.points ?? 0) === minPoints).map(s => s?.resistance ?? 0));
        const lowestCandidates = byeCandidates.filter(p => {
          const s = standingsForUnpaired.find(s2 => s2.participant.id === p.id);
          return s && s.points === minPoints && s.resistance === minResistance;
        });
        // Pick one at random if there are several
        if (lowestCandidates.length > 1) {
          const randomIdx = Math.floor(Math.random() * lowestCandidates.length);
          byeCandidates = [lowestCandidates[randomIdx]];
        } else if (lowestCandidates.length === 1) {
          byeCandidates = [lowestCandidates[0]];
        }
      }
      const byeCandidate = byeCandidates[0];
      pairs.push([byeCandidate.id, null]);
      unpaired = unpaired.filter(p => p.id !== byeCandidate.id);
    }
    // Pair by similar score, avoid rematches
    const used = new Set();
    for (let i = 0; i < unpaired.length; i++) {
      if (used.has(unpaired[i].id)) continue;
      let found = false;
      for (let j = i + 1; j < unpaired.length; j++) {
        if (used.has(unpaired[j].id)) continue;
        if (!havePlayed(unpaired[i].id, unpaired[j].id)) {
          pairs.push([unpaired[i].id, unpaired[j].id]);
          used.add(unpaired[i].id);
          used.add(unpaired[j].id);
          found = true;
          break;
        }
      }
      if (!found) {
        // If no non-rematch found, pair with next available
        for (let j = i + 1; j < unpaired.length; j++) {
          if (used.has(unpaired[j].id)) continue;
          pairs.push([unpaired[i].id, unpaired[j].id]);
          used.add(unpaired[i].id);
          used.add(unpaired[j].id);
          break;
        }
      }
    }
    return pairs;
  }
} 