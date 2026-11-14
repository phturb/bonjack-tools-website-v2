import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import topThumb from "../../img/Position_TOP.png";
import adcThumb from "../../img/Position_ADC.png";
import supportThumb from "../../img/Position_SUPPORT.png";
import midThumb from "../../img/Position_MID.png";
import jungleThumb from "../../img/Position_JUNGLE.png";
import { Champion, LeagueOfLegendsRole } from "../../helpers/loisDesNorms";

/** Role icons (src/img), bundled. */
export const ROLE_IMAGES: Record<LeagueOfLegendsRole, string> = {
  TOP: topThumb,
  ADC: adcThumb,
  SUPPORT: supportThumb,
  MID: midThumb,
  JUNGLE: jungleThumb,
};

const DDRAGON = "https://ddragon.leagueoflegends.com/cdn";

/** Data Dragon id of a champion ("MonkeyKing"), from its square image name ("MonkeyKing.png"). */
export const championKey = (champion: Champion): string => champion.img.replace(/\.png$/i, "");

export const squareUrl = (leagueVersion: string, champion: Champion) =>
  `${DDRAGON}/${leagueVersion}/img/champion/${champion.img}`;

export const splashUrl = (champion: Champion) =>
  `${DDRAGON}/img/champion/splash/${championKey(champion)}_0.jpg`;

interface ChampionFile {
  data: Record<string, { title?: string }>;
}

/** The champion's title ("the Nine-Tailed Fox"), cached for good once fetched; undefined while loading or on failure. */
export const useChampionTitle = (leagueVersion: string, champion: Champion | null | undefined) => {
  const key = champion ? championKey(champion) : "";
  const query = useQuery({
    queryKey: ["ddragon-title", key],
    queryFn: () =>
      axios
        .get<ChampionFile>(`${DDRAGON}/${leagueVersion}/data/en_US/champion/${encodeURIComponent(key)}.json`)
        .then((res) => res.data.data[key]?.title ?? null),
    enabled: key !== "" && leagueVersion !== "",
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  return query.data ?? undefined;
};
