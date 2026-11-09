import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Participant, ParticipantStatus, Tournament } from "../../interfaces/Swiss";
import { participantMap } from "../../helpers/swiss";

interface Props {
  tournament: Tournament;
  /** Creator only, while in progress: drop an active participant. */
  onDrop?: (participant: Participant) => void;
  dropping?: boolean;
}

const statusColor: Record<ParticipantStatus, "default" | "success" | "error" | "warning"> = {
  active: "default",
  advanced: "success",
  eliminated: "error",
  dropped: "warning",
};

const StandingsTable = ({ tournament, onDrop, dropping = false }: Props) => {
  const byId = participantMap(tournament);
  const ordered = tournament.standings
    .map((id) => byId.get(id))
    .filter((p): p is Participant => p !== undefined);
  // Participants missing from standings (should not happen) go last.
  const listed = new Set(tournament.standings);
  const rest = tournament.participants.filter((p) => !listed.has(p.id));
  const rows = [...ordered, ...rest];

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="standings">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Seed</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">W-L</TableCell>
            <TableCell align="right">Buchholz</TableCell>
            <TableCell>Status</TableCell>
            {onDrop && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((p, i) => (
            <TableRow key={p.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{p.seed}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell align="right">
                {p.wins}-{p.losses}
              </TableCell>
              <TableCell align="right">{p.buchholz}</TableCell>
              <TableCell>
                <Chip label={p.status} size="small" color={statusColor[p.status]} />
              </TableCell>
              {onDrop && (
                <TableCell align="right">
                  {p.status === "active" && (
                    <Button size="small" color="warning" disabled={dropping} onClick={() => onDrop(p)}>
                      Drop
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StandingsTable;
