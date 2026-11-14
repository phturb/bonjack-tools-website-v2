import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { deleteLobby, listLobbies, LobbySummary } from "../api/loisDesNorms";
import { LOBBIES_QUERY_KEY } from "../helpers/loisDesNorms";
import { apiErrorMessage } from "../helpers/swiss";
import ConfirmDialog from "../components/Swiss/ConfirmDialog";
import ClientScene from "../components/LoisDesNorms/ClientScene";
import LobbyCard, { LobbyTableHead } from "../components/LoisDesNorms/LobbyCard";
import NewLobbyDialog from "../components/LoisDesNorms/NewLobbyDialog";
import { bevel, caps, colors, fonts, goldFrame } from "../components/LoisDesNorms/tokens";
import { PLAYER_STATS_KEY } from "../components/LoisDesNorms/playerStats";

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

const ROWS = [0, 1, 2];

/** Placeholder rows with the same height as real ones. */
const RowsSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading lobbies">
    {ROWS.map((i) => (
      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.5, borderBottom: `1px solid ${colors.rule}` }}>
        <Skeleton variant="text" width="22%" sx={{ fontSize: "1rem" }} />
        <Skeleton variant="circular" width={30} height={30} />
        <Skeleton variant="circular" width={30} height={30} />
        <Skeleton variant="text" width="20%" />
        <Box sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" width={96} height={32} />
      </Box>
    ))}
  </Box>
);

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
  const count = query.data?.length;

  // When a polled table's game ends, its players' stats have changed: refetch them.
  const wasInGame = useRef(new Map<string, boolean>());
  useEffect(() => {
    if (!query.data) return;
    const before = wasInGame.current;
    const ended = query.data.some((lobby) => before.get(lobby.id) === true && !lobby.gameInProgress);
    wasInGame.current = new Map(query.data.map((lobby) => [lobby.id, lobby.gameInProgress]));
    if (ended) void queryClient.invalidateQueries({ queryKey: PLAYER_STATS_KEY });
  }, [query.data, queryClient]);

  return (
    <ClientScene>
      <Box
        component="header"
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 2.5 }}
      >
        <Box>
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, color: colors.cream }}>
            Lois des Norms
          </Typography>
          <Typography sx={{ fontFamily: fonts.mono, fontSize: "0.8125rem", color: colors.muted, mt: 0.75, letterSpacing: "0.04em" }}>
            {count === undefined ? "CUSTOM LOBBIES" : `CUSTOM LOBBIES · ${count} OPEN`}
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddRounded />} onClick={() => setCreating(true)} sx={{ height: 48 }}>
          Create lobby
        </Button>
      </Box>

      <Box sx={{ display: "grid", gap: 2, mb: query.isError || remove.isError ? 2.5 : 0 }}>
        {query.isError && <Alert severity="error">Could not load the lobbies: {apiErrorMessage(query.error)}</Alert>}
        {remove.isError && (
          <Alert severity="error" onClose={() => remove.reset()}>
            {closeErrorMessage(remove.error)}
          </Alert>
        )}
      </Box>

      {/* The custom-games browser: one framed table, gold rules between rows. */}
      <Box component="section" aria-label="Lobbies" sx={{ ...goldFrame, boxShadow: bevel, backgroundColor: "rgba(10, 20, 40, 0.85)" }}>
        <LobbyTableHead />
        {query.isPending && <RowsSkeleton />}
        {query.data && query.data.length === 0 && (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography sx={{ ...caps, fontWeight: 700, color: colors.goldText }}>No lobby is open</Typography>
            <Typography sx={{ color: colors.muted, mt: 1 }}>Create one, then seat the group.</Typography>
          </Box>
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
      </Box>

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
    </ClientScene>
  );
};

export default LoisDesNormsLobbies;
