import { isAxiosError } from "axios";
import { BestOf, Bucket, Match, Participant, Round, Tournament } from "../interfaces/Swiss";

/** Message from an API error body `{ "error": "message" }`, falling back to the axios message. */
export const apiErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ error?: string }>(error)) {
    const fromBody = error.response?.data?.error;
    if (typeof fromBody === "string" && fromBody.length > 0) return fromBody;
    if (error.response?.status === 403) return "Only the creator can do that.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

/** Fixed width of a round column in the bracket graph (spec section 6). */
export const COLUMN_WIDTH = 320;

export const winThreshold = (bestOf: BestOf): number => Math.ceil(bestOf / 2);

/** Every valid final score for a best-of: bo1 → 1–0 / 0–1, bo3 → 2–0, 2–1, 1–2, 0–2, … */
export const scoreOptions = (bestOf: BestOf): [number, number][] => {
  const needed = winThreshold(bestOf);
  const p1Wins: [number, number][] = [];
  const p2Wins: [number, number][] = [];
  for (let loserScore = 0; loserScore < needed; loserScore++) {
    p1Wins.push([needed, loserScore]);
    p2Wins.unshift([loserScore, needed]);
  }
  return [...p1Wins, ...p2Wins];
};

export const recordLabel = (bucket: Bucket): string => `${bucket.wins}-${bucket.losses}`;

export interface BucketGroup {
  bucket: Bucket;
  matches: Match[];
}

/** Matches of a round grouped by bucket, best record first. */
export const groupByBucket = (round: Round): BucketGroup[] => {
  const groups = new Map<string, BucketGroup>();
  for (const match of round.matches) {
    const key = recordLabel(match.bucket);
    const group = groups.get(key);
    if (group) {
      group.matches.push(match);
    } else {
      groups.set(key, { bucket: match.bucket, matches: [match] });
    }
  }
  return [...groups.values()].sort(
    (a, b) => b.bucket.wins - a.bucket.wins || a.bucket.losses - b.bucket.losses
  );
};

export const participantMap = (tournament: Tournament): Map<string, Participant> =>
  new Map(tournament.participants.map((p) => [p.id, p]));

export const currentRound = (tournament: Tournament): Round | undefined =>
  tournament.rounds.find((r) => r.number === tournament.currentRound) ??
  tournament.rounds[tournament.rounds.length - 1];

export const isResolved = (match: Match): boolean => match.winner !== null;

/** Round number in which a participant reached its final status, used to order the outcome panels. */
export const roundReached = (tournament: Tournament, participantId: string): number => {
  let last = 0;
  for (const round of tournament.rounds) {
    if (round.matches.some((m) => m.p1 === participantId || m.p2 === participantId)) {
      last = round.number;
    }
  }
  return last;
};

/** Split the pasted text into trimmed, non-empty names, one per line. */
export const parseNames = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
