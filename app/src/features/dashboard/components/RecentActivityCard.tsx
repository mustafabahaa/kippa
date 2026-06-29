import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  Divider,
  Skeleton,
  Stack,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WorkIcon from '@mui/icons-material/Work';
import { 
  useAccounts, 
  useCategories, 
  useTransactions, 
  useLedgerLines,
  useVoidTransactionMutation,
  useUpdateTransactionMutation 
} from '@/hooks/useFinance';
import { FinanceTransaction, CurrencyCode } from '@/domain/financeTypes';
import { useAppContext } from '@/hooks/useAppContext';

/** Format an ISO timestamp as a short time, e.g. "3:45 PM". */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function RecentActivityCard() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { householdId } = useAppContext();
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  
  const voidMutation = useVoidTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();

  // Edit Dialog States
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [editAccId, setEditAccId] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');

  const getTxIcon = (type: string) => {
    if (type.toLowerCase() === 'income') {
      return <WorkIcon sx={{ color: '#1E8E3E' }} />;
    }
    return <ShoppingCartIcon sx={{ color: 'text.secondary' }} />;
  };

  const getTxIconBg = (type: string) => {
    if (type.toLowerCase() === 'income') {
      return 'rgba(30, 142, 62, 0.1)';
    }
    return 'action.hover';
  };

  const handleOpenEdit = (tx: FinanceTransaction) => {
    setEditingTx(tx);
    setEditDesc(tx.description || '');
    setEditDate(tx.date);
    setEditCatId(tx.categoryId || '');
    setEditType((tx.type === 'income' ? 'income' : 'expense') as 'income' | 'expense');

    if (ledgerLines) {
      const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
      const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
      setEditAccId(firstLine ? firstLine.accountId : '');
      setEditAmount(firstLine ? Math.abs(firstLine.signedAmount).toString() : '0');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTx || !ledgerLines) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid amount.', { variant: 'warning' });
      return;
    }

    const signedAmount = editType === 'income' ? amount : -amount;
    const txLines = ledgerLines.filter(l => l.transactionId === editingTx.id);
    const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
    const currency = firstLine ? firstLine.currency : 'EGP';

    await updateMutation.mutateAsync({
      householdId,
      transactionId: editingTx.id,
      transactionUpdates: {
        description: editDesc,
        date: editDate,
        categoryId: editCatId || undefined,
        type: editType
      },
      lineUpdates: {
        accountId: editAccId,
        signedAmount: signedAmount,
        currency: currency as CurrencyCode
      }
    });

    setEditingTx(null);
  };

  const handleVoidTransaction = async (txId: string) => {
    if (window.confirm('Are you sure you want to void this transaction? This updates derived balances immediately.')) {
      await voidMutation.mutateAsync({ householdId, transactionId: txId });
    }
  };

  const isLoading = txsLoading || linesLoading;

  if (isLoading || !transactions || !ledgerLines) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: '20px' }} animation="wave" />
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
          Recent Activity
        </Typography>
        <Typography 
          variant="body2" 
          onClick={() => navigate('/transactions')}
          sx={{ color: 'primary.main', fontWeight: 'bold', cursor: 'pointer' }}
        >
          View All
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        {transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No recent activity recorded.
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {transactions.slice(0, 5).map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              
              // Find amount from ledgerLines
              const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
              const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
              const amount = firstLine ? Math.abs(firstLine.signedAmount) : 0;
              const currency = firstLine ? firstLine.currency : 'EGP';
              const isIncome = tx.type === 'income' || (tx.type === 'adjustment' && (firstLine?.signedAmount || 0) >= 0);

              return (
                <Box
                  key={tx.id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: getTxIconBg(tx.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getTxIcon(tx.type)}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.type === 'transfer' ? 'Transfer' : tx.type === 'conversion' ? 'Currency Exchange' : (cat?.name || 'General')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {[tx.description, `${tx.date} • ${formatTime(tx.createdAt)}`].filter(Boolean).join(' • ')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: isIncome ? '#1E8E3E' : 'text.primary', fontSize: '13.5px', whiteSpace: 'nowrap', mt: 0.25 }}>
                        {isIncome ? '+' : '-'}{amount.toLocaleString()} {currency}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, alignSelf: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(tx)}
                      disabled={tx.status === 'voided'}
                      sx={{ p: 0.5, width: 28, height: 28 }}
                    >
                      <EditIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleVoidTransaction(tx.id)}
                      disabled={tx.status === 'voided'}
                      sx={{ p: 0.5, width: 28, height: 28 }}
                    >
                      <DeleteIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={Boolean(editingTx)} onClose={() => setEditingTx(null)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Transaction</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <RadioGroup
              row
              value={editType}
              onChange={e => setEditType(e.target.value as 'income' | 'expense')}
            >
              <FormControlLabel value="expense" control={<Radio size="small" />} label="Expense" />
              <FormControlLabel value="income" control={<Radio size="small" />} label="Income" />
            </RadioGroup>

            <TextField
              type="date"
              size="small"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              size="small"
              label="Description"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              type="number"
              size="small"
              label="Amount"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <FormControl size="small" fullWidth>
              <InputLabel id="edit-tx-acc-label">Account</InputLabel>
              <Select
                labelId="edit-tx-acc-label"
                value={editAccId}
                label="Account"
                onChange={e => setEditAccId(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                {accounts.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {editType === 'expense' ? (
              <FormControl size="small" fullWidth>
                <InputLabel id="edit-tx-cat-label">Category</InputLabel>
                <Select
                  labelId="edit-tx-cat-label"
                  value={editCatId}
                  label="Category"
                  onChange={e => setEditCatId(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl size="small" fullWidth>
                <InputLabel id="edit-tx-cat-income-label">Income Category</InputLabel>
                <Select
                  labelId="edit-tx-cat-income-label"
                  value={editCatId}
                  label="Income Category"
                  onChange={e => setEditCatId(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  {categories.filter(c => c.type === 'income').map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditingTx(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" loading={updateMutation.isPending} sx={{ borderRadius: '12px', boxShadow: 'none' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
