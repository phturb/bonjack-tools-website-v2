import { useId } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Player } from "../../helpers/loisDesNorms";
import { ROLE_IMAGES, splashUrl, squareUrl, useChampionTitle } from "./champions";
import CrossFadeImage from "./CrossFadeImage";
import { highlightAnimation, REDUCED } from "./motion";
import { caps, colors, focusRing, fonts, goldFrame, motion, SHORT, sizes } from "./tokens";

const C = 160;
const point = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};
const arc = (r: number, from: number, to: number) => {
  const [x1, y1] = point(r, from);
  const [x2, y2] = point(r, to);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};
/** Fine tick marks every 5 degrees, longer every 30. */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5;
  const long = deg % 30 === 0;
  const [x1, y1] = point(long ? 134 : 139, deg);
  const [x2, y2] = point(145, deg);
  return { key: deg, x1, y1, x2, y2, long };
});
const SIDE_DIAMONDS = [0, 180].map((deg) => point(156, deg));

/** The gold ring: two arcs broken at the sides by diamonds, over a ring of tick marks. */
const RingFrame = () => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <Box component="svg" viewBox="0 0 320 320" aria-hidden sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.gold} />
          <stop offset="1" stopColor={colors.goldDark} />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={147} fill="none" stroke={colors.goldDark} strokeWidth="1" />
      <g stroke={`url(#${id}-gold)`} strokeLinecap="round">
        {TICKS.map((t) => (
          <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.long ? 1.6 : 0.8} opacity={t.long ? 1 : 0.7} />
        ))}
      </g>
      <g fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2.4">
        <path d={arc(156, 192, 348)} />
        <path d={arc(156, 12, 168)} />
      </g>
      {SIDE_DIAMONDS.map(([x, y]) => (
        <rect
          key={x}
          x={x - 5}
          y={y - 5}
          width="10"
          height="10"
          transform={`rotate(45 ${x} ${y})`}
          fill={colors.void}
          stroke={colors.gold}
          strokeWidth="1.6"
        />
      ))}
    </Box>
  );
};

/** Drawn emblem shown in the ring before the first roll. */
const EmptyEmblem = () => (
  <Box component="svg" viewBox="0 0 200 200" aria-hidden sx={{ width: "62%", height: "62%" }}>
    <g fill="none" strokeLinejoin="round">
      <polygon points="100,18 171,59 171,141 100,182 29,141 29,59" stroke={colors.goldDark} strokeWidth="2" />
      <polygon points="100,40 152,70 152,130 100,160 48,130 48,70" stroke={colors.gold} strokeWidth="1.2" opacity="0.7" />
      <polygon points="100,62 138,100 100,138 62,100" stroke={colors.cyan} strokeWidth="1.6" />
      <circle cx="100" cy="100" r="12" stroke={colors.cyan} strokeWidth="1.6" />
      <line x1="100" y1="18" x2="100" y2="62" stroke={colors.goldDark} strokeWidth="1" />
      <line x1="100" y1="138" x2="100" y2="182" stroke={colors.goldDark} strokeWidth="1" />
    </g>
  </Box>
);

const ringImgSx = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" } as const;

interface Props {
  players: Player[];
  leagueVersion: string;
  focusIndex: number | null;
  onFocus: (index: number) => void;
  /** Changes on every roll seen live. */
  rollSeq: number;
}

/** Centre: the focused champion's splash in the gold ring, name, title and role, then the team's champions. */
const SplashRing = ({ players, leagueVersion, focusIndex, onFocus, rollSeq }: Props) => {
  const focused = focusIndex != null ? players[focusIndex] : undefined;
  const champion = focused?.champion ?? undefined;
  const role = focused?.role ?? undefined;
  const title = useChampionTitle(leagueVersion, champion);

  return (
    <Box component="section" aria-label="Focused champion" sx={{ display: "grid", justifyItems: "center", gap: 1, textAlign: "center" }}>
      <Box sx={{ position: "relative", width: { xs: sizes.ringCompact, md: sizes.ring }, aspectRatio: "1", [SHORT]: { width: sizes.ringShort } }}>
        <Box
          sx={{
            position: "absolute",
            inset: "9%",
            borderRadius: "50%",
            overflow: "hidden",
            backgroundColor: colors.void,
            display: "grid",
            placeItems: "center",
            boxShadow: `inset 0 0 0 1px ${colors.void}`,
          }}
        >
          {/* The emblem stays underneath, so the ring is never blank while a splash downloads. */}
          <EmptyEmblem />
          {champion && <CrossFadeImage url={splashUrl(champion)} imgSx={ringImgSx} />}
        </Box>
        <RingFrame />
        {rollSeq > 0 && champion && (
          <Box
            key={rollSeq}
            aria-hidden
            sx={{ position: "absolute", inset: "9%", borderRadius: "50%", display: "none", [REDUCED]: { display: "block", animation: highlightAnimation } }}
          />
        )}
      </Box>

      {champion && focused ? (
        <Box>
          <Typography component="p" sx={{ fontFamily: fonts.italic, fontStyle: "italic", fontWeight: 600, fontSize: { xs: "1.75rem", md: "2.125rem" }, lineHeight: 1.05, color: colors.cream }}>
            {champion.name}
          </Typography>
          <Typography component="p" sx={{ ...caps, fontSize: "0.75rem", letterSpacing: "0.14em", color: colors.goldText, minHeight: "1.5em", mt: 0.5 }}>
            {title ?? " "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mt: 0.5, fontSize: "0.875rem" }}>
            {role && <Box component="img" src={ROLE_IMAGES[role]} alt="" sx={{ width: 18, height: 18 }} />}
            {role && <Box component="span" sx={{ fontWeight: 700, letterSpacing: "0.06em", color: colors.cream }}>{role}</Box>}
            <Box component="span" sx={{ color: colors.muted }}>· {focused.player.name ?? "Unnamed player"}</Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography component="p" sx={{ ...caps, fontWeight: 700, fontSize: "1.125rem", letterSpacing: "0.14em", color: colors.goldText }}>
            Waiting for the roll
          </Typography>
          <Typography component="p" sx={{ fontSize: "0.875rem", color: colors.muted, mt: 0.5 }}>
            Seat players, then start the loi.
          </Typography>
        </Box>
      )}

      {/* The team's champions; the focused one is framed in gold. */}
      <Box component="ul" aria-label="Team champions" sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", gap: 1 }}>
        {players.map((seat, index) => {
          const c = seat.champion;
          const isFocus = focusIndex === index;
          return (
            <li key={`thumb-${index}`}>
              <ButtonBase
                disabled={!c}
                onClick={() => onFocus(index)}
                aria-label={c ? `Show ${c.name}` : `Seat ${index + 1}, not rolled`}
                aria-pressed={c ? isFocus : undefined}
                sx={{
                  width: sizes.thumb,
                  height: sizes.thumb,
                  backgroundColor: colors.void,
                  ...(isFocus && c ? goldFrame : { border: `1px solid ${c ? colors.goldDark : "rgba(160, 155, 140, 0.25)"}` }),
                  opacity: c && !isFocus ? 0.7 : 1,
                  transition: `opacity ${motion.quick}ms`,
                  "&:hover": { opacity: 1 },
                  "&.Mui-focusVisible, &:focus-visible": focusRing,
                }}
              >
                {c && (
                  <Box component="img" src={squareUrl(leagueVersion, c)} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
              </ButtonBase>
            </li>
          );
        })}
      </Box>
    </Box>
  );
};

export default SplashRing;
