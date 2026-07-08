import React, { useState, useEffect } from 'react';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Stack,
  Divider,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  useAccounts,
  useCategories,
  useLedgerLines,
  useUpdateTransactionMutation,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { FinanceTransaction, CurrencyCode } from '@/domain/financeTypes';
import { TransactionTypeChip } from './TransactionTypeChip';

interface EditTransactionDialogProps {
  open: boolean;
  transaction: FinanceTransaction | null;
  onClose: () => void;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  open,
  transaction,
  onClose,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { householdId } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: ledgerLines = [] } = useLedgerLines(householdId);
  const updateMutation = useUpdateTransactionMutation();

  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [editAccId, setEditAccId] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (transaction) {
      setEditDesc(transaction.description || '');
      setEditDate(transaction.date);
      setEditCatId(transaction.categoryId || '');
      setEditType((transaction.type === 'income' ? 'income' : 'expense') as 'income' | 'expense');

      const txLines = ledgerLines.filter((l) => l.transactionId === transaction.id);
      const firstLine = txLines.find((l) => l.signedAmount !== 0) || txLines[0];
      setEditAccId(firstLine ? firstLine.accountId : '');
      setEditAmount(firstLine ? Number(Math.abs(firstLine.signedAmount).toFixed(2)).toString() : '0');
    }
  }, [transaction, ledgerLines]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!transaction) return null;

  const isRegularTx = transaction.type === 'expense' || transaction.type === 'income';

  const handleSave = async () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid amount.', { variant: 'warning' });
      return;
    }

    const txLines = ledgerLines.filter((l) => l.transactionId === transaction.id);
    const firstLine = txLines.find((l) => l.signedAmount !== 0) || txLines[0];
    const currency = firstLine ? firstLine.currency : baseCurrency;

    // If it's a regular transaction, it determines sign based on editType.
    // If it's a special transaction, it retains its original sign!
    let signedAmount: number;
    if (isRegularTx) {
      signedAmount = editType === 'income' ? amount : -amount;
    } else {
      // Retain original sign
      const originalSign = firstLine ? (firstLine.signedAmount >= 0 ? 1 : -1) : -1;
      signedAmount = amount * originalSign;
    }

    try {
      await updateMutation.mutateAsync({
        householdId,
        transactionId: transaction.id,
        transactionUpdates: {
          description: editDesc,
          date: editDate,
          categoryId: isRegularTx ? (editCatId || null) : null,
          type: isRegularTx ? editType : transaction.type,
        },
        lineUpdates: {
          accountId: editAccId,
          signedAmount: signedAmount,
          currency: currency as CurrencyCode,
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
      <DialogTitle component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Edit Transaction
        </Typography>
        <TransactionTypeChip type={transaction.type} />
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Read-only Warning and Info for Special Transactions */}
          {!isRegularTx && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: 'rgba(25, 118, 210, 0.05)',
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1.5 }}>
                  For ledger integrity, the type, accounts, and amount of a {transaction.type === 'adjustment' ? 'Reconciliation' : transaction.type} transaction cannot be modified.
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Amount: <span style={{ fontWeight: 'normal' }}>{editAmount} {ledgerLines.find(l => l.transactionId === transaction.id)?.currency || baseCurrency}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Account: <span style={{ fontWeight: 'normal' }}>{getAccountName(editAccId)}</span>
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          )}

          {/* Section 1: Financial Details */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Financial Details
            </Typography>
            <Divider sx={{ mt: 1, mb: 1 }} />
          </Grid>

          {isRegularTx && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'medium' }}>
                Transaction Type
              </Typography>
              <RadioGroup
                row
                value={editType}
                onChange={(e) => setEditType(e.target.value as 'income' | 'expense')}
                sx={{ gap: 2 }}
              >
                <FormControlLabel value="expense" control={<Radio />} label="Expense" />
                <FormControlLabel value="income" control={<Radio />} label="Income" />
              </RadioGroup>
            </Grid>
          )}

          {isRegularTx ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                fullWidth
                label="Amount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
          ) : null}

          {isRegularTx && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="edit-tx-acc-label">Account</InputLabel>
                <Select
                  labelId="edit-tx-acc-label"
                  value={editAccId}
                  label="Account"
                  onChange={(e) => setEditAccId(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Section 2: Metadata & Notes */}
          <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Classification & Details
            </Typography>
            <Divider sx={{ mt: 1, mb: 1 }} />
          </Grid>

          {/* Date Picker */}
          <Grid size={{ xs: 12, sm: isRegularTx ? 6 : 12 }}>
            <TextField
              type="date"
              fullWidth
              label="Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>

          {/* Category Selector (Regular only) */}
          {isRegularTx && (
            <Grid size={{ xs: 12, sm: 6 }}>
              {editType === 'expense' ? (
                <FormControl fullWidth>
                  <InputLabel id="edit-tx-cat-label">Category</InputLabel>
                  <Select
                    labelId="edit-tx-cat-label"
                    value={editCatId}
                    label="Category"
                    onChange={(e) => setEditCatId(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="edit-tx-cat-income-label">Income Category</InputLabel>
                  <Select
                    labelId="edit-tx-cat-income-label"
                    value={editCatId}
                    label="Income Category"
                    onChange={(e) => setEditCatId(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    {categories
                      .filter((c) => c.type === 'income')
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
          )}

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description / Notes"
              placeholder="Add details or notes about this transaction..."
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          loading={updateMutation.isPending}
          sx={{ borderRadius: '12px', boxShadow: 'none' }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
