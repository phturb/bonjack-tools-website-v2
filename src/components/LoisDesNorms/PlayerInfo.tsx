import { Box, ButtonBase, InputBase, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import SwapHorizRounded from "@mui/icons-material/SwapHorizRounded";
import { AvailablePlayer, AvailablePlayers, Player, PlayerStats } from "../../helpers/loisDesNorms";
import { ROLE_IMAGES, squareUrl } from "./champions";
import Nameplate from "./Nameplate";
import { usePlayerStatNote } from "./playerStats";
import { highlightAnimation, REDUCED, ringPulse, swapIn } from "./motion";
import { bevel, caps, colors, focusRing, FRAME, goldFrame, litFill, motion, SHORT, sizes, visuallyHidden } from "./tokens";

export interface PlayerInfoProperties {
  index: number;
  seat: Player;
  availablePlayers: AvailablePlayers;
  leagueVersion: string;
  onChange: (event: SelectChangeEvent, index: number) => void;
  /** This row's champion is the one shown in the centre. */
  focused: boolean;
  onFocus: (index: number) => void;
  /** Changes on every roll seen live; 0 means no roll seen since the page opened. */
  swapKey: number;
  /** Delay before this row's portrait swaps, so the rows lock in one after another. */
  swapDelay: number;
}

const portraitSize = { xs: sizes.portraitCompact, sm: sizes.portrait };

/** The seated player's nameplate, with live stats. */
const SeatedNameplate = ({ id, name, placeholder }: { id: string; name: string | null; placeholder?: PlayerStats | null }) => {
  const note = usePlayerStatNote(id, placeholder);
  return <Nameplate size="sm" name={name ?? "—"} initialFrom={name} note={note} reserveNote />;
};

/** One option of the picker, with live stats and, for a player seated elsewhere, where and what picking does. */
const OptionNameplate = ({ id, player }: { id: string; player: AvailablePlayer }) => {
  const stats = usePlayerStatNote(id, player.stats);
  const name = player.name ?? "—";
  const elsewhere = player.seatedIn;
  if (!elsewhere) return <Nameplate name={name} initialFrom={player.name ?? null} note={stats} />;
  const hint = elsewhere.gameInProgress ? "Playing there" : "Picking them moves them here";
  return (
    <Nameplate
      name={`${name} — in ${elsewhere.name}`}
      initialFrom={player.name ?? null}
      note={stats ? `${hint} · ${stats}` : hint}
    />
  );
};

/** Swap badge: no chevron, the badge itself is the control. */
const NoIcon = () => null;

/** One seat as a champ-select team row: role frame, portrait with its swap badge, champion and player. */
const PlayerInfo = (props: PlayerInfoProperties) => {
  const { index, seat, availablePlayers, onChange, focused, onFocus, swapKey, swapDelay, leagueVersion } = props;
  const { role, champion } = seat;
  const playerId = seat.player.id;
  const seated = playerId !== "";
  const rolled = seated && role != null && champion != null;
  const labelId = `seat-${index + 1}-label`;
  const pool = availablePlayers[playerId];
  const playerName = pool?.name ?? seat.player.name ?? null;
  const animate = rolled && swapKey > 0;

  return (
    <Box
      onClick={rolled ? () => onFocus(index) : undefined}
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: { xs: `${sizes.roleFrame}px ${sizes.portraitCompact}px minmax(0, 1fr)`, sm: `${sizes.roleFrame}px ${sizes.portrait}px minmax(0, 1fr)` },
        alignItems: "center",
        columnGap: { xs: 1.5, sm: 2 },
        // Same height empty, seated or locked in.
        height: { xs: 92, sm: sizes.seatRow },
        [SHORT]: {
          height: sizes.seatRowShort,
          gridTemplateColumns: `${sizes.roleFrame}px ${sizes.portraitShort}px minmax(0, 1fr)`,
        },
        px: 0.5,
        cursor: rolled ? "pointer" : "default",
        backgroundColor: focused ? "rgba(200, 170, 110, 0.07)" : "transparent",
        transition: `background-color ${motion.routine}ms`,
      }}
    >
      <span id={labelId} style={visuallyHidden}>
        Seat {index + 1}
      </span>

      {/* Role, where the client shows summoner spells. */}
      <Box
        key={`role-${swapKey}`}
        sx={{
          width: sizes.roleFrame,
          height: sizes.roleFrame,
          ...goldFrame,
          boxShadow: bevel,
          backgroundColor: colors.navy,
          backgroundImage: litFill,
          display: "grid",
          placeItems: "center",
          animation: animate ? `${swapIn} ${motion.swap}ms ${motion.easeOut} ${swapDelay}ms both` : "none",
          [REDUCED]: { animation: "none" },
        }}
      >
        {rolled && <Box component="img" src={ROLE_IMAGES[role]} alt="" sx={{ width: 24, height: 24 }} />}
      </Box>

      {/* Portrait in its gold ring, with the swap badge (the player picker). */}
      <Box sx={{ position: "relative", width: portraitSize, height: portraitSize, [SHORT]: { width: sizes.portraitShort, height: sizes.portraitShort } }}>
        <ButtonBase
          disabled={!rolled}
          onClick={(e) => {
            e.stopPropagation();
            onFocus(index);
          }}
          aria-label={rolled ? `Show ${champion.name}` : undefined}
          aria-pressed={rolled ? focused : undefined}
          tabIndex={rolled ? 0 : -1}
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            p: "2px",
            background: rolled
              ? `linear-gradient(180deg, ${focused ? colors.cream : colors.gold}, ${colors.goldDark})`
              : seated
                ? `linear-gradient(180deg, ${colors.gold}, ${colors.goldDark})`
                : "rgba(160, 155, 140, 0.25)",
            "&.Mui-focusVisible, &:focus-visible": { ...focusRing, borderRadius: "50%" },
            "&.Mui-disabled": { pointerEvents: "none" },
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: colors.void,
              boxShadow: `inset 0 0 0 2px ${colors.void}`,
            }}
          >
            {rolled && (
              <Box
                key={`portrait-${swapKey}`}
                component="img"
                src={squareUrl(leagueVersion, champion)}
                alt=""
                draggable={false}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  // Data Dragon squares carry a dark frame; crop it off.
                  transform: "scale(1.12)",
                  animation: animate ? `${swapIn} ${motion.swap}ms ${motion.easeOut} ${swapDelay}ms both` : "none",
                  [REDUCED]: { animation: "none" },
                }}
              />
            )}
          </Box>
        </ButtonBase>
        {animate && (
          // Lock-in pulse; reduced motion gets a short gold outline instead.
          <Box
            key={`pulse-${swapKey}`}
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${FRAME}px solid ${colors.gold}`,
              pointerEvents: "none",
              animation: `${ringPulse} ${motion.swap}ms ease-out ${swapDelay + motion.swap / 2}ms both`,
              [REDUCED]: { border: "none", animation: highlightAnimation },
            }}
          />
        )}

        <Select
          labelId={labelId}
          id={`seat-${index + 1}-select`}
          value={playerId}
          onChange={(evt) => onChange(evt, index)}
          onClick={(e) => e.stopPropagation()}
          displayEmpty
          input={<InputBase />}
          IconComponent={NoIcon}
          renderValue={(id) => (
            <>
              <SwapHorizRounded aria-hidden sx={{ fontSize: 18 }} />
              <span style={visuallyHidden}>{id === "" ? "Open seat" : (availablePlayers[id]?.name ?? seat.player.name ?? "Unnamed player")}</span>
            </>
          )}
          MenuProps={{ slotProps: { paper: { sx: { maxWidth: 360 } } } }}
          sx={{
            position: "absolute",
            right: { xs: -6, sm: -4 },
            bottom: { xs: -4, sm: -2 },
            "& .MuiSelect-select": {
              width: 30,
              height: 30,
              minHeight: 0,
              p: "0 !important",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: colors.goldText,
              backgroundColor: colors.void,
              border: `${FRAME}px solid ${colors.gold}`,
              transition: `background-color ${motion.quick}ms, color ${motion.quick}ms`,
            },
            "& .MuiSelect-select:hover": { backgroundColor: colors.navyRaised, color: colors.cream },
            "& .MuiSelect-select:focus": { backgroundColor: colors.void, borderRadius: "50%" },
            "& .MuiSelect-select:focus-visible": { ...focusRing, outlineOffset: 2 },
          }}
        >
          <MenuItem value="">
            <Nameplate empty name="Empty seat" />
          </MenuItem>
          {Object.entries(availablePlayers)
            .filter(([id]) => id !== "")
            .map(([id, player]) => {
              const elsewhere = player.seatedIn;
              // Seated in another lobby: a game there locks them, otherwise picking moves them.
              return (
                <MenuItem
                  key={id}
                  value={id}
                  disabled={elsewhere?.gameInProgress ?? false}
                  sx={elsewhere ? { whiteSpace: "normal" } : undefined}
                >
                  <OptionNameplate id={id} player={player} />
                </MenuItem>
              );
            })}
        </Select>
      </Box>

      {/* Champion, role, then the player. */}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          key={`name-${swapKey}`}
          noWrap
          sx={{
            ...caps,
            fontWeight: 700,
            fontSize: { xs: "1rem", sm: "1.125rem" },
            lineHeight: 1.25,
            color: rolled ? (focused ? colors.goldText : colors.cream) : colors.muted,
            animation: animate ? `${swapIn} ${motion.swap}ms ${motion.easeOut} ${swapDelay}ms both` : "none",
            [REDUCED]: { animation: "none" },
          }}
        >
          {rolled ? champion.name : seated ? "Awaiting roll" : "Open seat"}
        </Typography>
        <Typography
          key={`role-label-${swapKey}`}
          component="span"
          sx={{
            display: "block",
            animation: animate ? `${swapIn} ${motion.swap}ms ${motion.easeOut} ${swapDelay}ms both` : "none",
            [REDUCED]: { animation: "none" },
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: "0.875rem",
            letterSpacing: "0.06em",
            lineHeight: 1.4,
            minHeight: "1.4em",
            // The framed role icon identifies the role; the label stays in the muted text tone.
            color: rolled ? colors.muted : "transparent",
          }}
        >
          {rolled ? role : " "}
        </Typography>
        <Box sx={{ mt: 0.25 }}>
          {seated ? (
            <SeatedNameplate id={playerId} name={playerName} placeholder={pool?.stats ?? seat.player.stats} />
          ) : (
            <Nameplate size="sm" empty name="Pick a player" reserveNote />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PlayerInfo;
