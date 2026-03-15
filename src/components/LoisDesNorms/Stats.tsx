import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

interface PlayerStat {
  id: string;
  name: string;
  numberOfGame: number;
  totalRoll: number;
  maxNumberOfRoll: number;
  avgRollsPerGame: number;
}

const Stats = (props: { availablePlayers: any }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const stats: PlayerStat[] = Object.entries(props.availablePlayers)
    .filter((x) => x[1] && (x[1] as any).name && (x[1] as any).stats)
    .map((ap) => {
      const s = (ap[1] as any).stats;
      const numberOfGame: number = s.numberOfGame ?? 0;
      const totalRoll: number = s.totalRoll ?? 0;
      const maxNumberOfRoll: number = s.maxNumberOfRoll ?? 0;
      const avgRollsPerGame =
        numberOfGame > 0 ? Math.round((totalRoll / numberOfGame) * 10) / 10 : 0;

      return {
        id: ap[0],
        name: (ap[1] as any).name as string,
        numberOfGame,
        totalRoll,
        maxNumberOfRoll,
        avgRollsPerGame,
      };
    });

  if (stats.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Typography variant="body2" color="text.secondary">
          No player stats available yet.
        </Typography>
      </Box>
    );
  }

  const handleBarClick = (e: any) => {
    if (e?.activePayload?.[0]?.payload?.id) {
      navigate("/profile?id=" + e.activePayload[0].payload.id);
    }
  };

  const handleBarItemClick = (e: any) => {
    const id = e?.payload?.id;
    if (id && id !== "0") {
      navigate("/profile?id=" + id);
    }
  };

  const totalGames = stats.reduce((sum, s) => sum + s.numberOfGame, 0);
  const totalRolls = stats.reduce((sum, s) => sum + s.totalRoll, 0);
  const overallAvg =
    totalGames > 0 ? Math.round((totalRolls / totalGames) * 10) / 10 : 0;

  return (
    <Stack spacing={1} height="100%" overflow="auto" pb={1}>
      {/* Summary row */}
      <Stack
        direction="row"
        justifyContent="space-around"
        pt={1}
        divider={<Divider orientation="vertical" flexItem />}
      >
        <Box textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Total Games
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {totalGames}
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Total Rolls
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {totalRolls}
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Avg Rolls / Game
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {overallAvg}
          </Typography>
        </Box>
      </Stack>

      <Divider />

      {/* Avg rolls per game chart */}
      <Typography variant="caption" align="center" color="text.secondary">
        Avg Rolls per Game
      </Typography>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={stats}
          margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
          onClick={handleBarClick}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`${value} rolls`, "Avg / game"]}
          />
          <Bar
            dataKey="avgRollsPerGame"
            name="Avg Rolls / Game"
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
            onClick={handleBarItemClick}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Max rolls in a game chart */}
      <Typography variant="caption" align="center" color="text.secondary">
        Max Rolls in a Single Game
      </Typography>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={stats}
          margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
          onClick={handleBarClick}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`${value} rolls`, "Max rolls"]}
          />
          <Bar
            dataKey="maxNumberOfRoll"
            name="Max Rolls"
            fill={theme.palette.secondary.main}
            radius={[4, 4, 0, 0]}
            onClick={handleBarItemClick}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Games played chart */}
      <Typography variant="caption" align="center" color="text.secondary">
        Games Played
      </Typography>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={stats}
          margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
          onClick={handleBarClick}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: number) => [`${value}`, "Games played"]}
          />
          <Bar
            dataKey="numberOfGame"
            name="Games Played"
            fill={theme.palette.info?.main ?? "#29b6f6"}
            radius={[4, 4, 0, 0]}
            onClick={handleBarItemClick}
          />
        </BarChart>
      </ResponsiveContainer>
    </Stack>
  );
};

export default Stats;
