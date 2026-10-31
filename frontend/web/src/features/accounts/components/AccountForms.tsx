import { useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@monochrome-ui/design-system';
import type { Account, AccountType, CurrencyCode } from '@kippa/domain';
import { CurrencySelect } from '@/features/shared/components/CurrencySelect';

const TYPES: Array<{ label: string; value: AccountType }> = [
  { label: 'Running Bank', value: 'running' },
  { label: 'Savings Bank', value: 'savings' },
  { label: 'Cash', value: 'cash' },
  { label: 'Wallet', value: 'wallet' },
];
function TypeSelect({
  id,
  onChange,
  value,
}: {
  id: string;
  onChange: (value: AccountType) => void;
  value: AccountType;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id={id}>Account Type</InputLabel>
      <Select
        size="medium"
        labelId={id}
        value={value}
        label="Account Type"
        onChange={(event) => onChange(event.target.value as AccountType)}
      >
        {TYPES.map((type) => (
          <MenuItem key={type.value} value={type.value}>
            {type.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function AddAccountDialog(props: {
  open: boolean;
  baseCurrency: CurrencyCode;
  busy: boolean;
  onClose: () => void;
  onCreate: (draft: { name: string; type: AccountType; currency: CurrencyCode }) => Promise<void>;
}) {
  return props.open ? <AddAccountDialogInner key={props.baseCurrency} {...props} /> : null;
}

function AddAccountDialogInner({
  open,
  baseCurrency,
  busy,
  onClose,
  onCreate,
}: {
  open: boolean;
  baseCurrency: CurrencyCode;
  busy: boolean;
  onClose: () => void;
  onCreate: (draft: { name: string; type: AccountType; currency: CurrencyCode }) => Promise<void>;
}) {
  const [draft, setDraft] = useState({ name: '', type: 'running' as AccountType, currency: baseCurrency });

  const create = async () => {
    if (!draft.name.trim()) return;
    await onCreate({ ...draft, name: draft.name.trim() });
    setDraft((current) => ({ ...current, name: '' }));
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="create-account-title">
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Typography id="create-account-title" variant="h3">
          Add account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add a bank, cash, or wallet account to your household.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <TextField
            autoFocus
            fullWidth
            label="Account name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            disabled={busy}
          />
          <TypeSelect id="acc-type-label" value={draft.type} onChange={(type) => setDraft({ ...draft, type })} />
          <CurrencySelect
            labelId="acc-currency-label"
            value={draft.currency}
            onChange={(currency) => setDraft({ ...draft, currency })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={busy}>
          Cancel
        </Button>
        <Button onClick={create} variant="primaryAction" loading={busy} disabled={!draft.name.trim()}>
          Create account
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function EditAccountDialog({
  account,
  busy,
  onClose,
  onSave,
}: {
  account: Account;
  busy: boolean;
  onClose: () => void;
  onSave: (account: Account) => Promise<void>;
}) {
  const [draft, setDraft] = useState(account);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="edit-account-title">
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Typography id="edit-account-title" variant="h3">
          Edit account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update the account name, type, currency, or availability.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Account name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <TypeSelect id="edit-acc-type-label" value={draft.type} onChange={(type) => setDraft({ ...draft, type })} />
          <CurrencySelect
            labelId="edit-acc-currency-label"
            value={draft.currency}
            onChange={(currency) => setDraft({ ...draft, currency })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={draft.isActive}
                onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
              />
            }
            label="Account is active"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          variant="primaryAction"
          loading={busy}
          disabled={!draft.name.trim()}
        >
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
