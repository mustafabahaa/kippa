import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid, parseISO } from 'date-fns';
import type { Account, Loan } from '@kippa/domain';
import { loanInputSchema, type LoanInput } from '@/libs/loans';

type Props = {
  accounts: Account[];
  loan: Loan | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (input: LoanInput) => Promise<void>;
};
const empty = (): LoanInput => ({
  name: '',
  currency: 'EGP',
  originalTotal: 0,
  installmentAmount: 0,
  totalInstallments: 36,
  openingPaidInstallments: 0,
  openingPaidAmount: 0,
  firstPaymentDate: new Date().toISOString().slice(0, 10),
  dueDay: 1,
  graceDay: 2,
  paymentAccountId: '',
  status: 'active',
  notes: null,
});

export function LoanDialog({ accounts, loan, open, busy, onClose, onSave }: Props) {
  const [values, setValues] = useState<LoanInput>(() =>
    loan
      ? {
          name: loan.name,
          currency: loan.currency,
          originalTotal: loan.originalTotal,
          installmentAmount: loan.installmentAmount,
          totalInstallments: loan.totalInstallments,
          openingPaidInstallments: loan.openingPaidInstallments ?? 0,
          openingPaidAmount: loan.openingPaidAmount ?? 0,
          firstPaymentDate: loan.firstPaymentDate,
          dueDay: loan.dueDay,
          graceDay: loan.graceDay ?? null,
          paymentAccountId: loan.paymentAccountId,
          status: loan.status,
          notes: loan.notes ?? null,
        }
      : empty(),
  );
  const [error, setError] = useState('');
  const set = (key: keyof LoanInput, value: LoanInput[keyof LoanInput]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const number = (key: keyof LoanInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
    set(key, Number(event.target.value));
  const submit = async () => {
    const parsed = loanInputSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the loan details.');
      return;
    }
    setError('');
    await onSave(parsed.data);
  };
  const selectedDate = values.firstPaymentDate ? parseISO(values.firstPaymentDate) : null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="loan-dialog-title">
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Box>
          <Typography id="loan-dialog-title" variant="h3">
            {loan ? 'Edit loan' : 'Add loan'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Set the fixed schedule once and Kippa will prepare every cycle.
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2, pt: 2, px: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5">Loan details</Typography>
              <Typography variant="body2" color="text.secondary">
                Set the contract amount and fixed monthly installment.
              </Typography>
            </Box>
            <Stack spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
              <TextField
                autoFocus
                fullWidth
                label="Loan name"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
              />
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Fixed monthly payment"
                    value={values.installmentAmount || ''}
                    onChange={number('installmentAmount')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of months"
                    value={values.totalInstallments}
                    onChange={number('totalInstallments')}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                type="number"
                label="Contract total"
                value={values.originalTotal || ''}
                onChange={number('originalTotal')}
                helperText="For a fixed loan, payment × months."
              />
            </Stack>
          </Stack>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5">Schedule and progress</Typography>
              <Typography variant="body2" color="text.secondary">
                Add the start date and any payments made before using Kippa.
              </Typography>
            </Box>
            <Stack spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="First payment"
                      value={selectedDate && isValid(selectedDate) ? selectedDate : null}
                      onChange={(newValue) => {
                        if (newValue && isValid(newValue)) set('firstPaymentDate', format(newValue, 'yyyy-MM-dd'));
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Due day"
                    value={values.dueDay}
                    onChange={number('dueDay')}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="May withdraw by"
                    value={values.graceDay ?? ''}
                    onChange={number('graceDay')}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Earlier payments count"
                    value={values.openingPaidInstallments ?? 0}
                    onChange={number('openingPaidInstallments')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Earlier amount paid"
                    value={values.openingPaidAmount ?? 0}
                    onChange={number('openingPaidAmount')}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Stack>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5">Payment account</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose where Kippa should prepare the monthly installment.
              </Typography>
            </Box>
            <Box sx={{ px: { xs: 1, sm: 2 } }}>
              <TextField
                select
                size="medium"
                fullWidth
                label="Paying account"
                value={values.paymentAccountId}
                onChange={(e) => set('paymentAccountId', e.target.value)}
              >
                {accounts
                  .filter((a) => a.isActive && a.currency === values.currency && a.type !== 'credit')
                  .map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>
          </Stack>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" loading={busy} onClick={submit}>
          {loan ? 'Save changes' : 'Add loan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
