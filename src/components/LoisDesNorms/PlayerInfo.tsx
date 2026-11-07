import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  SelectChangeEvent,
  Avatar,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import topThumb from "../../img/Position_TOP.png";
import adcThumb from "../../img/Position_ADC.png";
import supportThumb from "../../img/Position_SUPPORT.png";
import midThumb from "../../img/Position_MID.png";
import jungleThumb from "../../img/Position_JUNGLE.png";
import {
  AvailablePlayers,
  Champion,
  LeagueOfLegendsRole,
} from "../../helpers/loisDesNorms";

export interface PlayerInfoProperties {
  index: number;
  availablePlayers: AvailablePlayers;
  playerId: string;
  leagueVersion: string;
  onChange: (event: SelectChangeEvent<string>, index: number) => void;
  role?: LeagueOfLegendsRole;
  champion?: Champion;
}

const ROLE_IMAGES: Record<LeagueOfLegendsRole, string> = {
  TOP: topThumb,
  ADC: adcThumb,
  SUPPORT: supportThumb,
  MID: midThumb,
  JUNGLE: jungleThumb,
};

const PlayerInfo = (props: PlayerInfoProperties) => {
  const { index, playerId, role, champion, availablePlayers, onChange } = props;
  const label = `Player ${index + 1}`;
  const labelId = `player-${index + 1}-select-label`;

  return (
    <Grid container direction="row" justifyContent="space-between" alignItems="center">
      <Grid item xs={8}>
        <FormControl fullWidth>
          <InputLabel id={labelId}>{label}</InputLabel>
          <Select
            labelId={labelId}
            id={`player-${index + 1}-select`}
            value={playerId}
            label={label}
            onChange={(evt) => onChange(evt, index)}
          >
            {Object.entries(availablePlayers).map(([id, player]) => (
              <MenuItem key={id || "none"} value={id}>
                {player.name ?? "—"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs="auto">
        <Stack>
          {role && (
            <Chip
              sx={{ width: "105px" }}
              label={role}
              avatar={<Avatar alt={role} src={ROLE_IMAGES[role]} />}
              variant="outlined"
            />
          )}
          {champion && (
            <Chip
              sx={{ width: "105px" }}
              label={champion.name}
              avatar={
                <Avatar
                  alt={champion.name}
                  src={`https://ddragon.leagueoflegends.com/cdn/${props.leagueVersion}/img/champion/${champion.img}`}
                />
              }
              variant="outlined"
            />
          )}
        </Stack>
      </Grid>
    </Grid>
  );
};

export default PlayerInfo;
