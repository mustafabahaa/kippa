import { useState, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Container,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  Skeleton,
  IconButton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  useAccounts,
  useCategories,
  useTransactions,
  useLedgerLines,
  useVoidTransactionMutation,
  useCycles,
  useActiveCycle,
  useHouseholdBaseCurrency
} from '@/hooks/useFinance';
import { FinanceTransaction } from '@/domain/financeTypes';
import { useAppContext } from '@/hooks/useAppContext';
import { TransactionIcon } from './components/TransactionIcon';
import { TransactionTypeChip } from './components/TransactionTypeChip';
import { EditTransactionDialog } from './components/EditTransactionDialog';

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
  const baseCurrency = useHouseholdBaseCurrency();
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCycleId, setSelectedCycleId] = useState('active');

  const handleSearch = (value: string) => { setSearchTerm(value); resetPage(); };
  const handleCategoryChange = (value: string) => { setSelectedCategory(value); resetPage(); };
  const handleAccountChange = (value: string) => { setSelectedAccount(value); resetPage(); };
  const handleTypeChange = (value: string) => { setSelectedType(value); resetPage(); };
  const handleCycleChange = (value: string) => { setSelectedCycleId(value); resetPage(); };

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);

  // Pagination State
  const PAGE_SIZE = 25;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const resetPage = () => setVisibleCount(PAGE_SIZE);

  // Queries & Mutations
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const { data: activeCycle } = useActiveCycle(householdId);

  const queryCycleId = useMemo(() => {
    if (selectedCycleId === 'all') return undefined;
    if (selectedCycleId === 'active') return activeCycle?.id || cycles[0]?.id;
    return selectedCycleId;
  }, [selectedCycleId, activeCycle, cycles]);

  const { data: transactions = [], isLoading: txsLoading } = useTransactions(householdId, queryCycleId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId, queryCycleId);

  const voidTxMutation = useVoidTransactionMutation();

  // Void Transaction
  const handleVoid = async (txId: string) => {
    if (window.confirm('Are you sure you want to void this transaction? This updates balances immediately.')) {
      try {
        await voidTxMutation.mutateAsync({ householdId, transactionId: txId });
        enqueueSnackbar('Transaction voided successfully.', { variant: 'success' });
      } catch (err: any) {
        enqueueSnackbar(err.message || 'Failed to void transaction', { variant: 'error' });
      }
    }
  };

  // Filtering Logic
  const filteredTxs = transactions.filter(tx => {
    // 1. Text Search
    const searchMatch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Category Filter
    let catMatch = true;
    if (selectedCategory !== 'all') {
      catMatch = tx.categoryId === selectedCategory;
    }

    // 3. Account Filter
    let accMatch = true;
    if (selectedAccount !== 'all') {
      const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
      accMatch = txLines.some(l => l.accountId === selectedAccount);
    }

    // 4. Type Filter
    let typeMatch = true;
    if (selectedType !== 'all') {
      typeMatch = tx.type === selectedType;
    }

    return searchMatch && catMatch && accMatch && typeMatch;
  });

  const isLoading = accountsLoading || categoriesLoading || txsLoading || linesLoading;

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: '20px' }} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 800, color: 'text.primary' }}>
              Transaction History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              View, search, and manage your household transactions.
            </Typography>
          </Box>
        </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            {/* Search Input */}
            <TextField
              placeholder="Search description..."
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '20px' }} />,
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Cycle Selector */}
            <FormControl sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
              <InputLabel id="history-cycle-label">Budget Cycle</InputLabel>
              <Select
                labelId="history-cycle-label"
                value={selectedCycleId}
                label="Budget Cycle"
                onChange={e => handleCycleChange(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="all">All Cycles</MenuItem>
                <MenuItem value="active">Active Cycle</MenuItem>
                {cycles.filter(c => c.status !== 'open').map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.status})</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Account Selector */}
            <FormControl sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
              <InputLabel id="history-account-label">Account</InputLabel>
              <Select
                labelId="history-account-label"
                value={selectedAccount}
                label="Account"
                onChange={e => handleAccountChange(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="all">All Accounts</MenuItem>
                {accounts.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Category Selector */}
            <FormControl sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
              <InputLabel id="history-category-label">Category</InputLabel>
              <Select
                labelId="history-category-label"
                value={selectedCategory}
                label="Category"
                onChange={e => handleCategoryChange(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Type Selector */}
            <FormControl sx={{ minWidth: 120, width: { xs: '100%', md: 'auto' } }}>
              <InputLabel id="history-type-label">Type</InputLabel>
              <Select
                labelId="history-type-label"
                value={selectedType}
                label="Type"
                onChange={e => handleTypeChange(e.target.value)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
                <MenuItem value="conversion">Exchange</MenuItem>
                <MenuItem value="adjustment">Reconciliation</MenuItem>
              </Select>
            </FormControl>
          </Stack>

        {/* Table Container */}
        <TableContainer component={Card} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell align="center" sx={{ width: 60, fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Transaction</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Account Info</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell align="center" sx={{ width: 120, fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No transactions match the selected filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTxs.slice(0, visibleCount).map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  
                  // Find amount from ledgerLines
                  const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
                  const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
                  const amount = firstLine ? Number(Math.abs(firstLine.signedAmount).toFixed(2)) : 0;
                  const currency = firstLine ? firstLine.currency : baseCurrency;
                  const isIncome = tx.type === 'income' || (tx.type === 'adjustment' && (firstLine?.signedAmount || 0) >= 0);
                  const txAccount = firstLine ? accounts.find(a => a.id === firstLine.accountId) : null;
                  const isCreditCard = tx.type === 'expense' && txAccount?.type === 'credit';

                  // Formatting details cell text based on transaction type
                  let detailsText: string;
                  if (tx.type === 'transfer') {
                    const fromL = txLines.find(l => l.signedAmount < 0);
                    const toL = txLines.find(l => l.signedAmount > 0);
                    const fromAcc = accounts.find(a => a.id === fromL?.accountId);
                    const toAcc = accounts.find(a => a.id === toL?.accountId);
                    detailsText = `${fromAcc?.name || 'Wallet'} ➔ ${toAcc?.name || 'Bank'}`;
                  } else if (tx.type === 'conversion') {
                    const fromL = txLines.find(l => l.signedAmount < 0);
                    const toL = txLines.find(l => l.signedAmount > 0);
                    const fromAcc = accounts.find(a => a.id === fromL?.accountId);
                    const toAcc = accounts.find(a => a.id === toL?.accountId);
                    const fromAmt = fromL ? Number(Math.abs(fromL.signedAmount).toFixed(2)) : 0;
                    const toAmt = toL ? Number(Math.abs(toL.signedAmount).toFixed(2)) : 0;
                    detailsText = `${fromAmt} ${fromL?.currency || baseCurrency} (${fromAcc?.name || 'Wallet'}) ➔ ${toAmt} ${toL?.currency || baseCurrency} (${toAcc?.name || 'Bank'})`;
                  } else {
                    const acc = accounts.find(a => a.id === firstLine?.accountId);
                    detailsText = acc?.name || 'Account';
                  }

                  return (
                    <TableRow key={tx.id} hover sx={{ opacity: tx.status === 'voided' ? 0.5 : 1 }}>
                      <TableCell align="center">
                        <TransactionIcon type={tx.type} size={36} isCreditCard={isCreditCard} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px' }}>
                            {tx.type === 'transfer' 
                              ? 'Transfer' 
                              : tx.type === 'conversion' 
                              ? 'Currency Exchange' 
                              : tx.type === 'adjustment' 
                              ? 'Reconciliation' 
                              : (cat?.name || 'General')}
                          </Typography>
                          <TransactionTypeChip type={tx.type} />
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25 }}>
                          {[tx.description, `${tx.date} • ${formatTime(tx.createdAt)}`].filter(Boolean).join(' • ')} {tx.status === 'voided' && '• (VOIDED)'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                          {detailsText}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {tx.type === 'conversion' ? (
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: tx.status === 'voided' ? 'text.secondary' : 'text.primary' }}>
                            Exchange Completed
                          </Typography>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: tx.status === 'voided' ? 'text.secondary' : isIncome ? 'success.main' : 'text.primary' }}>
                            {isIncome ? '+' : '-'}{amount.toLocaleString()} {currency}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton 
                            onClick={() => setEditingTx(tx)}
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
          {visibleCount < filteredTxs.length && (
            <Box sx={{ textAlign: 'center', py: 1.5 }}>
              <Button
                size="small"
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                sx={{ fontWeight: 600, fontSize: '12px', color: 'primary.main', textTransform: 'none', px: 2 }}
              >
                Load more ({filteredTxs.length - visibleCount} remaining)
              </Button>
            </Box>
          )}
        </TableContainer>
      </Stack>

      {/* Shared Edit Dialog */}
      <EditTransactionDialog
        open={Boolean(editingTx)}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
      />
    </Container>
  );
}
