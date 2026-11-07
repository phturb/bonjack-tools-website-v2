import { useState } from "react";
import { Paper, Tabs, Tab, Box } from "@mui/material";
import Rules from "./Rules";
import Stats from "./Stats";
import { AvailablePlayers } from "../../helpers/loisDesNorms";

const AdditionalInformationBlock = (props: { availablePlayers: AvailablePlayers }) => {
  const [tab, setTab] = useState(0);

  return (
    <Paper>
      <Box sx={{ padding: "10px", minHeight: "446px", width: "375px" }}>
        <Tabs value={tab} onChange={(_, value: number) => setTab(value)}>
          <Tab id="rules" label="Rules" value={0} />
          <Tab id="stats" label="Stats" value={1} />
        </Tabs>
        <div hidden={tab !== 1} style={{ height: 360, width: 375 }}>
          <Stats availablePlayers={props.availablePlayers} />
        </div>
        <div hidden={tab !== 0} style={{ height: 360, width: 375 }}>
          <Rules />
        </div>
      </Box>
    </Paper>
  );
};

export default AdditionalInformationBlock;
