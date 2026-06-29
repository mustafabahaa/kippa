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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControlLabel,
  Checkbox,
  Skeleton
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import EditIcon from '@mui/icons-material/Edit';
import { 
  useAccounts, 
  useCreateAccountMutation, 
  useUpdateAccountMutation 
} from '@/hooks/useFinance';
import { Account, AccountType, CurrencyCode } from '@/domain/financeTypes';
import { useAppContext } from '@/hooks/useAppContext';

export function Accounts() {
  const { householdId } = useAppContext();
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('bank');
  const [newAccCurrency, setNewAccCurrency] = useState<CurrencyCode>('EGP');

  // Edit Account State
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccType, setEditAccType] = useState<AccountType>('bank');
  const [editAccCurrency, setEditAccCurrency] = useState<CurrencyCode>('EGP');
  const [editAccIsActive, setEditAccIsActive] = useState(true);

  // Queries & Mutations
  const { data: accounts = [], isLoading } = useAccounts(householdId);
  const createAccountMutation = useCreateAccountMutation();
  const updateAccountMutation = useUpdateAccountMutation();

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccType(acc.type);
    setEditAccCurrency(acc.currency);
    setEditAccIsActive(acc.isActive);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !editAccName.trim()) return;

    const updated: Account = {
      ...editingAccount,
      name: editAccName,
      type: editAccType,
      currency: editAccCurrency,
      isActive: editAccIsActive
    };

    await updateAccountMutation.mutateAsync({
      householdId,
      accountId: editingAccount.id,
      updated
    });
    setEditingAccount(null);
  };

  const handleCreateAccount = async () => {
    if (!newAccName.trim()) return;

    const nextOrder = accounts.length > 0 ? Math.max(...accounts.map(a => a.sortOrder)) + 1 : 1;

    await createAccountMutation.mutateAsync({
      householdId,
      account: {
        name: newAccName,
        type: newAccType,
        currency: newAccCurrency,
        isActive: true,
        sortOrder: nextOrder
      }
    });

    setNewAccName('');
  };

  const getAccountIcon = (type: string) => {
    if (type.toLowerCase() === 'savings' || type.toLowerCase() === 'savings bank') {
      return <SavingsIcon sx={{ color: 'text.secondary' }} />;
    }
    if (type.toLowerCase() === 'cash' || type.toLowerCase() === 'wallet') {
      return <PaymentsIcon sx={{ color: 'text.secondary' }} />;
    }
    return <AccountBalanceIcon sx={{ color: 'text.secondary' }} />;
  };

  return (
    <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Bank Accounts
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            Manage EGP and USD bank accounts and wallets
          </Typography>
        </Box>

        {/* Current Accounts List */}
        <Stack spacing={1}>
          {isLoading ? (
            [1, 2].map(i => (
              <Skeleton 
                key={i} 
                variant="rectangular" 
                width="100%" 
                height={76} 
                sx={{ borderRadius: '20px' }} 
                animation="wave" 
              />
            ))
          ) : (
            accounts.map(acc => (
              <Box 
                key={acc.id} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: '20px', 
                  bgcolor: 'background.paper', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getAccountIcon(acc.type)}
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{acc.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                      {acc.type.toUpperCase()} • {acc.currency}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: acc.isActive ? 'success.main' : 'text.disabled' }}>
                    {acc.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                  <IconButton size="small" onClick={() => handleOpenEdit(acc)}>
                    <EditIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </Stack>
              </Box>
            ))
          )}
        </Stack>

        <Divider />

        {/* Add Account Card */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, color: 'text.primary', mb: 2 }}>
              Add New Account
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Account Name"
                placeholder="e.g. CIB Bank"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <FormControl fullWidth size="small">
                <InputLabel id="acc-type-label">Account Type</InputLabel>
                <Select
                  labelId="acc-type-label"
                  value={newAccType}
                  label="Account Type"
                  onChange={e => setNewAccType(e.target.value as AccountType)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="bank">Bank Account</MenuItem>
                  <MenuItem value="cash">Cash Wallet</MenuItem>
                  <MenuItem value="card">Credit Card</MenuItem>
                  <MenuItem value="savings">Savings Account</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="acc-currency-label">Currency</InputLabel>
                <Select
                  labelId="acc-currency-label"
                  value={newAccCurrency}
                  label="Currency"
                  onChange={e => setNewAccCurrency(e.target.value as CurrencyCode)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="EGP">EGP (Egyptian Pound)</MenuItem>
                  <MenuItem value="USD">USD (US Dollar)</MenuItem>
                </Select>
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreateAccount}
                loading={createAccountMutation.isPending}
                sx={{
                  py: 1.2,
                  borderRadius: '12px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Create Account
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Edit Account Dialog */}
      <Dialog open={Boolean(editingAccount)} onClose={() => setEditingAccount(null)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Account</DialogTitle>
        <DialogContent sx={{ minWidth: 280, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Account Name"
              value={editAccName}
              onChange={e => setEditAccName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="edit-acc-type-label">Account Type</InputLabel>
              <Select
                labelId="edit-acc-type-label"
                value={editAccType}
                label="Account Type"
                onChange={e => setEditAccType(e.target.value as AccountType)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="bank">Bank Account</MenuItem>
                <MenuItem value="cash">Cash Wallet</MenuItem>
                <MenuItem value="card">Credit Card</MenuItem>
                <MenuItem value="savings">Savings Account</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="edit-acc-currency-label">Currency</InputLabel>
              <Select
                labelId="edit-acc-currency-label"
                value={editAccCurrency}
                label="Currency"
                onChange={e => setEditAccCurrency(e.target.value as CurrencyCode)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="EGP">EGP (Egyptian Pound)</MenuItem>
                <MenuItem value="USD">USD (US Dollar)</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editAccIsActive}
                  onChange={e => setEditAccIsActive(e.target.checked)}
                />
              }
              label="Account is Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditingAccount(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleUpdateAccount} variant="contained" loading={updateAccountMutation.isPending} sx={{ borderRadius: '12px', boxShadow: 'none' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
