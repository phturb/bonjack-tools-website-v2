import { Box, Tooltip } from "@mui/material";
import LockRounded from "@mui/icons-material/LockRounded";
import { AvailablePlayers, initialOf, Player } from "../../helpers/loisDesNorms";
import { BracketTitle } from "./Frames";
import { bevel, colors, fonts, goldFrame, litFill, sizes, visuallyHidden } from "./tokens";

interface Props {
  availablePlayers: AvailablePlayers;
  players: Player[];
  channel: string;
}

/** Everyone in the voice channel, like the client's bench of available champions. */
const VoiceBench = ({ availablePlayers, players, channel }: Props) => {
  const seatedHere = new Set(players.map((p) => p.player.id).filter((id) => id !== ""));
  const pool = Object.entries(availablePlayers).filter(([id]) => id !== "");

  return (
    <Box component="section" aria-labelledby="voice-bench-title">
      <BracketTitle id="voice-bench-title">In voice{channel ? ` · ${channel}` : ""}</BracketTitle>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          mt: 1,
          p: 0,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 1,
          // Phones: five 44px squares per row (a 5x2 grid for ten players), never an orphan on a crowded row.
          mx: "auto",
          maxWidth: { xs: sizes.benchSquareCompact * 5 + 8 * 4, sm: "none" },
          columnGap: { sm: 0.75 },
        }}
      >
        {pool.length === 0 && (
          <Box component="li" sx={{ color: colors.muted, fontSize: "0.875rem" }}>
            Nobody in the voice channel
          </Box>
        )}
        {pool.map(([id, player]) => {
          const name = player.name ?? "Unnamed player";
          const here = seatedHere.has(id);
          const elsewhere = player.seatedIn;
          const state = here
            ? "seated here"
            : elsewhere
              ? elsewhere.gameInProgress
                ? `playing in ${elsewhere.name}`
                : `seated in ${elsewhere.name}`
              : "free";
          return (
            <Tooltip key={id} title={`${name}, ${state}`} disableInteractive>
              <Box
                component="li"
                tabIndex={0}
                sx={{
                  position: "relative",
                  width: { xs: sizes.benchSquareCompact, sm: sizes.benchSquare },
                  height: { xs: sizes.benchSquareCompact, sm: sizes.benchSquare },
                  display: "grid",
                  placeItems: "center",
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  backgroundColor: colors.navy,
                  backgroundImage: litFill,
                  boxShadow: bevel,
                  color: here ? colors.cream : colors.goldText,
                  ...(here ? goldFrame : { border: `1px solid ${colors.goldDark}` }),
                  opacity: elsewhere && !here ? 0.45 : 1,
                  "&:focus-visible": { outline: `2px solid ${colors.cyan}`, outlineOffset: 2 },
                }}
              >
                <span aria-hidden>{initialOf(player.name)}</span>
                <span style={visuallyHidden}>{`${name}, ${state}`}</span>
                {elsewhere?.gameInProgress && !here && (
                  <Box
                    aria-hidden
                    sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", backgroundColor: "rgba(1, 10, 19, 0.6)" }}
                  >
                    <LockRounded sx={{ fontSize: 16, color: colors.cream }} />
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default VoiceBench;
