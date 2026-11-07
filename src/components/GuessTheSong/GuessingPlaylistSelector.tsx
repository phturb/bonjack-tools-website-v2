import { useState } from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import SpotifyWebApi from "spotify-web-api-js";

interface GuessingPlaylistSelectorProps {
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  updatePlaylistId: (value: string) => void;
}

/** Accepts a raw playlist id, a spotify:playlist: URI or an open.spotify.com URL. */
const playlistIdParser = (input: string) => {
  const trimmed = input.trim();
  if (trimmed.startsWith("spotify:playlist:")) {
    return trimmed.slice("spotify:playlist:".length);
  }
  if (trimmed.startsWith("http")) {
    const path = trimmed.split("?")[0].split("#")[0];
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  }
  return trimmed;
};

const errorMessage = (err: unknown): string => {
  if (err && typeof err === "object") {
    const e = err as { status?: number; response?: string; message?: string };
    if (e.status === 404) return "Playlist not found";
    if (e.status === 401) return "Spotify session expired, reconnect";
    if (typeof e.response === "string") {
      try {
        const parsed = JSON.parse(e.response) as { error?: { message?: string } };
        if (parsed.error?.message) return parsed.error.message;
      } catch {
        return e.response;
      }
    }
    if (e.message) return e.message;
  }
  return "Could not load playlist";
};

const GuessingPlaylistSelector = (props: GuessingPlaylistSelectorProps) => {
  const [localPlaylistId, setLocalPlaylistId] = useState("");
  const [currentErrorMessage, setCurrentErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = () => {
    setCurrentErrorMessage("");
    const playlistId = playlistIdParser(localPlaylistId);
    if (!playlistId) {
      setCurrentErrorMessage("PlaylistId can't be empty !");
      return;
    }
    setIsLoading(true);
    props.spotifyApi
      .getPlaylist(playlistId, {})
      .then(() => props.updatePlaylistId(playlistId))
      .catch((err: unknown) => setCurrentErrorMessage(errorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  return (
    <Stack
      component="form"
      alignItems="center"
      spacing={1}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Typography variant="subtitle1" align="center">
        Enter the playlist id or URL that you want to use
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          error={currentErrorMessage.length > 0}
          helperText={currentErrorMessage}
          variant="standard"
          label="PlaylistId"
          value={localPlaylistId}
          onChange={(event) => setLocalPlaylistId(event.target.value)}
        />
        <Button type="submit" disabled={isLoading}>
          Submit
        </Button>
      </Stack>
    </Stack>
  );
};

export default GuessingPlaylistSelector;
