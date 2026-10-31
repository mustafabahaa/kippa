import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import type { Loan } from '@kippa/domain';

export function LoanPaymentDialog({
  loan,
  open,
  busy,
  onClose,
  onSave,
}: {
  loan: Loan | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (amount: number, date: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(() => loan?.installmentAmount ?? 0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const selectedDate = date ? parseISO(date) : null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="loan-payment-title">
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Box>
          <Typography id="loan-payment-title" variant="h3">
            Record payment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loan?.name ?? 'Loan'} · this adds an expense and advances the repayment schedule.
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2, pt: 2, px: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5">Payment details</Typography>
            <Typography variant="body2" color="text.secondary">
              Confirm the installment amount and the date it leaves your account.
            </Typography>
          </Box>
          <Stack spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
            <TextField
              autoFocus
              fullWidth
              type="number"
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Withdrawal date"
                value={selectedDate && isValid(selectedDate) ? selectedDate : null}
                onChange={(newValue) => {
                  if (newValue && isValid(newValue)) setDate(format(newValue, 'yyyy-MM-dd'));
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!loan || amount <= 0 || !date}
          loading={busy}
          onClick={() => onSave(amount, date)}
        >
          Record payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
