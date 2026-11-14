import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { LobbySummary } from "../../api/loisDesNorms";
import { lobbyPath, SEAT_COUNT } from "../../helpers/loisDesNorms";

interface Props {
  lobby: LobbySummary;
  /** Set only when the lobby can be closed: not main, no game in progress. */
  onClose?: () => void;
  closing?: boolean;
}

/** One row of the lobby list: name, status, seated players, viewers, Open and Close. */
const LobbyCard = ({ lobby, onClose, closing }: Props) => {
  // A Go nil slice arrives as null: treat it as no one seated.
  const seated = (lobby.players ?? []).map((p) => p.name || p.id);
  const viewers = `${lobby.viewers} viewer${lobby.viewers === 1 ? "" : "s"}`;

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Typography variant="h6" component="h2" sx={{ overflowWrap: "anywhere" }}>
            {lobby.name}
          </Typography>
          <Chip
            size="small"
            color={lobby.gameInProgress ? "success" : "default"}
            label={lobby.gameInProgress ? `In game · roll ${lobby.rollCount}` : "Waiting"}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {seated.length > 0
            ? `Seated (${seated.length}/${SEAT_COUNT}): ${seated.join(", ")}`
            : "No one seated"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {viewers}
        </Typography>
      </CardContent>
      <CardActions>
        <Button variant="contained" size="small" component={RouterLink} to={lobbyPath(lobby.id)}>
          Open
        </Button>
        {onClose && (
          <Button
            color="error"
            size="small"
            onClick={onClose}
            disabled={closing}
            aria-label={`Close ${lobby.name}`}
          >
            Close
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default LobbyCard;
