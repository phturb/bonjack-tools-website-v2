export type LeagueOfLegendsRole = "ADC" | "MID" | "JUNGLE" | "SUPPORT" | "TOP";

export type MessageActions = "updatePlayers" | "updateState";

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

export type AvailablePlayers = Record<string, DiscordPlayer>;

export interface LoisDesNormsState {
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
