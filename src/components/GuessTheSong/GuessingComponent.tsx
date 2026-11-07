import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SpotifyWebApi from "spotify-web-api-js";
import { green, red } from "@mui/material/colors";
import GuessedSongs from "./GuessedSongs";
import { PlayedTracks } from "../../interfaces/GuessTheSong/PlayedTracks";

interface GuessingComponentProps {
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  playlistId: string;
  updatePlaylistId: (playlistId: string) => void;
  onUnauthorized?: () => void;
}

type Track = SpotifyApi.PlaylistTrackObject;

/** Seconds of playback allowed at each stage; -1 means unlimited. */
const GUESS_STAGES = [1, 2, 5, 7, 11, 16, -1];
const LAST_STAGE = GUESS_STAGES.length - 1;
const INTERVAL_TIME = 250;

const normalize = (s: string) => s.trim().toLowerCase();

const pickRandom = (tracks: Track[]): [Track | undefined, number] => {
  if (tracks.length === 0) return [undefined, -1];
  const index = Math.floor(Math.random() * tracks.length);
  return [tracks[index], index];
};

const isUnauthorized = (err: unknown) =>
  typeof err === "object" && err !== null && (err as { status?: number }).status === 401;

const GuessingComponent = (props: GuessingComponentProps) => {
  const { spotifyApi, playlistId, onUnauthorized } = props;

  const [currentGuessStage, setCurrentGuessStage] = useState(0);
  const [songWasGuessed, setSongWasGuessed] = useState(false);
  const [currentGuessInput, setCurrentGuessInput] = useState("");
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [playedTracks, setPlayedTracks] = useState<PlayedTracks[]>([]);
  const [notPlayedTracks, setNotPlayedTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | undefined>();
  const [playlistName, setPlaylistName] = useState("");
  const [currentSongTime, setCurrentSongTime] = useState(0);
  const [device, setDevice] = useState<SpotifyApi.UserDevice | undefined>();
  const [availableDevices, setAvailableDevices] = useState<SpotifyApi.UserDevice[]>([]);
  const [guessError, setGuessError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleApiError = useCallback(
    (err: unknown) => {
      console.error(err);
      if (isUnauthorized(err)) onUnauthorized?.();
    },
    [onUnauthorized]
  );

  // The parent keys this component on playlistId, so a new playlist remounts it
  // and every piece of state starts fresh.
  useEffect(() => {
    let cancelled = false;

    const fetchAllTracks = async () => {
      let offset = 0;
      let tracks: Track[] = [];
      let total = Infinity;
      while (offset < total) {
        const page = await spotifyApi.getPlaylistTracks(playlistId, { offset });
        tracks = tracks.concat(page.items.filter((t) => t.track));
        total = page.total;
        offset += page.limit;
      }
      return tracks;
    };

    void (async () => {
      try {
        const playlist = await spotifyApi.getPlaylist(playlistId, {});
        const tracks = await fetchAllTracks();
        const playback = await spotifyApi.getMyCurrentPlaybackState({});
        const devices = await spotifyApi.getMyDevices();
        if (cancelled) return;

        setPlaylistName(playlist.name);
        setPlaylistTracks(tracks);
        const [first, firstIndex] = pickRandom(tracks);
        setCurrentTrack(first);
        setNotPlayedTracks(tracks.filter((_, i) => i !== firstIndex));
        setAvailableDevices(devices.devices);
        setDevice(playback?.device ?? devices.devices.find((d) => d.is_active));
      } catch (err) {
        if (cancelled) return;
        handleApiError(err);
        setLoadError("Could not load the playlist or your Spotify devices.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playlistId, spotifyApi, handleApiError]);

  // On unmount: stop polling and silence Spotify so the song does not keep
  // playing on another page.
  useEffect(() => {
    return () => {
      stopPolling();
      spotifyApi.pause({}).catch(() => undefined);
    };
  }, [stopPolling, spotifyApi]);

  /** Polls playback and pauses once the allowed time for this stage has elapsed. */
  const startStageTimer = (guessStage: number) => {
    stopPolling();
    const limitMs = GUESS_STAGES[guessStage] * 1000;
    if (limitMs < 0) return;

    // Spotify reports is_playing=false for a moment right after play(); only
    // treat "not playing" as the end once playback was actually observed.
    let sawPlaying = false;
    intervalRef.current = setInterval(async () => {
      try {
        const playback = await spotifyApi.getMyCurrentPlaybackState({});
        const progress = playback?.progress_ms ?? 0;
        if (playback?.is_playing) sawPlaying = true;
        setCurrentSongTime(progress);
        if (progress >= limitMs || (sawPlaying && !playback?.is_playing)) {
          stopPolling();
          await spotifyApi.pause({});
          await spotifyApi.seek(0, {});
          setCurrentSongTime(0);
        }
      } catch (err) {
        stopPolling();
        handleApiError(err);
      }
    }, INTERVAL_TIME);
  };

  const playCurrent = (guessStage: number) => {
    if (!currentTrack?.track) {
      setGuessError("No track to play");
      return;
    }
    if (!device?.id) {
      setGuessError("Select a Spotify device first");
      return;
    }
    setGuessError("");
    spotifyApi
      .play({ device_id: device.id, uris: [currentTrack.track.uri], position_ms: 0 })
      .then(() => startStageTimer(guessStage))
      .catch(handleApiError);
  };

  const onPlayClick = () => playCurrent(currentGuessStage);

  const onNextClick = () => {
    const nextStage = Math.min(currentGuessStage + 1, LAST_STAGE);
    setCurrentGuessStage(nextStage);
    playCurrent(nextStage);
  };

  const recordCurrent = (guessed: boolean) => {
    if (!currentTrack) return;
    setPlayedTracks((prev) =>
      prev.some((p) => p.raw.track?.id === currentTrack.track?.id)
        ? prev
        : [...prev, { raw: currentTrack, guessed }]
    );
  };

  const goToNextTrack = () => {
    stopPolling();
    spotifyApi.pause({}).catch(handleApiError);
    setCurrentGuessStage(0);
    setSongWasGuessed(false);
    setCurrentGuessInput("");
    setGuessError("");
    setCurrentSongTime(0);
    const [next, nextIndex] = pickRandom(notPlayedTracks);
    setCurrentTrack(next);
    setNotPlayedTracks(notPlayedTracks.filter((_, i) => i !== nextIndex));
  };

  const onSkipClick = () => {
    recordCurrent(songWasGuessed);
    goToNextTrack();
  };

  const onGuessSubmit = () => {
    const answer = currentTrack?.track?.name;
    if (!answer) return;
    if (normalize(currentGuessInput) === normalize(answer)) {
      setSongWasGuessed(true);
      setGuessError("");
      recordCurrent(true);
    } else {
      setGuessError("Wrong guess");
    }
  };

  const onDeviceChange = (event: SelectChangeEvent) => {
    setDevice(availableDevices.find((d) => d.id === event.target.value));
  };

  if (isLoading) {
    return (
      <Box sx={{ width: "100%" }}>
        <Skeleton variant="text" width="100%" sx={{ fontSize: "1rem" }} animation="wave" />
        <Skeleton variant="circular" width={40} height={40} animation="wave" />
        <Skeleton variant="rectangular" width="100%" height={200} animation="wave" />
      </Box>
    );
  }

  const revealed = songWasGuessed || currentGuessStage >= LAST_STAGE;
  const stageLimit = GUESS_STAGES[currentGuessStage];

  return (
    <Stack spacing={2} alignItems="center" justifyContent="center">
      <Typography variant="h5">{playlistName || "No Playlist"}</Typography>
      {loadError && <Alert severity="error">{loadError}</Alert>}
      <Stack direction="row" spacing={4} alignItems="center" justifyContent="center">
        {GUESS_STAGES.map((stage, i) => {
          if (i < currentGuessStage - 1 || i > currentGuessStage + 1) return null;
          const sx =
            i === currentGuessStage
              ? { bgcolor: green[500] }
              : i < currentGuessStage
                ? { bgcolor: red[500] }
                : undefined;
          return (
            <Avatar key={i} sx={sx}>
              {stage < 0 ? "∞" : `${stage}s`}
            </Avatar>
          );
        })}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button onClick={onPlayClick} disabled={currentSongTime > 0}>
          Play
        </Button>
        <Select
          aria-label="Device"
          displayEmpty
          value={device?.id ?? ""}
          onChange={onDeviceChange}
        >
          <MenuItem value="" disabled>
            Select a device
          </MenuItem>
          {availableDevices
            .filter((d) => d.id)
            .map((d) => (
              <MenuItem key={d.id} value={d.id!}>
                {d.name}
              </MenuItem>
            ))}
        </Select>
      </Stack>
      <Slider
        sx={{ width: 250 }}
        aria-label="song-progress-indicator"
        size="small"
        value={currentSongTime / 1000}
        min={0}
        max={stageLimit < 0 ? (currentTrack?.track?.duration_ms ?? 0) / 1000 : stageLimit}
        disabled
      />
      {revealed ? (
        <>
          <Typography variant="h6" align="center">
            {currentTrack?.track?.name ?? "No Song"}
          </Typography>
          <Button onClick={onSkipClick} disabled={!currentTrack}>
            {notPlayedTracks.length > 0 ? "Next song" : "Finish"}
          </Button>
        </>
      ) : (
        <>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
            <Autocomplete
              fullWidth
              sx={{ width: 230 }}
              value={currentGuessInput}
              inputValue={currentGuessInput}
              onChange={(_: React.SyntheticEvent, newValue: string | null) =>
                setCurrentGuessInput(newValue ?? "")
              }
              onInputChange={(_: React.SyntheticEvent, newValue: string) =>
                setCurrentGuessInput(newValue)
              }
              freeSolo
              options={playlistTracks.map((entry) => entry.track?.name ?? "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  helperText={guessError}
                  error={guessError.length > 0}
                  label="Guess"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onGuessSubmit();
                    }
                  }}
                />
              )}
            />
            <Button variant="outlined" onClick={onGuessSubmit}>
              Guess
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button onClick={onNextClick}>More time</Button>
            <Button onClick={onSkipClick}>Skip</Button>
          </Stack>
        </>
      )}
      <GuessedSongs guessedSongs={playedTracks} />
      <Button onClick={() => props.updatePlaylistId("")}>Reset Playlist</Button>
    </Stack>
  );
};

export default GuessingComponent;
