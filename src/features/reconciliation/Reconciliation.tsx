import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  Button, 
  TextField, 
  Chip, 
  Divider, 
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Grid
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { dbService } from '../../services/dbService';
import { transactionService } from '../../services/transactionService';
import { Account, Reconciliation as ReconModel, UserProfile, BudgetCycle } from '../../domain/financeTypes';

interface ReconciliationProps {
  householdId: string;
  userProfile: UserProfile;
  accounts: Account[];
  balances: { accountId: string; balance: number }[];
  activeCycle: BudgetCycle | null;
  onReconciled: () => void;
}

type AdjustmentReason = 'forgotten expense' | 'bank fee' | 'exchange difference' | 'cash counting correction' | 'unknown difference';

export function Reconciliation({
  householdId,
  userProfile,
  accounts,
  balances,
  activeCycle,
  onReconciled
}: ReconciliationProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [reason, setReason] = useState<AdjustmentReason>('forgotten expense');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<ReconModel[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0]);
    }
    loadReconHistory();
  }, [accounts]);

  const loadReconHistory = async () => {
    const list = await dbService.getDocs(householdId, 'reconciliations');
    setHistory((list as ReconModel[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  };

  const getCalculatedBalance = (): number => {
    if (!selectedAccount) return 0;
    const match = balances.find(b => b.accountId === selectedAccount.id);
    return match ? match.balance : 0;
  };

  const calculatedBalance = getCalculatedBalance();
  const actualBalance = parseFloat(actualBalanceInput) || 0;
  const difference = selectedAccount ? actualBalance - calculatedBalance : 0;

  const handleResolve = async () => {
    if (!selectedAccount) return;
    setError(null);
    setSuccess(null);

    try {
      let adjustmentTransactionId: string | undefined = undefined;

      // 1. If difference is non-zero, write an adjustment transaction
      if (Math.abs(difference) > 0.001) {
        adjustmentTransactionId = await transactionService.createTransaction(
          householdId,
          {
            type: 'adjustment',
            date: new Date().toISOString().split('T')[0],
            description: `Balance Correction (${reason}): ${note || 'Manual Reconciliation adjustment'}`,
            budgetCycleId: activeCycle?.id || undefined,
            createdBy: userProfile.uid,
          },
          [
            {
              accountId: selectedAccount.id,
              signedAmount: difference,
              currency: selectedAccount.currency,
            }
          ]
        );
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
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString(),
        adjustmentTransactionId,
        note: note || undefined,
      };

      await dbService.setDoc(householdId, 'reconciliations', reconId, reconLog);

      setSuccess(`Reconciliation saved successfully! Difference of ${difference.toFixed(2)} ${selectedAccount.currency} corrected.`);
      setActualBalanceInput('');
      setNote('');
      loadReconHistory();
      onReconciled();
    } catch (err: any) {
      setError(err.message || 'Failed to process reconciliation');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h1">Manual Reconciliation</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Audit your account balances manually to keep records perfectly aligned with reality.
          </Typography>
        </Box>

        {success && <Alert severity="success">{success}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {/* Audit Form Card */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3.5}>
              {/* Account Selection */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  CHOOSE ACCOUNT TO RECONCILE
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {accounts.map(acc => (
                    <Chip
                      key={acc.id}
                      label={`${acc.name} (${acc.currency})`}
                      onClick={() => {
                        setSelectedAccount(acc);
                        setActualBalanceInput('');
                        setError(null);
                        setSuccess(null);
                      }}
                      color={selectedAccount?.id === acc.id ? 'primary' : 'default'}
                      variant={selectedAccount?.id === acc.id ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>

              {selectedAccount && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        APP CALCULATED BALANCE
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 700, mt: 1 }}>
                        {calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedAccount.currency}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label={`Actual Balance (${selectedAccount.currency})`}
                      placeholder="e.g. 15420.50"
                      value={actualBalanceInput}
                      onChange={e => setActualBalanceInput(e.target.value)}
                      InputProps={{ style: { fontSize: '1.25rem', fontWeight: 600 } }}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Difference & Adjustment Section */}
              {selectedAccount && actualBalanceInput && (
                <Box sx={{ p: 2.5, bgcolor: Math.abs(difference) < 0.01 ? 'success.light' : 'warning.light', borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Difference:
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: Math.abs(difference) < 0.01 ? 'success.main' : 'error.main' }}>
                        {difference > 0 ? '+' : ''}{difference.toFixed(2)} {selectedAccount.currency}
                      </Typography>
                    </Box>

                    {Math.abs(difference) > 0.001 ? (
                      <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          An adjustment transaction of <strong>{difference.toFixed(2)} {selectedAccount.currency}</strong> will be posted to correct this account's history.
                        </Typography>

                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            ADJUSTMENT REASON
                          </Typography>
                          <ToggleButtonGroup
                            color="primary"
                            value={reason}
                            exclusive
                            onChange={(_, v) => v && setReason(v)}
                            fullWidth
                            size="small"
                          >
                            <ToggleButton value="forgotten expense">Forgotten Expense</ToggleButton>
                            <ToggleButton value="bank fee">Bank Fee</ToggleButton>
                            <ToggleButton value="exchange difference">Rate Diff</ToggleButton>
                            <ToggleButton value="cash counting correction">Cash Count</ToggleButton>
                          </ToggleButtonGroup>
                        </Box>

                        <TextField
                          fullWidth
                          size="small"
                          label="Notes/Observations"
                          placeholder="e.g. monthly ATM fees or forgotten dinner"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                        />
                      </Stack>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircleIcon color="success" />
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                          Balances are perfectly matching. No adjustment transaction needed.
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      onClick={handleResolve}
                      startIcon={<SyncAltIcon />}
                      sx={{ py: 1.5, mt: 1 }}
                    >
                      Resolve & Lock Balance
                    </Button>
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Reconciliation History log */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Audit Logs & Reconciliation History</Typography>
            {history.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                No manual reconciliations performed yet.
              </Typography>
            ) : (
              <Stack spacing={2} divider={<Divider />}>
                {history.map(item => {
                  const acc = accounts.find(a => a.id === item.accountId);
                  return (
                    <Box key={item.id} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {acc?.name || 'Account'} Check
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.date} • Checked by {item.createdBy === 'mock-uid-123' ? 'You' : 'Partner'}
                        </Typography>
                        {item.note && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                            Note: {item.note}
                          </Typography>
                        )}
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Actual: {item.actualBalance.toFixed(2)} {item.currency}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: Math.abs(item.difference) < 0.01 ? 'success.main' : 'error.main',
                          fontWeight: 600
                        }}>
                          Diff: {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
