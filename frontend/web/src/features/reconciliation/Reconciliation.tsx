import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@monochrome-ui/design-system';
import type { AccountType, Reconciliation as ReconModel } from '@kippa/domain';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCycles,
  useReconciliationHistory,
  useCreateTransactionMutation,
  useSaveReconciliationMutation,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { calculateAccountBalances } from '@/libs/financeCalculations';
import { ReconciliationHistory } from './components/ReconciliationHistory';
import { AccountBalanceIcon, CheckCircleIcon, PaymentsIcon, SavingsIcon } from '@/components/AppIcon';

type AdjustmentReason =
  'forgotten expense' | 'bank fee' | 'exchange difference' | 'cash counting correction' | 'unknown difference';

const sectionIndent = { xs: 0, md: 4 } as const;
const contentIndent = { xs: 0, md: 2 } as const;

const adjustmentReasons: AdjustmentReason[] = [
  'forgotten expense',
  'bank fee',
  'exchange difference',
  'cash counting correction',
  'unknown difference',
];

function accountTypeLabel(type: AccountType) {
  if (type === 'running') return 'Running bank';
  if (type === 'savings') return 'Savings bank';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function Reconciliation() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { householdId, userProfile } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const { maskDigits, privacyMode } = usePrivacyMask();

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions = [], isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const {
    data: historyData,
    isLoading: historyLoading,
    hasNextPage: hasNextHistoryPage = false,
    isFetchingNextPage: isFetchingHistoryPage,
    fetchNextPage: fetchNextHistoryPage,
  } = useReconciliationHistory(householdId);
  const historyPages = historyData?.pages.map((page) => page.items) ?? [];

  const createTxMutation = useCreateTransactionMutation();
  const saveReconMutation = useSaveReconciliationMutation();

  const sortedAccounts = [...accounts].sort((a, b) => {
    const rank = (account: (typeof accounts)[number]) => {
      if (account.currency === baseCurrency) return 0;
      if (account.type === 'cash') return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || sortedAccounts[0] || null;
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [reason, setReason] = useState<AdjustmentReason>('forgotten expense');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const activeCycle = cycles.find((cycle) => cycle.status === 'open') || null;
  const isLoading = accountsLoading || txsLoading || linesLoading || historyLoading;

  const balancesMap = calculateAccountBalances(accounts, transactions, ledgerLines);
  const calculatedBalance = selectedAccount ? balancesMap[selectedAccount.id] || 0 : 0;
  const parsedActualBalance = actualBalanceInput.trim() ? Number(actualBalanceInput) : null;
  const hasActualBalance = parsedActualBalance !== null && Number.isFinite(parsedActualBalance);
  const actualBalance = parsedActualBalance ?? 0;
  const difference = hasActualBalance ? Number((actualBalance - calculatedBalance).toFixed(2)) : 0;
  const isMatched = hasActualBalance && Math.abs(difference) < 0.01;

  const getAccountIcon = (type: AccountType) => {
    if (type === 'savings') return <SavingsIcon variant="Linear" />;
    if (type === 'cash' || type === 'wallet') return <PaymentsIcon variant="Linear" />;
    return <AccountBalanceIcon variant="Linear" />;
  };

  const handleResolve = async () => {
    if (!selectedAccount || !hasActualBalance || !userProfile) return;
    setIsProcessing(true);

    try {
      let adjustmentTransactionId: string | null = null;

      if (Math.abs(difference) > 0.001) {
        adjustmentTransactionId = await createTxMutation.mutateAsync({
          householdId,
          transaction: {
            type: 'adjustment',
            date: new Date().toISOString().split('T')[0],
            description: `Balance Correction (${reason}): ${note || 'Manual Reconciliation adjustment'}`,
            createdBy: userProfile.uid,
            budgetCycleId: activeCycle?.id || null,
          },
          lines: [
            {
              accountId: selectedAccount.id,
              signedAmount: difference,
              currency: selectedAccount.currency,
            },
          ],
        });
      }

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
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString(),
        adjustmentTransactionId,
        note: note.trim() || null,
      };

      await saveReconMutation.mutateAsync({ householdId, reconId, reconLog });
      enqueueSnackbar(
        isMatched
          ? 'Reconciliation saved. Your balance matches.'
          : privacyMode
            ? 'Reconciliation saved. Difference corrected.'
            : `Reconciliation saved. Difference of ${difference.toFixed(2)} ${selectedAccount.currency} corrected.`,
        { variant: 'success' },
      );
      setActualBalanceInput('');
      setNote('');
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to process reconciliation', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextHistoryPage = async () => {
    const result = await fetchNextHistoryPage();
    return Boolean(result.data?.pages.at(-1)?.items.length);
  };

  if (isLoading) {
    return (
      <Stack spacing={{ xs: 2, md: 3 }}>
        <PageHeader title="Reconciliation" subtitle="Compare recorded balances with your bank or cash totals." />
        <Box component="section" sx={{ px: sectionIndent }}>
          <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
            <Grid container spacing={{ xs: 3, lg: 4 }}>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Skeleton variant="rounded" width={44} height={44} />
                    <Box>
                      <Skeleton variant="text" width={190} height={24} />
                      <Skeleton variant="text" width={290} height={18} />
                    </Box>
                  </Stack>
                  <Box sx={{ px: contentIndent }}>
                    <Stack spacing={2.5}>
                      <Skeleton variant="rounded" width="100%" height={48} />
                      <Stack direction="row" spacing={3}>
                        <Skeleton variant="text" width="30%" height={80} />
                        <Skeleton variant="text" width="30%" height={80} />
                        <Skeleton variant="text" width="30%" height={80} />
                      </Stack>
                      <Skeleton variant="rounded" width="70%" height={56} />
                      <Skeleton variant="rounded" width={220} height={42} />
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Stack spacing={2}>
                  <Skeleton variant="text" width={230} height={28} />
                  {[1, 2, 3, 4].map((item) => (
                    <Stack key={item} direction="row" spacing={1.5} sx={{ py: 1.5 }}>
                      <Skeleton variant="rounded" width={44} height={44} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="55%" height={22} />
                        <Skeleton variant="text" width="75%" height={18} />
                      </Box>
                      <Skeleton variant="text" width={100} height={24} />
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <PageHeader title="Reconciliation" subtitle="Compare recorded balances with your bank or cash totals." />

      <Box component="section" sx={{ px: sectionIndent }}>
        <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
          <Grid container spacing={{ xs: 3, lg: 4 }} alignItems="start">
            <Grid size={{ xs: 12, lg: 5 }} sx={{ minWidth: 0 }}>
              <Stack spacing={{ xs: 2, md: 2.5 }}>
                <SectionHeading
                  icon={<AccountBalanceIcon variant="Linear" />}
                  title="Balance check"
                  subtitle="Confirm the balance on your statement or in your wallet."
                />

                <Box sx={{ px: contentIndent }}>
                  {accounts.length === 0 ? (
                    <Stack spacing={1} alignItems="flex-start">
                      <Typography variant="body2" color="text.secondary">
                        Create an account first, then come back here to balance-check it.
                      </Typography>
                      <Button onClick={() => navigate('/accounts')}>Go to accounts</Button>
                    </Stack>
                  ) : selectedAccount ? (
                    <Stack spacing={{ xs: 2.5, md: 3 }}>
                      <Box sx={{ width: '100%', maxWidth: 420 }}>
                        <FormControl fullWidth>
                          <InputLabel id="reconciliation-account-label">Account</InputLabel>
                          <Select
                            size="medium"
                            labelId="reconciliation-account-label"
                            label="Account"
                            value={selectedAccount.id}
                            onChange={(event) => {
                              setSelectedAccountId(event.target.value);
                              setActualBalanceInput('');
                              setNote('');
                            }}
                          >
                            {sortedAccounts.map((account) => (
                              <MenuItem key={account.id} value={account.id}>
                                {account.name} · {accountTypeLabel(account.type)} · {account.currency}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                          columnGap: { xs: 0, sm: 3 },
                          rowGap: { xs: 2, sm: 0 },
                          alignItems: 'center',
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="fieldHint" color="text.secondary">
                            Calculated
                          </Typography>
                          <Typography variant="loanMetric">
                            {maskDigits(calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }))}
                          </Typography>
                          <Typography variant="sectionSubtitle" color="text.secondary">
                            {selectedAccount.currency}
                          </Typography>
                        </Stack>

                        <Stack spacing={0.5}>
                          <Typography variant="fieldHint" color="text.secondary">
                            Actual
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            placeholder="0.00"
                            value={actualBalanceInput}
                            onChange={(event) => setActualBalanceInput(event.target.value)}
                            slotProps={{
                              htmlInput: { inputMode: 'decimal', step: '0.01' },
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">{selectedAccount.currency}</InputAdornment>
                                ),
                              },
                            }}
                          />
                        </Stack>

                        <Stack spacing={0.5}>
                          <Typography variant="fieldHint" color="text.secondary">
                            Difference
                          </Typography>
                          <Typography
                            variant="loanMetric"
                            color={
                              !hasActualBalance || Math.abs(difference) < 0.01
                                ? 'text.primary'
                                : difference > 0
                                  ? 'success.main'
                                  : 'error.main'
                            }
                          >
                            {hasActualBalance
                              ? `${difference > 0 ? '+' : ''}${maskDigits(difference.toLocaleString(undefined, { minimumFractionDigits: 2 }))}`
                              : '—'}
                          </Typography>
                          <Typography variant="sectionSubtitle" color="text.secondary">
                            {hasActualBalance ? selectedAccount.currency : 'Enter actual balance'}
                          </Typography>
                        </Stack>
                      </Box>

                      {isMatched ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckCircleIcon variant="Linear" color="success" fontSize="small" />
                          <Typography variant="body2" color="success.main">
                            Perfect match. Your records are aligned.
                          </Typography>
                        </Stack>
                      ) : hasActualBalance ? (
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="sectionTitle">Adjustment details</Typography>
                            <Typography variant="sectionSubtitle" color="text.secondary">
                              Select why the balance differs. Add context for your household if needed.
                            </Typography>
                          </Box>
                          <Box sx={{ pl: { xs: 0, sm: 2 } }}>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {adjustmentReasons.map((item) => {
                                  const isSelected = reason === item;
                                  return (
                                    <Chip
                                      key={item}
                                      label={item.replace(/\b\w/g, (character) => character.toUpperCase())}
                                      variant={isSelected ? 'filterSelected' : 'filter'}
                                      clickable
                                      aria-pressed={isSelected}
                                      onClick={() => setReason(item)}
                                    />
                                  );
                                })}
                              </Box>
                              <TextField
                                variant="filled"
                                label="Adjustment note (optional)"
                                placeholder="Add context for your household"
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                multiline
                                minRows={3}
                                fullWidth
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      ) : null}

                      <Button
                        variant="contained"
                        onClick={handleResolve}
                        loading={isProcessing}
                        disabled={!hasActualBalance || !userProfile}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {isMatched ? 'Confirm balance' : 'Apply correction'}
                      </Button>
                    </Stack>
                  ) : null}
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }} sx={{ minWidth: 0 }}>
              <ReconciliationHistory
                accounts={accounts}
                pages={historyPages}
                hasNextPage={hasNextHistoryPage}
                isFetchingNextPage={isFetchingHistoryPage}
                onNextPage={handleNextHistoryPage}
                mask={maskDigits}
                renderAccountIcon={getAccountIcon}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Stack>
  );
}
