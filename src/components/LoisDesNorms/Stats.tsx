import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { AvailablePlayers, winRate } from "../../helpers/loisDesNorms";

const TEAM_ID = "team";

const Stats = (props: { availablePlayers: AvailablePlayers }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const playerStats = Object.entries(props.availablePlayers)
    .filter(([, p]) => p && p.name && p.stats)
    .map(([id, p]) => ({
      id,
      name: p.name,
      numberOfGame: p.stats!.numberOfGame,
      totalRoll: p.stats!.totalRoll,
      winRate: winRate(p.stats),
    }));

  const team = {
    numberOfGame: playerStats.reduce((acc, s) => acc + s.numberOfGame, 0),
    totalRoll: playerStats.reduce((acc, s) => acc + s.totalRoll, 0),
  };
  const stats = [
    ...playerStats,
    { id: TEAM_ID, name: "Team", ...team, winRate: winRate(team) },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={stats} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
        <Bar
          dataKey="winRate"
          name="Win Rate"
          fill={theme.palette.secondary.main}
          onClick={(data) => {
            const id = (data as { payload?: { id?: string } }).payload?.id;
            if (id && id !== TEAM_ID) void navigate(`/profile?id=${encodeURIComponent(id)}`);
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Stats;
