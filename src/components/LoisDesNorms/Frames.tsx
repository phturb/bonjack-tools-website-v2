import { ReactNode } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { caps, colors } from "./tokens";

const diamond = (side: "left" | "right") => ({
  content: '""',
  position: "absolute",
  top: "50%",
  [side]: -3,
  width: 6,
  height: 6,
  transform: "translateY(-50%) rotate(45deg)",
  border: `1px solid ${colors.gold}`,
  backgroundColor: colors.void,
});

/** Thin gold rule with small diamond end caps, between rows. */
export const GoldRule = ({ sx }: { sx?: SxProps<Theme> }) => (
  <Box
    aria-hidden
    sx={[
      {
        position: "relative",
        height: "1px",
        mx: "4px",
        background: `linear-gradient(90deg, ${colors.goldDark}, ${colors.gold} 50%, ${colors.goldDark})`,
        "&::before": diamond("left"),
        "&::after": diamond("right"),
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
);

/** A small capital title between two gold bracket lines. */
export const BracketTitle = ({ children, id }: { children: ReactNode; id?: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    <Box aria-hidden sx={{ flex: 1, height: 10, borderTop: `1px solid ${colors.goldDark}`, borderLeft: `1px solid ${colors.goldDark}`, mt: "10px" }} />
    <Box
      id={id}
      component="h2"
      sx={{ ...caps, m: 0, fontSize: "0.8125rem", fontWeight: 700, color: colors.goldText, letterSpacing: "0.16em", whiteSpace: "nowrap" }}
    >
      {children}
    </Box>
    <Box aria-hidden sx={{ flex: 1, height: 10, borderTop: `1px solid ${colors.goldDark}`, borderRight: `1px solid ${colors.goldDark}`, mt: "10px" }} />
  </Box>
);
