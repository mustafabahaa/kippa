import { useEffect, useMemo, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  InputAdornment,
  Portal,
  Stack,
  Typography,
  Chip,
  TextField,
  Skeleton,
  alpha
} from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BackspaceIcon } from '@/components/AppIcon';
import { NotesIcon } from '@/components/AppIcon';
import { AddIcon } from '@/components/AppIcon';
import { CalendarTodayIcon } from '@/components/AppIcon';
import { AccountBalanceIcon } from '@/components/AppIcon';
import { SavingsIcon } from '@/components/AppIcon';
import { PaymentsIcon } from '@/components/AppIcon';
import { CheckCircleIcon } from '@/components/AppIcon';
import { ReceiptLongIcon } from '@/components/AppIcon';
import { SearchIcon } from '@/components/AppIcon';
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
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';

type EntryMode = 'expense' | 'income' | 'transfer';

export function FastEntry() {
  const { enqueueSnackbar } = useSnackbar();
  const { householdId, userProfile } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const isSaveAnimationPreview = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('preview-save-animation') === '1';

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
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [saveFeedbackContent, setSaveFeedbackContent] = useState({
    title: 'Entry logged',
    amount: '',
    category: '',
    account: '',
  });
  const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
  }, []);

  const triggerSaveFeedback = (title: string, amount: string, category: string, account: string) => {
    if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
    setSaveFeedbackContent({ title, amount, category, account });
    setShowSaveFeedback(true);
    saveFeedbackTimerRef.current = setTimeout(() => setShowSaveFeedback(false), 1650);
  };

  // Transfer Specific States
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
    // Transfer accepts any other account — same or different currency.
    if (mode === 'transfer') return true;
    return true;
  });

  // True when the user is making a cross-currency transfer (needs a destination
  // amount + a derived rate). False for same-currency transfers and other modes.
  const isCrossCurrency =
    mode === 'transfer' &&
    !!selectedAccount &&
    !!toAccount &&
    toAccount.currency !== selectedAccount.currency;

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

  const frequentCategories = useMemo(() => {
    const used = sortedCategories.filter(category => category.score > 0);
    return (used.length > 0 ? used : sortedCategories).slice(0, 8);
  }, [sortedCategories]);

  const displayedCategories = useMemo(() => {
    if (!selectedCategory || frequentCategories.some(category => category.id === selectedCategory.id)) {
      return frequentCategories;
    }
    return [selectedCategory, ...frequentCategories.slice(0, 7)];
  }, [frequentCategories, selectedCategory]);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLocaleLowerCase();
    if (!query) return sortedCategories;
    return sortedCategories.filter(category => category.name.toLocaleLowerCase().includes(query));
  }, [categorySearch, sortedCategories]);

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

    // Transfer accepts any currency; only clear if it equals the source.
    // (Equality already handled by the `toAccountId === id` check above.)
  };

  const handleSelectMode = (m: EntryMode) => {
    setMode(m);
    setSelectedCategoryId(null);
    setCategoryDialogOpen(false);
    setCategorySearch('');
    
    if (!toAccountId || !selectedAccountId) return;
    const sourceAcc = accounts.find(a => a.id === selectedAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!sourceAcc || !toAcc) return;

    // No currency-based clearing needed: transfer accepts any currency,
    // and other modes don't use a destination account.
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
    // Development-only visual QA: preview the success motion without validation
    // or any transaction mutation. This branch is compiled out in production.
    if (isSaveAnimationPreview) {
      triggerSaveFeedback(
        mode === 'expense' ? 'Expense logged' : mode === 'income' ? 'Income logged' : 'Transfer sent',
        `${amountStr === '0' ? '250' : amountStr} ${selectedAccount?.currency ?? baseCurrency}`,
        mode === 'transfer' ? 'Transfer' : selectedCategory?.name ?? 'Food & dining',
        mode === 'transfer'
          ? `${selectedAccount?.name ?? 'EGP Cash'} → ${toAccount?.name ?? 'EGP Bank'}`
          : selectedAccount?.name ?? 'EGP Cash',
      );
      return;
    }

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
        triggerSaveFeedback(
          'Expense logged',
          `${amount} ${selectedAccount.currency}`,
          selectedCategory?.name ?? 'Expense',
          selectedAccount.name,
        );
        localStorage.setItem('ledger_last_used_account', selectedAccount.id);
        enqueueSnackbar(`Saved! Logged expense of ${amount} ${selectedAccount.currency}`, { variant: 'success' });
        setAmountStr('0');
        setDescription('');
        setSelectedCategoryId(null);
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
        triggerSaveFeedback(
          'Income logged',
          `${amount} ${selectedAccount.currency}`,
          selectedCategory?.name ?? 'Income',
          selectedAccount.name,
        );
        enqueueSnackbar(`Saved! Logged income of ${amount} ${selectedAccount.currency}`, { variant: 'success' });
        setAmountStr('0');
        setDescription('');
        setSelectedCategoryId(null);
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

        const crossCurrency = toAccount.currency !== selectedAccount.currency;
        let toAmount = 0;
        if (crossCurrency) {
          toAmount = parseFloat(toAmountStr);
          if (isNaN(toAmount) || toAmount <= 0) {
            enqueueSnackbar('Please enter a valid destination amount', { variant: 'warning' });
            return;
          }
        }

        await createTxMutation.mutateAsync({
          householdId,
          transaction: {
            type: 'transfer',
            date,
            description: description || (crossCurrency
              ? `${selectedAccount.currency} to ${toAccount.currency} Transfer`
              : 'Transfer'),
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
              signedAmount: crossCurrency ? toAmount : amount,
              currency: toAccount.currency,
            }
          ],
          ...(crossCurrency ? {
            conversionDetails: {
              fromCurrency: selectedAccount.currency,
              toCurrency: toAccount.currency,
              fromAmount: amount,
              toAmount: toAmount,
              effectiveRate: toAmount / amount,
              rateSource: 'manual' as const,
            }
          } : {}),
        });
        triggerSaveFeedback(
          'Transfer sent',
          `${amount} ${selectedAccount.currency}`,
          'Transfer',
          `${selectedAccount.name} → ${toAccount.name}`,
        );
        enqueueSnackbar('Saved transfer!', { variant: 'success' });
        setAmountStr('0');
        setToAmountStr('0');
        setDescription('');
      }
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Error occurred saving transaction', { variant: 'error' });
    }
  };

  const currentCurrencySymbol = selectedAccount?.currency ?? baseCurrency;
  const isSaving = createTxMutation.isPending;

  if (accountsLoading || categoriesLoading) {
    return (
      <Box sx={{ py: 0.5, width: '100%', maxWidth: 520, mx: 'auto' }}>
        <Stack spacing={3}>
          <PageHeader title="Fast Entry" subtitle="Log expenses, income & transfers" />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: '20px' }} />
          <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: '20px' }} />
        </Stack>
      </Box>
    );
  }

  if (accounts.length === 0) {
    return (
      <Box sx={{ py: 0.5, width: '100%', maxWidth: 520, mx: 'auto' }}>
        <Stack spacing={3}>
          <PageHeader title="Fast Entry" subtitle="Log expenses, income & transfers" />
          <EmptyLayout
            title="No accounts to log entries against"
            description="Add an account first — you'll need one to record expenses, income, or transfers."
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 0.5, pb: { xs: 12, lg: 0 }, width: '100%', maxWidth: 520, mx: 'auto' }}>
      <Stack spacing={2.5}>
        
        {/* Page Header */}
        <PageHeader title="Fast Entry" subtitle="Log expenses, income & transfers" />

        {/* Keep the entry type visible before the amount on every viewport. */}
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          {(['expense', 'income', 'transfer'] as EntryMode[]).map(m => (
            <Button
              key={m}
              onClick={() => handleSelectMode(m)}
              variant={mode === m ? 'contained' : 'outlined'}
              sx={{
                flex: 1,
                fontSize: '11px',
                height: 40,
                minHeight: 40,
                borderRadius: '16px',
                px: 1,
                bgcolor: mode === m ? 'secondary.main' : 'background.paper',
                color: mode === m ? 'secondary.contrastText' : 'text.primary',
                borderColor: mode === m ? 'transparent' : 'divider',
                '&:hover': {
                  bgcolor: mode === m ? 'secondary.main' : 'action.hover',
                  borderColor: mode === m ? 'transparent' : 'divider',
                },
              }}
            >
              {m.toUpperCase()}
            </Button>
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box sx={{ order: 2, minWidth: 0 }}>
            <Stack spacing={2.5} divider={<Divider flexItem />}>

        {/* Category Selection (Only for expense/income) */}
        {(mode === 'expense' || mode === 'income') && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px' }}>
                Category
              </Typography>
            </Box>
            {sortedCategories.length === 0 ? (
              <EmptyLayout
                title={`No ${mode} categories yet`}
                description={`Create ${mode} categories first to tag your ${mode} entries.`}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                {displayedCategories.map((cat) => {
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
                        bgcolor: isSelected ? 'secondary.main' : 'background.paper',
                        color: isSelected ? 'secondary.contrastText' : 'text.secondary',
                        borderColor: isSelected ? 'secondary.main' : 'divider',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        '&:hover': { bgcolor: isSelected ? 'secondary.main' : 'action.hover' },
                      }}
                    />
                  );
                })}
                {sortedCategories.length > displayedCategories.length && (
                  <Chip
                    icon={<AddIcon fontSize="small" />}
                    label={`More (${sortedCategories.length - displayedCategories.length})`}
                    onClick={() => setCategoryDialogOpen(true)}
                    variant="outlined"
                    sx={{
                      height: 36,
                      borderRadius: '12px',
                      borderColor: 'divider',
                      color: 'primary.main',
                      bgcolor: 'action.hover',
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Account Selection */}
        <Box sx={{ width: '100%' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px' }}>
              {mode === 'transfer' ? 'Source Account' : 'From Account'}
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
                    borderColor: isSelected ? 'transparent' : 'divider',
                    bgcolor: isSelected
                      ? theme => alpha(theme.palette.primary.main, 0.08)
                      : 'background.paper',
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
                      bgcolor: 'action.hover',
                      color: isSelected ? 'primary.main' : 'text.secondary',
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
                    {isSelected && <CheckCircleIcon sx={{ ml: 'auto', fontSize: 17, color: 'primary.main' }} />}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: isSelected ? 'primary.main' : 'text.primary' }}>
                    {acc.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Target Account Selection (Only for transfer) */}
        {mode === 'transfer' && (
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
                        borderColor: isSelected ? 'transparent' : 'divider',
                        bgcolor: isSelected
                          ? theme => alpha(theme.palette.primary.main, 0.08)
                          : 'background.paper',
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
                          bgcolor: 'action.hover',
                          color: isSelected ? 'primary.main' : 'text.secondary',
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
                        {isSelected && <CheckCircleIcon sx={{ ml: 'auto', fontSize: 17, color: 'primary.main' }} />}
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
                  ? 'No other accounts available.'
                  : 'Please select a Source Account first.'}
              </Typography>
            )}
          </Box>
        )}

        {/* Note / Date Area */}
        <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            placeholder="Note (optional)"
            value={description}
            onChange={event => setDescription(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <NotesIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
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
            </Stack>
          </Box>

        {/* Custom Numeric Keypad */}
        <Box sx={{ order: 1, minWidth: 0 }}>
        <Box>
          {/* Amount display lives directly above the keypad so the value being
              entered is always visible while typing (mobile UX). */}
          <Box
            onClick={() => isCrossCurrency && setIsKeypadForDest(false)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 2,
              mb: 1.5,
              bgcolor: (!isKeypadForDest || !isCrossCurrency) ? 'primary.dark' : 'background.paper',
              color: (!isKeypadForDest || !isCrossCurrency) ? 'primary.contrastText' : 'text.secondary',
              borderRadius: '24px',
              border: '1px solid',
              borderColor: (!isKeypadForDest || !isCrossCurrency) ? 'transparent' : 'divider',
              boxShadow: (!isKeypadForDest || !isCrossCurrency) ? '0px 4px 12px rgba(0,0,0,0.08)' : 'none',
              cursor: isCrossCurrency ? 'pointer' : 'default',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Typography variant="body2" sx={{ color: (!isKeypadForDest || !isCrossCurrency) ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontSize: '12px', fontWeight: 500, mb: 0.5 }}>
              {mode === 'transfer' ? 'Source Amount' : 'Amount to Log'}
            </Typography>
            <Box display="flex" alignItems="baseline" gap={0.5} sx={{ color: (!isKeypadForDest || !isCrossCurrency) ? 'primary.contrastText' : 'text.secondary' }}>
              <Typography color="inherit" sx={{ fontSize: '20px', fontWeight: 600 }}>
                {currentCurrencySymbol}
              </Typography>
              <Typography color="inherit" sx={{ fontSize: '32px', fontWeight: 700 }}>
                {amountStr}
              </Typography>
            </Box>
          </Box>

          {/* Destination amount (cross-currency transfer only) */}
          {isCrossCurrency && (
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
          {isCrossCurrency && (() => {
            const fromAmt = parseFloat(amountStr);
            const destAmt = parseFloat(toAmountStr);
            if (isNaN(fromAmt) || fromAmt <= 0 || isNaN(destAmt) || destAmt <= 0) return null;
            const rate = destAmt / fromAmt;
            return (
              <Typography variant="body2" align="center" sx={{ color: 'text.secondary', fontSize: '12px', mb: 1.5 }}>
                Rate: 1 {selectedAccount?.currency} = {rate.toFixed(2)} {toAccount?.currency}
              </Typography>
            );
          })()}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map(k => {
              const isBack = k === 'back';
              return (
                <Button
                  key={k}
                  onClick={() => handleKeypadPress(k)}
                  disableRipple
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
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
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
            startIcon={<CheckCircleIcon />}
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
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              display: { xs: 'none', lg: 'flex' },
            }}
          >
            {mode === 'expense' ? 'Save Expense' : mode === 'income' ? 'Save Income' : 'Save Transaction'}
          </Button>

          <Fab
            variant="extended"
            color="primary"
            aria-label={mode === 'expense' ? 'Save Expense' : mode === 'income' ? 'Save Income' : 'Save Transaction'}
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              display: { xs: 'flex', lg: 'none' },
              position: 'fixed',
              right: 18,
              bottom: 96,
              zIndex: theme => theme.zIndex.appBar + 1,
              minWidth: 112,
              gap: 1,
            }}
          >
            <CheckCircleIcon fontSize="small" />
            {isSaving ? 'Saving…' : 'Save'}
          </Fab>
        </Box>
        </Box>
        </Box>

        <Dialog
          open={categoryDialogOpen}
          onClose={() => {
            setCategoryDialogOpen(false);
            setCategorySearch('');
          }}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            Choose category
            <Typography component="span" sx={{ display: 'block', mt: 0.5, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              Frequent categories stay on the entry screen for faster logging.
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <TextField
                autoFocus
                fullWidth
                placeholder="Search categories"
                value={categorySearch}
                onChange={event => setCategorySearch(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {filteredCategories.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {filteredCategories.map(category => {
                    const isSelected = selectedCategory?.id === category.id;
                    return (
                      <Chip
                        key={category.id}
                        label={category.name}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setCategoryDialogOpen(false);
                          setCategorySearch('');
                        }}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{
                          height: 40,
                          borderRadius: '12px',
                          bgcolor: isSelected ? 'secondary.main' : 'background.paper',
                          color: isSelected ? 'secondary.contrastText' : 'text.secondary',
                          borderColor: isSelected ? 'secondary.main' : 'divider',
                        }}
                      />
                    );
                  })}
                </Box>
              ) : (
                <EmptyLayout
                  title="No matching categories"
                  description="Try another category name."
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCategoryDialogOpen(false);
                setCategorySearch('');
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Portal>
          {showSaveFeedback && (
            <Box
              role="status"
              aria-live="polite"
              aria-label="Entry saved"
              onClick={() => setShowSaveFeedback(false)}
              sx={{
                '--save-origin-x': '50%',
                '--save-origin-y': { xs: 'calc(100% - 122px)', lg: 'calc(100% - 96px)' },
                position: 'fixed',
                inset: 0,
                zIndex: theme => theme.zIndex.modal + 2,
                background: theme => `
                  radial-gradient(circle at 50% 28%, ${alpha(theme.palette.common.white, 0.12)} 0%, transparent 38%),
                  linear-gradient(155deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)
                `,
                color: 'common.white',
                pointerEvents: 'auto',
                cursor: 'pointer',
                overflow: 'hidden',
                animation: 'fastEntrySendCover 1600ms cubic-bezier(0.22, 1, 0.36, 1) both',
                '@keyframes fastEntrySendCover': {
                  '0%': {
                    opacity: 1,
                    clipPath: 'circle(0 at var(--save-origin-x) var(--save-origin-y))',
                  },
                  '22%': {
                    opacity: 1,
                    clipPath: 'circle(150vmax at var(--save-origin-x) var(--save-origin-y))',
                  },
                  '90%': {
                    opacity: 1,
                    clipPath: 'circle(150vmax at var(--save-origin-x) var(--save-origin-y))',
                  },
                  '100%': {
                    opacity: 0,
                    clipPath: 'circle(150vmax at var(--save-origin-x) var(--save-origin-y))',
                  },
                },
              }}
            >
              {[0, 1].map(ring => (
                <Box
                  key={ring}
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: { xs: 220, sm: 320 },
                    aspectRatio: '1',
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: theme => alpha(theme.palette.common.white, 0.2),
                    animation: `fastEntryRing 720ms ${100 + ring * 90}ms ease-out both`,
                    '@keyframes fastEntryRing': {
                      '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.25)' },
                      '22%': { opacity: 1 },
                      '100%': { opacity: 0, transform: 'translate(-50%, -50%) scale(2.6)' },
                    },
                  }}
                />
              ))}

              <Stack
                alignItems="center"
                spacing={0.5}
                sx={{
                  color: theme => theme.palette.common.white,
                  position: 'absolute',
                  left: '50%',
                  top: '54%',
                  width: 'min(84vw, 440px)',
                  textAlign: 'center',
                  animation: 'fastEntryCopy 1600ms cubic-bezier(0.22, 1, 0.36, 1) both',
                  '@keyframes fastEntryCopy': {
                    '0%': { transform: 'translate(-50%, 22px) scale(0.96)' },
                    '32%': { transform: 'translate(-50%, 0) scale(1)' },
                    '88%': { transform: 'translate(-50%, -4px) scale(1)' },
                    '100%': { transform: 'translate(-50%, -18px) scale(0.98)' },
                  },
                }}
              >
                <Typography
                  sx={{
                    color: theme => theme.palette.common.white,
                    fontSize: 14,
                    lineHeight: 1.4,
                    fontWeight: 700,
                    textShadow: theme => `0 2px 18px ${alpha(theme.palette.common.white, 0.16)}`,
                  }}
                >
                  {saveFeedbackContent.title}
                </Typography>
                <Typography
                  sx={{
                    color: theme => theme.palette.common.white,
                    fontSize: { xs: 38, sm: 48 },
                    lineHeight: 1.1,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {saveFeedbackContent.amount}
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  spacing={1}
                  sx={{ width: '100%', pt: 0.5, color: theme => theme.palette.common.white }}
                >
                  <Typography noWrap sx={{ maxWidth: '42%', fontSize: 13, fontWeight: 650 }}>
                    {saveFeedbackContent.category}
                  </Typography>
                  <Typography aria-hidden sx={{ fontSize: 12 }}>•</Typography>
                  <Typography noWrap sx={{ maxWidth: '50%', fontSize: 13, fontWeight: 650 }}>
                    {saveFeedbackContent.account}
                  </Typography>
                </Stack>
                <Typography sx={{ pt: 1, fontSize: 11, fontWeight: 600, color: theme => theme.palette.common.white }}>
                  Tap anywhere to continue
                </Typography>
              </Stack>

              <Stack
                alignItems="center"
                sx={{
                  position: 'absolute',
                  left: 'var(--save-origin-x)',
                  top: 'var(--save-origin-y)',
                  animation: 'fastEntrySendIcon 1100ms cubic-bezier(0.22, 1, 0.36, 1) both',
                  '@keyframes fastEntrySendIcon': {
                    '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.42) rotate(10deg)' },
                    '14%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
                    '62%': { opacity: 1, transform: 'translate(-50%, calc(-50% - 52vh)) scale(1.04) rotate(-4deg)' },
                    '82%': { opacity: 1, transform: 'translate(-50%, calc(-50% - 58vh)) scale(0.92) rotate(0deg)' },
                    '100%': { opacity: 0, transform: 'translate(-50%, calc(-50% - 64vh)) scale(0.72)' },
                  },
                }}
              >
                {[0, 1, 2].map(trail => (
                  <Box
                    key={trail}
                    sx={{
                      position: 'absolute',
                      top: 124 + trail * 22,
                      width: 11 - trail,
                      height: 11 - trail,
                      borderRadius: '50%',
                      bgcolor: 'secondary.main',
                      opacity: 0.68 - trail * 0.16,
                      animation: `fastEntryTrail 260ms ${trail * 45}ms ease-in-out infinite alternate`,
                      '@keyframes fastEntryTrail': {
                        from: { transform: 'translateY(0) scale(0.75)' },
                        to: { transform: 'translateY(8px) scale(1)' },
                      },
                    }}
                  />
                ))}
                <Box
                  sx={{
                    width: { xs: 120, sm: 132 },
                    height: { xs: 120, sm: 132 },
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'secondary.main',
                    color: 'secondary.contrastText',
                    position: 'relative',
                  }}
                >
                  <ReceiptLongIcon
                    fontSize="inherit"
                    sx={{
                      fontSize: { xs: 72, sm: 80 },
                      position: 'absolute',
                      '& path, & circle, & rect, & line, & polyline': {
                        strokeWidth: 1,
                      },
                      animation: 'fastEntryReceiptOut 1100ms ease-out both',
                      '@keyframes fastEntryReceiptOut': {
                        '0%, 45%': { opacity: 1, transform: 'scale(1) rotate(0deg)' },
                        '62%, 100%': { opacity: 0, transform: 'scale(0.55) rotate(-18deg)' },
                      },
                    }}
                  />
                  <CheckCircleIcon
                    fontSize="inherit"
                    sx={{
                      fontSize: { xs: 72, sm: 80 },
                      position: 'absolute',
                      '& path, & circle, & rect, & line, & polyline': {
                        strokeWidth: 1,
                      },
                      animation: 'fastEntryCheckIn 1100ms cubic-bezier(0.22, 1, 0.36, 1) both',
                      '@keyframes fastEntryCheckIn': {
                        '0%, 48%': { opacity: 0, transform: 'scale(0.35) rotate(18deg)' },
                        '68%, 100%': { opacity: 1, transform: 'scale(1) rotate(0deg)' },
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          )}
        </Portal>

      </Stack>
    </Box>
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
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        borderRadius: '16px',
        color: 'text.secondary',
        fontSize: '13.5px',
        gap: 0.5,
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    >
      <CalendarTodayIcon sx={{ fontSize: '16px' }} />
      {dateLabel}
    </Box>
  );
}
