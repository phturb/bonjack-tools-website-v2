import "@fontsource-variable/cinzel";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/jetbrains-mono";
import { createTheme } from "@mui/material/styles";
import { bevel, colors, focusRing, fonts, FRAME, goldFrame, litFill, motion } from "./tokens";

const focusVisible = { "&.Mui-focusVisible, &:focus-visible": focusRing };

const buttonCaps = {
  fontFamily: fonts.display,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
} as const;

/** Dark navy theme scoped to the Lois des Norms pages (nested ThemeProvider). */
export const ldnTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: colors.gold, dark: colors.goldDark, light: colors.cream, contrastText: colors.void },
    secondary: { main: colors.cyan, contrastText: colors.void },
    error: { main: colors.danger, dark: colors.danger, light: colors.redText, contrastText: "#FFFFFF" },
    warning: { main: colors.gold, contrastText: colors.void },
    info: { main: colors.cyan, contrastText: colors.void },
    success: { main: colors.cyan, contrastText: colors.void },
    background: { default: colors.void, paper: colors.navy },
    text: { primary: colors.cream, secondary: colors.muted, disabled: colors.muted },
    divider: colors.rule,
    action: {
      hover: "rgba(200, 170, 110, 0.08)",
      selected: "rgba(200, 170, 110, 0.14)",
      focus: "rgba(10, 200, 185, 0.14)",
      disabled: colors.muted,
      disabledBackground: "rgba(200, 170, 110, 0.06)",
    },
  },
  shape: { borderRadius: 0 },
  typography: {
    fontFamily: fonts.ui,
    h1: { fontFamily: fonts.display, fontWeight: 700, fontSize: "2rem", lineHeight: 1.1, letterSpacing: "0.08em", textTransform: "uppercase" },
    h2: { fontFamily: fonts.display, fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.2, letterSpacing: "0.08em", textTransform: "uppercase" },
    button: buttonCaps,
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingInline: 18,
          transition: `background-color ${motion.quick}ms, color ${motion.quick}ms, border-color ${motion.quick}ms`,
          ...focusVisible,
        },
        // The hextech primary: dark fill inside the gold frame, gold caps.
        containedPrimary: {
          ...goldFrame,
          backgroundColor: colors.navy,
          // A slight vertical fill, lit from the top like the client's buttons.
          backgroundImage: litFill,
          color: colors.goldText,
          boxShadow: bevel,
          "&:hover": {
            backgroundColor: colors.navyRaised,
            backgroundImage: `linear-gradient(180deg, #16294A, ${colors.navyRaised})`,
            color: colors.cream,
            boxShadow: bevel,
          },
          "&.Mui-disabled": {
            ...goldFrame,
            borderImage: `linear-gradient(180deg, ${colors.goldDark}, rgba(120, 90, 40, 0.4)) 1`,
            backgroundColor: colors.void,
            backgroundImage: "none",
            color: colors.muted,
          },
        },
        containedError: {
          backgroundColor: colors.danger,
          color: "#FFFFFF",
          "&:hover": { backgroundColor: colors.dangerHover },
        },
        outlined: {
          border: `${FRAME}px solid ${colors.goldDark}`,
          color: colors.cream,
          backgroundColor: colors.navy,
          backgroundImage: litFill,
          boxShadow: bevel,
          "&:hover": { border: `${FRAME}px solid ${colors.gold}`, backgroundColor: colors.navyRaised, boxShadow: bevel },
          "&.Mui-disabled": {
            border: `${FRAME}px solid rgba(120, 90, 40, 0.4)`,
            color: colors.muted,
            backgroundImage: "none",
            backgroundColor: colors.void,
          },
        },
        text: {
          color: colors.muted,
          "&:hover": { color: colors.cream, backgroundColor: "rgba(200, 170, 110, 0.08)" },
        },
      },
    },
    MuiIconButton: { styleOverrides: { root: focusVisible } },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: {
        root: { color: colors.goldText, textUnderlineOffset: "0.2em", "&:focus-visible": focusRing },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...goldFrame,
          backgroundColor: colors.navy,
          borderRadius: 0,
          boxShadow: `${bevel}, 0 24px 48px ${colors.shadow}`,
          fontVariantNumeric: "tabular-nums",
          "& ::selection": { backgroundColor: colors.gold, color: colors.void },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: fonts.display, fontWeight: 700, fontSize: "1.125rem", letterSpacing: "0.1em", textTransform: "uppercase", color: colors.goldText },
      },
    },
    MuiDialogContentText: { styleOverrides: { root: { color: colors.muted } } },
    MuiPopover: {
      styleOverrides: {
        paper: {
          ...goldFrame,
          backgroundColor: colors.navy,
          borderRadius: 0,
          boxShadow: `0 16px 32px ${colors.shadow}`,
          scrollbarColor: `${colors.goldDark} ${colors.void}`,
          fontVariantNumeric: "tabular-nums",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { backgroundColor: "rgba(200, 170, 110, 0.14)" },
          "&.Mui-selected:hover, &:hover": { backgroundColor: colors.navyRaised },
          "&.Mui-focusVisible": { backgroundColor: colors.navyRaised, outline: `${FRAME}px solid ${colors.cyan}`, outlineOffset: -2 },
          "&.Mui-disabled": { opacity: 0.6 },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: colors.void,
          "& .MuiOutlinedInput-notchedOutline": { borderWidth: FRAME, borderColor: colors.goldDark },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.gold },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: FRAME, borderColor: colors.gold },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: colors.muted, "&.Mui-focused": { color: colors.goldText } } } },
    MuiFormHelperText: { styleOverrides: { root: { color: colors.muted } } },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 36 },
        indicator: { backgroundColor: colors.gold, height: FRAME },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          ...buttonCaps,
          fontSize: "0.8125rem",
          minHeight: 36,
          minWidth: 0,
          paddingInline: 12,
          color: colors.muted,
          "&.Mui-selected": { color: colors.goldText },
          "&.Mui-focusVisible": { ...focusRing, outlineOffset: -3 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { ...goldFrame, borderRadius: 0, backgroundColor: colors.navy, color: colors.cream, alignItems: "center" },
        standardWarning: { "& .MuiAlert-icon": { color: colors.gold } },
        standardError: { "& .MuiAlert-icon": { color: colors.redText } },
        standardInfo: { "& .MuiAlert-icon": { color: colors.cyan } },
        standardSuccess: { "& .MuiAlert-icon": { color: colors.cyan } },
      },
    },
    MuiSkeleton: { styleOverrides: { root: { backgroundColor: "rgba(200, 170, 110, 0.08)", borderRadius: 0 } } },
    MuiCircularProgress: { defaultProps: { color: "inherit" } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: colors.void, color: colors.cream, border: `1px solid ${colors.goldDark}`, borderRadius: 0, fontSize: "0.8125rem" },
      },
    },
  },
});
