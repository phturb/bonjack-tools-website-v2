import axios from "axios";
import { API_HTTP_ENDPOINT } from "../config/config";

/** One Lois des Norms lobby as listed by `GET /lois/lobbies`. */
export interface LobbySummary {
  /** "main" or 8 characters [a-z0-9]. */
  id: string;
  /** "Main" for the default lobby. */
  name: string;
  isDefault: boolean;
  gameInProgress: boolean;
  rollCount: number;
  gameId: number;
  /** Occupied seats only. */
  players: { id: string; name?: string }[];
  /** Open websocket connections. */
  viewers: number;
  /** RFC 3339. */
  createdAt: string;
}

/** Longest lobby name the server accepts. */
export const LOBBY_NAME_MAX_LENGTH = 40;

const base = `${API_HTTP_ENDPOINT}/lois/lobbies`;
const lobbyUrl = (id: string) => `${base}/${encodeURIComponent(id)}`;

/** Main first, then the others by creation date. */
export const listLobbies = () => axios.get<LobbySummary[]>(base).then((res) => res.data);

/** A blank name lets the server pick its default ("Lobby N"). Fails with 409 at the lobby cap. */
export const createLobby = (name?: string) => {
  const trimmed = name?.trim() ?? "";
  return axios
    .post<LobbySummary>(base, trimmed.length > 0 ? { name: trimmed } : {})
    .then((res) => res.data);
};

/** 404 for an unknown id, 409 for main or a lobby with a game in progress. */
export const deleteLobby = (id: string) => axios.delete(lobbyUrl(id)).then(() => undefined);
