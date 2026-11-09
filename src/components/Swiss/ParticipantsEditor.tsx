import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQuery } from "@tanstack/react-query";
import {
  PARTICIPANT_WARNING_THRESHOLD,
  Participant,
  ParticipantInput,
  SwissPlayer,
} from "../../interfaces/Swiss";
import { parseNames } from "../../helpers/swiss";
import { listPlayers } from "../../api/swiss";

interface Row {
  key: string;
  id?: string;
  name: string;
  /** Linked site user, null when the seat is free. */
  playerId: string | null;
}

const playerLabel = (p: SwissPlayer) => (p.name ? `${p.name} (${p.id})` : p.id);

interface Props {
  participants: Participant[];
  saving?: boolean;
  error?: string | null;
  onSave: (participants: ParticipantInput[]) => void;
}

// Keys for rows added locally; only incremented inside event handlers.
let nextLocalKey = 1;
const toRows = (participants: Participant[]): Row[] =>
  [...participants]
    .sort((a, b) => a.seed - b.seed)
    .map((p) => ({ key: p.id, id: p.id, name: p.name, playerId: p.playerId }));

const ParticipantsEditor = (props: Props) => {
  const { participants, saving = false, error, onSave } = props;
  const [rows, setRows] = useState<Row[]>(() => toRows(participants));
  const [input, setInput] = useState("");
  const players = useQuery({ queryKey: ["swiss", "players"], queryFn: listPlayers });
  const playerOptions = players.data ?? [];
  const playerById = new Map(playerOptions.map((p) => [p.id, p]));

  const addFromInput = () => {
    const names = parseNames(input);
    if (names.length === 0) return;
    const added = names.map((name) => ({ key: `new-${nextLocalKey++}`, name, playerId: null }));
    setRows((prev) => [...prev, ...added]);
    setInput("");
  };

  const move = (index: number, delta: number) =>
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });

  const rename = (index: number, name: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, name } : row)));

  const remove = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const link = (index: number, playerId: string | null) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, playerId } : row)));

  const trimmed = rows.map((r) => r.name.trim());
  const duplicates = new Set(
    trimmed.filter((name, i) => name.length > 0 && trimmed.indexOf(name) !== i)
  );
  const hasEmpty = trimmed.some((name) => name.length === 0);
  const linkedIds = rows.map((r) => r.playerId).filter((id): id is string => id !== null);
  const doubleLinked = new Set(linkedIds.filter((id, i) => linkedIds.indexOf(id) !== i));
  const canSave = !saving && !hasEmpty && duplicates.size === 0 && doubleLinked.size === 0;

  const save = () =>
    onSave(
      rows.map((row, i) => ({ id: row.id, name: row.name.trim(), seed: i + 1, playerId: row.playerId }))
    );

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h3">
        Participants ({rows.length})
      </Typography>
      <TextField
        label="Add participants"
        placeholder="One name per line, paste a list to add several"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addFromInput();
          }
        }}
        multiline
        minRows={1}
        maxRows={8}
        fullWidth
      />
      <Button onClick={addFromInput} disabled={parseNames(input).length === 0}>
        Add
      </Button>
      {rows.length > PARTICIPANT_WARNING_THRESHOLD && (
        <Alert severity="warning">
          More than {PARTICIPANT_WARNING_THRESHOLD} participants; the bracket will be very large.
        </Alert>
      )}
      {duplicates.size > 0 && (
        <Alert severity="error">Duplicate names: {[...duplicates].join(", ")}</Alert>
      )}
      {doubleLinked.size > 0 && (
        <Alert severity="error">A user can hold only one seat: {[...doubleLinked].join(", ")}</Alert>
      )}
      <Typography variant="body2" color="text.secondary">
        Optionally link a seat to a known user. People not listed can claim their own seat from the
        tournament page once logged in.
      </Typography>
      <List dense>
        {rows.map((row, index) => (
          <ListItem
            key={row.key}
            disableGutters
            secondaryAction={
              <Stack direction="row">
                <IconButton
                  aria-label="move up"
                  size="small"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="move down"
                  size="small"
                  disabled={index === rows.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="remove" size="small" onClick={() => remove(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          >
            <Typography sx={{ width: 40, color: "text.secondary" }}>#{index + 1}</Typography>
            <TextField
              size="small"
              value={row.name}
              onChange={(e) => rename(index, e.target.value)}
              error={row.name.trim().length === 0 || duplicates.has(row.name.trim())}
              sx={{ flexGrow: 1 }}
            />
            <Autocomplete
              size="small"
              sx={{ width: 220, ml: 1, mr: 14 }}
              options={playerOptions}
              getOptionLabel={playerLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={
                row.playerId === null
                  ? null
                  : (playerById.get(row.playerId) ?? { id: row.playerId, name: null })
              }
              onChange={(_, option) => link(index, option?.id ?? null)}
              loading={players.isPending}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="User"
                  error={row.playerId !== null && doubleLinked.has(row.playerId)}
                />
              )}
            />
          </ListItem>
        ))}
      </List>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" onClick={save} disabled={!canSave}>
        {saving ? "Saving…" : "Save participants"}
      </Button>
    </Stack>
  );
};

export default ParticipantsEditor;
