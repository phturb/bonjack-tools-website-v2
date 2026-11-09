import { useState } from "react";
import {
  Alert,
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
import {
  PARTICIPANT_WARNING_THRESHOLD,
  Participant,
  ParticipantInput,
} from "../../interfaces/Swiss";
import { parseNames } from "../../helpers/swiss";

interface Row {
  key: string;
  id?: string;
  name: string;
}

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
    .map((p) => ({ key: p.id, id: p.id, name: p.name }));

const ParticipantsEditor = (props: Props) => {
  const { participants, saving = false, error, onSave } = props;
  const [rows, setRows] = useState<Row[]>(() => toRows(participants));
  const [input, setInput] = useState("");

  const addFromInput = () => {
    const names = parseNames(input);
    if (names.length === 0) return;
    const added = names.map((name) => ({ key: `new-${nextLocalKey++}`, name }));
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

  const trimmed = rows.map((r) => r.name.trim());
  const duplicates = new Set(
    trimmed.filter((name, i) => name.length > 0 && trimmed.indexOf(name) !== i)
  );
  const hasEmpty = trimmed.some((name) => name.length === 0);
  const canSave = !saving && !hasEmpty && duplicates.size === 0;

  const save = () =>
    onSave(rows.map((row, i) => ({ id: row.id, name: row.name.trim(), seed: i + 1 })));

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
              sx={{ mr: 14, flexGrow: 1 }}
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
