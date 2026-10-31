import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid, parseISO } from 'date-fns';
import { useSnackbar } from 'notistack';
import {
  useAccounts,
  useCategories,
  useLedgerLines,
  useUpdateTransactionMutation,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { FinanceTransaction } from '@kippa/domain';
import { useTransactionEditFields } from '../hooks/useTransactionEditFields';
import { findPrimaryLedgerLine, resolveEditedCurrency, resolveEditedSignedAmount } from '@/libs/transactionEdit';

interface EditTransactionDialogProps {
  open: boolean;
  transaction: FinanceTransaction | null;
  onClose: () => void;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({ open, transaction, onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { householdId } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: ledgerLines = [] } = useLedgerLines(householdId);
  const updateMutation = useUpdateTransactionMutation();

  const { fields, setField } = useTransactionEditFields(transaction, ledgerLines);

  if (!transaction) return null;

  const isRegularTx = transaction.type === 'expense' || transaction.type === 'income';
  const selectedDate = fields.date ? parseISO(fields.date) : null;

  const handleSave = async () => {
    const amount = parseFloat(fields.amount);
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid amount.', { variant: 'warning' });
      return;
    }

    const firstLine = findPrimaryLedgerLine(transaction.id, ledgerLines);
    const currency = resolveEditedCurrency(firstLine, baseCurrency);
    const signedAmount = resolveEditedSignedAmount(amount, fields.type, firstLine, isRegularTx);

    try {
      await updateMutation.mutateAsync({
        householdId,
        transactionId: transaction.id,
        transactionUpdates: {
          description: fields.description,
          date: fields.date,
          categoryId: isRegularTx ? fields.categoryId || null : null,
          type: isRegularTx ? fields.type : transaction.type,
        },
        lineUpdates: {
          accountId: fields.accountId,
          signedAmount: signedAmount,
          currency,
          ...(firstLine?.cardFee &&
          fields.type === 'expense' &&
          accounts.find((account) => account.id === fields.accountId)?.type === 'credit'
            ? {
                cardFee: {
                  baseAmount: Number((amount / (1 + firstLine.cardFee.rate / 100)).toFixed(2)),
                  rate: firstLine.cardFee.rate,
                },
              }
            : {}),
        },
      });
      enqueueSnackbar('Transaction updated successfully!', { variant: 'success' });
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to update transaction', { variant: 'error' });
    }
  };

  const getAccountName = (id: string) => {
    return accounts.find((a) => a.id === id)?.name || id;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h3">Edit transaction</Typography>
            <Typography variant="body2" color="text.secondary">
              Make changes to this household transaction.
            </Typography>
          </Box>
          {isRegularTx && (
            <Stack direction="row" spacing={1}>
              <Button
                variant={fields.type === 'expense' ? 'segmentedSelected' : 'segmented'}
                aria-pressed={fields.type === 'expense'}
                onClick={() => setField('type', 'expense')}
              >
                Expense
              </Button>
              <Button
                variant={fields.type === 'income' ? 'segmentedSelected' : 'segmented'}
                aria-pressed={fields.type === 'income'}
                onClick={() => setField('type', 'income')}
              >
                Income
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, pt: 2, pl: { xs: 3, sm: 5 }, pr: 3 }}>
        <Stack spacing={3}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5">Transaction details</Typography>
              <Typography variant="body2" color="text.secondary">
                {isRegularTx
                  ? 'Update the amount, account, date, category, or note.'
                  : 'Amount and account are fixed for this transaction. You can update the date or note.'}
              </Typography>
            </Box>

            <Stack spacing={2} sx={{ pl: { xs: 1, sm: 2 } }}>
              {!isRegularTx && (
                <Typography variant="body2" color="text.primary">
                  {fields.amount} {findPrimaryLedgerLine(transaction.id, ledgerLines)?.currency || baseCurrency} ·{' '}
                  {getAccountName(fields.accountId)}
                </Typography>
              )}

              {isRegularTx && (
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      type="number"
                      fullWidth
                      label="Amount"
                      helperText={
                        findPrimaryLedgerLine(transaction.id, ledgerLines)?.cardFee
                          ? 'Includes bank fees. Change the fee in the card payment dialog.'
                          : undefined
                      }
                      value={fields.amount}
                      onChange={(e) => setField('amount', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="edit-tx-acc-label">Account</InputLabel>
                      <Select
                        size="medium"
                        labelId="edit-tx-acc-label"
                        value={fields.accountId}
                        label="Account"
                        onChange={(e) => setField('accountId', e.target.value)}
                      >
                        {accounts.map((a) => (
                          <MenuItem key={a.id} value={a.id}>
                            {a.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: isRegularTx ? 6 : 12 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={selectedDate && isValid(selectedDate) ? selectedDate : null}
                      onChange={(newValue) => {
                        if (newValue && isValid(newValue)) setField('date', format(newValue, 'yyyy-MM-dd'));
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>

                {isRegularTx && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="edit-tx-cat-label">Category</InputLabel>
                      <Select
                        size="medium"
                        labelId="edit-tx-cat-label"
                        value={fields.categoryId}
                        label="Category"
                        onChange={(e) => setField('categoryId', e.target.value)}
                      >
                        {categories
                          .filter((c) => c.type === fields.type)
                          .map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={5}
                    label="Description"
                    placeholder="Add a note"
                    value={fields.description}
                    onChange={(e) => setField('description', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" loading={updateMutation.isPending}>
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
