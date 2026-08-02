import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

interface CategoryNameDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  value: string;
  placeholder?: string;
  loading: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function CategoryNameDialog({
  open,
  title,
  confirmLabel,
  value,
  placeholder,
  loading,
  onChange,
  onClose,
  onConfirm,
}: CategoryNameDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ minWidth: 300 }}>
        <TextField
          autoFocus
          fullWidth
          label="Category Name"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={!value.trim()} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
