import { Box, Card, CardActionArea, Chip, Stack, Typography } from "@mui/material";
import { Match, Participant } from "../../interfaces/Swiss";

interface Props {
  match: Match;
  participants: Map<string, Participant>;
  /** True when this match belongs to the current (open) round. */
  current: boolean;
  /** True when someone advances or is eliminated with this result. */
  decider: boolean;
  /** Set when the viewer can enter a result; clicking opens the result dialog. */
  onSelect?: (match: Match) => void;
}

const ParticipantLine = (props: {
  participant: Participant | undefined;
  score: number | null;
  winner: boolean;
  decided: boolean;
}) => {
  const { participant, score, winner, decided } = props;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography
        noWrap
        sx={{
          fontWeight: winner ? 700 : 400,
          color: decided && !winner ? "text.secondary" : "text.primary",
        }}
      >
        {participant ? `(${participant.seed}) ${participant.name}` : "?"}
      </Typography>
      <Typography sx={{ fontWeight: winner ? 700 : 400, ml: 1 }}>
        {decided ? (score ?? "–") : "–"}
      </Typography>
    </Stack>
  );
};

const MatchCard = (props: Props) => {
  const { match, participants, current, decider, onSelect } = props;
  const p1 = participants.get(match.p1);
  const p2 = match.p2 ? participants.get(match.p2) : undefined;
  const decided = match.winner !== null;
  const clickable = current && !match.bye && onSelect !== undefined;

  const body = (
    <Box sx={{ p: 1.5 }}>
      <ParticipantLine
        participant={p1}
        score={match.p1Score}
        winner={decided && match.winner === match.p1}
        decided={decided}
      />
      {match.bye ? (
        <Typography variant="body2" color="text.secondary">
          bye
        </Typography>
      ) : (
        <ParticipantLine
          participant={p2}
          score={match.p2Score}
          winner={decided && match.winner === match.p2}
          decided={decided}
        />
      )}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          bo{match.bestOf}
          {decider ? " · decider" : ""}
        </Typography>
        {match.rematch && <Chip label="rematch" size="small" color="warning" />}
        {match.forfeit && <Chip label="forfeit" size="small" color="error" />}
      </Stack>
    </Box>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: current && !decided ? "primary.main" : undefined,
        bgcolor: match.bye ? "action.hover" : undefined,
      }}
    >
      {clickable ? (
        <CardActionArea onClick={() => onSelect(match)} aria-label="enter result">
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  );
};

export default MatchCard;
