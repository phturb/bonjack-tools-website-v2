import { useEffect, useReducer, useRef, useCallback, useState } from "react";
import {
  Alert,
  CircularProgress,
  Container,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  emptyDiscordPlayer,
  emptyPlayer,
  LoisDesNormsState,
  MessageActions,
  Player,
} from "../helpers/loisDesNorms";
import AdditionalInformationBlock from "../components/LoisDesNorms/AdditionalInformationBlock";
import Lobby from "../components/LoisDesNorms/Lobby";
import { LDN_WEBSOCKET_ENDPOINT } from "../config/config";

type Message = { action: MessageActions; content: string };

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30_000;

const initialState: LoisDesNormsState = {
  players: Array.from({ length: 5 }, emptyPlayer),
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
};

const reducer = (state: LoisDesNormsState, message: Message): LoisDesNormsState => {
  switch (message.action) {
    case "updatePlayers": {
      const players = JSON.parse(message.content) as Player[];
      return { ...state, players };
    }
    case "updateState": {
      const newState = JSON.parse(message.content) as LoisDesNormsState;
      return {
        ...newState,
        nextRollAt: Date.now() + (newState.nextRollTimer ?? 0),
        availablePlayers: { ...newState.availablePlayers, "": emptyDiscordPlayer() },
      };
    }
    default:
      return state;
  }
};

type ConnectionStatus =
  | { kind: "connecting"; attempt: number }
  | { kind: "open" }
  | { kind: "closed"; attempt: number; retryInMs: number };

const LoisDesNorms = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connection, setConnection] = useState<ConnectionStatus>({ kind: "connecting", attempt: 1 });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;
    let retryDelay = INITIAL_RETRY_MS;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (disposed) return;
      attempt += 1;
      setConnection({ kind: "connecting", attempt });
      const ws = new WebSocket(LDN_WEBSOCKET_ENDPOINT);
      wsRef.current = ws;

      ws.onopen = () => {
        retryDelay = INITIAL_RETRY_MS;
        setConnection({ kind: "open" });
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as Message;
          if (msg.action) dispatch(msg);
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
        if (disposed) return;
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
  }, []);

  const send = useCallback((action: string, content?: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(`Socket not open, dropping action "${action}"`);
      return;
    }
    ws.send(JSON.stringify({ action, content }));
  }, []);

  const reset = () => send("reset");
  const roll = () => send("roll");
  const cancel = () => send("cancel");

  const onPlayerChange = (event: SelectChangeEvent<string>, index: number) => {
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

    dispatch({ action: "updatePlayers", content: JSON.stringify(players) });
    send("updatePlayers", JSON.stringify(players.map((p) => p.player)));
  };

  const title = (
    <Typography variant="h4" component="h4" align="center">
      Lois Des Norms
    </Typography>
  );

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
        {title}
        {connectionBanner}
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      {title}
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

export default LoisDesNorms;
