import { keyframes } from "@mui/material/styles";
import { colors, FRAME, motion } from "./tokens";

/** Gold flash running down the seat rows on a lock-in. */
export const sweep = keyframes`
  from { transform: translateY(-30%); opacity: 0; }
  20% { opacity: 1; }
  to { transform: translateY(330%); opacity: 0; }
`;

/** A portrait swapping to its new champion. */
export const swapIn = keyframes`
  from { transform: scale(1.12); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

/** Gold ring expanding off a portrait as it locks in. */
export const ringPulse = keyframes`
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(1.28); opacity: 0; }
`;

/** Timer bar filling up to its current length when a cooldown starts. */
export const refill = keyframes`
  from { transform: scaleX(0); }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/** Reduced motion: a short gold outline instead of movement. */
export const highlight = keyframes`
  from { outline: ${FRAME + 1}px solid ${colors.gold}; outline-offset: 3px; }
  to { outline: ${FRAME + 1}px solid transparent; outline-offset: 3px; }
`;

export const REDUCED = "@media (prefers-reduced-motion: reduce)";

export const highlightAnimation = `${highlight} 900ms ${motion.easeOut} both`;
