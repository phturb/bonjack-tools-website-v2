import { Box, Button, Tooltip, Typography } from "@mui/material";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { Link as RouterLink } from "react-router-dom";
import { LobbySummary } from "../../api/loisDesNorms";
import { lobbyPath, SEAT_COUNT } from "../../helpers/loisDesNorms";
import { InitialDisc } from "./Nameplate";
import { usePlayerStatNote } from "./playerStats";
import { caps, colors, fonts, visuallyHidden } from "./tokens";

interface Props {
  lobby: LobbySummary;
  /** Set only when the lobby can be closed: not main, no game in progress. */
  onClose?: () => void;
  closing?: boolean;
}

/** Desktop column template of the lobby table; the header row uses it too. */
const LOBBY_COLUMNS = "minmax(0, 1.3fr) minmax(0, 1.2fr) minmax(0, 1fr) 96px 188px";

type Seat = { id: string; name?: string | null } | undefined;

/** One seat of a lobby: the player's initial, with name and live stat note in its label and tooltip. */
const SeatChip = ({ player }: { player: Seat }) => {
  const note = usePlayerStatNote(player?.id);
  if (!player) {
    return (
      <li>
        <InitialDisc empty />
        <span style={visuallyHidden}>Open seat</span>
      </li>
    );
  }
  const name = player.name || player.id;
  const label = note ? `${name}, ${note}` : name;
  return (
    <li>
      <Tooltip title={label} disableInteractive>
        <Box tabIndex={0} sx={{ borderRadius: "50%", "&:focus-visible": { outline: `2px solid ${colors.cyan}`, outlineOffset: 2 } }}>
          <InitialDisc name={player.name} />
          <span style={visuallyHidden}>{label}</span>
        </Box>
      </Tooltip>
    </li>
  );
};

/** Status in the client's words: in game with the loi and reroll numbers, or waiting with the seat count. */
const StatusText = ({ lobby, seated }: { lobby: Pick<LobbySummary, "gameInProgress" | "gameId" | "rollCount">; seated: number }) => (
  <Typography
    component="span"
    sx={{ fontFamily: fonts.mono, fontSize: "0.8125rem", letterSpacing: "0.04em", color: lobby.gameInProgress ? colors.goldText : colors.muted }}
  >
    {lobby.gameInProgress
      ? `IN GAME · LOI Nº ${lobby.gameId} · REROLL ${lobby.rollCount}`
      : `WAITING · ${seated}/${SEAT_COUNT}`}
  </Typography>
);

/** One lobby in the custom-games table: name, seats, status, spectators, Join and Close. */
const LobbyCard = ({ lobby, onClose, closing }: Props) => {
  // A Go nil slice arrives as null: treat it as no one seated.
  const seated = lobby.players ?? [];
  const seats = Array.from({ length: SEAT_COUNT }, (_, i) => seated[i]);
  const nameId = `lobby-${lobby.id}-name`;

  return (
    <Box
      component="article"
      aria-labelledby={nameId}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", md: LOBBY_COLUMNS },
        gridTemplateAreas: {
          xs: '"name viewers" "seats seats" "status status" "actions actions"',
          md: '"name seats status viewers actions"',
        },
        alignItems: "center",
        columnGap: 2,
        rowGap: 1,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${colors.rule}`,
        transition: "background-color 150ms",
        "&:hover": { backgroundColor: "rgba(200, 170, 110, 0.05)" },
      }}
    >
      <Typography id={nameId} variant="h2" component="h2" sx={{ gridArea: "name", overflowWrap: "anywhere", fontSize: "1rem", color: colors.cream }}>
        {lobby.name}
      </Typography>
      <Box component="ul" aria-label={`Seats, ${seated.length} of ${SEAT_COUNT} taken`} sx={{ gridArea: "seats", listStyle: "none", m: 0, p: 0, display: "flex", gap: 0.75 }}>
        {seats.map((player, i) => (
          <SeatChip key={player?.id || `open-${i}`} player={player} />
        ))}
      </Box>
      <Box sx={{ gridArea: "status" }}>
        <StatusText lobby={lobby} seated={seated.length} />
      </Box>
      <Box
        sx={{ gridArea: "viewers", display: "flex", alignItems: "center", gap: 0.75, fontFamily: fonts.mono, fontSize: "0.8125rem", color: colors.muted }}
      >
        <VisibilityOutlined aria-hidden sx={{ fontSize: 16 }} />
        <span aria-hidden>{lobby.viewers}</span>
        <span style={visuallyHidden}>{`${lobby.viewers} watching`}</span>
      </Box>
      <Box sx={{ gridArea: "actions", display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {onClose && (
          <Button variant="text" size="small" onClick={onClose} disabled={closing} aria-label={`Close ${lobby.name}`}>
            Close
          </Button>
        )}
        <Button variant="contained" size="small" component={RouterLink} to={lobbyPath(lobby.id)} aria-label={`Join ${lobby.name}`} sx={{ minWidth: 96 }}>
          Join
        </Button>
      </Box>
    </Box>
  );
};

/** Column titles of the lobby table (desktop only; each row names its own cells for screen readers). */
export const LobbyTableHead = () => (
  <Box
    aria-hidden
    sx={{
      display: { xs: "none", md: "grid" },
      gridTemplateColumns: LOBBY_COLUMNS,
      columnGap: 2,
      px: 2,
      py: 1,
      borderBottom: `1px solid ${colors.goldDark}`,
      ...caps,
      fontSize: "0.6875rem",
      letterSpacing: "0.14em",
      color: colors.muted,
      fontWeight: 700,
    }}
  >
    <span>Lobby</span>
    <span>Seats</span>
    <span>Status</span>
    <span>Spectators</span>
    <span />
  </Box>
);

export default LobbyCard;
