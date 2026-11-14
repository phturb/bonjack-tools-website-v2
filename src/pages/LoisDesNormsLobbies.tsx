import { useState } from "react";
import { Alert, Button, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { deleteLobby, listLobbies, LobbySummary } from "../api/loisDesNorms";
import { LOBBIES_QUERY_KEY } from "../helpers/loisDesNorms";
import { apiErrorMessage } from "../helpers/swiss";
import ConfirmDialog from "../components/Swiss/ConfirmDialog";
import LobbyCard from "../components/LoisDesNorms/LobbyCard";
import NewLobbyDialog from "../components/LoisDesNorms/NewLobbyDialog";

const POLL_INTERVAL_MS = 3000;

/** The contract gives no body for these DELETE errors; prefer the server's message when there is one. */
const closeErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ error?: string }>(error) && !error.response?.data?.error) {
    if (error.response?.status === 404) return "That lobby was already closed.";
    if (error.response?.status === 409) return "That lobby can't be closed while a game is in progress.";
  }
  return apiErrorMessage(error);
};

const canClose = (lobby: LobbySummary) => !lobby.isDefault && !lobby.gameInProgress;

/** Lobby list at /lois-des-norms. */
const LoisDesNormsLobbies = () => {
  const [creating, setCreating] = useState(false);
  // Kept after the confirm closes so its text doesn't blank during the fade-out.
  const [closeCandidate, setCloseCandidate] = useState<LobbySummary | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: LOBBIES_QUERY_KEY,
    queryFn: listLobbies,
    refetchInterval: POLL_INTERVAL_MS,
  });
  const remove = useMutation({
    mutationFn: deleteLobby,
    // A 404 or 409 also means the list is stale.
    onSettled: () => queryClient.invalidateQueries({ queryKey: LOBBIES_QUERY_KEY }),
  });

  return (
    <Container>
      <Typography variant="h4" component="h4" align="center">
        Lois Des Norms
      </Typography>
      <Typography align="center" color="text.secondary">
        Pick a lobby, or start a new one for another group.
      </Typography>
      <Stack direction="row" justifyContent="center" sx={{ my: 2 }}>
        <Button variant="contained" onClick={() => setCreating(true)}>
          New lobby
        </Button>
      </Stack>
      <Stack spacing={2} sx={{ maxWidth: 640, mx: "auto" }}>
        {query.isPending && <CircularProgress sx={{ alignSelf: "center" }} />}
        {query.isError && <Alert severity="error">{apiErrorMessage(query.error)}</Alert>}
        {remove.isError && (
          <Alert severity="error" onClose={() => remove.reset()}>
            {closeErrorMessage(remove.error)}
          </Alert>
        )}
        {query.data && query.data.length === 0 && (
          <Typography align="center" color="text.secondary">
            No lobby yet.
          </Typography>
        )}
        {query.data?.map((lobby) => (
          <LobbyCard
            key={lobby.id}
            lobby={lobby}
            onClose={
              canClose(lobby)
                ? () => {
                    setCloseCandidate(lobby);
                    setConfirmOpen(true);
                  }
                : undefined
            }
            closing={remove.isPending && remove.variables === lobby.id}
          />
        ))}
      </Stack>
      <NewLobbyDialog open={creating} onClose={() => setCreating(false)} />
      <ConfirmDialog
        open={confirmOpen}
        title="Close this lobby?"
        body={`"${closeCandidate?.name ?? ""}" will be removed and its seats freed. Anyone viewing it is told it was closed.`}
        confirmLabel="Close lobby"
        destructive
        onConfirm={() => {
          if (closeCandidate) remove.mutate(closeCandidate.id);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Container>
  );
};

export default LoisDesNormsLobbies;
