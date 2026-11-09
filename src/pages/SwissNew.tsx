import { useAuth0 } from "@auth0/auth0-react";
import { useCallerIdentity } from "../helpers/auth";
import { Button, Container, Stack, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createTournament } from "../api/swiss";
import { TournamentInput } from "../interfaces/Swiss";
import { apiErrorMessage } from "../helpers/swiss";
import TournamentForm from "../components/Swiss/TournamentForm";
import { useAccessToken } from "../helpers/auth";
import DevIdentityField from "../components/Swiss/DevIdentityField";

const Title = () => (
  <Typography variant="h4" component="h4" align="center">
    New Swiss Tournament
  </Typography>
);

const SwissNew = () => {
  const { loginWithRedirect } = useAuth0();
  const { isAuthenticated } = useCallerIdentity();
  const getToken = useAccessToken();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (input: TournamentInput) => createTournament(await getToken(), input),
    onSuccess: (tournament) => {
      void navigate(`/swiss/${tournament.id}`);
    },
  });

  if (!isAuthenticated) {
    return (
      <Container>
        <Title />
        <Typography align="center">Log in to create a tournament.</Typography>
        <Button onClick={() => loginWithRedirect({ appState: { returnTo: "/swiss/new" } })}>
          Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Title />
      <Stack alignItems="center">
        <DevIdentityField />
      </Stack>
      <TournamentForm
        submitLabel="Create"
        submitting={mutation.isPending}
        error={mutation.isError ? apiErrorMessage(mutation.error) : null}
        onSubmit={(input) => mutation.mutate(input)}
      />
    </Container>
  );
};

export default SwissNew;
