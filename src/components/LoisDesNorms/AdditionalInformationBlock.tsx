import { Box, Tab, Tabs } from "@mui/material";
import Rules from "./Rules";
import Stats from "./Stats";
import { AvailablePlayers } from "../../helpers/loisDesNorms";
import { colors } from "./tokens";

interface Props {
  availablePlayers: AvailablePlayers;
  seatedIds: string[];
  fill?: boolean;
  /** 0 = rules, 1 = stats. Owned by the page so a layout change (crossing the wide breakpoint) keeps it. */
  tab: number;
  onTabChange: (tab: number) => void;
}

/** Right column: the house rules, or the stats ledger. */
const AdditionalInformationBlock = ({ tab, onTabChange: setTab, ...props }: Props) => {
  return (
    <Box
      component="section"
      aria-label="Rules and stats"
      // fill: take the column's height and scroll inside it, never growing the page.
      sx={props.fill ? { position: "absolute", inset: 0, display: "flex", flexDirection: "column" } : undefined}
    >
      <Tabs
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        sx={{ mb: 1.5, borderBottom: `1px solid ${colors.rule}`, "& .MuiTabs-flexContainer": { justifyContent: "flex-end" } }}
      >
        <Tab id="rules" label="Rules" value={0} aria-controls="rules-panel" />
        <Tab id="stats" label="Stats" value={1} aria-controls="stats-panel" />
      </Tabs>
      <Box
        sx={
          props.fill
            ? {
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                pr: 0.5,
                // A visible scroll cue: a gold scrollbar and the last rows fading out, with room to scroll them clear.
                pb: 4,
                scrollbarWidth: "thin",
                scrollbarColor: `${colors.goldDark} transparent`,
                maskImage: "linear-gradient(to bottom, #000 calc(100% - 32px), transparent)",
              }
            : undefined
        }
      >
        <div id="rules-panel" role="tabpanel" aria-labelledby="rules" hidden={tab !== 0}>
          <Rules />
        </div>
        <div id="stats-panel" role="tabpanel" aria-labelledby="stats" hidden={tab !== 1}>
          <Stats availablePlayers={props.availablePlayers} seatedIds={props.seatedIds} />
        </div>
      </Box>
    </Box>
  );
};

export default AdditionalInformationBlock;
