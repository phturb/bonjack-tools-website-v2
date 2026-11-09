import { useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { BestOf, Tournament } from "../../interfaces/Swiss";
import { activeRound, isResolved, playoffRoundLabel, qualifiers } from "../../helpers/swiss";
import ConfirmDialog from "./ConfirmDialog";

const BEST_OF: BestOf[] = [1, 3, 5];

interface Props {
  tournament: Tournament;
  busy?: boolean;
  error?: string | null;
  onCloseRound: () => void;
  onUndoRound: () => void;
  onStartPlayoffs: (bestOf: BestOf) => void;
  onDelete: () => void;
}

type Pending = "close" | "undo" | "cancelPlayoffs" | "playoffs" | "delete" | null;

const confirmText: Record<Exclude<Pending, null>, { title: string; body: string; label: string }> = {
  close: {
    title: "Close round?",
    body: "Results of this round become final and the next round is generated.",
    label: "Close round",
  },
  undo: {
    title: "Undo latest round?",
    body: "The latest generated round is removed. Only allowed while it has no results.",
    label: "Undo round",
  },
  cancelPlayoffs: {
    title: "Cancel playoffs?",
    body: "The playoff bracket is removed and the tournament returns to the end of the Swiss stage. You can start the playoffs again.",
    label: "Cancel playoffs",
  },
  playoffs: {
    title: "Start playoffs?",
    body: "The advanced participants are placed on a single-elimination bracket seeded by the standings. The playoffs best-of is frozen.",
    label: "Start playoffs",
  },
  delete: {
    title: "Delete tournament?",
    body: "This removes the tournament, its participants and every match. This cannot be undone.",
    label: "Delete",
  },
};

/** Creator actions once the tournament started, each behind a confirmation. */
const ActionBar = (props: Props) => {
  const { tournament, busy = false, error, onCloseRound, onUndoRound, onStartPlayoffs, onDelete } = props;
  const [pending, setPending] = useState<Pending>(null);
  const [playoffsBestOf, setPlayoffsBestOf] = useState<BestOf>(tournament.config.playoffsBestOf);

  const status = tournament.status;
  const inPlayoffs = status === "playoffs";
  const stageOpen = status === "in_progress" || inPlayoffs;
  const round = activeRound(tournament);
  const unresolved = round ? round.matches.filter((m) => !isResolved(m)).length : 0;
  const latestHasResults = round ? round.matches.some((m) => !m.bye && isResolved(m)) : false;
  const canClose = stageOpen && round !== undefined && unresolved === 0;
  // Backend refuses undo (409) on Swiss round 1, on completed/finished tournaments, or when
  // the latest round has results. Undoing playoff round 1 cancels the playoffs.
  const canUndo = stageOpen && !latestHasResults && (inPlayoffs || tournament.rounds.length > 1);
  const undoCancelsPlayoffs = inPlayoffs && tournament.playoffs?.currentRound === 1;
  const qualified = status === "completed" ? qualifiers(tournament).length : 0;

  const roundLabel = round
    ? inPlayoffs && tournament.playoffs
      ? playoffRoundLabel(tournament.playoffs.size, round.number).toLowerCase()
      : `round ${round.number}`
    : "";

  const confirm = () => {
    if (pending === "close") onCloseRound();
    else if (pending === "undo" || pending === "cancelPlayoffs") onUndoRound();
    else if (pending === "playoffs") onStartPlayoffs(playoffsBestOf);
    else if (pending === "delete") onDelete();
    setPending(null);
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap>
        {stageOpen && (
          <Button variant="contained" disabled={busy || !canClose} onClick={() => setPending("close")}>
            Close {roundLabel}
          </Button>
        )}
        {status === "completed" && (
          <>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="swiss-playoffs-bestof">Playoffs best of</InputLabel>
              <Select
                labelId="swiss-playoffs-bestof"
                label="Playoffs best of"
                value={playoffsBestOf}
                disabled={busy}
                onChange={(e) => setPlayoffsBestOf(e.target.value)}
              >
                {BEST_OF.map((n) => (
                  <MenuItem key={n} value={n}>
                    Bo{n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" disabled={busy || qualified < 2} onClick={() => setPending("playoffs")}>
              Start playoffs ({qualified} qualified)
            </Button>
          </>
        )}
        {stageOpen && (
          <Button
            variant="outlined"
            disabled={busy || !canUndo}
            onClick={() => setPending(undoCancelsPlayoffs ? "cancelPlayoffs" : "undo")}
          >
            {undoCancelsPlayoffs ? "Cancel playoffs" : "Undo round"}
          </Button>
        )}
        <Button variant="outlined" color="error" disabled={busy} onClick={() => setPending("delete")}>
          Delete tournament
        </Button>
        {stageOpen && unresolved > 0 && (
          <Typography variant="body2" color="text.secondary">
            {unresolved} match{unresolved === 1 ? "" : "es"} without result
          </Typography>
        )}
        {status === "completed" && qualified < 2 && (
          <Typography variant="body2" color="text.secondary">
            Swiss stage completed. Playoffs need at least two advanced participants.
          </Typography>
        )}
        {status === "finished" && (
          <Typography variant="body2" color="text.secondary">
            Finished.
          </Typography>
        )}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <ConfirmDialog
        open={pending !== null}
        title={pending ? confirmText[pending].title : ""}
        body={pending ? confirmText[pending].body : ""}
        confirmLabel={pending ? confirmText[pending].label : ""}
        destructive={pending === "delete" || pending === "cancelPlayoffs"}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </Stack>
  );
};

export default ActionBar;
