import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SpotifyWebApi from "spotify-web-api-js";
import { Box, Button, CircularProgress, Container, Paper, Stack, Typography } from "@mui/material";
import ConnectSpotify from "../components/GuessTheSong/ConnectSpotify";
import GuessingComponent from "../components/GuessTheSong/GuessingComponent";
import GuessingPlaylistSelector from "../components/GuessTheSong/GuessingPlaylistSelector";
import {
  clearSpotifyToken,
  finishSpotifyLogin,
  loadSpotifyToken,
} from "../helpers/spotifyAuth";

const GuessTheSong = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(() => loadSpotifyToken());
  const [exchangeError, setExchangeError] = useState<string | undefined>();
  const [playlistId, setPlaylistId] = useState("");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const spotifyError = searchParams.get("error");
  const exchanging = Boolean(code && state && !token && !exchangeError);
  const authError = spotifyError
    ? `Spotify refused the login: ${spotifyError}`
    : exchangeError;

  useEffect(() => {
    if (!code || !state || token) return undefined;
    let cancelled = false;
    finishSpotifyLogin(code, state)
      .then((accessToken) => {
        if (!cancelled) setToken(accessToken);
      })
      .catch((err: Error) => {
        if (!cancelled) setExchangeError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSearchParams({}, { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [code, state, token, setSearchParams]);

  const spotifyApi = useMemo(() => {
    const api = new SpotifyWebApi();
    if (token) api.setAccessToken(token);
    return api;
  }, [token]);

  const disconnect = () => {
    clearSpotifyToken();
    setToken(null);
    setPlaylistId("");
  };

  let content;
  if (exchanging) {
    content = <CircularProgress />;
  } else if (!token) {
    content = <ConnectSpotify error={authError} />;
  } else if (playlistId) {
    content = (
      <Stack>
        <GuessingComponent
          key={playlistId}
          spotifyApi={spotifyApi}
          playlistId={playlistId}
          updatePlaylistId={setPlaylistId}
          onUnauthorized={disconnect}
        />
      </Stack>
    );
  } else {
    content = (
      <Stack spacing={1}>
        <GuessingPlaylistSelector
          spotifyApi={spotifyApi}
          updatePlaylistId={setPlaylistId}
        />
        <Button size="small" onClick={disconnect}>
          Disconnect Spotify
        </Button>
      </Stack>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h4" align="center">
        Guess the Song
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Paper sx={{ width: 320, padding: 2 }}>{content}</Paper>
      </Box>
    </Container>
  );
};

export default GuessTheSong;
