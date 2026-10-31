import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@monochrome-ui/design-system';
import { MerchantKeywordsEditor } from './MerchantKeywordsEditor';

interface CategoryNameDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  value: string;
  placeholder?: string;
  loading: boolean;
  categoryType?: 'income' | 'expense';
  onCategoryTypeChange?: (type: 'income' | 'expense') => void;
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
  description,
  confirmLabel,
  value,
  placeholder,
  loading,
  categoryType,
  onCategoryTypeChange,
  merchants,
  onChange,
  onMerchantsChange,
  onClose,
  onConfirm,
}: CategoryNameDialogProps) {
  const editingMerchants = merchants !== undefined && !!onMerchantsChange;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={3} sx={{ px: 2, pt: 1, pb: 2 }}>
          <Typography variant="sectionSubtitle" color="text.secondary">
            {description}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Category Name"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={loading}
          />
          {categoryType && onCategoryTypeChange && (
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="category-type-label">Type</InputLabel>
              <Select
                size="medium"
                labelId="category-type-label"
                label="Type"
                value={categoryType}
                onChange={(event) => onCategoryTypeChange(event.target.value as 'income' | 'expense')}
              >
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="income">Income</MenuItem>
              </Select>
            </FormControl>
          )}
          {editingMerchants && (
            <MerchantKeywordsEditor keywords={merchants} onChange={onMerchantsChange} disabled={loading} emptyState />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={!value.trim()} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
