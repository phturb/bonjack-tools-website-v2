import axios from "axios";

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
}

export const getCoinMarkets = (ids: string[]) =>
  axios
    .get<CoinMarket[]>("https://api.coingecko.com/api/v3/coins/markets", {
      params: { vs_currency: "usd", ids: ids.join(","), per_page: ids.length },
    })
    .then((res) => res.data);
