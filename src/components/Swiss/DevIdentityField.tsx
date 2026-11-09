import { TextField } from "@mui/material";
import { AUTH_CONFIGURED, setDevSubject, useDevSubject } from "../../helpers/auth";

/**
 * Local-development identity switcher. Renders nothing when Auth0 is
 * configured. Lets you act as the owner or as a stranger against a backend
 * running without JWT (`go run ./cmd/swissdev`).
 */
const DevIdentityField = () => {
  const subject = useDevSubject();
  if (AUTH_CONFIGURED) return null;
  return (
    <TextField
      label="Acting as (dev, no Auth0)"
      size="small"
      value={subject}
      onChange={(e) => setDevSubject(e.target.value)}
      helperText="Bearer subject sent to the backend"
      sx={{ alignSelf: "center", my: 1 }}
    />
  );
};

export default DevIdentityField;
