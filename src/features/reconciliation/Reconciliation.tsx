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
  Grid
} from '@mui/material';
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
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);

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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
      <Stack spacing={3}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
            Reconciliation
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
            Audit your account balances manually to keep records perfectly aligned.
          </Typography>
        </Box>

        {success && <Alert severity="success" sx={{ borderRadius: '16px' }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ borderRadius: '16px' }}>{error}</Alert>}

        {/* Audit Form Card */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2.5}>
              {/* Account Selection */}
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px', mb: 1 }}>
                  Select Account
                </Typography>
                <Stack 
                  direction="row" 
                  spacing={1} 
                  sx={{ 
                    overflowX: 'auto', 
                    pb: 0.5, 
                    '&::-webkit-scrollbar': { display: 'none' }, 
                    msOverflowStyle: 'none', 
                    scrollbarWidth: 'none' 
                  }}
                >
                  {accounts.map(acc => {
                    const isSelected = selectedAccount?.id === acc.id;
                    return (
                      <Chip
                        key={acc.id}
                        label={`${acc.name} (${acc.currency})`}
                        onClick={() => {
                          setSelectedAccount(acc);
                          setActualBalanceInput('');
                          setError(null);
                          setSuccess(null);
                        }}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{
                          fontSize: '12px',
                          height: 32,
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

              {selectedAccount && (
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 500 }}>
                        Calculated Balance
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5, fontSize: '15px' }}>
                        {calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedAccount.currency}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 500 }}>
                        Difference
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5, fontSize: '15px', color: Math.abs(difference) < 0.01 ? 'text.primary' : difference > 0 ? '#1E8E3E' : 'error.main' }}>
                        {difference > 0 ? '+' : ''}{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedAccount.currency}
                      </Typography>
                    </Box>
                  </Box>

                  <TextField
                    label={`Actual ${selectedAccount.currency} Balance`}
                    type="number"
                    fullWidth
                    value={actualBalanceInput}
                    onChange={e => setActualBalanceInput(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                      }
                    }}
                  />

                  {Math.abs(difference) > 0.001 && (
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: '14px', mb: 1 }}>
                          Reason for Adjustment
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                          {(['forgotten expense', 'bank fee', 'exchange difference', 'cash counting correction'] as AdjustmentReason[]).map(r => {
                            const isSel = reason === r;
                            return (
                              <Chip
                                key={r}
                                label={r.toUpperCase()}
                                onClick={() => setReason(r)}
                                variant={isSel ? 'filled' : 'outlined'}
                                sx={{
                                  fontSize: '11px',
                                  height: 28,
                                  bgcolor: isSel ? 'primary.main' : 'background.paper',
                                  color: isSel ? 'primary.contrastText' : 'text.secondary',
                                  borderColor: isSel ? 'primary.main' : 'divider'
                                }}
                              />
                            );
                          })}
                        </Stack>
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
                    disabled={isProcessing}
                    fullWidth
                    variant="contained"
                    sx={{
                      height: 48,
                      borderRadius: '16px',
                      bgcolor: 'primary.dark',
                      fontWeight: 'bold'
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Apply Correction & Reconcile'}
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* History */}
        <Stack spacing={1.5}>
          <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
            Audit History
          </Typography>
          <Stack spacing={1}>
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                No past reconciliation logs found.
              </Typography>
            ) : (
              history.map(item => {
                const acc = accounts.find(a => a.id === item.accountId);
                return (
                  <Box 
                    key={item.id} 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: 'background.paper', 
                      borderRadius: '16px', 
                      border: '1px solid', 
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}
                  >
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '13.5px' }}>
                        {acc?.name || 'Unknown Account'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                        {item.date}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        Diff: {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)} {item.currency}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        Actual: {item.actualBalance.toFixed(2)} {item.currency}
                      </Typography>
                    </Box>
                    {item.note && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px', mt: 0.5, fontStyle: 'italic' }}>
                        Note: {item.note}
                      </Typography>
                    )}
                  </Box>
                );
              })
            )}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
