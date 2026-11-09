import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { Match, MatchResultInput, Participant } from "../../interfaces/Swiss";
import { scoreOptions } from "../../helpers/swiss";

interface Props {
  match: Match | null;
  participants: Map<string, Participant>;
  saving?: boolean;
  error?: string | null;
  onSubmit: (match: Match, result: MatchResultInput) => void;
  onClose: () => void;
}

/** Score picker constrained by the match best-of (spec section 10). */
const ResultDialog = (props: Props) => {
  const { match, participants, saving = false, error, onSubmit, onClose } = props;
  const p1 = match ? participants.get(match.p1) : undefined;
  const p2 = match?.p2 ? participants.get(match.p2) : undefined;
  const options = match ? scoreOptions(match.bestOf) : [];

  return (
    <Dialog open={match !== null} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Match result · bo{match?.bestOf}</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          <strong>{p1?.name ?? "?"}</strong> vs <strong>{p2?.name ?? "?"}</strong>
        </Typography>
        {match?.winner !== null && match !== null && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current result {match.p1Score}–{match.p2Score}. Pick a score to change it.
          </Typography>
        )}
        <Stack spacing={1} sx={{ mt: 1 }}>
          {options.map(([p1Score, p2Score]) => {
            const selected = match?.p1Score === p1Score && match?.p2Score === p2Score;
            return (
              <Button
                key={`${p1Score}-${p2Score}`}
                variant={selected ? "contained" : "outlined"}
                disabled={saving || match === null}
                onClick={() => match && onSubmit(match, { p1Score, p2Score })}
              >
                {p1?.name ?? "?"} {p1Score} – {p2Score} {p2?.name ?? "?"}
              </Button>
            );
          })}
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {saving ? "Saving…" : "Cancel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResultDialog;
