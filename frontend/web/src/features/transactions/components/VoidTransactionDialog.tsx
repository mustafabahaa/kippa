import { ConfirmationDialog } from '@monochrome-ui/design-system';

interface VoidTransactionDialogProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function VoidTransactionDialog({ open, loading = false, onClose, onConfirm }: VoidTransactionDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      title="Void this transaction?"
      description="It will stay in your history marked as voided, and your household balances and spending totals will update. It won’t be permanently deleted."
      confirmLabel="Void transaction"
      tone="danger"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
