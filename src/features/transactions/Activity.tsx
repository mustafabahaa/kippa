import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WorkIcon from '@mui/icons-material/Work';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FilterListIcon from '@mui/icons-material/FilterList';

import { Account, Category, FinanceTransaction, LedgerLine, CurrencyCode } from '../../domain/financeTypes';
import { transactionService } from '../../services/transactionService';

interface ActivityProps {
  householdId: string;
  transactions: FinanceTransaction[];
  ledgerLines: LedgerLine[];
  categories: Category[];
  accounts: Account[];
  onDataUpdated: () => void;
}

export function Activity({
  householdId,
  transactions,
  ledgerLines,
  categories,
  accounts,
  onDataUpdated
}: ActivityProps) {
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
      alert('Please enter a valid amount.');
      return;
    }

    const signedAmount = editType === 'income' ? amount : -amount;
    const txLines = ledgerLines.filter(l => l.transactionId === editingTx.id);
    const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
    const currency = firstLine ? firstLine.currency : 'EGP';

    await transactionService.updateTransaction(
      householdId,
      editingTx.id,
      {
        description: editDesc,
        date: editDate,
        categoryId: editCatId || undefined,
        type: editType
      },
      {
        accountId: editAccId,
        signedAmount: signedAmount,
        currency: currency as CurrencyCode
      }
    );

    setEditingTx(null);
    onDataUpdated();
  };

  // Void Transaction
  const handleVoid = async (txId: string) => {
    if (window.confirm('Are you sure you want to void this transaction?')) {
      await transactionService.voidTransaction(householdId, txId);
      onDataUpdated();
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

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            All Activity
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            View and manage all transaction histories and entries
          </Typography>
        </Box>

        {/* Filter Toolbar Card */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
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
                <FormControl size="small" fullWidth>
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

                <FormControl size="small" fullWidth>
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

                <FormControl size="small" fullWidth>
                  <InputLabel id="filter-type-label">Type</InputLabel>
                  <Select
                    labelId="filter-type-label"
                    value={selectedType}
                    label="Type"
                    onChange={e => setSelectedType(e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="income">Incomes</MenuItem>
                    <MenuItem value="expense">Expenses</MenuItem>
                    <MenuItem value="transfer">Transfers</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Transactions Table/List */}
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Date & Details</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5, width: '100px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No matching activities found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTxs.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const isIncome = tx.type === 'income' || (tx.type === 'adjustment' && (ledgerLines.find(l => l.transactionId === tx.id)?.signedAmount || 0) >= 0);
                  const txLines = ledgerLines.filter(l => l.transactionId === tx.id);
                  const firstLine = txLines.find(l => l.signedAmount !== 0) || txLines[0];
                  const amount = firstLine ? Math.abs(firstLine.signedAmount) : 0;
                  const currency = firstLine ? firstLine.currency : 'EGP';

                  return (
                    <TableRow key={tx.id} hover sx={{ opacity: tx.status === 'voided' ? 0.5 : 1 }}>
                      <TableCell sx={{ py: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: getTxIconBg(tx.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getTxIcon(tx.type)}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                              {tx.description || cat?.name || 'General Adjustment'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                              {tx.date} • {firstLine ? accounts.find(a => a.id === firstLine.accountId)?.name : 'System'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 1, fontSize: '13px' }}>
                        {tx.type === 'adjustment' ? 'System' : (cat?.name || 'Uncategorized')}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1, fontWeight: 'bold', fontSize: '13px', color: tx.status === 'voided' ? 'text.disabled' : isIncome ? '#1E8E3E' : 'text.primary' }}>
                        {tx.status === 'voided' ? '[VOIDED] ' : isIncome ? '+' : '-'}{amount.toLocaleString()} {currency}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenEdit(tx)}
                            disabled={tx.status === 'voided'}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon sx={{ fontSize: '16px' }} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleVoid(tx.id)}
                            disabled={tx.status === 'voided'}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon sx={{ fontSize: '16px' }} />
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
          <Button onClick={handleSaveEdit} variant="contained" sx={{ borderRadius: '12px', boxShadow: 'none' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
