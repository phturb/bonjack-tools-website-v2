import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = (props: Props) => (
  <Dialog open={props.open} onClose={props.onCancel}>
    <DialogTitle>{props.title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{props.body}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={props.onCancel}>Cancel</Button>
      <Button
        variant="contained"
        color={props.destructive ? "error" : "primary"}
        onClick={props.onConfirm}
      >
        {props.confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
