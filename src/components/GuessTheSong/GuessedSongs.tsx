import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { PlayedTracks } from "../../interfaces/GuessTheSong/PlayedTracks";

interface GuessedSongsProps {
  guessedSongs: PlayedTracks[];
}

const SongList = (props: { tracks: PlayedTracks[] }) => (
  <List>
    {props.tracks.map((played) => (
      <ListItem key={played.raw.track?.id ?? played.raw.track?.name}>
        <ListItemText primary={played.raw.track?.name} />
      </ListItem>
    ))}
  </List>
);

const GuessedSongs = (props: GuessedSongsProps) => {
  const guessed = props.guessedSongs.filter((s) => s.guessed);
  const failed = props.guessedSongs.filter((s) => !s.guessed);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" align="center">
          Song Guess Results
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Stack direction="row" spacing={1}>
          <CheckCircleIcon color="success" />
          <Typography variant="subtitle1" align="center">
            Guessed
          </Typography>
        </Stack>
        <SongList tracks={guessed} />
      </Grid>
      <Grid item xs={6}>
        <Stack direction="row" spacing={1}>
          <CancelIcon color="error" />
          <Typography variant="subtitle1" align="center">
            Failed
          </Typography>
        </Stack>
        <SongList tracks={failed} />
      </Grid>
    </Grid>
  );
};

export default GuessedSongs;
