import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  Container,
  Stack,
  Typography,
  Button,
  TextField,
  Chip,
  Divider,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCycles,
  useReconciliationHistory,
  useCreateTransactionMutation,
  useSaveReconciliationMutation,
  useHouseholdBaseCurrency
} from '@/hooks/useFinance';
import { Reconciliation as ReconModel } from '@/domain/financeTypes';
import { useAppContext } from '@/hooks/useAppContext';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';

type AdjustmentReason = 'forgotten expense' | 'bank fee' | 'exchange difference' | 'cash counting correction' | 'unknown difference';

export function Reconciliation() {
  const { enqueueSnackbar } = useSnackbar();
  const { householdId, userProfile } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const theme = useTheme();
  const { maskDigits, privacyMode } = usePrivacyMask();

  const getAccountIcon = (type: string, size = '14px') => {
    const iconStyle = { fontSize: size, color: 'inherit' };
    if (type.toLowerCase() === 'savings' || type.toLowerCase() === 'savings bank') {
      return <SavingsIcon sx={iconStyle} />;
    }
    if (type.toLowerCase() === 'cash' || type.toLowerCase() === 'wallet') {
      return <PaymentsIcon sx={iconStyle} />;
    }
    return <AccountBalanceIcon sx={iconStyle} />;
  };

  // Queries
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions = [], isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const { data: history = [], isLoading: historyLoading } = useReconciliationHistory(householdId);

  // Mutations
  const createTxMutation = useCreateTransactionMutation();
  const saveReconMutation = useSaveReconciliationMutation();

  // Sort accounts so base-currency accounts come first, then cash, then everything else.
  const sortedAccounts = [...accounts].sort((a, b) => {
    const rank = (acc: typeof a) => {
      if (acc.currency === baseCurrency) return 0;
      if (acc.type === 'cash') return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || sortedAccounts[0] || null;
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [reason, setReason] = useState<AdjustmentReason>('forgotten expense');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeCycle = cycles.find(c => c.status === 'open') || null;



  const isLoading = accountsLoading || txsLoading || linesLoading || historyLoading;

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Box sx={{ mt: 1 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '20px' }} />
        </Stack>
      </Container>
    );
  }

  // Calculate balances map on the fly
  const activeTxIds = new Set(transactions.filter(t => t.status === 'posted').map(t => t.id));
  const activeLines = ledgerLines.filter(line => activeTxIds.has(line.transactionId));
  const balancesMap: Record<string, number> = {};
  accounts.forEach(acc => {
    balancesMap[acc.id] = 0;
  });
  activeLines.forEach(line => {
    if (balancesMap[line.accountId] !== undefined) {
      balancesMap[line.accountId] += line.signedAmount;
    }
  });

  const getCalculatedBalance = (): number => {
    if (!selectedAccount) return 0;
    return balancesMap[selectedAccount.id] || 0;
  };

  const calculatedBalance = getCalculatedBalance();
  const actualBalance = parseFloat(actualBalanceInput) || 0;
  const difference = selectedAccount ? Number((actualBalance - calculatedBalance).toFixed(2)) : 0;

  const handleResolve = async () => {
    if (!selectedAccount) return;
    setIsProcessing(true);

    try {
      let adjustmentTransactionId: string | null = null;

      // 1. If difference is non-zero, write an adjustment transaction
      if (Math.abs(difference) > 0.001) {
        adjustmentTransactionId = await createTxMutation.mutateAsync({
          householdId,
          transaction: {
            type: 'adjustment',
            date: new Date().toISOString().split('T')[0],
            description: `Balance Correction (${reason}): ${note || 'Manual Reconciliation adjustment'}`,
            createdBy: userProfile!.uid,
            budgetCycleId: activeCycle?.id || null,
          },
          lines: [
            {
              accountId: selectedAccount.id,
              signedAmount: difference,
              currency: selectedAccount.currency,
            }
          ]
        });
      }

      // 2. Log Reconciliation event
      const reconId = crypto.randomUUID();
      const reconLog: ReconModel = {
        id: reconId,
        householdId,
        accountId: selectedAccount.id,
        date: new Date().toISOString().split('T')[0],
        calculatedBalance,
        actualBalance,
        difference,
        currency: selectedAccount.currency,
        createdBy: userProfile!.uid,
        createdAt: new Date().toISOString(),
        adjustmentTransactionId,
        note: note.trim() || null,
      };

      await saveReconMutation.mutateAsync({
        householdId,
        reconId,
        reconLog
      });

      enqueueSnackbar(privacyMode
        ? 'Reconciliation saved! Difference corrected.'
        : `Reconciliation saved! Difference of ${difference.toFixed(2)} ${selectedAccount.currency} corrected.`, { variant: 'success' });
      setActualBalanceInput('');
      setNote('');
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to process reconciliation', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Sort history locally
  const sortedHistory = [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <PageHeader
          title="Reconciliation"
          subtitle="Audit your account balances manually to keep records perfectly aligned."
        />

        {/* Account Selection */}
        <Box sx={{ width: '100%' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px', mb: 1 }}>
            Select Account
          </Typography>
          {sortedAccounts.length === 0 ? (
            <EmptyLayout
              title="No accounts to reconcile"
              description="Create an account first, then come back here to balance-check it."
            />
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {sortedAccounts.map(acc => {
              const isSelected = selectedAccount?.id === acc.id;
              return (
                <Box
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setActualBalanceInput('');
                  }}
                  sx={{
                    flex: { xs: '1 1 calc(50% - 9px)', sm: '1 1 0' },
                    minWidth: 0,
                    p: 1.5,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.selected',
                      transform: 'translateY(-1px)',
                    }
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
                      {acc.type} ({acc.currency})
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', color: isSelected ? 'primary.main' : 'text.primary' }}>
                    {acc.name}
                  </Typography>
                </Box>
              );
            })}
            </Box>
          )}
        </Box>

        {selectedAccount && (
          <Stack spacing={2.5}>
            {/* Balance comparison: Calculated → Actual = Difference */}
            <Box
              sx={{
                p: 2,
                borderRadius: '20px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Calculated */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 500, mb: 0.5 }}>
                    Calculated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '15px', color: 'text.primary' }}>
                    {maskDigits(`${calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px' }}>
                    {selectedAccount.currency}
                  </Typography>
                </Box>

                <Typography sx={{ color: 'text.disabled', fontSize: '20px', fontWeight: 300, px: 0.5 }}>
                  −
                </Typography>

                {/* Actual input */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 500, mb: 0.5 }}>
                    Actual
                  </Typography>
                  <TextField
                    type="number"
                    variant="standard"
                    placeholder="0.00"
                    fullWidth
                    value={privacyMode && actualBalanceInput ? maskDigits(actualBalanceInput) : actualBalanceInput}
                    onChange={e => setActualBalanceInput(e.target.value)}
                    sx={{
                      '& .MuiInput-root': {
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: 'text.primary',
                        '&:before': { display: 'none' },
                        '&:after': { display: 'none' },
                      },
                      '& .MuiInput-input': { py: 0, px: 0 },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px' }}>
                    {selectedAccount.currency}
                  </Typography>
                </Box>

                <Typography sx={{ color: 'text.disabled', fontSize: '20px', fontWeight: 300, px: 0.5 }}>
                  =
                </Typography>

                {/* Difference */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 500, mb: 0.5 }}>
                    Difference
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '15px',
                      color: Math.abs(difference) < 0.01
                        ? 'text.primary'
                        : difference > 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {difference > 0 ? '+' : ''}{maskDigits(`${difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px' }}>
                    {selectedAccount.currency}
                  </Typography>
                </Box>
              </Box>

              {Math.abs(difference) < 0.01 && actualBalanceInput !== '' && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: '14px', color: 'success.main' }} />
                  <Typography variant="body2" sx={{ color: 'success.main', fontSize: '11px', fontWeight: 600 }}>
                    Perfect match — records are aligned.
                  </Typography>
                </Box>
              )}
            </Box>

            {Math.abs(difference) > 0.001 && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px', mb: 1 }}>
                    Reason for Adjustment
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(['forgotten expense', 'bank fee', 'exchange difference', 'cash counting correction'] as AdjustmentReason[]).map(r => {
                      const isSel = reason === r;
                      return (
                        <Chip
                          key={r}
                          label={r}
                          onClick={() => setReason(r)}
                          variant={isSel ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: '13px',
                            height: 36,
                            borderRadius: '12px',
                            bgcolor: isSel ? 'primary.main' : 'background.paper',
                            color: isSel ? 'primary.contrastText' : 'text.secondary',
                            borderColor: isSel ? 'primary.main' : 'divider',
                            fontWeight: isSel ? 'bold' : 'normal',
                            textTransform: 'capitalize',
                            '&:hover': { bgcolor: isSel ? 'primary.main' : 'action.hover' },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>

                <TextField
                  label="Adjustment Note"
                  fullWidth
                  placeholder="Explain the reason..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                    }
                  }}
                />
              </Stack>
            )}

            <Button
              onClick={handleResolve}
              loading={isProcessing}
              fullWidth
              variant="contained"
              sx={{
                height: 48,
                borderRadius: '16px',
                bgcolor: 'primary.dark',
                fontWeight: 'bold'
              }}
            >
              Apply Correction & Reconcile
            </Button>
          </Stack>
        )}

        {/* History */}
        <Stack spacing={1.5}>
          <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
            Audit History
          </Typography>
          <Card>
            <Stack spacing={0}>
              {sortedHistory.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <EmptyLayout
                    title="No past reconciliation logs found"
                    description="Manual adjustments will appear here after reconciling your accounts."
                  />
                </Box>
              ) : (
                sortedHistory.map((item, idx) => (
                <Box key={item.id}>
                  {idx > 0 && <Divider sx={{ borderColor: 'divider' }} />}
                {(() => {
                const acc = accounts.find(a => a.id === item.accountId);
                const isDiffZero = Math.abs(item.difference) < 0.001;
                const diffColor = isDiffZero
                  ? 'text.secondary'
                  : item.difference > 0
                    ? 'success.main'
                    : 'error.main';
                const diffBg = isDiffZero
                  ? alpha(theme.palette.text.secondary, 0.08)
                  : item.difference > 0
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1);

                // Safe parsing of YYYY-MM-DD to avoid local timezone offset shift
                const formatDateString = (dateStr: string) => {
                  const [year, month, day] = dateStr.split('-');
                  const date = new Date(Number(year), Number(month) - 1, Number(day));
                  return date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                };

                return (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {/* Circular tinted icon — matches TransactionIcon pattern */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: diffBg,
                        color: diffColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isDiffZero
                        ? <CheckCircleIcon sx={{ fontSize: '18px', color: 'success.main' }} />
                        : acc ? getAccountIcon(acc.type, '18px') : <AccountBalanceIcon sx={{ fontSize: '18px' }} />}
                    </Box>

                    {/* Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px', color: 'text.primary' }}>
                        {acc?.name || 'Unknown Account'}
                      </Typography>
                      {item.note && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.25, wordBreak: 'break-word' }}>
                          {item.note}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '10px', mt: 0.25, opacity: 0.8 }}>
                        {formatDateString(item.date)} · Actual {maskDigits(`${item.actualBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${item.currency}`)}
                      </Typography>
                    </Box>

                    {/* Amount — matches transaction list right-aligned style */}
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 'bold',
                        color: diffColor,
                        fontSize: '13.5px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        mt: 0.5,
                      }}
                    >
                      {isDiffZero
                        ? 'Matched'
                        : `${item.difference > 0 ? '+' : ''}${maskDigits(`${item.difference.toFixed(2)} ${item.currency}`)}`}
                    </Typography>
                  </Box>
                );
                })()}
                </Box>
              ))
            )}
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
}
