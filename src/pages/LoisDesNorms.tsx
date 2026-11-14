import { useEffect, useReducer, useRef, useCallback, useState } from "react";
import {
  Alert,
  CircularProgress,
  Container,
  Link,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  DEFAULT_LOBBY_ID,
  emptyDiscordPlayer,
  emptyPlayer,
  LOBBY_LIST_PATH,
  lobbyWebsocketUrl,
  LoisDesNormsState,
  MessageActions,
  Player,
  SEAT_COUNT,
} from "../helpers/loisDesNorms";
import AdditionalInformationBlock from "../components/LoisDesNorms/AdditionalInformationBlock";
import Lobby from "../components/LoisDesNorms/Lobby";

type Message = { action: MessageActions; content: string };

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30_000;
/** Close code the server uses right after lobbyNotFound. */
const LOBBY_NOT_FOUND_CLOSE_CODE = 4404;

const initialState = (lobbyId: string): LoisDesNormsState => ({
  lobbyId,
  lobbyName: "",
  players: Array.from({ length: SEAT_COUNT }, emptyPlayer),
  rollCount: 0,
  gameInProgress: false,
  gameId: -1,
  nextRollTimer: 0,
  nextRollAt: 0,
  canRoll: false,
  availablePlayers: { "": emptyDiscordPlayer() },
  discordGuild: "",
  discordGuildName: "",
  discordGuildChannel: "",
  leagueVersion: "",
});

const reducer = (state: LoisDesNormsState, message: Message): LoisDesNormsState => {
  switch (message.action) {
    case "updatePlayers": {
      const players = JSON.parse(message.content) as Player[];
      return { ...state, players };
    }
    case "updateState": {
      // Replaces the whole state, so it also reverts an optimistic updatePlayers
      // the server refused (it echoes the true state back to the sender).
      const newState = JSON.parse(message.content) as LoisDesNormsState;
      return {
        ...newState,
        // Additive fields: an older server leaves them out.
        lobbyId: newState.lobbyId ?? state.lobbyId,
        lobbyName: newState.lobbyName ?? "",
        nextRollAt: Date.now() + (newState.nextRollTimer ?? 0),
        availablePlayers: { ...newState.availablePlayers, "": emptyDiscordPlayer() },
      };
    }
    default:
      return state;
  }
};

/** Why the server ended the connection for good: no reconnect after either. */
type LobbyGoneReason = "notFound" | "closed";

type ConnectionStatus =
  | { kind: "connecting"; attempt: number }
  | { kind: "open" }
  | { kind: "closed"; attempt: number; retryInMs: number }
  | { kind: "gone"; reason: LobbyGoneReason };

const backLink = (
  <Link component={RouterLink} to={LOBBY_LIST_PATH} underline="hover" sx={{ display: "inline-block", mt: 1 }}>
    ← All lobbies
  </Link>
);

const title = (
  <Typography variant="h4" component="h4" align="center">
    Lois Des Norms
  </Typography>
);

const LoisDesNormsLobby = ({ lobbyId }: { lobbyId: string }) => {
  const [state, dispatch] = useReducer(reducer, lobbyId, initialState);
  const [connection, setConnection] = useState<ConnectionStatus>({ kind: "connecting", attempt: 1 });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Unmounted (the page is keyed by lobby id, so this also covers a lobby switch).
    let disposed = false;
    // The server said the lobby does not exist or was closed.
    let gone = false;
    let retryDelay = INITIAL_RETRY_MS;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const stop = (ws: WebSocket, reason: LobbyGoneReason) => {
      gone = true;
      clearTimeout(retryTimer);
      setConnection({ kind: "gone", reason });
      ws.close();
    };

    const connect = () => {
      if (disposed || gone) return;
      attempt += 1;
      setConnection({ kind: "connecting", attempt });
      const ws = new WebSocket(lobbyWebsocketUrl(lobbyId));
      wsRef.current = ws;

      ws.onopen = () => {
        retryDelay = INITIAL_RETRY_MS;
        setConnection({ kind: "open" });
      };
      ws.onmessage = (event) => {
        if (disposed || gone) return;
        try {
          const msg = JSON.parse(event.data) as Message;
          if (msg.action === "lobbyNotFound") stop(ws, "notFound");
          else if (msg.action === "lobbyClosed") stop(ws, "closed");
          else if (msg.action) dispatch(msg);
        } catch (err) {
          console.error("Invalid websocket message", err);
        }
      };
      ws.onerror = (err) => {
        console.error("Socket encountered error, closing", err);
        ws.close();
      };
      ws.onclose = (evt) => {
        if (wsRef.current === ws) wsRef.current = null;
        if (disposed || gone) return;
        if (evt.code === LOBBY_NOT_FOUND_CLOSE_CODE) {
          // The lobbyNotFound message got lost; the close code says the same thing.
          gone = true;
          setConnection({ kind: "gone", reason: "notFound" });
          return;
        }
        console.warn(
          `Socket closed (${evt.reason || evt.code}). Reconnecting in ${retryDelay / 1000}s`
        );
        setConnection({ kind: "closed", attempt, retryInMs: retryDelay });
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
      };
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [lobbyId]);

  /** False when the socket is not open and the action was dropped. */
  const send = useCallback((action: string, content?: string): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(`Socket not open, dropping action "${action}"`);
      return false;
    }
    ws.send(JSON.stringify({ action, content }));
    return true;
  }, []);

  const reset = () => send("reset");
  const roll = () => send("roll");
  const cancel = () => send("cancel");

  const onPlayerChange = (event: SelectChangeEvent, index: number) => {
    const newId = event.target.value;
    const current = state.players[index];
    if (newId === current.player.id) return;

    const players = state.players.map((p) => ({ ...p, player: { ...p.player } }));
    // Picking an already-seated player swaps the two seats. Picking "empty" just
    // clears this seat; it must never move the current player somewhere else.
    const swapIndex = newId === "" ? -1 : players.findIndex((p) => p.player.id === newId);
    if (swapIndex >= 0) {
      players[swapIndex].player = { ...current.player };
    }
    players[index].player = {
      id: newId,
      name: state.availablePlayers[newId]?.name,
    };

    // Optimistic: applied only once sent. If the server refuses the seat (the
    // player is in a game in another lobby), its updateState reverts it.
    if (send("updatePlayers", JSON.stringify(players.map((p) => p.player)))) {
      dispatch({ action: "updatePlayers", content: JSON.stringify(players) });
    }
  };

  if (connection.kind === "gone") {
    return (
      <Container>
        {backLink}
        {title}
        <Alert severity="warning" sx={{ mt: 2 }}>
          {connection.reason === "notFound"
            ? "This lobby does not exist. It may have been closed. "
            : "This lobby was closed. "}
          <Link component={RouterLink} to={LOBBY_LIST_PATH}>
            See all lobbies
          </Link>
        </Alert>
      </Container>
    );
  }

  const connectionBanner =
    connection.kind === "open" ? null : (
      <Alert severity={connection.kind === "closed" ? "warning" : "info"}>
        {connection.kind === "closed"
          ? `Connection lost. Retrying in ${Math.round(connection.retryInMs / 1000)}s (attempt ${connection.attempt})…`
          : connection.attempt === 1
            ? "Connecting to the game server…"
            : `Connecting to the game server (attempt ${connection.attempt})…`}
      </Alert>
    );

  if (state.gameId < 0) {
    return (
      <Container>
        {backLink}
        {title}
        {connectionBanner}
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      {backLink}
      {title}
      <Typography variant="h5" component="h5" align="center" sx={{ overflowWrap: "anywhere" }}>
        {state.lobbyName || lobbyId}
      </Typography>
      {connectionBanner}
      <Typography variant="h5" component="h5" align="center">
        Connected Server : {state.discordGuildName || state.discordGuild}
      </Typography>
      <Typography variant="h5" component="h5" align="center">
        Voice Channel : {state.discordGuildChannel}
      </Typography>
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        style={{ maxWidth: "100%", minHeight: 440 }}
      >
        <Grid item>
          <Lobby
            rollCount={state.rollCount}
            players={state.players}
            availablePlayers={state.availablePlayers}
            gameInProgress={state.gameInProgress}
            canRoll={state.canRoll}
            nextRollAt={state.nextRollAt}
            leagueVersion={state.leagueVersion}
            reset={reset}
            roll={roll}
            cancel={cancel}
            onPlayerChange={onPlayerChange}
          />
        </Grid>
        <Grid item>
          <AdditionalInformationBlock availablePlayers={state.availablePlayers} />
        </Grid>
      </Grid>
    </Container>
  );
};

/**
 * One lobby at /lois-des-norms/:lobbyId. Keyed by the id so switching lobbies
 * remounts it: fresh reducer state, and the old socket and retry timer are
 * disposed by the effect cleanup.
 */
const LoisDesNorms = () => {
  const { lobbyId = DEFAULT_LOBBY_ID } = useParams<{ lobbyId: string }>();
  return <LoisDesNormsLobby key={lobbyId} lobbyId={lobbyId} />;
};

export default LoisDesNorms;
