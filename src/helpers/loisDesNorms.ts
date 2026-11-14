import { LDN_WEBSOCKET_ENDPOINT } from "../config/config";

export type LeagueOfLegendsRole = "ADC" | "MID" | "JUNGLE" | "SUPPORT" | "TOP";

/**
 * Websocket actions. The client sends updatePlayers (plus roll, cancel, reset);
 * the server sends updateState, and lobbyNotFound or lobbyClosed (content: the
 * lobby id) right before it closes the connection for good.
 */
export type MessageActions = "updatePlayers" | "updateState" | "lobbyNotFound" | "lobbyClosed";

export interface Player {
  player: DiscordPlayer;
  role: LeagueOfLegendsRole | undefined;
  champion: Champion | undefined;
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
  name: string | undefined;
  stats?: PlayerStats;
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
  seatedIn?: SeatedIn;
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

export const winRate = (stats: PlayerStats | undefined): number => {
  if (!stats || stats.numberOfGame === 0 || stats.totalRoll === 0) return 0;
  return (stats.numberOfGame / stats.totalRoll) * 100;
};
