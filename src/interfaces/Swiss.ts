// Types mirrored from the Go JSON of the Swiss tournament API
// (docs/specs/swiss-tournament.md, section 8).

/** `completed` is the end of the Swiss stage; playoffs may follow until `finished`. */
export type TournamentStatus = "draft" | "in_progress" | "completed" | "playoffs" | "finished";
export type ParticipantStatus = "active" | "advanced" | "eliminated" | "dropped";
export type Seeding = "manual" | "random";
export type Visibility = "public" | "unlisted";
export type BestOf = 1 | 3 | 5;

export interface TournamentConfig {
  winsToAdvance: number;
  lossesToEliminate: number;
  bestOf: BestOf;
  decidersBestOf: BestOf;
  /** Best-of of every playoff match. Editable until the playoffs start. */
  playoffsBestOf: BestOf;
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
  /** Linked site user (Discord id) and their known name, null when unlinked. */
  playerId: string | null;
  playerName: string | null;
}

/** Body item of PUT /swiss/{id}/participants. */
export interface ParticipantInput {
  id?: string;
  name: string;
  seed: number;
  /** Existing site user to link; omit or null to leave the seat unlinked. */
  playerId?: string | null;
}

/** Entry of GET /swiss/players: a site user known to the backend. */
export interface SwissPlayer {
  id: string;
  name: string | null;
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

/** Single-elimination stage among the advanced players, present once started. */
export interface Playoffs {
  bestOf: BestOf;
  /** Bracket size, a power of two; round 1 has size/2 matches (byes included). */
  size: number;
  currentRound: number;
  rounds: Round[];
  /** Winner of the final, set when the status is `finished`. */
  champion: string | null;
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
  playoffs: Playoffs | null;
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
  playoffsBestOf: 1,
  seeding: "manual",
  allowRematches: false,
  visibility: "public",
};

export const PARTICIPANT_WARNING_THRESHOLD = 64;
