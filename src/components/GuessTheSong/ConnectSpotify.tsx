import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { startSpotifyLogin } from "../../helpers/spotifyAuth";

const ConnectSpotify = (props: { error?: string }) => {
  const [error, setError] = useState<string | undefined>(props.error);

  const onConnectClick = () => {
    startSpotifyLogin().catch((err: Error) => setError(err.message));
  };

  return (
    <Stack spacing={1}>
      <Typography variant="h4" align="center">
        Connect Spotify
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="outlined" onClick={onConnectClick}>
        Connect
      </Button>
    </Stack>
  );
};

export default ConnectSpotify;
