import { Box, Paper, Stack, Typography } from "@mui/material";
import { Match, Participant, Round, TournamentConfig } from "../../interfaces/Swiss";
import { COLUMN_WIDTH, groupByBucket, recordLabel } from "../../helpers/swiss";
import MatchCard from "./MatchCard";

interface Props {
  round: Round;
  config: TournamentConfig;
  participants: Map<string, Participant>;
  current: boolean;
  onSelect?: (match: Match) => void;
}

const BucketColumn = (props: Props) => {
  const { round, config, participants, current, onSelect } = props;
  const groups = groupByBucket(round);

  return (
    <Paper
      variant="outlined"
      sx={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, flexShrink: 0, p: 1.5 }}
    >
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
        Round {round.number}
        {current && !round.closed ? " · current" : ""}
      </Typography>
      <Stack spacing={1.5}>
        {groups.map((group) => {
          const decider =
            group.bucket.wins === config.winsToAdvance - 1 ||
            group.bucket.losses === config.lossesToEliminate - 1;
          return (
            <Box key={recordLabel(group.bucket)}>
              <Typography variant="overline" color="text.secondary">
                {recordLabel(group.bucket)}
              </Typography>
              <Stack spacing={1}>
                {group.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    participants={participants}
                    current={current}
                    decider={decider}
                    onSelect={onSelect}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default BucketColumn;
