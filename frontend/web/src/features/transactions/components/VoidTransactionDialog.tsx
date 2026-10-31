import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface VoidTransactionDialogProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function VoidTransactionDialog({ open, loading = false, onClose, onConfirm }: VoidTransactionDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="void-transaction-title">
      <DialogTitle id="void-transaction-title">Void this transaction?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          It will stay in your history marked as voided, and your household balances and spending totals will update. It
          won’t be permanently deleted.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" loading={loading}>
          Void transaction
        </Button>
      </DialogActions>
    </Dialog>
  );
}
