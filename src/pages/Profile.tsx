import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { extractDiscordFromUser } from "../helpers/discordHelper";
import { winRate } from "../helpers/loisDesNorms";
import {
  getPlayerChampions,
  getPlayerStats,
  updatePlayerChampions,
} from "../api/players";
import { AUTH0_AUDIENCE } from "../config/config";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 150 },
  { field: "name", headerName: "Name", width: 150 },
  {
    field: "img",
    headerName: "Image",
    renderCell: (params: GridRenderCellParams<{ img: string }, string>) => (
      <Avatar alt="Champion Icon" src={params.value} />
    ),
  },
];

const Title = () => (
  <Typography variant="h4" component="h4" align="center">
    Profile
  </Typography>
);

const ChampionsGrid = (props: { discordId: string; isLoggedInUser: boolean }) => {
  const { discordId, isLoggedInUser } = props;
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<GridRowSelectionModel | null>(null);

  const championsQuery = useQuery({
    queryKey: ["player-champions", discordId],
    queryFn: () => getPlayerChampions(discordId),
  });

  const champions = championsQuery.data ?? [];
  const ownedSelection: GridRowSelectionModel = {
    type: "include",
    ids: new Set<GridRowId>(champions.filter((c) => c.owned).map((c) => c.id)),
  };
  const rowSelectionModel = selection ?? ownedSelection;

  const selectedCount = champions.filter((c) => rowSelectionModel.ids.has(c.id)).length;

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH0_AUDIENCE },
      });
      const payload = champions.map((c) => ({
        id: c.id,
        owned: rowSelectionModel.ids.has(c.id),
      }));
      await updatePlayerChampions(discordId, token, payload);
    },
    onSuccess: () => {
      setSelection(null);
      queryClient.invalidateQueries({ queryKey: ["player-champions", discordId] });
    },
  });

  if (championsQuery.isPending) return <CircularProgress />;
  if (championsQuery.isError) {
    return <Alert severity="error">{championsQuery.error.message}</Alert>;
  }

  return (
    <>
      {isLoggedInUser && (
        <>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || selectedCount === 0}
          >
            {mutation.isPending ? "Saving…" : "Update Champions"}
          </Button>
          {selectedCount === 0 && (
            <Alert severity="warning">
              Select at least one champion. An empty selection means every champion
              can be rolled.
            </Alert>
          )}
        </>
      )}
      {mutation.isError && (
        <Alert severity="error">{mutation.error.message}</Alert>
      )}
      {mutation.isSuccess && <Alert severity="success">Champions updated</Alert>}
      <DataGrid
        rows={champions}
        columns={columns}
        disableRowSelectionOnClick
        checkboxSelection={isLoggedInUser}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={setSelection}
      />
    </>
  );
};

const ProfileContent = (props: {
  userName: string;
  discordId: string;
  isLoggedInUser: boolean;
}) => {
  const statsQuery = useQuery({
    queryKey: ["player-stats", props.discordId],
    queryFn: () => getPlayerStats(props.discordId),
  });
  const stats = statsQuery.data?.stats;

  if (statsQuery.isError) {
    const status = isAxiosError(statsQuery.error) ? statsQuery.error.response?.status : undefined;
    return (
      <Container>
        <Title />
        <Alert severity={status === 404 ? "warning" : "error"}>
          {status === 404
            ? `No player found with id ${props.discordId}`
            : statsQuery.error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Title />
      <Typography variant="body1" component="p" align="center">
        User: {statsQuery.data?.name || props.userName}
      </Typography>
      <Typography variant="subtitle2" component="h6" align="center">
        Games Played : {stats?.numberOfGame ?? "…"}
      </Typography>
      <Typography variant="subtitle2" component="h6" align="center">
        Number of Rerolls : {stats?.totalRoll ?? "…"}
      </Typography>
      <Typography variant="subtitle2" component="h6" align="center">
        Win Rate : {stats ? `${winRate(stats).toFixed(1)}%` : "…"}
      </Typography>
      <ChampionsGrid discordId={props.discordId} isLoggedInUser={props.isLoggedInUser} />
    </Container>
  );
};

const Profile = () => {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const [searchParams] = useSearchParams();
  const { isDiscordUser, discordId: ownDiscordId } = extractDiscordFromUser(user);
  const requestedId = searchParams.get("id");

  if (!requestedId && !isAuthenticated) {
    return (
      <Container>
        <Title />
        <Typography align="center">Log in to see your profile.</Typography>
        <Button onClick={() => loginWithRedirect({ appState: { returnTo: "/profile" } })}>
          Login
        </Button>
      </Container>
    );
  }

  if (!requestedId && !isDiscordUser) {
    return (
      <Container>
        <Title />
        <Typography>
          Profile features are currently only supported for discord login
        </Typography>
      </Container>
    );
  }

  const discordId = requestedId ?? ownDiscordId ?? "";
  const isLoggedInUser = discordId === ownDiscordId;
  const userName = isLoggedInUser ? (user?.nickname ?? discordId) : discordId;

  return (
    <ProfileContent
      key={discordId}
      userName={userName}
      discordId={discordId}
      isLoggedInUser={isLoggedInUser}
    />
  );
};

export default Profile;
