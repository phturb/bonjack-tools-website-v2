import {
  Button,
  Box,
  Typography,
  Paper,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import Countdown from "react-countdown";
import { AvailablePlayers, Player } from "../../helpers/loisDesNorms";
import PlayerInfo from "./PlayerInfo";

export interface LobbyProperties {
  rollCount: number;
  players: Player[];
  availablePlayers: AvailablePlayers;
  leagueVersion: string;
  canRoll: boolean;
  /** Epoch ms at which the next roll becomes available. */
  nextRollAt: number;
  reset: () => void;
  roll: () => void;
  cancel: () => void;
  onPlayerChange: (event: SelectChangeEvent, index: number) => void;
}

const Lobby = (props: LobbyProperties) => {
  return (
    <Paper sx={{ m: 1 }}>
      <Stack
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{ width: 320, padding: "10px", minHeight: "446px" }}
        spacing={2}
      >
        <Box>
          <Typography component="h5" variant="h5">
            Roll count : {props.rollCount}
          </Typography>
        </Box>
        {props.players.map((player, index) => (
          <PlayerInfo
            key={`player-info-${index}`}
            index={index}
            availablePlayers={props.availablePlayers}
            playerId={player.player.id}
            leagueVersion={props.leagueVersion}
            role={player.role}
            champion={player.champion}
            onChange={props.onPlayerChange}
          />
        ))}

        <Stack direction="row" spacing={2} justifyContent="space-around">
          <Button variant="outlined" onClick={props.cancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={props.reset}>
            Finish
          </Button>

          {props.canRoll ? (
            <Button variant="contained" onClick={props.roll}>
              Roll
            </Button>
          ) : (
            <Box>
              <Countdown date={props.nextRollAt} />
            </Box>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default Lobby;
