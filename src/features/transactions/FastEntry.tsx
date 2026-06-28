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
  Alert,
  Grid,
  IconButton
} from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import NotesIcon from '@mui/icons-material/Notes';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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
  const [showNoteField, setShowNoteField] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Conversion / Transfer Specific States
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [toAmountStr, setToAmountStr] = useState('0');
  const [isKeypadForDest, setIsKeypadForDest] = useState(false); // Controls which amount input the keypad controls

  // Keypad controls
  const handleKeypadPress = (val: string) => {
    setError(null);
    setSuccess(null);
    
    const activeSetter = isKeypadForDest ? setToAmountStr : setAmountStr;
    const activeVal = isKeypadForDest ? toAmountStr : amountStr;

    if (val === 'back') {
      activeSetter(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '.') {
      if (!activeVal.includes('.')) {
        activeSetter(prev => prev + '.');
      }
    } else {
      activeSetter(prev => prev === '0' ? val : prev + val);
    }
  };

  // Set defaults
  useEffect(() => {
    if (accounts.length > 0) {
      const lastUsedId = localStorage.getItem('ledger_last_used_account');
      const found = accounts.find(a => a.id === lastUsedId);
      setSelectedAccount(found || accounts[0]);
      if (accounts.length > 1) {
        setToAccount(accounts[1]);
      }
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
      setError('Please enter a valid amount');
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

    setIsSaving(true);

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
        setSuccess(`Saved! Logged expense of ${amount} ${selectedAccount.currency}`);
        setAmountStr('0');
        setDescription('');
        setShowNoteField(false);
        onTransactionSaved();
      } 
      else if (mode === 'income') {
        await transactionService.createTransaction(
          householdId,
          {
            type: 'income',
            date,
            description: description || 'Income',
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
        setSuccess(`Saved! Logged income of ${amount} ${selectedAccount.currency}`);
        setAmountStr('0');
        setDescription('');
        setShowNoteField(false);
        onTransactionSaved();
      } 
      else if (mode === 'conversion') {
        const toAmount = parseFloat(toAmountStr);
        if (!toAccount || isNaN(toAmount) || toAmount <= 0) {
          setError('Please select destination details');
          setIsSaving(false);
          return;
        }

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
          ]
        );
        setSuccess(`Saved conversion!`);
        setAmountStr('0');
        setToAmountStr('0');
        setDescription('');
        setShowNoteField(false);
        onTransactionSaved();
      }
      else if (mode === 'transfer') {
        if (!toAccount) {
          setError('Please select destination account');
          setIsSaving(false);
          return;
        }

        await transactionService.createTransaction(
          householdId,
          {
            type: 'transfer',
            date,
            description: description || `Transfer`,
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
        setSuccess(`Saved transfer!`);
        setAmountStr('0');
        setDescription('');
        setShowNoteField(false);
        onTransactionSaved();
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred saving transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const currentCurrencySymbol = selectedAccount?.currency === 'USD' ? '$' : 'EGP';

  return (
    <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
      <Stack spacing={2.5}>
        
        {/* Mode Selector */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {(['expense', 'income', 'conversion', 'transfer'] as EntryMode[]).map(m => (
            <Button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setSuccess(null);
              }}
              variant={mode === m ? 'contained' : 'outlined'}
              sx={{ 
                flex: 1, 
                fontSize: '11px', 
                height: 36, 
                minHeight: 36, 
                borderRadius: '8px',
                px: 1,
                bgcolor: mode === m ? 'primary.main' : 'background.paper',
                color: mode === m ? 'primary.contrastText' : 'text.primary',
                border: '1px solid',
                borderColor: mode === m ? 'primary.main' : 'divider'
              }}
            >
              {m.toUpperCase()}
            </Button>
          ))}
        </Stack>

        {/* Amount Display Area */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            py: 3, 
            bgcolor: 'background.paper', 
            borderRadius: '20px', 
            border: '1px solid', 
            borderColor: 'divider',
            cursor: 'pointer'
          }}
          onClick={() => setIsKeypadForDest(false)}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px', fontWeight: 500, mb: 1 }}>
            {mode === 'conversion' ? 'Source Amount' : 'Amount to Log'}
          </Typography>
          <Box display="flex" alignItems="baseline" sx={{ color: isKeypadForDest ? 'text.secondary' : 'primary.main' }}>
            <Typography variant="h2" sx={{ fontSize: '28px', mr: 0.5, fontWeight: 500 }}>
              {currentCurrencySymbol}
            </Typography>
            <Typography variant="h1" sx={{ fontSize: '44px', fontWeight: 700 }}>
              {amountStr}
            </Typography>
          </Box>
        </Box>

        {/* Secondary Amount Display for Conversions */}
        {mode === 'conversion' && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 2.5, 
              bgcolor: 'background.paper', 
              borderRadius: '20px', 
              border: '1px solid', 
              borderColor: isKeypadForDest ? 'primary.main' : 'divider',
              cursor: 'pointer'
            }}
            onClick={() => setIsKeypadForDest(true)}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px', fontWeight: 500, mb: 0.5 }}>
              Destination Amount
            </Typography>
            <Box display="flex" alignItems="baseline" sx={{ color: isKeypadForDest ? 'primary.main' : 'text.secondary' }}>
              <Typography variant="h2" sx={{ fontSize: '24px', mr: 0.5, fontWeight: 500 }}>
                {toAccount?.currency === 'USD' ? '$' : 'EGP'}
              </Typography>
              <Typography variant="h1" sx={{ fontSize: '36px', fontWeight: 700 }}>
                {toAmountStr}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Error / Success alerts */}
        {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ borderRadius: '12px' }}>{success}</Alert>}

        {/* Category Selection (Only for expense/income) */}
        {(mode === 'expense' || mode === 'income') && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px' }}>
                Category
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.main', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                See All
              </Typography>
            </Box>
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                overflowX: 'auto', 
                pb: 1, 
                '&::-webkit-scrollbar': { display: 'none' }, 
                msOverflowStyle: 'none', 
                scrollbarWidth: 'none' 
              }}
            >
              {categories.filter(c => c.type === mode).map(cat => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    onClick={() => setSelectedCategory(cat)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      fontSize: '13px',
                      height: 36,
                      borderRadius: '999px',
                      bgcolor: isSelected ? 'primary.main' : 'background.paper',
                      color: isSelected ? 'primary.contrastText' : 'text.secondary',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      '&:hover': { bgcolor: isSelected ? 'primary.main' : 'action.hover' }
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Account Selection */}
        <Box sx={{ width: '100%' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px', mb: 1 }}>
            {mode === 'transfer' || mode === 'conversion' ? 'Source Account' : 'From Account'}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            {accounts.map(acc => {
              const isSelected = selectedAccount?.id === acc.id;
              return (
                <Box
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc)}
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'info.light' : 'background.paper',
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '11px' }}>
                    {acc.type}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {acc.name}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Target Account Selection (Only for transfer/conversion) */}
        {(mode === 'transfer' || mode === 'conversion') && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px', mb: 1 }}>
              Destination Account
            </Typography>
            <Stack direction="row" spacing={1.5}>
              {accounts.map(acc => {
                const isSelected = toAccount?.id === acc.id;
                return (
                  <Box
                    key={acc.id}
                    onClick={() => setToAccount(acc)}
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'info.light' : 'background.paper',
                      color: isSelected ? 'primary.main' : 'text.secondary',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '11px' }}>
                      {acc.type}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                      {acc.name}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Note / Date Area */}
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Box flex={1}>
            <Button
              onClick={() => setShowNoteField(!showNoteField)}
              fullWidth
              variant="outlined"
              sx={{
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: 'text.secondary',
                fontSize: '13.5px',
                height: 48,
                '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' }
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <NotesIcon sx={{ fontSize: '20px' }} />
                Note
              </Box>
              {showNoteField ? <RemoveIcon sx={{ fontSize: '18px' }} /> : <AddIcon sx={{ fontSize: '18px' }} />}
            </Button>
          </Box>
          <Box sx={{ width: '120px' }}>
            <Box 
              sx={{ 
                height: 48, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: '16px', 
                bgcolor: 'background.paper',
                color: 'text.secondary',
                fontSize: '13.5px',
                gap: 0.5
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: '16px' }} />
              Today
            </Box>
          </Box>
        </Stack>

        {showNoteField && (
          <TextField
            multiline
            rows={2}
            fullWidth
            placeholder="Add details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
              }
            }}
          />
        )}

        {/* Custom Numeric Keypad */}
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map(k => {
              const isBack = k === 'back';
              return (
                <Button
                  key={k}
                  onClick={() => handleKeypadPress(k)}
                  fullWidth
                  sx={{
                    height: 60,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isBack ? 'surfaceOffWhite' : 'background.paper',
                    color: 'text.primary',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:active': { transform: 'scale(0.95)', bgcolor: 'info.light' }
                  }}
                >
                  {isBack ? <BackspaceIcon /> : k}
                </Button>
              );
            })}
          </Box>

          {/* Submit Action Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            fullWidth
            variant="contained"
            sx={{
              mt: 2.5,
              height: 56,
              borderRadius: '16px',
              bgcolor: 'primary.dark',
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {isSaving ? 'Saving...' : mode === 'expense' ? 'Save Expense' : mode === 'income' ? 'Save Income' : 'Save Transaction'}
          </Button>
        </Box>

      </Stack>
    </Container>
  );
}
