import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createLobby, LOBBY_NAME_MAX_LENGTH } from "../../api/loisDesNorms";
import { LOBBIES_QUERY_KEY, lobbyPath } from "../../helpers/loisDesNorms";
import { apiErrorMessage } from "../../helpers/swiss";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Optional name, then POST and straight into the new lobby. Shows the server's error at the lobby cap. */
const NewLobbyDialog = ({ open, onClose }: Props) => {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: createLobby,
    onSuccess: (lobby) => {
      void queryClient.invalidateQueries({ queryKey: LOBBIES_QUERY_KEY });
      void navigate(lobbyPath(lobby.id));
    },
  });

  const close = () => {
    if (create.isPending) return;
    setName("");
    create.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>New lobby</DialogTitle>
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!create.isPending) create.mutate(name);
        }}
      >
        <DialogContent sx={{ pt: 0 }}>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText={`Leave empty for a default name. ${name.length}/${LOBBY_NAME_MAX_LENGTH}`}
            slotProps={{ htmlInput: { maxLength: LOBBY_NAME_MAX_LENGTH } }}
          />
          {create.isError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {apiErrorMessage(create.error)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={create.isPending}>
            Create
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default NewLobbyDialog;
