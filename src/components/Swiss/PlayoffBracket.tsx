import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Match, Tournament } from "../../interfaces/Swiss";
import { COLUMN_WIDTH, participantMap, playoffRoundLabel } from "../../helpers/swiss";
import MatchCard from "./MatchCard";

interface Props {
  tournament: Tournament;
  /** Set for the creator while the playoffs run; only current-round cards are clickable. */
  onSelectMatch?: (match: Match) => void;
}

/** Single-elimination bracket: one column per generated round, the final last. */
const PlayoffBracket = ({ tournament, onSelectMatch }: Props) => {
  const playoffs = tournament.playoffs;
  if (!playoffs) return null;
  const participants = participantMap(tournament);
  const champion = playoffs.champion ? participants.get(playoffs.champion) : undefined;
  const totalRounds = Math.log2(playoffs.size);

  return (
    <Stack spacing={1}>
      {champion && (
        <Alert icon={<EmojiEventsIcon fontSize="inherit" />} severity="success">
          Champion: <strong>{champion.name}</strong> (seed {champion.seed})
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 2,
          overflowX: "auto",
          pb: 2,
        }}
      >
        {playoffs.rounds.map((round) => {
          const current =
            tournament.status === "playoffs" && round.number === playoffs.currentRound && !round.closed;
          return (
            <Paper
              key={round.number}
              variant="outlined"
              sx={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, flexShrink: 0, p: 1.5 }}
            >
              <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {playoffRoundLabel(playoffs.size, round.number)}
                {current ? " · current" : ""}
              </Typography>
              <Stack spacing={1}>
                {round.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    participants={participants}
                    current={current}
                    decider={false}
                    onSelect={current ? onSelectMatch : undefined}
                  />
                ))}
              </Stack>
            </Paper>
          );
        })}
        {playoffs.rounds.length < totalRounds && (
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
            {totalRounds - playoffs.rounds.length} more round
            {totalRounds - playoffs.rounds.length === 1 ? "" : "s"} to come
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default PlayoffBracket;
