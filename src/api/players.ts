import axios from "axios";
import { API_HTTP_ENDPOINT } from "../config/config";
import { PlayerStats } from "../helpers/loisDesNorms";

export interface PlayerChampion {
  id: string;
  name: string;
  img: string;
  owned: boolean;
}

export interface PlayerStatsResponse {
  id: string;
  name: string;
  stats: PlayerStats;
}

export const getPlayerChampions = (discordId: string) =>
  axios
    .get<PlayerChampion[]>(
      `${API_HTTP_ENDPOINT}/players/${encodeURIComponent(discordId)}/champions`
    )
    .then((res) => res.data);

export const getPlayerStats = (discordId: string) =>
  axios
    .get<PlayerStatsResponse>(
      `${API_HTTP_ENDPOINT}/players/${encodeURIComponent(discordId)}/stats`
    )
    .then((res) => res.data);

export const updatePlayerChampions = (
  discordId: string,
  token: string,
  champions: { id: string; owned: boolean }[]
) =>
  axios.post(
    `${API_HTTP_ENDPOINT}/players/${encodeURIComponent(discordId)}/champions`,
    champions,
    { headers: { Authorization: `Bearer ${token}` } }
  );
