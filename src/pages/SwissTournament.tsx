import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  closeRound,
  deleteTournament,
  dropParticipant,
  getTournament,
  replaceParticipants,
  setMatchResult,
  startTournament,
  undoRound,
  updateTournament,
} from "../api/swiss";
import {
  Match,
  MatchResultInput,
  PARTICIPANT_WARNING_THRESHOLD,
  Participant,
  ParticipantInput,
  Tournament,
  TournamentInput,
  TournamentStatus,
} from "../interfaces/Swiss";
import { apiErrorMessage, participantMap } from "../helpers/swiss";
import { useCallerIdentity } from "../helpers/auth";
import TournamentForm from "../components/Swiss/TournamentForm";
import ParticipantsEditor from "../components/Swiss/ParticipantsEditor";
import BracketGraph from "../components/Swiss/BracketGraph";
import ResultDialog from "../components/Swiss/ResultDialog";
import StandingsTable from "../components/Swiss/StandingsTable";
import ActionBar from "../components/Swiss/ActionBar";
import ConfirmDialog from "../components/Swiss/ConfirmDialog";
import { useSwissMutation } from "../components/Swiss/useSwissMutation";
import DevIdentityField from "../components/Swiss/DevIdentityField";

const POLL_INTERVAL_MS = 5000;

const statusLabel: Record<TournamentStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  completed: "Completed",
};

const Title = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="h4" component="h4" align="center">
    {children}
  </Typography>
);

const errorOf = (mutation: { isError: boolean; error: unknown }) =>
  mutation.isError ? apiErrorMessage(mutation.error) : null;

const ShareButton = () => {
  const [message, setMessage] = useState<string | null>(null);
  const share = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => setMessage("Link copied"))
      .catch(() => setMessage("Could not copy, copy the address bar instead"));
  };
  return (
    <>
      <Button startIcon={<ShareIcon />} onClick={share}>
        Share
      </Button>
      <Snackbar
        open={message !== null}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        message={message}
      />
    </>
  );
};

const Header = ({ tournament }: { tournament: Tournament }) => (
  <Stack spacing={1} alignItems="center" sx={{ mb: 2 }}>
    <Title>{tournament.name}</Title>
    {tournament.description && (
      <Typography align="center" color="text.secondary">
        {tournament.description}
      </Typography>
    )}
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip label={statusLabel[tournament.status]} size="small" />
      <Chip
        label={`bo${tournament.config.bestOf} · ${tournament.config.winsToAdvance}W / ${tournament.config.lossesToEliminate}L`}
        size="small"
        variant="outlined"
      />
      {tournament.config.visibility === "unlisted" && (
        <Chip label="unlisted" size="small" variant="outlined" />
      )}
      <ShareButton />
    </Stack>
    <DevIdentityField />
  </Stack>
);

/** Draft tournament: config form, participants editor and the Start button (creator), or a read-only summary. */
const DraftView = ({ tournament, isOwner }: { tournament: Tournament; isOwner: boolean }) => {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<"start" | "delete" | null>(null);

  const update = useSwissMutation(tournament.id, (token, input: TournamentInput) =>
    updateTournament(tournament.id, token, input)
  );
  const participants = useSwissMutation(tournament.id, (token, list: ParticipantInput[]) =>
    replaceParticipants(tournament.id, token, list)
  );
  const start = useSwissMutation(tournament.id, (token) => startTournament(tournament.id, token));
  const remove = useSwissMutation(
    tournament.id,
    (token) => deleteTournament(tournament.id, token),
    () => void navigate("/swiss")
  );

  const sorted = [...tournament.participants].sort((a, b) => a.seed - b.seed);

  if (!isOwner) {
    return (
      <Container maxWidth="md">
        <Header tournament={tournament} />
        <Alert severity="info">This tournament has not started yet.</Alert>
        <Typography variant="h6" component="h3" sx={{ mt: 2 }}>
          Participants ({sorted.length})
        </Typography>
        <List dense>
          {sorted.map((p) => (
            <ListItem key={p.id} disableGutters>
              <ListItemText primary={`(${p.seed}) ${p.name}`} />
            </ListItem>
          ))}
        </List>
      </Container>
    );
  }

  const canStart = tournament.participants.length >= 2 && !start.isPending;
  const busy = update.isPending || participants.isPending || start.isPending || remove.isPending;

  return (
    <Container maxWidth="md">
      <Header tournament={tournament} />
      <Stack spacing={3}>
        <TournamentForm
          initial={{
            name: tournament.name,
            description: tournament.description,
            ...tournament.config,
          }}
          submitLabel="Save configuration"
          submitting={update.isPending}
          error={errorOf(update)}
          onSubmit={(input) => update.mutate(input)}
        />
        {update.isSuccess && !update.isPending && (
          <Alert severity="success">Configuration saved</Alert>
        )}
        <Divider />
        <ParticipantsEditor
          key={tournament.participants.map((p) => p.id).join(",")}
          participants={tournament.participants}
          saving={participants.isPending}
          error={errorOf(participants)}
          onSave={(list) => participants.mutate(list)}
        />
        {participants.isSuccess && !participants.isPending && (
          <Alert severity="success">Participants saved</Alert>
        )}
        <Divider />
        {tournament.participants.length > PARTICIPANT_WARNING_THRESHOLD && (
          <Alert severity="warning">
            More than {PARTICIPANT_WARNING_THRESHOLD} participants; the bracket will be very large.
          </Alert>
        )}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={!canStart || busy} onClick={() => setConfirm("start")}>
            Start tournament
          </Button>
          <Button variant="outlined" color="error" disabled={busy} onClick={() => setConfirm("delete")}>
            Delete tournament
          </Button>
        </Stack>
        {tournament.participants.length < 2 && (
          <Typography variant="body2" color="text.secondary">
            Save at least two participants to start.
          </Typography>
        )}
        {errorOf(start) && <Alert severity="error">{errorOf(start)}</Alert>}
        {errorOf(remove) && <Alert severity="error">{errorOf(remove)}</Alert>}
      </Stack>
      <ConfirmDialog
        open={confirm === "start"}
        title="Start tournament?"
        body="Seeding is applied, round 1 is generated and the configuration is frozen (except name and description)."
        confirmLabel="Start"
        onConfirm={() => {
          setConfirm(null);
          start.mutate();
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete tournament?"
        body="This removes the tournament and its participants. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirm(null);
          remove.mutate();
        }}
        onCancel={() => setConfirm(null)}
      />
    </Container>
  );
};

/** In-progress or completed tournament: bracket graph, standings and creator actions. */
const LiveView = ({ tournament, isOwner }: { tournament: Tournament; isOwner: boolean }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Match | null>(null);
  const [dropCandidate, setDropCandidate] = useState<Participant | null>(null);

  const result = useSwissMutation(
    tournament.id,
    (token, vars: { matchId: string; result: MatchResultInput }) =>
      setMatchResult(tournament.id, token, vars.matchId, vars.result),
    () => setSelected(null)
  );
  const close = useSwissMutation(tournament.id, (token) => closeRound(tournament.id, token));
  const undo = useSwissMutation(tournament.id, (token) => undoRound(tournament.id, token));
  const drop = useSwissMutation(tournament.id, (token, participantId: string) =>
    dropParticipant(tournament.id, token, participantId)
  );
  const remove = useSwissMutation(
    tournament.id,
    (token) => deleteTournament(tournament.id, token),
    () => void navigate("/swiss")
  );

  const canEdit = isOwner && tournament.status === "in_progress";
  const busy = close.isPending || undo.isPending || drop.isPending || remove.isPending;
  const actionError = errorOf(close) ?? errorOf(undo) ?? errorOf(drop) ?? errorOf(remove);

  return (
    <Container maxWidth={false}>
      <Header tournament={tournament} />
      <BracketGraph
        tournament={tournament}
        onSelectMatch={canEdit ? (match) => setSelected(match) : undefined}
      />
      <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
        Standings
      </Typography>
      <StandingsTable
        tournament={tournament}
        onDrop={canEdit ? (p) => setDropCandidate(p) : undefined}
        dropping={drop.isPending}
      />
      {isOwner && (
        <Stack sx={{ mt: 2 }}>
          <ActionBar
            tournament={tournament}
            busy={busy}
            error={actionError}
            onCloseRound={() => close.mutate()}
            onUndoRound={() => undo.mutate()}
            onDelete={() => remove.mutate()}
          />
        </Stack>
      )}
      <ResultDialog
        match={selected}
        participants={participantMap(tournament)}
        saving={result.isPending}
        error={errorOf(result)}
        onSubmit={(match, scores) => result.mutate({ matchId: match.id, result: scores })}
        onClose={() => setSelected(null)}
      />
      <ConfirmDialog
        open={dropCandidate !== null}
        title={`Drop ${dropCandidate?.name ?? ""}?`}
        body="The participant plays no more matches. Their unplayed current match becomes a forfeit win for the opponent."
        confirmLabel="Drop"
        destructive
        onConfirm={() => {
          if (dropCandidate) drop.mutate(dropCandidate.id);
          setDropCandidate(null);
        }}
        onCancel={() => setDropCandidate(null)}
      />
    </Container>
  );
};

const SwissTournament = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { sub } = useCallerIdentity();

  const query = useQuery({
    queryKey: ["swiss", id],
    queryFn: () => getTournament(id),
    enabled: id.length > 0,
    // Poll only while the tournament is in progress (spec section 7).
    refetchInterval: (q) =>
      q.state.data?.status === "in_progress" ? POLL_INTERVAL_MS : false,
  });

  if (query.isPending) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (query.isError) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined;
    return (
      <Container>
        <Title>Swiss Tournament</Title>
        <Alert severity={status === 404 ? "warning" : "error"}>
          {status === 404 ? `No tournament found with id ${id}` : apiErrorMessage(query.error)}
        </Alert>
      </Container>
    );
  }

  const tournament = query.data;
  // The backend does not send isOwner; the caller's Auth0 sub is compared to the stored owner.
  const isOwner = sub !== undefined && tournament.ownerSub === sub;

  return tournament.status === "draft" ? (
    <DraftView tournament={tournament} isOwner={isOwner} />
  ) : (
    <LiveView tournament={tournament} isOwner={isOwner} />
  );
};

export default SwissTournament;
