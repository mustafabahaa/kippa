import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid, parseISO } from 'date-fns';

export type NewCycleValues = {
  name: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'planned';
};

type CreateCycleDialogProps = {
  busy: boolean;
  onClose: () => void;
  onCreate: (values: NewCycleValues) => Promise<boolean>;
  open: boolean;
};

const today = () => new Date().toISOString().split('T')[0];

export function CreateCycleDialog({ busy, onClose, onCreate, open }: CreateCycleDialogProps) {
  const [values, setValues] = useState<NewCycleValues>({ name: '', startDate: today(), endDate: '', status: 'open' });
  const [nameError, setNameError] = useState(false);

  const update = <Key extends keyof NewCycleValues>(key: Key, value: NewCycleValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === 'name') setNameError(false);
  };

  const handleCreate = async () => {
    if (!values.name.trim()) {
      setNameError(true);
      return;
    }
    if (await onCreate({ ...values, name: values.name.trim() })) {
      setValues({ name: '', startDate: today(), endDate: '', status: 'open' });
      setNameError(false);
    }
  };
  const startDate = values.startDate ? parseISO(values.startDate) : null;
  const endDate = values.endDate ? parseISO(values.endDate) : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="create-cycle-title">
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Typography id="create-cycle-title" variant="h3">New budget cycle</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a name and date range for this household budget period.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2, pt: 2, px: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5">Cycle details</Typography>
            <Typography variant="body2" color="text.secondary">
              Set the period Kippa should use for budgets and spending.
            </Typography>
          </Box>
          <Stack spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
            <TextField
              fullWidth
              label="Cycle name"
              placeholder="e.g. July 2026"
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              error={nameError}
              helperText={nameError ? 'A cycle name is required.' : undefined}
            />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start date"
                    value={startDate && isValid(startDate) ? startDate : null}
                    onChange={(value) => {
                      if (value && isValid(value)) update('startDate', format(value, 'yyyy-MM-dd'));
                    }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Target end date"
                    value={endDate && isValid(endDate) ? endDate : null}
                    onChange={(value) => update('endDate', value && isValid(value) ? format(value, 'yyyy-MM-dd') : '')}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="h5">Cycle status</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.status === 'open'}
                  onChange={(event) => update('status', event.target.checked ? 'open' : 'planned')}
                />
              }
              label="Start this cycle now"
            />
            {values.status === 'open' && (
              <Typography variant="body2" color="text.secondary" sx={{ pl: { xs: 4, sm: 5 } }}>
                Starting now will close the currently active cycle.
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" loading={busy}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type CloseCycleDialogProps = {
  busy: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  open: boolean;
};

const CONFIRMATIONS = [
  'I have reconciled and verified all bank balances for this month.',
  'All USD transactions and exchanges have been logged.',
  'I understand this locks the cycle and moves leftovers forward.',
] as const;

export function CloseCycleDialog({ busy, onClose, onConfirm, open }: CloseCycleDialogProps) {
  const [confirmed, setConfirmed] = useState(() => CONFIRMATIONS.map(() => false));
  const canConfirm = confirmed.every(Boolean);

  const handleConfirm = async () => {
    if (canConfirm && (await onConfirm())) setConfirmed(CONFIRMATIONS.map(() => false));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="close-cycle-title">
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Typography id="close-cycle-title" variant="h3">Close budget cycle</Typography>
        <Typography variant="body2" color="text.secondary">
          This locks the cycle and compiles the household’s balances and leftover budget.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2, pt: 2, px: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5">Review before closing</Typography>
            <Typography variant="body2" color="text.secondary">
              Confirm each item before Kippa finalizes this cycle.
            </Typography>
          </Box>
          <Stack spacing={1.5} sx={{ px: { xs: 1, sm: 2 } }}>
            {CONFIRMATIONS.map((label, index) => (
              <FormControlLabel
                key={label}
                control={
                  <Checkbox
                    checked={confirmed[index]}
                    onChange={(event) =>
                      setConfirmed((current) =>
                        current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)),
                      )
                    }
                  />
                }
                label={label}
              />
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={!canConfirm} loading={busy} variant="contained" color="error">
          Confirm &amp; Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
