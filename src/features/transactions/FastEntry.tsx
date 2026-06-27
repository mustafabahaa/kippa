import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container,
  Stack, 
  Typography, 
  Chip, 
  TextField, 
  ToggleButton, 
  ToggleButtonGroup,
  Alert,
  Grid
} from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { Account, Category, BudgetCycle, UserProfile } from '../../domain/financeTypes';
import { transactionService } from '../../services/transactionService';

interface FastEntryProps {
  householdId: string;
  userProfile: UserProfile;
  accounts: Account[];
  categories: Category[];
  activeCycle: BudgetCycle | null;
  onTransactionSaved: () => void;
}

type EntryMode = 'expense' | 'income' | 'conversion' | 'transfer';

export function FastEntry({ 
  householdId, 
  userProfile, 
  accounts, 
  categories, 
  activeCycle, 
  onTransactionSaved 
}: FastEntryProps) {
  const [mode, setMode] = useState<EntryMode>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Conversion / Transfer Specific States
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [toAmountStr, setToAmountStr] = useState('0');
  const rateSource = 'manual';

  // Keypad controls
  const handleKeypadPress = (val: string) => {
    setError(null);
    setSuccess(null);
    if (val === 'C') {
      setAmountStr('0');
    } else if (val === 'back') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(prev => prev + '.');
      }
    } else {
      setAmountStr(prev => prev === '0' ? val : prev + val);
    }
  };

  // Set defaults
  useEffect(() => {
    if (accounts.length > 0) {
      const lastUsedId = localStorage.getItem('ledger_last_used_account');
      const found = accounts.find(a => a.id === lastUsedId);
      setSelectedAccount(found || accounts[0]);
    }
    
    const expenseCats = categories.filter(c => c.type === 'expense');
    if (expenseCats.length > 0) {
      setSelectedCategory(expenseCats[0]);
    }
  }, [accounts, categories]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (mode === 'expense' && !selectedCategory) {
      setError('Please select a category');
      return;
    }

    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    try {
      if (mode === 'expense') {
        await transactionService.createTransaction(
          householdId,
          {
            type: 'expense',
            date,
            description: description || undefined,
            categoryId: selectedCategory?.id,
            budgetCycleId: activeCycle?.id || undefined,
            createdBy: userProfile.uid,
          },
          [
            {
              accountId: selectedAccount.id,
              signedAmount: -amount,
              currency: selectedAccount.currency,
            }
          ]
        );
        localStorage.setItem('ledger_last_used_account', selectedAccount.id);
        setSuccess(`Logged expense of ${amount} ${selectedAccount.currency}!`);
        setAmountStr('0');
        setDescription('');
      } 
      else if (mode === 'income') {
        await transactionService.createTransaction(
          householdId,
          {
            type: 'income',
            date,
            description: description || 'Salary',
            categoryId: selectedCategory?.id,
            budgetCycleId: activeCycle?.id || undefined,
            createdBy: userProfile.uid,
          },
          [
            {
              accountId: selectedAccount.id,
              signedAmount: amount,
              currency: selectedAccount.currency,
            }
          ]
        );
        setSuccess(`Logged income of ${amount} ${selectedAccount.currency}!`);
        setAmountStr('0');
        setDescription('');
      } 
      else if (mode === 'conversion') {
        const toAmount = parseFloat(toAmountStr);
        if (!toAccount || isNaN(toAmount) || toAmount <= 0) {
          setError('Please select a destination account and valid destination amount');
          return;
        }

        const effectiveRate = toAmount / amount;

        await transactionService.createTransaction(
          householdId,
          {
            type: 'conversion',
            date,
            description: description || `USD to EGP Conversion`,
            budgetCycleId: activeCycle?.id || undefined,
            createdBy: userProfile.uid,
          },
          [
            {
              accountId: selectedAccount.id,
              signedAmount: -amount,
              currency: selectedAccount.currency,
            },
            {
              accountId: toAccount.id,
              signedAmount: toAmount,
              currency: toAccount.currency,
            }
          ],
          {
            fromCurrency: selectedAccount.currency,
            toCurrency: toAccount.currency,
            fromAmount: amount,
            toAmount,
            effectiveRate,
            rateSource,
          }
        );
        setSuccess(`Converted ${amount} ${selectedAccount.currency} to ${toAmount} ${toAccount.currency} (Rate: ${effectiveRate.toFixed(2)})`);
        setAmountStr('0');
        setToAmountStr('0');
        setDescription('');
      } 
      else if (mode === 'transfer') {
        if (!toAccount) {
          setError('Please select a destination account');
          return;
        }

        await transactionService.createTransaction(
          householdId,
          {
            type: 'transfer',
            date,
            description: description || `Transfer to ${toAccount.name}`,
            budgetCycleId: activeCycle?.id || undefined,
            createdBy: userProfile.uid,
          },
          [
            {
              accountId: selectedAccount.id,
              signedAmount: -amount,
              currency: selectedAccount.currency,
            },
            {
              accountId: toAccount.id,
              signedAmount: amount,
              currency: toAccount.currency,
            }
          ]
        );
        setSuccess(`Transferred ${amount} ${selectedAccount.currency} from ${selectedAccount.name} to ${toAccount.name}`);
        setAmountStr('0');
        setDescription('');
      }

      onTransactionSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction');
    }
  };

  const handleModeChange = (newMode: EntryMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setAmountStr('0');
    setToAmountStr('0');
    if (newMode === 'income') {
      const incCats = categories.filter(c => c.type === 'income');
      setSelectedCategory(incCats[0] || null);
    } else {
      const expCats = categories.filter(c => c.type === 'expense');
      setSelectedCategory(expCats[0] || null);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
      <Stack spacing={3}>
        <ToggleButtonGroup
          color="primary"
          value={mode}
          exclusive
          onChange={(_, v) => v && handleModeChange(v)}
          fullWidth
          size="small"
        >
          <ToggleButton value="expense">Expense</ToggleButton>
          <ToggleButton value="income">Income</ToggleButton>
          <ToggleButton value="conversion">Convert</ToggleButton>
          <ToggleButton value="transfer">Transfer</ToggleButton>
        </ToggleButtonGroup>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={3.5}>
              {!activeCycle && (
                <Alert severity="warning">
                  No active budget cycle! Logged transactions won't be linked to a budget cycle.
                </Alert>
              )}

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  {mode === 'conversion' ? 'FROM AMOUNT' : 'AMOUNT'}
                </Typography>
                <Typography variant="h1" sx={{ fontSize: '3rem', mt: 1, fontWeight: 700 }}>
                  {amountStr} <span style={{ fontSize: '1.5rem', color: '#5f6368' }}>{selectedAccount?.currency}</span>
                </Typography>
              </Box>

              {mode === 'conversion' && (
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 3 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    TO AMOUNT
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <TextField
                      variant="standard"
                      value={toAmountStr}
                      onChange={e => setToAmountStr(e.target.value)}
                      placeholder="0"
                      inputProps={{ style: { textAlign: 'center', fontSize: '1.75rem', fontWeight: 600 } }}
                      sx={{ width: 120 }}
                    />
                    <Typography variant="h3">{toAccount?.currency || 'EGP'}</Typography>
                  </Stack>
                  {parseFloat(amountStr) > 0 && parseFloat(toAmountStr) > 0 && (
                    <Typography variant="body2" align="center" color="primary" sx={{ mt: 1 }}>
                      Effective Rate: 1 {selectedAccount?.currency} = {(parseFloat(toAmountStr) / parseFloat(amountStr)).toFixed(2)} {toAccount?.currency}
                    </Typography>
                  )}
                </Box>
              )}

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {mode === 'conversion' || mode === 'transfer' ? 'FROM ACCOUNT' : 'ACCOUNT'}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {accounts.map(acc => (
                    <Chip
                      key={acc.id}
                      label={`${acc.name} (${acc.currency})`}
                      onClick={() => {
                        setSelectedAccount(acc);
                        if (toAccount && toAccount.id === acc.id) {
                          setToAccount(null);
                        }
                      }}
                      color={selectedAccount?.id === acc.id ? 'primary' : 'default'}
                      variant={selectedAccount?.id === acc.id ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>

              {(mode === 'conversion' || mode === 'transfer') && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    TO ACCOUNT
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {accounts
                      .filter(acc => {
                        if (mode === 'conversion') {
                          return acc.currency !== selectedAccount?.currency;
                        }
                        return acc.currency === selectedAccount?.currency && acc.id !== selectedAccount?.id;
                      })
                      .map(acc => (
                        <Chip
                          key={acc.id}
                          label={`${acc.name} (${acc.currency})`}
                          onClick={() => setToAccount(acc)}
                          color={toAccount?.id === acc.id ? 'primary' : 'default'}
                          variant={toAccount?.id === acc.id ? 'filled' : 'outlined'}
                        />
                      ))}
                  </Box>
                </Box>
              )}

              {(mode === 'expense' || mode === 'income') && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    CATEGORY
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} sx={{ maxHeight: 110, overflowY: 'auto', p: 0.5 }}>
                    {categories
                      .filter(c => c.type === (mode === 'expense' ? 'expense' : 'income'))
                      .map(cat => (
                        <Chip
                          key={cat.id}
                          label={cat.name}
                          onClick={() => setSelectedCategory(cat)}
                          color={selectedCategory?.id === cat.id ? 'success' : 'default'}
                          variant={selectedCategory?.id === cat.id ? 'filled' : 'outlined'}
                          size="small"
                        />
                      ))}
                  </Box>
                </Box>
              )}

              {/* Numeric Keypad */}
              <Box>
                <Grid container spacing={1}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map(val => (
                    <Grid size={{ xs: 4 }} key={val}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleKeypadPress(val)}
                        sx={{
                          height: 52,
                          fontSize: '1.25rem',
                          borderRadius: 3,
                          borderColor: 'divider',
                          color: 'text.primary',
                          bgcolor: 'background.paper',
                          '&:hover': {
                            bgcolor: 'info.light'
                          }
                        }}
                      >
                        {val === 'back' ? <BackspaceIcon /> : val}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Description / Note (Optional)"
                  size="small"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <TextField
                  type="date"
                  label="Date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  sx={{ width: 160 }}
                />
              </Stack>

              <Button
                variant="contained"
                onClick={handleSave}
                fullWidth
                sx={{
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 4,
                  bgcolor: mode === 'expense' ? 'error.main' : mode === 'income' ? 'success.main' : 'primary.main',
                  '&:hover': {
                    bgcolor: mode === 'expense' ? 'error.dark' : mode === 'income' ? 'success.dark' : 'primary.dark'
                  }
                }}
              >
                Save {mode.toUpperCase()}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
