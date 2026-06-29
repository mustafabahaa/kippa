import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WorkIcon from '@mui/icons-material/Work';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { 
  useAccounts, 
  useCategories, 
  useTransactions, 
  useLedgerLines,
  useVoidTransactionMutation,
  useUpdateTransactionMutation 
} from '../../hooks/useFinance';
import { FinanceTransaction, CurrencyCode } from '../../domain/financeTypes';
import { useAppContext } from '../../hooks/useAppContext';

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

export function TransactionHistory() {
  const { enqueueSnackbar } = useSnackbar();
  const { householdId } = useAppContext();
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [editAccId, setEditAccId] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');

  // Queries & Mutations
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: transactions = [], isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);

  const voidTxMutation = useVoidTransactionMutation();
  const updateTxMutation = useUpdateTransactionMutation();

  const getTxIcon = (type: string) => {
    if (type.toLowerCase() === 'income') {
      return <WorkIcon sx={{ color: '#1E8E3E' }} />;
    }
    if (type.toLowerCase() === 'transfer' || type.toLowerCase() === 'conversion') {
      return <SwapHorizIcon sx={{ color: 'primary.main' }} />;
    }
    return <ShoppingCartIcon sx={{ color: 'text.secondary' }} />;
  };

  const getTxIconBg = (type: string) => {
    if (type.toLowerCase() === 'income') {
      return 'rgba(30, 142, 62, 0.1)';
    }
    if (type.toLowerCase() === 'transfer' || type.toLowerCase() === 'conversion') {
      return 'secondary.container';
    }
    return 'action.hover';
  };

  // Open Edit Modal
  const handleOpenEdit = (tx: FinanceTransaction) => {
    setEditingTx(tx);
    setEditDesc(tx.description || '');
    setEditDate(tx.date);
    setEditCatId(tx.categoryId || '');
    setEditType((tx.type === 'income' ? 'income' : 'expense') as 'income' | 'expense');

    const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
    const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
    setEditAccId(firstLine ? firstLine.accountId : '');
    setEditAmount(firstLine ? Math.abs(firstLine.signedAmount).toString() : '0');
  };

  // Save Transaction Changes
  const handleSaveEdit = async () => {
    if (!editingTx) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid amount.', { variant: 'warning' });
      return;
    }

    const signedAmount = editType === 'income' ? amount : -amount;
    const txLines = ledgerLines.filter(l => l.transactionId === editingTx.id);
    const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
    const currency = firstLine ? firstLine.currency : 'EGP';

    await updateTxMutation.mutateAsync({
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

  // Void Transaction
  const handleVoid = async (txId: string) => {
    if (window.confirm('Are you sure you want to void this transaction?')) {
      await voidTxMutation.mutateAsync({ householdId, transactionId: txId });
    }
  };

  // Filtering Logic
  const filteredTxs = transactions.filter(tx => {
    // 1. Text Search
    const searchMatch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Category Filter
    const catMatch = selectedCategory === 'all' || tx.categoryId === selectedCategory;

    // 3. Account Filter
    const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
    const accMatch = selectedAccount === 'all' || txLines.some(l => l.accountId === selectedAccount);

    // 4. Type Filter
    const typeMatch = 
      selectedType === 'all' ||
      (selectedType === 'income' && tx.type === 'income') ||
      (selectedType === 'expense' && tx.type === 'expense') ||
      (selectedType === 'transfer' && (tx.type === 'transfer' || tx.type === 'conversion'));

    return searchMatch && catMatch && accMatch && typeMatch;
  });

  const isLoading = accountsLoading || categoriesLoading || txsLoading || linesLoading;

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="text" width="20%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: '20px' }} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: '20px' }} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Transaction History
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            View and manage all transaction histories and entries
          </Typography>
        </Box>

        {/* Filter Toolbar Card */}
      
            <Stack spacing={2}>
              <TextField
                fullWidth
                
                placeholder="Search description, notes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '20px' }} />
                  }
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                {/* Category selector */}
                <FormControl fullWidth>
                  <InputLabel id="filter-cat-label">Category</InputLabel>
                  <Select
                    labelId="filter-cat-label"
                    value={selectedCategory}
                    label="Category"
                    onChange={e => setSelectedCategory(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Account selector */}
                <FormControl fullWidth>
                  <InputLabel id="filter-acc-label">Account</InputLabel>
                  <Select
                    labelId="filter-acc-label"
                    value={selectedAccount}
                    label="Account"
                    onChange={e => setSelectedAccount(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="all">All Accounts</MenuItem>
                    {accounts.map(a => (
                      <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Type selector */}
                <FormControl fullWidth>
                  <InputLabel id="filter-type-label">Type</InputLabel>
                  <Select
                    labelId="filter-type-label"
                    value={selectedType}
                    label="Type"
                    onChange={e => setSelectedType(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="transfer">Transfers & Exchanges</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
        

        {/* Transactions Table */}
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
          <Table aria-label="transactions activity table" sx={{ '& .MuiTableCell-head': { bgcolor: 'action.hover' } }}>
            <TableHead>
              <TableRow>
                <TableCell width="60px"></TableCell>
                <TableCell>Date / Description</TableCell>
                <TableCell>Details</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center" width="100px">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary', fontStyle: 'italic' }}>
                    No matching activities found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTxs.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
                  const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
                  
                  const isIncome = tx.type === 'income' || (tx.type === 'adjustment' && (firstLine?.signedAmount || 0) >= 0);
                  const amount = firstLine ? Math.abs(firstLine.signedAmount) : 0;
                  const currency = firstLine ? firstLine.currency : 'EGP';

                  // Build details string
                  let detailsText: string;
                  if (tx.type === 'transfer' || tx.type === 'conversion') {
                    const fromL = txLines.find(l => l.signedAmount < 0);
                    const toL = txLines.find(l => l.signedAmount > 0);
                    const fromAcc = accounts.find(a => a.id === fromL?.accountId);
                    const toAcc = accounts.find(a => a.id === toL?.accountId);
                    detailsText = `${fromAcc?.name || 'Wallet'} ➔ ${toAcc?.name || 'Bank'}`;
                  } else {
                    const acc = accounts.find(a => a.id === firstLine?.accountId);
                    detailsText = `${acc?.name || 'Account'} • ${cat?.name || 'General'}`;
                  }

                  return (
                    <TableRow key={tx.id} hover sx={{ opacity: tx.status === 'voided' ? 0.5 : 1 }}>
                      <TableCell align="center">
                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: getTxIconBg(tx.type), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getTxIcon(tx.type)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px' }}>
                          {tx.description || cat?.name || 'General Entry'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                          {tx.date} • {formatTime(tx.createdAt)} {tx.status === 'voided' && '• (VOIDED)'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                          {detailsText}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: tx.status === 'voided' ? 'text.secondary' : isIncome ? '#1E8E3E' : 'text.primary' }}>
                          {isIncome ? '+' : '-'}{amount.toLocaleString()} {currency}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton 
                            
                            onClick={() => handleOpenEdit(tx)}
                            disabled={tx.status === 'voided'}
                          >
                            <EditIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                          <IconButton 
                            
                            color="error" 
                            onClick={() => handleVoid(tx.id)}
                            disabled={tx.status === 'voided'}
                          >
                            <DeleteIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

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
              <FormControlLabel value="expense" control={<Radio />} label="Expense" />
              <FormControlLabel value="income" control={<Radio />} label="Income" />
            </RadioGroup>

            <TextField
              type="date"
              
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              
              label="Description"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              type="number"
              
              label="Amount"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <FormControl fullWidth>
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
              <FormControl fullWidth>
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
              <FormControl fullWidth>
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
          <Button onClick={handleSaveEdit} variant="contained" sx={{ borderRadius: '12px', boxShadow: 'none' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
