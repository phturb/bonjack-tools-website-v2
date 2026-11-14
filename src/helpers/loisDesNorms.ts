import { LDN_WEBSOCKET_ENDPOINT } from "../config/config";

export type LeagueOfLegendsRole = "ADC" | "MID" | "JUNGLE" | "SUPPORT" | "TOP";

/**
 * Websocket actions. The client sends updatePlayers (plus roll, cancel, reset);
 * the server sends updateState, and lobbyNotFound or lobbyClosed (content: the
 * lobby id) right before it closes the connection for good.
 */
export type MessageActions = "updatePlayers" | "updateState" | "lobbyNotFound" | "lobbyClosed";

// The Go server sends JSON null for nil pointers, maps and slices: every
// optional field below can arrive as null, not only missing.

export interface Player {
  player: DiscordPlayer;
  /** null until the seat is rolled. */
  role?: LeagueOfLegendsRole | null;
  /** null until the seat is rolled. */
  champion?: Champion | null;
}

export interface Champion {
  id: string;
  name: string;
  img: string;
}

export interface PlayerStats {
  numberOfGame: number;
  totalRoll: number;
}

export interface DiscordPlayer {
  id: string;
  name?: string | null;
  stats?: PlayerStats | null;
}

/** Another lobby a player is seated in. */
export interface SeatedIn {
  id: string;
  name: string;
  /** The other lobby has a game in progress: the player can't be seated here. */
  gameInProgress: boolean;
}

export interface AvailablePlayer extends DiscordPlayer {
  /** Set only when the player sits in another lobby. Picking them moves them unless that lobby is in a game. */
  seatedIn?: SeatedIn | null;
}

export type AvailablePlayers = Record<string, AvailablePlayer>;

export interface LoisDesNormsState {
  lobbyId: string;
  lobbyName: string;
  players: Player[];
  rollCount: number;
  gameInProgress: boolean;
  availablePlayers: AvailablePlayers;
  gameId: number;
  /** Remaining ms before the next roll, as sent by the server. */
  nextRollTimer: number;
  /** Full cooldown between two rolls, in ms. Older servers leave it out. */
  rollCooldownMs?: number | null;
  /** Epoch ms derived from nextRollTimer when the state was received. */
  nextRollAt: number;
  canRoll: boolean;
  /** Discord guild id. */
  discordGuild: string;
  discordGuildName: string;
  discordGuildChannel: string;
  leagueVersion: string;
}

export const DEFAULT_LOBBY_ID = "main";
/** Production cooldown, for servers that don't send rollCooldownMs. */
export const DEFAULT_ROLL_COOLDOWN_MS = 300_000;
export const LOBBY_LIST_PATH = "/lois-des-norms";
/** Seats in a lobby. */
export const SEAT_COUNT = 5;
/** react-query key of the lobby list. */
export const LOBBIES_QUERY_KEY = ["ldn-lobbies"] as const;

export const lobbyPath = (lobbyId: string): string =>
  `${LOBBY_LIST_PATH}/${encodeURIComponent(lobbyId)}`;

/**
 * Websocket URL subscribed to one lobby. The endpoint may already carry a query
 * string; a relative one resolves against the page, like `new WebSocket` does.
 */
export const lobbyWebsocketUrl = (lobbyId: string): string => {
  const url = new URL(LDN_WEBSOCKET_ENDPOINT, window.location.href);
  if (url.protocol === "http:") url.protocol = "ws:";
  if (url.protocol === "https:") url.protocol = "wss:";
  url.searchParams.set("lobby", lobbyId);
  return url.toString();
};

export const emptyDiscordPlayer = (): DiscordPlayer => {
  return { id: "", name: undefined };
};

export const emptyPlayer = (): Player => {
  return { player: emptyDiscordPlayer(), role: undefined, champion: undefined };
};

/** First letter of a name, for the initial disc. */
export const initialOf = (name: string | null | undefined): string =>
  Array.from(name?.trim() ?? "")[0]?.toLocaleUpperCase() ?? "?";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One-line stat note under a player's name: "12 games · 31 rolls". */
export const statNote = (stats: PlayerStats | null | undefined): string | undefined =>
  stats ? `${plural(stats.numberOfGame, "game")} · ${plural(stats.totalRoll, "roll")}` : undefined;

export const winRate = (stats: PlayerStats | null | undefined): number => {
  if (!stats || stats.numberOfGame === 0 || stats.totalRoll === 0) return 0;
  return (stats.numberOfGame / stats.totalRoll) * 100;
};
