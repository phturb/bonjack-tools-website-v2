import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { Tournament } from "../../interfaces/Swiss";
import { currentRound, isResolved } from "../../helpers/swiss";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  tournament: Tournament;
  busy?: boolean;
  error?: string | null;
  onCloseRound: () => void;
  onUndoRound: () => void;
  onDelete: () => void;
}

type Pending = "close" | "undo" | "delete" | null;

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
  delete: {
    title: "Delete tournament?",
    body: "This removes the tournament, its participants and every match. This cannot be undone.",
    label: "Delete",
  },
};

/** Creator actions on an in-progress or completed tournament, each behind a confirmation. */
const ActionBar = (props: Props) => {
  const { tournament, busy = false, error, onCloseRound, onUndoRound, onDelete } = props;
  const [pending, setPending] = useState<Pending>(null);

  const round = currentRound(tournament);
  const inProgress = tournament.status === "in_progress";
  const unresolved = round ? round.matches.filter((m) => !isResolved(m)).length : 0;
  const latestHasResults = round ? round.matches.some((m) => !m.bye && isResolved(m)) : false;
  const canClose = inProgress && round !== undefined && unresolved === 0;
  // Backend refuses undo (409) on round 1, on a completed tournament, or when the latest round has results.
  const canUndo = inProgress && tournament.rounds.length > 1 && !latestHasResults;

  const confirm = () => {
    if (pending === "close") onCloseRound();
    else if (pending === "undo") onUndoRound();
    else if (pending === "delete") onDelete();
    setPending(null);
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
        {inProgress && (
          <Button variant="contained" disabled={busy || !canClose} onClick={() => setPending("close")}>
            Close round {round?.number}
          </Button>
        )}
        <Button variant="outlined" disabled={busy || !canUndo} onClick={() => setPending("undo")}>
          Undo round
        </Button>
        <Button variant="outlined" color="error" disabled={busy} onClick={() => setPending("delete")}>
          Delete tournament
        </Button>
        {inProgress && unresolved > 0 && (
          <Typography variant="body2" color="text.secondary">
            {unresolved} match{unresolved === 1 ? "" : "es"} without result
          </Typography>
        )}
        {tournament.status === "completed" && (
          <Typography variant="body2" color="text.secondary">
            Completed.
          </Typography>
        )}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <ConfirmDialog
        open={pending !== null}
        title={pending ? confirmText[pending].title : ""}
        body={pending ? confirmText[pending].body : ""}
        confirmLabel={pending ? confirmText[pending].label : ""}
        destructive={pending === "delete"}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </Stack>
  );
};

export default ActionBar;
