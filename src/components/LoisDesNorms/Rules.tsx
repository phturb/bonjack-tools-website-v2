import { Box, Typography } from "@mui/material";
import { colors, fonts, visuallyHidden } from "./tokens";

const RULES = [
  "Invade MANDATORY",
  "We can't swap role or champions",
  "You take the first champion you roll",
  "Support takes support item and jungle takes smite and jungle item",
  "You need to play until you win",
  "You can't surrender",
  "If a rematch is called and everyone jumps in, the rules start over again",
];

/** The house rules down the right column, each beside its number in a red ring. */
const Rules = () => (
  <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: { xs: 1.25, md: 1.5 } }}>
    {RULES.map((rule, index) => (
      <Box
        component="li"
        key={rule}
        sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 40px", alignItems: "center", columnGap: 1.5 }}
      >
        <Typography sx={{ fontSize: "0.9375rem", lineHeight: 1.35, color: colors.cream, textAlign: "right" }}>
          <span style={visuallyHidden}>{`Rule ${index + 1}: `}</span>
          {rule}
        </Typography>
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `2px solid ${colors.red}`,
            boxShadow: `inset 0 0 0 2px ${colors.void}, inset 0 0 0 3px rgba(200, 48, 74, 0.35)`,
            backgroundColor: colors.void,
            display: "grid",
            placeItems: "center",
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: "1.0625rem",
            color: colors.cream,
          }}
        >
          {index + 1}
        </Box>
      </Box>
    ))}
  </Box>
);

export default Rules;
