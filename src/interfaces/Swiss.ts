// Types mirrored from the Go JSON of the Swiss tournament API
// (docs/specs/swiss-tournament.md, section 8).

export type TournamentStatus = "draft" | "in_progress" | "completed";
export type ParticipantStatus = "active" | "advanced" | "eliminated" | "dropped";
export type Seeding = "manual" | "random";
export type Visibility = "public" | "unlisted";
export type BestOf = 1 | 3 | 5;

export interface TournamentConfig {
  winsToAdvance: number;
  lossesToEliminate: number;
  bestOf: BestOf;
  decidersBestOf: BestOf;
  seeding: Seeding;
  allowRematches: boolean;
  visibility: Visibility;
}

/** Body of POST /swiss and PATCH /swiss/{id}. */
export interface TournamentInput extends Partial<TournamentConfig> {
  name?: string;
  description?: string;
}

export interface Participant {
  id: string;
  name: string;
  seed: number;
  wins: number;
  losses: number;
  buchholz: number;
  status: ParticipantStatus;
}

/** Body item of PUT /swiss/{id}/participants. */
export interface ParticipantInput {
  id?: string;
  name: string;
  seed: number;
}

export interface Bucket {
  wins: number;
  losses: number;
}

export interface Match {
  id: string;
  bucket: Bucket;
  bestOf: BestOf;
  p1: string;
  p2: string | null;
  p1Score: number | null;
  p2Score: number | null;
  winner: string | null;
  bye: boolean;
  rematch: boolean;
  forfeit: boolean;
}

export interface Round {
  number: number;
  closed: boolean;
  matches: Match[];
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  status: TournamentStatus;
  config: TournamentConfig;
  ownerSub: string;
  createdAt: string;
  currentRound: number;
  participants: Participant[];
  rounds: Round[];
  standings: string[];
}

export interface TournamentSummary {
  id: string;
  name: string;
  status: TournamentStatus;
  /** Participant count. */
  participants: number;
  createdAt: string;
}

export interface MatchResultInput {
  p1Score: number;
  p2Score: number;
}

export const DEFAULT_CONFIG: TournamentConfig = {
  winsToAdvance: 3,
  lossesToEliminate: 3,
  bestOf: 1,
  decidersBestOf: 1,
  seeding: "manual",
  allowRematches: false,
  visibility: "public",
};

export const PARTICIPANT_WARNING_THRESHOLD = 64;
