import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { MerchantKeywordsEditor } from './MerchantKeywordsEditor';

interface CategoryNameDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  value: string;
  placeholder?: string;
  loading: boolean;
  /** Present only when editing an existing category: merchant keywords that
   *  auto-suggest this category for imported bank messages. */
  merchants?: string[];
  onChange: (value: string) => void;
  onMerchantsChange?: (merchants: string[]) => void;
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
  merchants,
  onChange,
  onMerchantsChange,
  onClose,
  onConfirm,
}: CategoryNameDialogProps) {
  const editingMerchants = merchants !== undefined && !!onMerchantsChange;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ minWidth: { xs: 320, sm: 460 }, pb: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Category Name"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={loading}
          />
          {editingMerchants && (
            <MerchantKeywordsEditor
              keywords={merchants}
              onChange={onMerchantsChange}
              disabled={loading}
              emptyState
            />
          )}
        </Stack>
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
