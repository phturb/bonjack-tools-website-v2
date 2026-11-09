import { Box, Typography } from "@mui/material";
import { Match, Tournament } from "../../interfaces/Swiss";
import { participantMap } from "../../helpers/swiss";
import BucketColumn from "./BucketColumn";
import OutcomePanels from "./OutcomePanels";

interface Props {
  tournament: Tournament;
  /** Set for the creator while the tournament is in progress; only current-round cards are clickable. */
  onSelectMatch?: (match: Match) => void;
}

const BracketGraph = ({ tournament, onSelectMatch }: Props) => {
  const participants = participantMap(tournament);
  if (tournament.rounds.length === 0) {
    return <Typography color="text.secondary">No rounds yet.</Typography>;
  }
  return (
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
      {tournament.rounds.map((round) => {
        const current = round.number === tournament.currentRound && !round.closed;
        return (
          <BucketColumn
            key={round.number}
            round={round}
            config={tournament.config}
            participants={participants}
            current={current}
            onSelect={current ? onSelectMatch : undefined}
          />
        );
      })}
      <OutcomePanels tournament={tournament} />
    </Box>
  );
};

export default BracketGraph;
