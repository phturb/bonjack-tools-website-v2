import {
  Stack,
  Typography,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import { CoinMarket } from "../../api/coingecko";

const CoinTracker = (props: { coin: CoinMarket }) => {
  const { coin } = props;
  const change = coin.price_change_percentage_24h;
  const coinDetail = (
    <Stack direction="row" spacing={2} component="span">
      <Typography component="span">Price: {coin.current_price} USD</Typography>
      <Typography component="span">
        24h:{" "}
        <span style={{ color: change !== null && change > 0 ? "green" : "red" }}>
          {change === null ? "n/a" : `${change.toFixed(2)}%`}
        </span>
      </Typography>
    </Stack>
  );

  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar alt={coin.name} src={coin.image} />
      </ListItemAvatar>
      <ListItemText primary={coin.name} secondary={coinDetail} />
    </ListItem>
  );
};

export default CoinTracker;
