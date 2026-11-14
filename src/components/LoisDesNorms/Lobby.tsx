import { Fragment } from "react";
import { Box, SelectChangeEvent, Skeleton } from "@mui/material";
import { AvailablePlayers, Player, SEAT_COUNT } from "../../helpers/loisDesNorms";
import { GoldRule } from "./Frames";
import PlayerInfo from "./PlayerInfo";
import { REDUCED, sweep } from "./motion";
import { colors, motion, sizes } from "./tokens";

export interface LobbyProperties {
  players: Player[];
  availablePlayers: AvailablePlayers;
  leagueVersion: string;
  onPlayerChange: (event: SelectChangeEvent, index: number) => void;
  /** Index of the row shown in the centre, if any. */
  focusIndex: number | null;
  onFocus: (index: number) => void;
  /** Changes on every roll seen live. */
  rollSeq: number;
}

/** The team: five seat rows between gold rules; a gold flash runs down them on a lock-in. */
const Lobby = (props: LobbyProperties) => (
  <Box component="section" aria-label="Seats" sx={{ position: "relative", overflow: "hidden" }}>
    {props.rollSeq > 0 && (
      <Box
        key={props.rollSeq}
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "30%",
          zIndex: 2,
          pointerEvents: "none",
          background: `linear-gradient(180deg, transparent, rgba(200, 170, 110, 0.22) 50%, transparent)`,
          animation: `${sweep} ${motion.sweep}ms ease-in-out both`,
          [REDUCED]: { display: "none" },
        }}
      />
    )}
    <GoldRule />
    {props.players.map((player, index) => (
      <Fragment key={`seat-${index}`}>
        <PlayerInfo
          index={index}
          seat={player}
          availablePlayers={props.availablePlayers}
          leagueVersion={props.leagueVersion}
          onChange={props.onPlayerChange}
          focused={props.focusIndex === index}
          onFocus={props.onFocus}
          swapKey={props.rollSeq}
          swapDelay={motion.sweep / 4 + index * motion.stagger}
        />
        <GoldRule />
      </Fragment>
    ))}
  </Box>
);

const SEAT_INDEXES = Array.from({ length: SEAT_COUNT }, (_, i) => i);

/** The rows' outline while the first state is on its way. */
export const LobbySkeleton = () => (
  <Box aria-busy="true" aria-label="Loading the seats">
    <GoldRule />
    {SEAT_INDEXES.map((i) => (
      <Fragment key={i}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, height: { xs: 92, sm: sizes.seatRow }, px: 0.5 }}>
          <Skeleton variant="rectangular" width={sizes.roleFrame} height={sizes.roleFrame} />
          <Skeleton
            variant="circular"
            sx={{ width: { xs: sizes.portraitCompact, sm: sizes.portrait }, height: { xs: sizes.portraitCompact, sm: sizes.portrait }, bgcolor: colors.navy }}
          />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        </Box>
        <GoldRule />
      </Fragment>
    ))}
  </Box>
);

export default Lobby;
