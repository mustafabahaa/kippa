import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Chip,
  TextField,
  Skeleton
} from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import BackspaceIcon from '@mui/icons-material/Backspace';
import NotesIcon from '@mui/icons-material/Notes';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import { isToday, format } from 'date-fns';
import {
  useAccounts,
  useCategories,
  useCategoryFrequency,
  useCycles,
  useCreateTransactionMutation,
  useHouseholdBaseCurrency
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { PageHeader } from '@/features/shared/components/PageHeader';

type EntryMode = 'expense' | 'income' | 'conversion' | 'transfer';

export function FastEntry() {
  const { enqueueSnackbar } = useSnackbar();
  const { householdId, userProfile } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();

  const getAccountIcon = (type: string) => {
    const iconStyle = { fontSize: '14px', color: 'inherit' };
    if (type.toLowerCase() === 'savings' || type.toLowerCase() === 'savings bank') {
      return <SavingsIcon sx={iconStyle} />;
    }
    if (type.toLowerCase() === 'cash' || type.toLowerCase() === 'wallet') {
      return <PaymentsIcon sx={iconStyle} />;
    }
    return <AccountBalanceIcon sx={iconStyle} />;
  };
  const [mode, setMode] = useState<EntryMode>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  // Conversion / Transfer Specific States
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [toAmountStr, setToAmountStr] = useState('0');
  const [isKeypadForDest, setIsKeypadForDest] = useState(false); // Controls which amount input the keypad controls

  // Queries & Mutations
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const createTxMutation = useCreateTransactionMutation();

  const frequencyScores = useCategoryFrequency(
    householdId,
    mode === 'income' ? 'income' : 'expense'
  );

  const activeCycle = cycles.find(c => c.status === 'open') || null;
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // YYYY-MM-DD string submitted to the backend
  const date = format(entryDate, 'yyyy-MM-dd');
  const dateLabel = isToday(entryDate) ? 'Today' : format(entryDate, 'MMM d');

  // Sort accounts so base-currency running accounts come first, then cash accounts, then everything else (e.g. USD).
  // Priority: base-currency running account (0) -> cash type (1) -> other (2). Stable within each tier.
  const sortedAccounts = [...accounts].sort((a, b) => {
    const rank = (acc: typeof a) => {
      if (acc.currency === baseCurrency && acc.type === 'running') return 0;
      if (acc.type === 'cash') return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });

  // Derive selected items. Accounts default to nothing — the user must
  // explicitly pick one, and we warn via snackbar if they forget on save.
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  const toAccount = accounts.find(a => a.id === toAccountId) || null;

  // Filter destination accounts based on chosen mode and source account
  const eligibleDestinationAccounts = sortedAccounts.filter(acc => {
    if (acc.id === selectedAccountId) return false;
    if (!selectedAccount) return true;
    if (mode === 'conversion') {
      return acc.currency !== selectedAccount.currency;
    }
    if (mode === 'transfer') {
      return acc.currency === selectedAccount.currency;
    }
    return true;
  });

  const selectedCategory = (selectedCategoryId && categories.find(c => c.id === selectedCategoryId && c.type === mode))
    || null;

  const sortedCategories = useMemo(() => {
    if (mode !== 'expense' && mode !== 'income') return [];
    return categories
      .filter((c) => c.type === mode)
      .map((c) => ({
        ...c,
        score: frequencyScores[c.id] ?? 0,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score; // score DESC
        return a.name.localeCompare(b.name); // name ASC tiebreak
      });
  }, [categories, mode, frequencyScores]);

  // Event handlers to update state and reset target/destination account if it is invalid for the chosen mode or source account.
  const handleSelectSourceAccount = (id: string | null) => {
    setSelectedAccountId(id);
    if (!id || !toAccountId) return;
    const sourceAcc = accounts.find(a => a.id === id);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!sourceAcc || !toAcc) return;

    if (toAccountId === id) {
      setToAccountId(null);
      return;
    }

    if (mode === 'conversion' && toAcc.currency === sourceAcc.currency) {
      setToAccountId(null);
    } else if (mode === 'transfer' && toAcc.currency !== sourceAcc.currency) {
      setToAccountId(null);
    }
  };

  const handleSelectMode = (m: EntryMode) => {
    setMode(m);
    setSelectedCategoryId(null);
    
    if (!toAccountId || !selectedAccountId) return;
    const sourceAcc = accounts.find(a => a.id === selectedAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!sourceAcc || !toAcc) return;

    if (m === 'conversion' && toAcc.currency === sourceAcc.currency) {
      setToAccountId(null);
    } else if (m === 'transfer' && toAcc.currency !== sourceAcc.currency) {
      setToAccountId(null);
    }
  };

  // Keypad controls
  const handleKeypadPress = (val: string) => {
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

  const handleSave = async () => {
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid amount', { variant: 'warning' });
      return;
    }

    if ((mode === 'expense' || mode === 'income') && !selectedCategory) {
      enqueueSnackbar('Please select a category before continuing', { variant: 'warning' });
      return;
    }

    if (!selectedAccount) {
      enqueueSnackbar('Please select a From Account', { variant: 'warning' });
      return;
    }

    try {
      if (mode === 'expense') {
        await createTxMutation.mutateAsync({
          householdId,
          transaction: {
            type: 'expense',
            date,
            description: description || null,
            categoryId: selectedCategory?.id || null,
            budgetCycleId: activeCycle?.id || null,
            createdBy: userProfile!.uid,
          },
          lines: [
            {
              accountId: selectedAccount.id,
              signedAmount: -amount,
              currency: selectedAccount.currency,
            }
          ]
        });
        localStorage.setItem('ledger_last_used_account', selectedAccount.id);
        enqueueSnackbar(`Saved! Logged expense of ${amount} ${selectedAccount.currency}`, { variant: 'success' });
        setAmountStr('0');
        setDescription('');
        setSelectedCategoryId(null);
        setShowNoteField(false);
      } 
      else if (mode === 'income') {
        await createTxMutation.mutateAsync({
          householdId,
          transaction: {
            type: 'income',
            date,
            description: description || 'Income',
            categoryId: selectedCategory?.id || null,
            budgetCycleId: activeCycle?.id || null,
            createdBy: userProfile!.uid,
          },
          lines: [
            {
              accountId: selectedAccount.id,
              signedAmount: amount,
              currency: selectedAccount.currency,
            }
          ]
        });
        enqueueSnackbar(`Saved! Logged income of ${amount} ${selectedAccount.currency}`, { variant: 'success' });
        setAmountStr('0');
        setDescription('');
        setSelectedCategoryId(null);
        setShowNoteField(false);
      } 
      else if (mode === 'conversion') {
        if (!toAccount) {
          enqueueSnackbar('Please select a Destination Account', { variant: 'warning' });
          return;
        }
        if (toAccount.id === selectedAccount.id) {
          enqueueSnackbar('Source and Destination accounts must be different', { variant: 'warning' });
          return;
        }
        if (toAccount.currency === selectedAccount.currency) {
          enqueueSnackbar('Source and Destination currencies must be different for a conversion', { variant: 'warning' });
          return;
        }
        const toAmount = parseFloat(toAmountStr);
        if (isNaN(toAmount) || toAmount <= 0) {
          enqueueSnackbar('Please enter a valid destination amount', { variant: 'warning' });
          return;
        }

        await createTxMutation.mutateAsync({
          householdId,
          transaction: {
            type: 'conversion',
            date,
            description: description || `${selectedAccount.currency} to ${toAccount.currency} Conversion`,
            budgetCycleId: activeCycle?.id || null,
            createdBy: userProfile!.uid,
          },
          lines: [
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
          conversionDetails: {
            fromCurrency: selectedAccount.currency,
            toCurrency: toAccount.currency,
            fromAmount: amount,
            toAmount: toAmount,
            effectiveRate: toAmount / amount,
            rateSource: 'manual',
          }
        });
        enqueueSnackbar('Saved conversion!', { variant: 'success' });
        setAmountStr('0');
        setToAmountStr('0');
        setDescription('');
        setShowNoteField(false);
      }
      else if (mode === 'transfer') {
        if (!toAccount) {
          enqueueSnackbar('Please select a Destination Account', { variant: 'warning' });
          return;
        }
        if (toAccount.id === selectedAccount.id) {
          enqueueSnackbar('Source and Destination accounts must be different', { variant: 'warning' });
          return;
        }
        if (toAccount.currency !== selectedAccount.currency) {
          enqueueSnackbar('Source and Destination currencies must be the same for a transfer. Use Conversion instead.', { variant: 'warning' });
          return;
        }

        await createTxMutation.mutateAsync({
          householdId,
          transaction: {
            type: 'transfer',
            date,
            description: description || `Transfer`,
            budgetCycleId: activeCycle?.id || null,
            createdBy: userProfile!.uid,
          },
          lines: [
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
        });
        enqueueSnackbar('Saved transfer!', { variant: 'success' });
        setAmountStr('0');
        setDescription('');
        setShowNoteField(false);
      }
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Error occurred saving transaction', { variant: 'error' });
    }
  };

  const currentCurrencySymbol = selectedAccount?.currency ?? baseCurrency;
  const isSaving = createTxMutation.isPending;

  if (accountsLoading || categoriesLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <PageHeader title="Fast Entry" subtitle="Log expenses, income, conversions & transfers" />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: '20px' }} />
          <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: '20px' }} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5}>
        
        {/* Page Header */}
        <PageHeader title="Fast Entry" subtitle="Log expenses, income, conversions & transfers" />

        {/* Mode Selector */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {(['expense', 'income', 'conversion', 'transfer'] as EntryMode[]).map(m => (
            <Button
              key={m}
              onClick={() => handleSelectMode(m)}
              variant={mode === m ? 'contained' : 'outlined'}
              sx={{ 
                flex: 1, 
                fontSize: '11px', 
                height: 36, 
                minHeight: 36, 
                borderRadius: '16px',
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

        {/* Category Selection (Only for expense/income) */}
        {(mode === 'expense' || mode === 'income') && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px' }}>
                Category
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {sortedCategories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      fontSize: '13px',
                      height: 36,
                      borderRadius: '12px',
                      bgcolor: isSelected ? 'primary.main' : 'background.paper',
                      color: isSelected ? 'primary.contrastText' : 'text.secondary',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      '&:hover': { bgcolor: isSelected ? 'primary.main' : 'action.hover' },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Account Selection */}
        <Box sx={{ width: '100%' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px' }}>
              {mode === 'transfer' || mode === 'conversion' ? 'Source Account' : 'From Account'}
            </Typography>
            {!selectedAccount && (
              <Typography variant="caption" sx={{ color: 'error.main', fontSize: '11px', fontWeight: 600 }}>
                Tap to select
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {sortedAccounts.map(acc => {
              const isSelected = selectedAccount?.id === acc.id;
              return (
                <Box
                  key={acc.id}
                  onClick={() => handleSelectSourceAccount(acc.id)}
                  sx={{
                    flex: { xs: '1 1 calc(50% - 9px)', sm: '1 1 0' },
                    minWidth: 0,
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
                  <Box display="flex" alignItems="center" gap={1} sx={{ width: '100%', mb: 0.5 }}>
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '8px', 
                      bgcolor: isSelected ? 'primary.main' : 'action.hover', 
                      color: isSelected ? 'primary.contrastText' : 'text.secondary', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getAccountIcon(acc.type)}
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '11px', textTransform: 'capitalize' }}>
                      {acc.type}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: isSelected ? 'primary.main' : 'text.primary' }}>
                    {acc.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Target Account Selection (Only for transfer/conversion) */}
        {(mode === 'transfer' || mode === 'conversion') && (
          <Box sx={{ width: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px' }}>
                Destination Account
              </Typography>
              {!toAccount && (
                <Typography variant="caption" sx={{ color: 'error.main', fontSize: '11px', fontWeight: 600 }}>
                  Tap to select
                </Typography>
              )}
            </Box>
            {eligibleDestinationAccounts.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {eligibleDestinationAccounts.map(acc => {
                  const isSelected = toAccount?.id === acc.id;
                  return (
                    <Box
                      key={acc.id}
                      onClick={() => setToAccountId(acc.id)}
                      sx={{
                        flex: { xs: '1 1 calc(50% - 9px)', sm: '1 1 0' },
                        minWidth: 0,
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
                      <Box display="flex" alignItems="center" gap={1} sx={{ width: '100%', mb: 0.5 }}>
                        <Box sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '8px', 
                          bgcolor: isSelected ? 'primary.main' : 'action.hover', 
                          color: isSelected ? 'primary.contrastText' : 'text.secondary', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {getAccountIcon(acc.type)}
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '11px', textTransform: 'capitalize' }}>
                          {acc.type}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: isSelected ? 'primary.main' : 'text.primary' }}>
                        {acc.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '13px', py: 1 }}>
                {selectedAccountId 
                  ? (mode === 'conversion' 
                      ? 'No accounts with a different currency available.' 
                      : 'No other accounts with the same currency available.')
                  : 'Please select a Source Account first.'}
              </Typography>
            )}
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
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <MobileDatePicker
              value={entryDate}
              onChange={(newValue) => newValue && setEntryDate(newValue)}
              maxDate={new Date()}
              closeOnSelect
              open={datePickerOpen}
              onOpen={() => setDatePickerOpen(true)}
              onClose={() => setDatePickerOpen(false)}
              slots={{ field: DateButtonField }}
              slotProps={{
                field: { dateLabel, setOpen: setDatePickerOpen } as any,
              }}
            />
          </LocalizationProvider>
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
          {/* Amount display lives directly above the keypad so the value being
              entered is always visible while typing (mobile UX). */}
          <Box
            onClick={() => mode === 'conversion' && setIsKeypadForDest(false)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 2,
              mb: 1.5,
              bgcolor: (!isKeypadForDest || mode !== 'conversion') ? 'primary.dark' : 'background.paper',
              color: (!isKeypadForDest || mode !== 'conversion') ? 'primary.contrastText' : 'text.secondary',
              borderRadius: '24px',
              border: '1px solid',
              borderColor: (!isKeypadForDest || mode !== 'conversion') ? 'transparent' : 'divider',
              boxShadow: (!isKeypadForDest || mode !== 'conversion') ? '0px 4px 12px rgba(0,0,0,0.08)' : 'none',
              cursor: mode === 'conversion' ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="body2" sx={{ color: (!isKeypadForDest || mode !== 'conversion') ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontSize: '12px', fontWeight: 500, mb: 0.5 }}>
              {mode === 'conversion' ? 'Source Amount' : 'Amount to Log'}
            </Typography>
            <Box display="flex" alignItems="baseline" gap={0.5} sx={{ color: (!isKeypadForDest || mode !== 'conversion') ? 'primary.contrastText' : 'text.secondary' }}>
              <Typography color="inherit" sx={{ fontSize: '20px', fontWeight: 600 }}>
                {currentCurrencySymbol}
              </Typography>
              <Typography color="inherit" sx={{ fontSize: '32px', fontWeight: 700 }}>
                {amountStr}
              </Typography>
            </Box>
          </Box>

          {/* Destination amount (conversion mode only) */}
          {mode === 'conversion' && (
            <Box
              onClick={() => setIsKeypadForDest(true)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1.5,
                mb: 1.5,
                bgcolor: isKeypadForDest ? 'primary.dark' : 'background.paper',
                color: isKeypadForDest ? 'primary.contrastText' : 'text.secondary',
                borderRadius: '24px',
                border: '1px solid',
                borderColor: isKeypadForDest ? 'transparent' : 'divider',
                boxShadow: isKeypadForDest ? '0px 4px 12px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Typography variant="body2" sx={{ color: isKeypadForDest ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontSize: '12px', fontWeight: 500, mb: 0.5 }}>
                Destination Amount
              </Typography>
              <Box display="flex" alignItems="baseline" gap={0.5} sx={{ color: isKeypadForDest ? 'primary.contrastText' : 'text.secondary' }}>
                <Typography color="inherit" sx={{ fontSize: '18px', fontWeight: 600 }}>
                  {toAccount?.currency ?? baseCurrency}
                </Typography>
                <Typography color="inherit" sx={{ fontSize: '28px', fontWeight: 700 }}>
                  {toAmountStr}
                </Typography>
              </Box>
            </Box>
          )}
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
                    borderRadius: '16px',
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
            loading={isSaving}
            loadingPosition="start"
            startIcon={<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
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
            {mode === 'expense' ? 'Save Expense' : mode === 'income' ? 'Save Income' : 'Save Transaction'}
          </Button>
        </Box>

      </Stack>
    </Container>
  );
}

/**
 * Custom field slot for MobileDatePicker — renders as a compact pill matching the
 * Note button style, instead of the default editable input. Tapping it opens the
 * calendar dialog via the `setOpen` prop passed through `slotProps.field`.
 */
function DateButtonField({ dateLabel, setOpen }: { dateLabel?: string; setOpen?: (open: boolean) => void }) {
  return (
    <Box
      onClick={() => setOpen?.(true)}
      sx={{
        width: '120px',
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
        gap: 0.5,
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <CalendarTodayIcon sx={{ fontSize: '16px' }} />
      {dateLabel}
    </Box>
  );
}
