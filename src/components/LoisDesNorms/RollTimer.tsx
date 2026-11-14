import { Box, Typography } from "@mui/material";
import Countdown from "react-countdown";
import { REDUCED, refill } from "./motion";
import { caps, colors, SHORT } from "./tokens";

interface Props {
  gameInProgress: boolean;
  canRoll: boolean;
  /** Remaining cooldown in ms when the last state arrived. */
  nextRollTimer: number;
  /** Epoch ms at which the next roll becomes available. */
  nextRollAt: number;
  /** Full length of the cooldown between two rolls, in ms. */
  cooldownTotalMs: number;
  /** Players seated in this lobby, shown before the game starts. */
  seatedCount: number;
}

/** One cyan bar; its fill shrinks toward the number as the cooldown runs out. */
const Bar = ({ fraction, side }: { fraction: number; side: "left" | "right" }) => (
  <Box aria-hidden sx={{ flex: 1, maxWidth: 220, height: 6, backgroundColor: "rgba(10, 200, 185, 0.14)", position: "relative" }}>
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundColor: colors.cyan,
        transformOrigin: side === "left" ? "right center" : "left center",
        transform: `scaleX(${fraction})`,
        // A new cooldown fills the bar, then it glides between the once-a-second ticks.
        animation: fraction > 0 ? `${refill} 600ms ease-out` : "none",
        transition: "transform 1s linear",
        [REDUCED]: { transition: "none", animation: "none" },
      }}
    />
  </Box>
);

const Face = ({ big, caption, fraction, tone }: { big: string; caption: string; fraction: number; tone: string }) => (
  <Box sx={{ display: "grid", justifyItems: "center", gap: 0.25 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", justifyContent: "center" }}>
      <Bar fraction={fraction} side="left" />
      <Typography
        component="span"
        sx={{ ...caps, fontWeight: 700, fontSize: "2.5rem", lineHeight: 1, minWidth: "3ch", textAlign: "center", color: tone, fontVariantNumeric: "tabular-nums", [SHORT]: { fontSize: "2rem" } }}
      >
        {big}
      </Typography>
      <Bar fraction={fraction} side="right" />
    </Box>
    <Typography component="span" sx={{ ...caps, fontSize: "0.75rem", letterSpacing: "0.16em", color: colors.muted }}>
      {caption}
    </Typography>
  </Box>
);

/** The champ-select timer: seconds to the next reroll, flanked by cyan bars showing the real share left. */
const RollTimer = ({ gameInProgress, canRoll, nextRollTimer, nextRollAt, cooldownTotalMs, seatedCount }: Props) => {
  // Before a game: the seat count, and READY only once the loi can really start.
  if (!gameInProgress && (canRoll || nextRollTimer <= 0)) {
    const canStart = canRoll && seatedCount > 0;
    return (
      <Box role="status" aria-label={`${seatedCount} of 5 seated${canStart ? ", ready to start" : ""}`}>
        <Face
          big={`${seatedCount}/5`}
          caption={seatedCount === 0 ? "Seat players to start" : canStart ? "Seated · ready to start" : "Seated"}
          fraction={0}
          tone={canStart ? colors.cyan : colors.muted}
        />
      </Box>
    );
  }
  if (!canRoll && nextRollTimer > 0) {
    return (
      <Countdown
        key={nextRollAt}
        date={nextRollAt}
        renderer={({ total }) => {
          const seconds = Math.max(0, Math.ceil(total / 1000));
          const fraction = cooldownTotalMs > 0 ? Math.min(1, Math.max(0, total / cooldownTotalMs)) : 0;
          return (
            <Box role="timer" aria-label={`Next reroll in ${seconds} seconds`}>
              <Face big={String(seconds)} caption="Seconds to reroll" fraction={fraction} tone={colors.cream} />
            </Box>
          );
        }}
      />
    );
  }
  if (canRoll) {
    return <Face big="Ready" caption={gameInProgress ? "Reroll open" : "Start the loi"} fraction={0} tone={colors.cyan} />;
  }
  return <Face big="—" caption={gameInProgress ? "Waiting for the server" : "Start not available yet"} fraction={0} tone={colors.muted} />;
};

export default RollTimer;
