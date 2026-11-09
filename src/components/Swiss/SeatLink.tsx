import { Button, Chip, Stack, Tooltip } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import { Participant, Tournament } from "../../interfaces/Swiss";

interface Props {
  tournament: Tournament;
  participant: Participant;
  /** Viewer identity: undefined when not logged in or without a Discord identity. */
  callerPlayerId?: string;
  isOwner: boolean;
  busy?: boolean;
  onClaim?: (participant: Participant) => void;
  onUnclaim?: (participant: Participant) => void;
}

/** Link between a seat and a site user: badge, plus "This is me" / "Unlink" when allowed. */
const SeatLink = (props: Props) => {
  const { tournament, participant, callerPlayerId, isOwner, busy = false, onClaim, onUnclaim } = props;
  const linked = participant.playerId !== null;
  const self = linked && participant.playerId === callerPlayerId;
  const finished = tournament.status === "finished";
  const callerHasSeat =
    callerPlayerId !== undefined && tournament.participants.some((p) => p.playerId === callerPlayerId);
  const canClaim = !finished && !linked && callerPlayerId !== undefined && !callerHasSeat && onClaim;
  const canUnlink = !finished && linked && (isOwner || self) && onUnclaim;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {linked && (
        <Tooltip title={`Discord id ${participant.playerId ?? ""}`}>
          <Chip
            icon={<LinkIcon />}
            label={self ? "you" : (participant.playerName ?? "linked")}
            size="small"
            color={self ? "primary" : "default"}
            variant="outlined"
          />
        </Tooltip>
      )}
      {canClaim && (
        <Button size="small" disabled={busy} onClick={() => onClaim(participant)}>
          This is me
        </Button>
      )}
      {canUnlink && (
        <Button size="small" color="inherit" disabled={busy} onClick={() => onUnclaim(participant)}>
          Unlink
        </Button>
      )}
    </Stack>
  );
};

export default SeatLink;
