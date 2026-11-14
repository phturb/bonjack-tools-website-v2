import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getPlayerStats, PlayerStatsResponse } from "../../api/players";
import { PlayerStats, statNote } from "../../helpers/loisDesNorms";

/**
 * Live per-player stats: the one source for every stat on these pages. The
 * lobby state's stats are computed once when a player loads or joins voice and
 * go stale after a game ends; they only serve as placeholder data.
 */
export const PLAYER_STATS_KEY = ["player-stats"] as const;

/** Stats change at most once per finished loi; polls and re-renders must not refetch them. */
const STATS_STALE_MS = 5 * 60_000;

export const playerStatsQuery = (playerId: string, placeholder?: PlayerStats | null) => ({
  queryKey: [...PLAYER_STATS_KEY, playerId],
  queryFn: () => getPlayerStats(playerId),
  enabled: playerId !== "",
  staleTime: STATS_STALE_MS,
  retry: 1,
  placeholderData: placeholder ? { id: playerId, name: "", stats: placeholder } : undefined,
});

/**
 * The stats a query result stands for. A failed refetch keeps the last good
 * value (react-query keeps data on error); a first fetch that fails falls back
 * to the placeholder rather than blanking the note.
 */
export const statsOf = (
  result: Pick<UseQueryResult<PlayerStatsResponse>, "data" | "isError">,
  placeholder?: PlayerStats | null
): PlayerStats | undefined => result.data?.stats ?? (result.isError ? (placeholder ?? undefined) : undefined);

export const usePlayerStats = (playerId: string | undefined, placeholder?: PlayerStats | null) =>
  statsOf(useQuery(playerStatsQuery(playerId ?? "", placeholder)), placeholder);

/** A player's one-line stat note. */
export const usePlayerStatNote = (playerId: string | undefined, placeholder?: PlayerStats | null) =>
  statNote(usePlayerStats(playerId, placeholder));
