import { useCallerIdentity } from "../helpers/auth";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { listTournaments } from "../api/swiss";
import { TournamentStatus } from "../interfaces/Swiss";
import { apiErrorMessage } from "../helpers/swiss";
import DevIdentityField from "../components/Swiss/DevIdentityField";

const statusLabel: Record<TournamentStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  completed: "Swiss done",
  playoffs: "Playoffs",
  finished: "Finished",
};

const SwissList = () => {
  const { isAuthenticated } = useCallerIdentity();
  const query = useQuery({ queryKey: ["swiss"], queryFn: listTournaments });

  return (
    <Container>
      <Typography variant="h4" component="h4" align="center">
        Swiss Tournaments
      </Typography>
      <Stack alignItems="center">
        <DevIdentityField />
      </Stack>
      <Stack direction="row" justifyContent="center" sx={{ my: 2 }}>
        {isAuthenticated ? (
          <Button variant="contained" component={RouterLink} to="/swiss/new">
            New tournament
          </Button>
        ) : (
          <Typography color="text.secondary">Log in to create a tournament.</Typography>
        )}
      </Stack>
      {query.isPending && <CircularProgress />}
      {query.isError && <Alert severity="error">{apiErrorMessage(query.error)}</Alert>}
      {query.data && query.data.length === 0 && (
        <Typography align="center" color="text.secondary">
          No public tournament yet.
        </Typography>
      )}
      {query.data && query.data.length > 0 && (
        <List>
          {query.data.map((t) => (
            <ListItemButton key={t.id} component={RouterLink} to={`/swiss/${t.id}`}>
              <ListItemText
                primary={t.name}
                secondary={`${t.participants} participant${t.participants === 1 ? "" : "s"} · created ${new Date(t.createdAt).toLocaleDateString()}`}
              />
              <Chip label={statusLabel[t.status]} size="small" />
            </ListItemButton>
          ))}
        </List>
      )}
    </Container>
  );
};

export default SwissList;
