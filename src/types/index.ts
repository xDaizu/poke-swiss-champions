export interface Pokemon {
  id: number;
  name: string;
  type: string[];
  sprite: string;
}

export interface Participant {
  id: string;
  name: string;
  title: string;
  team: Pokemon[];
  profileImage?: string;
}

export interface Match {
  id: string;
  round: number;
  participant1Id: string | null;
  participant2Id: string | null;
  result: MatchResult | null;
  public: boolean;
}

export type MatchResult = 'win1' | 'win2' | 'tie' | 'bye';

export interface Tournament {
  rounds: number;
  currentRound: number;
  matches: Match[];
}
