import { List, ListItem, ListItemText, Paper, Typography } from "@mui/material";
import { Participant, Tournament } from "../../interfaces/Swiss";
import { COLUMN_WIDTH, roundReached } from "../../helpers/swiss";

interface Props {
  tournament: Tournament;
}

const Panel = (props: { title: string; entries: Participant[]; tournament: Tournament }) => (
  <Paper
    variant="outlined"
    sx={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, flexShrink: 0, p: 1.5 }}
  >
    <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
      {props.title} ({props.entries.length})
    </Typography>
    {props.entries.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        Nobody yet
      </Typography>
    ) : (
      <List dense disablePadding>
        {props.entries.map((p) => (
          <ListItem key={p.id} disableGutters>
            <ListItemText
              primary={`(${p.seed}) ${p.name}`}
              secondary={`${p.wins}-${p.losses} · round ${roundReached(props.tournament, p.id)}`}
            />
          </ListItem>
        ))}
      </List>
    )}
  </Paper>
);

/** Participants ordered by the round they finished in, then by standings. */
const ordered = (tournament: Tournament, status: Participant["status"]): Participant[] => {
  const rank = new Map(tournament.standings.map((id, i) => [id, i]));
  return tournament.participants
    .filter((p) => p.status === status)
    .sort(
      (a, b) =>
        roundReached(tournament, a.id) - roundReached(tournament, b.id) ||
        (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)
    );
};

const OutcomePanels = ({ tournament }: Props) => (
  <>
    <Panel title="Advanced" entries={ordered(tournament, "advanced")} tournament={tournament} />
    <Panel
      title="Eliminated"
      entries={[...ordered(tournament, "eliminated"), ...ordered(tournament, "dropped")]}
      tournament={tournament}
    />
  </>
);

export default OutcomePanels;
