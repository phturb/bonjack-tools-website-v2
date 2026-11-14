import { ReactNode } from "react";
import { Box, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CrossFadeImage from "./CrossFadeImage";
import { ldnTheme } from "./theme";
import { colors, sizes } from "./tokens";

/**
 * While these pages are mounted: the body takes the page's ground, the site's
 * fixed footer keeps its look but gets that ground and cream text so it stays
 * legible, and #root drops its footer gap (the scene keeps its own, at least
 * the footer's height).
 */
const footerStyles = {
  // The page ground behind everything, so no light band shows below or around the scene.
  body: { backgroundColor: colors.void },
  "#root": { paddingBottom: 0 },
  ".footer": { backgroundColor: colors.void, color: colors.cream },
  ".footer .MuiTypography-root": { color: colors.cream },
} as const;

const layerSx = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  // Blurred and darkened so the page reads over it; scaled so the blur has no soft edge.
  filter: "blur(16px) brightness(0.34) saturate(1.1)",
  transform: "scale(1.08)",
} as const;

/** The focused champion's splash behind everything, cross-faded when it changes. */
const SplashGround = ({ url }: { url: string }) => (
  <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
    <CrossFadeImage url={url} imgSx={layerSx} />
    {/* Vignette into the blue-black ground. */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 75% 70% at 50% 40%, rgba(1, 10, 19, 0.15) 0%, rgba(1, 10, 19, 0.75) 70%, ${colors.void} 100%)`,
      }}
    />
  </Box>
);

/** The champ-select ground: blue-black under the focused champion's blurred splash, with the pages' own theme. */
const ClientScene = ({ children, splash }: { children: ReactNode; splash?: string }) => (
  <ThemeProvider theme={ldnTheme}>
    <GlobalStyles styles={footerStyles} />
    <Box
      component="main"
      sx={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        backgroundColor: colors.void,
        backgroundImage: `linear-gradient(180deg, ${colors.navy} 0%, ${colors.void} 75%)`,
        color: colors.cream,
        colorScheme: "dark",
        fontVariantNumeric: "tabular-nums",
        caretColor: colors.gold,
        scrollbarColor: `${colors.goldDark} ${colors.void}`,
        // Site header: 56px on phones, 64px on tablets, about 69px on desktop.
        minHeight: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)", md: "calc(100dvh - 69px)" },
        "& *, & *::before, & *::after": { boxSizing: "border-box" },
        "& ::selection": { backgroundColor: colors.gold, color: colors.void },
      }}
    >
      {splash && <SplashGround url={splash} />}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: sizes.content,
          mx: "auto",
          px: { xs: 1.5, sm: 3 },
          pt: { xs: 2, md: 2 },
          // Clear of the fixed footer (about 24px) with room to spare.
          pb: { xs: 6, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  </ThemeProvider>
);

export default ClientScene;
