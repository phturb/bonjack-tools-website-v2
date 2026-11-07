import { Fragment } from "react";
import {
  Container,
  Divider,
  List,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CoinTracker from "../components/CryptoTracker/CoinTracker";
import { getCoinMarkets } from "../api/coingecko";

const cryptoIds = [
  "bitcoin",
  "ethereum",
  "crypto-com-chain",
  "iota",
  "elrond-erd-2",
  "terra-luna",
  "cardano",
  "solana",
  "kucoin-shares",
  "matic-network",
  "binancecoin",
];

const CryptoTracker = () => {
  const cryptos = useQuery({
    queryKey: ["cryptos", cryptoIds],
    queryFn: () => getCoinMarkets(cryptoIds),
    refetchInterval: 120_000,
  });

  let content;
  if (cryptos.isPending) {
    content = <CircularProgress />;
  } else if (cryptos.isError) {
    content = (
      <Typography color="error">
        Could not load prices: {cryptos.error.message}
      </Typography>
    );
  } else {
    const data = cryptos.data;
    content = (
      <Paper>
        <List sx={{ bgcolor: "background.paper" }}>
          {data.map((coin, index) => (
            <Fragment key={coin.id}>
              <CoinTracker coin={coin} />
              {index !== data.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </Fragment>
          ))}
        </List>
      </Paper>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h4" align="center">
        CryptoTracker
      </Typography>
      {content}
    </Container>
  );
};

export default CryptoTracker;
