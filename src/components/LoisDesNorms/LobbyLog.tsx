import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { bevel, colors, fonts, goldFrame, SHORT } from "./tokens";

export interface LogEntry {
  id: number;
  /** Epoch ms when this page saw it. */
  at: number;
  text: string;
}

const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** What happened in this lobby while the page was open, newest last, like the client's lobby chat. */
const LobbyLog = ({ entries }: { entries: LogEntry[] }) => {
  const listRef = useRef<HTMLOListElement>(null);
  const count = entries.length;
  // Keep the newest line in view, like a chat.
  useEffect(() => {
    const list = listRef.current;
    if (list && count > 0) list.scrollTop = list.scrollHeight;
  }, [count]);

  return (
    <Box
      component="section"
      aria-label="Lobby log"
      sx={{
        height: { xs: 132, md: 96 },
        [SHORT]: { height: 70 },
        // The one gold frame, like the client's lobby chat.
        ...goldFrame,
        boxShadow: bevel,
        backgroundColor: "rgba(1, 10, 19, 0.72)",
      }}
    >
      <Box
        component="ol"
        ref={listRef}
        tabIndex={0}
        sx={{
          listStyle: "none",
          m: 0,
          px: 1.25,
          py: 1,
          height: "100%",
          overflowY: "auto",
          fontSize: "0.8125rem",
          lineHeight: 1.55,
          "&:focus-visible": { outline: `2px solid ${colors.cyan}`, outlineOffset: -2 },
        }}
      >
        {entries.map((entry) => (
          <li key={entry.id}>
            <Box component="time" dateTime={new Date(entry.at).toISOString()} sx={{ fontFamily: fonts.mono, color: colors.muted, mr: 1 }}>
              {clock(entry.at)}
            </Box>
            <Box component="span" sx={{ color: colors.cream }}>{entry.text}</Box>
          </li>
        ))}
      </Box>
    </Box>
  );
};

export default LobbyLog;
