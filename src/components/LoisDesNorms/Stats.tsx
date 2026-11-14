import { Box, Link, Typography } from "@mui/material";
import { useQueries } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { AvailablePlayers, PlayerStats, winRate } from "../../helpers/loisDesNorms";
import Nameplate from "./Nameplate";
import { playerStatsQuery, statsOf } from "./playerStats";
import { caps, colors, fonts, visuallyHidden } from "./tokens";

const cellSx = { py: 0.75, px: 0.75, borderBottom: `1px solid ${colors.rule}` } as const;
const numberSx = { ...cellSx, textAlign: "right", fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" } as const;
const headSx = { ...caps, fontSize: "0.6875rem", letterSpacing: "0.12em", color: colors.muted, fontWeight: 700, borderBottom: `1px solid ${colors.goldDark}` } as const;

type Row = { id: string; name: string; stats: PlayerStats };

/** Win rate, or a dash when nothing has been rolled yet: no rolls is not a 0% win rate. */
const rate = (stats: PlayerStats) => (stats.totalRoll === 0 ? "—" : `${winRate(stats).toFixed(1)}%`);

const PlayerRow = ({ row }: { row: Row }) => (
  <tr>
    <Box component="th" scope="row" sx={{ ...cellSx, textAlign: "left", fontWeight: 400 }}>
      <Nameplate
        size="sm"
        initialFrom={row.name}
        name={
          <Link component={RouterLink} to={`/profile?id=${encodeURIComponent(row.id)}`} sx={{ color: colors.cream }}>
            {row.name}
          </Link>
        }
      />
    </Box>
    <Box component="td" sx={numberSx}>{row.stats.numberOfGame}</Box>
    <Box component="td" sx={numberSx}>{row.stats.totalRoll}</Box>
    <Box component="td" sx={numberSx}>{rate(row.stats)}</Box>
  </tr>
);

/**
 * Ledger: the seated players and their team total first, then everyone else in
 * voice. Games won, total rolls and win rate, all from the live stats source.
 */
const Stats = (props: { availablePlayers: AvailablePlayers; seatedIds: string[] }) => {
  // Live stats per player; the lobby state's own (stale) stats are only placeholders.
  const players = Object.entries(props.availablePlayers).filter(([id, p]) => id !== "" && p && p.name);
  const results = useQueries({
    queries: players.map(([id, p]) => playerStatsQuery(id, p.stats)),
  });
  const rows = players
    .map(([id, p], i) => ({ id, name: p.name ?? "", stats: statsOf(results[i], p.stats) }))
    .filter((row): row is Row => row.stats !== undefined);

  if (rows.length === 0) {
    return (
      <Typography sx={{ color: colors.muted, fontSize: "0.9375rem" }}>
        No stats yet for the players in voice. They count from the first finished loi.
      </Typography>
    );
  }

  // Seat order for the team, then the rest of voice as listed.
  const seated = props.seatedIds.map((id) => rows.find((r) => r.id === id)).filter((r): r is Row => r !== undefined);
  const others = rows.filter((r) => !props.seatedIds.includes(r.id));
  const team = {
    numberOfGame: seated.reduce((acc, r) => acc + r.stats.numberOfGame, 0),
    totalRoll: seated.reduce((acc, r) => acc + r.stats.totalRoll, 0),
  };
  const totalSx = { ...numberSx, color: colors.goldText, borderBottom: `1px solid ${colors.goldDark}` };

  return (
    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "0.875rem" }}>
      <caption style={visuallyHidden}>Player stats: games won, total rolls and win rate</caption>
      <colgroup>
        <col />
        <col style={{ width: 44 }} />
        <col style={{ width: 48 }} />
        <col style={{ width: 64 }} />
      </colgroup>
      <thead>
        <tr>
          <Box component="th" scope="col" sx={{ ...cellSx, ...headSx, textAlign: "left" }}>Player</Box>
          <Box component="th" scope="col" sx={{ ...numberSx, ...headSx }} title="Games won">G</Box>
          <Box component="th" scope="col" sx={{ ...numberSx, ...headSx }} title="Total rolls">R</Box>
          <Box component="th" scope="col" sx={{ ...numberSx, ...headSx }} title="Win rate">WR</Box>
        </tr>
      </thead>
      {seated.length > 0 && (
        <tbody>
          {seated.map((row) => (
            <PlayerRow key={row.id} row={row} />
          ))}
          <tr>
            <Box component="th" scope="row" sx={{ ...cellSx, ...caps, textAlign: "left", fontWeight: 700, color: colors.goldText, borderBottom: `1px solid ${colors.goldDark}` }}>
              Team
            </Box>
            <Box component="td" sx={totalSx}>{team.numberOfGame}</Box>
            <Box component="td" sx={totalSx}>{team.totalRoll}</Box>
            <Box component="td" sx={totalSx}>{rate(team)}</Box>
          </tr>
        </tbody>
      )}
      {others.length > 0 && (
        <tbody>
          <tr>
            <Box component="th" scope="colgroup" colSpan={4} sx={{ ...cellSx, ...headSx, textAlign: "left", pt: 1.5 }}>
              Also in voice
            </Box>
          </tr>
          {others.map((row) => (
            <PlayerRow key={row.id} row={row} />
          ))}
        </tbody>
      )}
    </Box>
  );
};

export default Stats;
