import axios from "axios";
import { API_HTTP_ENDPOINT } from "../config/config";
import {
  MatchResultInput,
  ParticipantInput,
  Tournament,
  TournamentInput,
  TournamentSummary,
} from "../interfaces/Swiss";

const base = `${API_HTTP_ENDPOINT}/swiss`;
const tournamentUrl = (id: string) => `${base}/${encodeURIComponent(id)}`;
const auth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const listTournaments = () =>
  axios.get<TournamentSummary[]>(base).then((res) => res.data);

export const getTournament = (id: string) =>
  axios.get<Tournament>(tournamentUrl(id)).then((res) => res.data);

export const createTournament = (token: string, input: TournamentInput) =>
  axios.post<Tournament>(base, input, auth(token)).then((res) => res.data);

export const updateTournament = (
  id: string,
  token: string,
  input: TournamentInput
) =>
  axios
    .patch<Tournament>(tournamentUrl(id), input, auth(token))
    .then((res) => res.data);

export const deleteTournament = (id: string, token: string) =>
  axios.delete(tournamentUrl(id), auth(token)).then(() => undefined);

export const replaceParticipants = (
  id: string,
  token: string,
  participants: ParticipantInput[]
) =>
  axios
    .put<Tournament>(`${tournamentUrl(id)}/participants`, participants, auth(token))
    .then((res) => res.data);

export const dropParticipant = (id: string, token: string, participantId: string) =>
  axios
    .post<Tournament>(
      `${tournamentUrl(id)}/participants/${encodeURIComponent(participantId)}/drop`,
      null,
      auth(token)
    )
    .then((res) => res.data);

export const startTournament = (id: string, token: string) =>
  axios
    .post<Tournament>(`${tournamentUrl(id)}/start`, null, auth(token))
    .then((res) => res.data);

export const setMatchResult = (
  id: string,
  token: string,
  matchId: string,
  result: MatchResultInput
) =>
  axios
    .put<Tournament>(
      `${tournamentUrl(id)}/matches/${encodeURIComponent(matchId)}/result`,
      result,
      auth(token)
    )
    .then((res) => res.data);

export const startPlayoffs = (id: string, token: string) =>
  axios
    .post<Tournament>(`${tournamentUrl(id)}/playoffs/start`, null, auth(token))
    .then((res) => res.data);

export const closeRound = (id: string, token: string) =>
  axios
    .post<Tournament>(`${tournamentUrl(id)}/rounds/close`, null, auth(token))
    .then((res) => res.data);

export const undoRound = (id: string, token: string) =>
  axios
    .post<Tournament>(`${tournamentUrl(id)}/rounds/undo`, null, auth(token))
    .then((res) => res.data);
