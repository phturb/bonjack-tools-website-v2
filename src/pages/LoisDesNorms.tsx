import { ReactNode, useEffect, useReducer, useRef, useCallback, useState } from "react";
import { Alert, Box, Button, Link, SelectChangeEvent, Skeleton, Typography, useMediaQuery } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import HeadsetMicOutlined from "@mui/icons-material/HeadsetMicOutlined";
import { useQueryClient } from "@tanstack/react-query";
import Countdown from "react-countdown";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  DEFAULT_LOBBY_ID,
  DEFAULT_ROLL_COOLDOWN_MS,
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
import Lobby, { LobbySkeleton } from "../components/LoisDesNorms/Lobby";
import ClientScene from "../components/LoisDesNorms/ClientScene";
import LobbyLog, { LogEntry } from "../components/LoisDesNorms/LobbyLog";
import RollTimer from "../components/LoisDesNorms/RollTimer";
import SplashRing from "../components/LoisDesNorms/SplashRing";
import VoiceBench from "../components/LoisDesNorms/VoiceBench";
import { splashUrl } from "../components/LoisDesNorms/champions";
import { caps, colors, fonts, SHORT, sizes, visuallyHidden } from "../components/LoisDesNorms/tokens";
import { PLAYER_STATS_KEY } from "../components/LoisDesNorms/playerStats";

type Message = { action: MessageActions; content: string };
/** Page-only action: this page asked the server to finish or cancel. */
type LocalEnd = { action: "localEnd"; content: "finish" | "cancel" };

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30_000;
/** Close code the server uses right after lobbyNotFound. */
const LOBBY_NOT_FOUND_CLOSE_CODE = 4404;
/** Lines kept in the lobby log. */
const LOG_LIMIT = 50;

/** Server state plus what the page derives from how it changed. */
interface PageState extends LoisDesNormsState {
  /** Bumped on every roll seen live; drives the lock-in animation. */
  rollSeq: number;
  /** Polite announcement of the last roll. */
  announcement: string;
  /** Bumped when a game ends or another one starts: player stats must be refetched. */
  gameEndSeq: number;
  /** Seat ids as the server last confirmed them (optimistic changes excluded), for the log. */
  confirmedSeats: string[];
  /** What this page last asked for, to word the end of the loi. */
  pendingEnd: "finish" | "cancel" | null;
  log: LogEntry[];
  logSeq: number;
}

const initialState = (lobbyId: string): PageState => ({
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
  rollSeq: 0,
  announcement: "",
  gameEndSeq: 0,
  confirmedSeats: [],
  pendingEnd: null,
  log: [],
  logSeq: 0,
});

/** Server seats in the client's shape: always SEAT_COUNT seats, never a null player. */
const normalizeSeats = (seats: Player[] | null | undefined): Player[] =>
  Array.from({ length: SEAT_COUNT }, (_, i) => {
    const seat = seats?.[i];
    return seat ? { ...seat, player: seat.player ?? emptyDiscordPlayer() } : emptyPlayer();
  });

const rollAnnouncement = (state: LoisDesNormsState): string => {
  const draws = state.players
    .filter((seat) => seat.player.id && seat.role && seat.champion)
    .map((seat) => `${seat.player.name ?? "A player"}: ${seat.role}, ${seat.champion?.name}`);
  return `Loi number ${state.gameId}, roll ${state.rollCount}. ${draws.join(". ")}.`;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const nameIn = (state: LoisDesNormsState, id: string) =>
  state.availablePlayers[id]?.name ?? state.players.find((s) => s.player.id === id)?.player.name ?? "A player";

/** Real events between two server states, in the order they read best. */
const logLines = (state: PageState, next: LoisDesNormsState, rolled: boolean): string[] => {
  if (state.gameId < 0) return [`Connected to ${next.lobbyName || state.lobbyId}`];
  const lines: string[] = [];
  const before = new Set(state.confirmedSeats.filter(Boolean));
  const after = new Set(next.players.map((s) => s.player.id).filter(Boolean));
  for (const id of before) if (!after.has(id)) lines.push(`${nameIn(state, id)} left the lobby`);
  for (const id of after) if (!before.has(id)) lines.push(`${nameIn(next, id)} joined the lobby`);
  if (state.gameInProgress && !next.gameInProgress) {
    const rolls = plural(state.rollCount, "roll");
    lines.push(
      state.pendingEnd === "finish"
        ? `Loi Nº ${state.gameId} finished after ${rolls}`
        : state.pendingEnd === "cancel"
          ? `Loi Nº ${state.gameId} cancelled`
          : `Loi Nº ${state.gameId} ended after ${rolls}`
    );
  }
  if (!state.gameInProgress && next.gameInProgress) lines.push(`Loi Nº ${next.gameId} started`);
  if (rolled) lines.push(next.rollCount === 1 ? "Roll 1 locked in" : `Reroll ${next.rollCount} locked in`);
  return lines;
};

const reducer = (state: PageState, message: Message | LocalEnd): PageState => {
  switch (message.action) {
    case "localEnd":
      return { ...state, pendingEnd: message.content };
    case "updatePlayers": {
      const players = normalizeSeats(JSON.parse(message.content) as Player[]);
      return { ...state, players };
    }
    case "updateState": {
      // Replaces the whole state, so it also reverts an optimistic updatePlayers
      // the server refused (it echoes the true state back to the sender).
      const newState = JSON.parse(message.content) as LoisDesNormsState;
      const hadState = state.gameId >= 0;
      const timer = newState.nextRollTimer ?? 0;
      // A roll seen live: a new game started, or the roll count went up.
      const rolled =
        hadState &&
        newState.gameInProgress &&
        (newState.gameId !== state.gameId || newState.rollCount > state.rollCount);
      // Finish or Cancel (in game -> not), or a different game: stats have moved on.
      const gameEnded =
        hadState &&
        ((state.gameInProgress && !newState.gameInProgress) || newState.gameId !== state.gameId);
      const merged: LoisDesNormsState = {
        ...newState,
        // Additive fields: an older server leaves them out.
        lobbyId: newState.lobbyId ?? state.lobbyId,
        lobbyName: newState.lobbyName ?? "",
        players: normalizeSeats(newState.players),
        nextRollAt: Date.now() + timer,
        availablePlayers: {
          ...Object.fromEntries(Object.entries(newState.availablePlayers ?? {}).filter(([, p]) => p != null)),
          "": emptyDiscordPlayer(),
        },
      };
      const lines = logLines(state, merged, rolled);
      const now = Date.now();
      const log = [...state.log, ...lines.map((text, i) => ({ id: state.logSeq + i + 1, at: now, text }))].slice(-LOG_LIMIT);
      return {
        ...merged,
        rollSeq: rolled ? state.rollSeq + 1 : state.rollSeq,
        announcement: rolled ? rollAnnouncement(merged) : state.announcement,
        gameEndSeq: gameEnded ? state.gameEndSeq + 1 : state.gameEndSeq,
        confirmedSeats: merged.players.map((s) => s.player.id),
        pendingEnd: state.gameInProgress && !merged.gameInProgress ? null : state.pendingEnd,
        log,
        logSeq: state.logSeq + lines.length,
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

/** From this width the page is the three-column champ select; below, one column. */
const WIDE = "(min-width: 1200px)";

const BackLink = () => (
  <Link
    component={RouterLink}
    to={LOBBY_LIST_PATH}
    sx={{ ...caps, display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: "0.75rem", letterSpacing: "0.14em", color: colors.muted }}
  >
    <ArrowBackRounded aria-hidden sx={{ fontSize: 16 }} />
    All lobbies
  </Link>
);

const clockOf = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const LoisDesNormsLobby = ({ lobbyId }: { lobbyId: string }) => {
  const [state, dispatch] = useReducer(reducer, lobbyId, initialState);
  const queryClient = useQueryClient();
  const wide = useMediaQuery(WIDE, { noSsr: true });
  const [userFocus, setUserFocus] = useState<number | null>(null);
  // Rules or stats; kept here so it survives the layout switching at the wide breakpoint.
  const [infoTab, setInfoTab] = useState(0);

  // The server records a game's stats when it ends; refetch every nameplate's.
  useEffect(() => {
    if (state.gameEndSeq > 0) void queryClient.invalidateQueries({ queryKey: PLAYER_STATS_KEY });
  }, [state.gameEndSeq, queryClient]);
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

  const roll = () => send("roll");
  // Note which end this page asked for, so the log can say finished or cancelled.
  const reset = () => {
    if (send("reset")) dispatch({ action: "localEnd", content: "finish" });
  };
  const cancel = () => {
    if (send("cancel")) dispatch({ action: "localEnd", content: "cancel" });
  };

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
      <ClientScene>
        <BackLink />
        <Typography variant="h1" component="h1" sx={{ mt: 2, mb: 3 }}>
          {connection.reason === "notFound" ? "No such lobby" : "Lobby closed"}
        </Typography>
        <Alert
          severity="warning"
          action={
            <Button variant="contained" component={RouterLink} to={LOBBY_LIST_PATH} sx={{ whiteSpace: "nowrap" }}>
              All lobbies
            </Button>
          }
        >
          {connection.reason === "notFound"
            ? "This lobby does not exist. It may have been closed."
            : "This lobby was closed. Its seats are free again."}
        </Alert>
      </ClientScene>
    );
  }

  const connectionBanner =
    connection.kind === "open" ? null : (
      <Alert severity={connection.kind === "closed" ? "warning" : "info"} sx={{ mb: 2 }}>
        {connection.kind === "closed"
          ? `Connection lost. Retrying in ${Math.round(connection.retryInMs / 1000)}s (attempt ${connection.attempt})…`
          : connection.attempt === 1
            ? "Connecting to the game server…"
            : `Connecting to the game server (attempt ${connection.attempt})…`}
      </Alert>
    );

  const loaded = state.gameId >= 0;
  const lobbyName = state.lobbyName || lobbyId;
  const rolledSeats = state.players.map((s, i) => (s.player.id && s.champion ? i : -1)).filter((i) => i >= 0);
  const focusIndex = userFocus != null && rolledSeats.includes(userFocus) ? userFocus : (rolledSeats[0] ?? null);
  const focusedChampion = focusIndex != null ? state.players[focusIndex].champion : null;
  const coolingDown = !state.canRoll && state.nextRollTimer > 0;
  const cooldownTotalMs = state.rollCooldownMs ?? DEFAULT_ROLL_COOLDOWN_MS;

  const title = (
    <Box>
      <BackLink />
      {loaded ? (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="h1"
            component="h1"
            title={state.gameInProgress ? undefined : lobbyName}
            sx={{
              // A long lobby name steps down and stops at two lines, so the seats stay in the first viewport.
              fontSize: state.gameInProgress
                ? { xs: "1.625rem", md: "2rem" }
                : { xs: "1.625rem", md: lobbyName.length > 26 ? "1.25rem" : lobbyName.length > 16 ? "1.5rem" : "2rem" },
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
              color: state.gameInProgress ? colors.goldText : colors.cream,
            }}
          >
            {state.gameInProgress ? `Loi Nº ${state.gameId}` : lobbyName}
          </Typography>
          {state.gameInProgress && (
            <Typography noWrap title={lobbyName} sx={{ ...caps, fontSize: "0.875rem", color: colors.cream, mt: 0.5 }}>
              {lobbyName}
            </Typography>
          )}
          {/* Only what the server sent: no patch before the first roll, no reroll outside a game. */}
          {(state.leagueVersion || state.gameInProgress) && (
            <Typography sx={{ fontFamily: fonts.mono, fontSize: "0.75rem", color: colors.muted, mt: 0.5, letterSpacing: "0.04em" }}>
              {[state.leagueVersion && `PATCH ${state.leagueVersion}`, state.gameInProgress && `REROLL ${state.rollCount}`]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ mt: 1, width: 240 }}>
          <Skeleton variant="text" sx={{ fontSize: "2rem" }} />
          <Skeleton variant="text" width="50%" />
        </Box>
      )}
    </Box>
  );

  const meta = loaded ? (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", lg: "flex-end" }, gap: 1, fontFamily: fonts.mono, fontSize: "0.75rem", color: colors.muted }}>
      <HeadsetMicOutlined aria-hidden sx={{ fontSize: 16 }} />
      <span>{state.discordGuildName || state.discordGuild}</span>
    </Box>
  ) : null;

  const seatedCount = state.players.filter((seat) => seat.player.id !== "").length;
  const top = loaded ? (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <VoiceBench availablePlayers={state.availablePlayers} players={state.players} channel={state.discordGuildChannel} />
      <RollTimer
        gameInProgress={state.gameInProgress}
        canRoll={state.canRoll}
        nextRollTimer={state.nextRollTimer}
        nextRollAt={state.nextRollAt}
        cooldownTotalMs={cooldownTotalMs}
        seatedCount={seatedCount}
      />
    </Box>
  ) : (
    <Skeleton variant="rectangular" height={96} />
  );

  const primaryLabel = state.gameInProgress ? "Reroll" : "Start";
  const action = (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Button
        variant="contained"
        size="large"
        onClick={roll}
        // A loi with nobody seated would record an empty game.
        disabled={!loaded || !state.canRoll || (!state.gameInProgress && seatedCount === 0)}
        sx={{ minWidth: 260, height: 52, fontSize: "1.0625rem", [SHORT]: { height: 44 } }}
      >
        {coolingDown ? (
          <Countdown
            key={state.nextRollAt}
            date={state.nextRollAt}
            renderer={({ total }) => (
              <span>
                {primaryLabel} in <Box component="span" sx={{ fontFamily: fonts.mono, letterSpacing: 0 }}>{clockOf(total)}</Box>
              </span>
            )}
          />
        ) : (
          primaryLabel
        )}
      </Button>
    </Box>
  );

  const quit = state.gameInProgress ? (
    <Box sx={{ display: "flex", justifyContent: { xs: "center", lg: "flex-end" }, gap: 1 }}>
      <Button variant="text" onClick={cancel}>
        Cancel
      </Button>
      <Button variant="outlined" onClick={reset} sx={{ minWidth: 120 }}>
        Finish
      </Button>
    </Box>
  ) : (
    <div />
  );

  const seats = loaded ? (
    <Lobby
      players={state.players}
      availablePlayers={state.availablePlayers}
      leagueVersion={state.leagueVersion}
      onPlayerChange={onPlayerChange}
      focusIndex={focusIndex}
      onFocus={setUserFocus}
      rollSeq={state.rollSeq}
    />
  ) : (
    <LobbySkeleton />
  );

  const center = loaded ? (
    <SplashRing
      players={state.players}
      leagueVersion={state.leagueVersion}
      focusIndex={focusIndex}
      onFocus={setUserFocus}
      rollSeq={state.rollSeq}
    />
  ) : null;

  const seatedIds = state.players.map((seat) => seat.player.id).filter((id) => id !== "");
  const rules = loaded ? (
    <AdditionalInformationBlock
      availablePlayers={state.availablePlayers}
      seatedIds={seatedIds}
      fill={wide}
      tab={infoTab}
      onTabChange={setInfoTab}
    />
  ) : null;
  const log = <LobbyLog entries={state.log} />;

  const cell = (area: string, node: ReactNode, sx: object = {}) => <Box sx={{ gridArea: area, minWidth: 0, ...sx }}>{node}</Box>;

  return (
    <ClientScene splash={focusedChampion ? splashUrl(focusedChampion) : undefined}>
      {connectionBanner}
      {wide ? (
        // Champ select: reading order follows the three columns, top to bottom.
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `${sizes.leftColumn}px minmax(0, 1fr) ${sizes.rightColumn}px`,
            gridTemplateRows: "auto auto auto",
            gridTemplateAreas: '"title top meta" "seats center rules" "log action quit"',
            columnGap: 4,
            rowGap: 1.5,
            [SHORT]: { rowGap: 1 },
            alignItems: "start",
          }}
        >
          {cell("title", title)}
          {cell("top", top)}
          {cell("meta", meta, { alignSelf: "start", pt: 0.5 })}
          {cell("seats", seats)}
          {cell("center", center, { alignSelf: "center" })}
          {/* The panel fills this cell and scrolls inside it, so a long ledger never pushes the page. */}
          {cell("rules", rules, { position: "relative", alignSelf: "stretch" })}
          {cell("log", log, { alignSelf: "end" })}
          {cell("action", action, { alignSelf: "center" })}
          {cell("quit", quit, { alignSelf: "center" })}
        </Box>
      ) : (
        // One column, in the order a phone reads it: who and when, the actions, the team, the focus, rules, log.
        <Box sx={{ display: "grid", gap: 2.5, maxWidth: 720, mx: "auto" }}>
          {title}
          {meta}
          {top}
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {action}
            {quit}
          </Box>
          {seats}
          {center}
          {rules}
          {log}
        </Box>
      )}
      <div aria-live="polite" style={visuallyHidden}>
        {state.announcement}
      </div>
    </ClientScene>
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
