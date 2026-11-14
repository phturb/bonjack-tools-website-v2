import { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { initialOf } from "../../helpers/loisDesNorms";
import { colors, fonts, sizes } from "./tokens";

interface DiscProps {
  name?: string | null;
  size?: number;
  /** An open seat: dark empty ring, no letter. */
  empty?: boolean;
}

/** Round chip with the player's initial inside a thin gold ring. */
export const InitialDisc = ({ name, size = sizes.disc, empty }: DiscProps) => (
  <Box
    aria-hidden
    sx={{
      width: size,
      height: size,
      flex: "none",
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      fontFamily: fonts.display,
      fontWeight: 700,
      fontSize: Math.round(size * 0.44),
      lineHeight: 1,
      backgroundColor: colors.void,
      border: `1px solid ${empty ? "rgba(160, 155, 140, 0.35)" : colors.goldDark}`,
      boxShadow: empty ? "none" : `inset 0 0 0 1px ${colors.void}, inset 0 0 0 2px rgba(200, 170, 110, 0.35)`,
      color: colors.goldText,
    }}
  >
    {empty ? null : initialOf(name)}
  </Box>
);

interface NameplateProps {
  name: ReactNode;
  /** Name used for the initial when `name` is not plain text; null for a player without a name. */
  initialFrom?: string | null;
  /** One-line stat note, e.g. "12 games · 31 rolls". */
  note?: ReactNode;
  /** Keep the note line's height even without a note, so the plate never changes size. */
  reserveNote?: boolean;
  size?: "md" | "sm";
  empty?: boolean;
  /** Room kept free at the end of the name line (px), e.g. for a select's chevron. */
  reserveEnd?: number;
  /** Leave the disc out where a portrait already stands for the player. */
  noDisc?: boolean;
}

/** The one way a player is shown: initial disc, name, stat note in monospace. */
const Nameplate = ({ name, initialFrom, note, reserveNote, size = "md", empty, reserveEnd = 0, noDisc }: NameplateProps) => {
  const small = size === "sm";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      {!noDisc && (
        <InitialDisc
          name={initialFrom !== undefined ? initialFrom : typeof name === "string" ? name : undefined}
          size={small ? sizes.discSmall : sizes.disc}
          empty={empty}
        />
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component="span"
          noWrap
          sx={{
            display: "block",
            fontWeight: 500,
            fontSize: small ? "0.875rem" : "0.9375rem",
            lineHeight: 1.35,
            color: empty ? colors.muted : colors.cream,
            pr: `${reserveEnd}px`,
          }}
        >
          {name}
        </Typography>
        {(note !== undefined || reserveNote) && (
          <Typography
            component="span"
            noWrap
            sx={{ display: "block", fontFamily: fonts.mono, fontSize: "0.75rem", lineHeight: 1.45, color: colors.muted }}
          >
            {note ?? " "}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Nameplate;
