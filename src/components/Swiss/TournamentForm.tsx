import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  BestOf,
  DEFAULT_CONFIG,
  TournamentConfig,
  TournamentInput,
} from "../../interfaces/Swiss";

export interface TournamentFormValues extends TournamentConfig {
  name: string;
  description: string;
}

interface Props {
  initial?: Partial<TournamentFormValues>;
  /** After start only name and description are editable. */
  configLocked?: boolean;
  submitting?: boolean;
  submitLabel: string;
  error?: string | null;
  onSubmit: (input: TournamentInput) => void;
}

const BEST_OF: BestOf[] = [1, 3, 5];
const ONE_TO_FIVE = [1, 2, 3, 4, 5];

const TournamentForm = (props: Props) => {
  const { initial, configLocked = false, submitting = false, submitLabel, error, onSubmit } = props;
  const [values, setValues] = useState<TournamentFormValues>({
    name: "",
    description: "",
    ...DEFAULT_CONFIG,
    ...initial,
  });
  // decidersBestOf follows bestOf until the user picks it explicitly.
  const [decidersTouched, setDecidersTouched] = useState(
    initial?.decidersBestOf !== undefined && initial.decidersBestOf !== initial.bestOf
  );

  const update = <K extends keyof TournamentFormValues>(key: K, value: TournamentFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const nameError =
    values.name.trim().length === 0
      ? "Name is required"
      : values.name.length > 80
        ? "At most 80 characters"
        : null;
  const descriptionError = values.description.length > 500 ? "At most 500 characters" : null;
  const maxRounds = values.winsToAdvance + values.lossesToEliminate - 1;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (nameError || descriptionError) return;
    const { name, description, ...config } = values;
    onSubmit(
      configLocked
        ? { name: name.trim(), description }
        : { name: name.trim(), description, ...config }
    );
  };

  return (
    <form onSubmit={submit} noValidate>
      <Stack spacing={2}>
        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          error={nameError !== null && values.name.length > 0}
          helperText={nameError ?? `${values.name.length}/80`}
          required
          fullWidth
        />
        <TextField
          label="Description"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          error={descriptionError !== null}
          helperText={descriptionError ?? `${values.description.length}/500`}
          multiline
          minRows={2}
          fullWidth
        />
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth disabled={configLocked}>
              <InputLabel id="swiss-wins">Wins to advance</InputLabel>
              <Select
                labelId="swiss-wins"
                label="Wins to advance"
                value={values.winsToAdvance}
                onChange={(e) => update("winsToAdvance", e.target.value)}
              >
                {ONE_TO_FIVE.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth disabled={configLocked}>
              <InputLabel id="swiss-losses">Losses to eliminate</InputLabel>
              <Select
                labelId="swiss-losses"
                label="Losses to eliminate"
                value={values.lossesToEliminate}
                onChange={(e) => update("lossesToEliminate", e.target.value)}
              >
                {ONE_TO_FIVE.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth disabled={configLocked}>
              <InputLabel id="swiss-bestof">Best of</InputLabel>
              <Select
                labelId="swiss-bestof"
                label="Best of"
                value={values.bestOf}
                onChange={(e) => {
                  const bestOf = e.target.value;
                  setValues((prev) => ({
                    ...prev,
                    bestOf,
                    decidersBestOf: decidersTouched ? prev.decidersBestOf : bestOf,
                  }));
                }}
              >
                {BEST_OF.map((n) => (
                  <MenuItem key={n} value={n}>
                    Bo{n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth disabled={configLocked}>
              <InputLabel id="swiss-deciders">Deciders best of</InputLabel>
              <Select
                labelId="swiss-deciders"
                label="Deciders best of"
                value={values.decidersBestOf}
                onChange={(e) => {
                  setDecidersTouched(true);
                  update("decidersBestOf", e.target.value);
                }}
              >
                {BEST_OF.map((n) => (
                  <MenuItem key={n} value={n}>
                    Bo{n}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Matches where someone advances or is eliminated</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth disabled={configLocked}>
              <InputLabel id="swiss-seeding">Seeding</InputLabel>
              <Select
                labelId="swiss-seeding"
                label="Seeding"
                value={values.seeding}
                onChange={(e) => update("seeding", e.target.value)}
              >
                <MenuItem value="manual">Manual (participant order)</MenuItem>
                <MenuItem value="random">Random at start</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth disabled={configLocked}>
              <InputLabel id="swiss-visibility">Visibility</InputLabel>
              <Select
                labelId="swiss-visibility"
                label="Visibility"
                value={values.visibility}
                onChange={(e) => update("visibility", e.target.value)}
              >
                <MenuItem value="public">Public (listed)</MenuItem>
                <MenuItem value="unlisted">Unlisted (link only)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.allowRematches}
                  disabled={configLocked}
                  onChange={(e) => update("allowRematches", e.target.checked)}
                />
              }
              label="Allow rematches"
            />
          </Grid>
        </Grid>
        <FormHelperText>
          Up to {maxRounds} round{maxRounds === 1 ? "" : "s"}
          {configLocked ? " · configuration is frozen after start" : ""}
        </FormHelperText>
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || nameError !== null || descriptionError !== null}
        >
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </Stack>
    </form>
  );
};

export default TournamentForm;
