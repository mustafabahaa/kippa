import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  LinearProgress, 
  Button, 
  Divider,
  Alert,
  TextField,
  Chip,
  IconButton,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { DashboardData } from '../../services/selectors';
import { Account, BudgetCycle, FinanceTransaction, Category } from '../../domain/financeTypes';

interface DashboardProps {
  data: DashboardData;
  accounts: Account[];
  categories: Category[];
  activeCycle: BudgetCycle | null;
  transactions: FinanceTransaction[];
  displayUsdToEgpRate: number;
  onUpdateDisplayRate: (rate: number) => void;
  onVoidTransaction: (txId: string) => void;
  onNavigateToFastEntry: () => void;
}

export function Dashboard({
  data,
  accounts,
  categories,
  activeCycle,
  transactions,
  displayUsdToEgpRate,
  onUpdateDisplayRate,
  onVoidTransaction,
  onNavigateToFastEntry
}: DashboardProps) {
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(displayUsdToEgpRate.toString());

  const handleSaveRate = () => {
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateDisplayRate(parsed);
      setEditingRate(false);
    }
  };

  const getStatusColor = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return 'success.main';
    if (status === 'warning') return 'warning.main';
    return 'error.main';
  };

  const getStatusLabel = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return 'On Track';
    if (status === 'warning') return 'Pace Warning';
    return 'Over Budgeting';
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={4}>
        {/* Top Summary Banner */}
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
          <Box>
            <Typography variant="h1">Finance Dashboard</Typography>
            {activeCycle ? (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Active Cycle: <strong>{activeCycle.name}</strong> ({activeCycle.startDate} to {activeCycle.endDate || 'next salary'})
              </Typography>
            ) : (
              <Typography variant="body1" color="error" sx={{ mt: 0.5 }}>
                No active budget cycle configured. Go to 'Cycles' to start one.
              </Typography>
            )}
          </Box>

          <Button 
            variant="contained" 
            startIcon={<AccountBalanceWalletOutlinedIcon />} 
            onClick={onNavigateToFastEntry}
            sx={{ px: 3, py: 1.2 }}
          >
            Add Transaction
          </Button>
        </Box>

        {/* Financial Health Indicator */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }} sx={{ borderRight: { md: '1px solid' }, borderColor: 'divider', pr: { md: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  SAVING PACING
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 600, color: getStatusColor(data.saving.status) }}>
                  {getStatusLabel(data.saving.status)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Current progress predicts EGP <strong>{data.saving.projected.toFixed(0)}</strong> saving, target is EGP <strong>{data.saving.target.toFixed(0)}</strong>.
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, md: 4 }} sx={{ borderRight: { md: '1px solid' }, borderColor: 'divider', px: { md: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  BUDGET-SAFE DAILY SPEND
                </Typography>
                <Typography variant="h2" color="primary" sx={{ fontWeight: 600 }}>
                  EGP {data.safeDailySpend.budgetSafe.toFixed(0)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  Based on remaining flexible budget.
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, md: 4 }} sx={{ pl: { md: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  CASH-SAFE DAILY SPEND
                </Typography>
                <Typography variant="h2" color="success.main" sx={{ fontWeight: 600 }}>
                  EGP {data.safeDailySpend.cashSafe.toFixed(0)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  Based on current liquid cash reserves.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Main Stats Grid */}
        <Grid container spacing={3}>
          {/* Account Balances List */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h3">Accounts & Cash</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {editingRate ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          size="small"
                          label="USD/EGP Rate"
                          value={rateInput}
                          onChange={e => setRateInput(e.target.value)}
                          sx={{ width: 100 }}
                        />
                        <IconButton size="small" onClick={handleSaveRate} color="success">
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Display USD Rate: <strong>{displayUsdToEgpRate}</strong>
                        </Typography>
                        <IconButton size="small" onClick={() => setEditingRate(true)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </Box>
                </Box>

                <Stack spacing={2}>
                  {accounts.map(acc => {
                    const balanceObj = data.accountBalances.find(b => b.accountId === acc.id);
                    const bal = balanceObj ? balanceObj.balance : 0;
                    return (
                      <Box key={acc.id} display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{acc.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {acc.type.toUpperCase()} • {acc.currency}
                          </Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 600 }}>
                          {bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {acc.currency}
                        </Typography>
                      </Box>
                    );
                  })}
                  <Divider />
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Total Net Worth (EGP)</Typography>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                      EGP {data.totalEgpEquivalent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Cycle & Budget Status */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ mb: 3 }}>Cycle Progress & Spending</Typography>

                <Stack spacing={3.5}>
                  {data.cycleProgress ? (
                    <Box>
                      <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body1">Cycle Timeline Progress</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Day {data.cycleProgress.elapsedDays} of {data.cycleProgress.totalDays} ({data.cycleProgress.remainingDays} left)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={data.cycleProgress.ratio * 100} 
                        sx={{ height: 8, borderRadius: 4 }} 
                      />
                    </Box>
                  ) : (
                    <Alert severity="warning">Timeline tracking requires an active open cycle.</Alert>
                  )}

                  <Box>
                    <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body1">Cycle Budget Spent</Typography>
                      <Typography variant="body2" color="text.secondary">
                        EGP {data.spending.actual.toFixed(0)} of EGP {data.spending.plannedBudget.toFixed(0)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      color={data.spending.actual > data.spending.plannedBudget ? 'error' : 'primary'}
                      value={Math.min(100, data.spending.plannedBudget > 0 ? (data.spending.actual / data.spending.plannedBudget) * 100 : 0)} 
                      sx={{ height: 8, borderRadius: 4 }} 
                    />
                    {data.spending.actual > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Projected cycle spending: EGP <strong>{data.spending.projected.toFixed(0)}</strong> (Burn pace)
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Category Warnings & Status */}
        {data.categoryStatus.length > 0 && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ mb: 3 }}>Category Budget Allocations</Typography>
              <Grid container spacing={3}>
                {data.categoryStatus.map(cat => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.categoryId}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{cat.categoryName}</Typography>
                        <Chip 
                          label={cat.status.toUpperCase()} 
                          size="small" 
                          color={cat.status === 'over' ? 'error' : cat.status === 'warning' ? 'warning' : 'success'} 
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        EGP {cat.spent.toFixed(0)} / EGP {cat.planned.toFixed(0)} ({Math.round(cat.ratio * 100)}%)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, cat.ratio * 100)}
                        color={cat.status === 'over' ? 'error' : cat.status === 'warning' ? 'warning' : 'success'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions List */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 3 }}>Recent Transactions</Typography>
            {transactions.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                No transactions recorded yet. Add some to populate the list!
              </Typography>
            ) : (
              <Stack spacing={1.5} divider={<Divider />}>
                {transactions.slice(0, 8).map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  return (
                    <Box key={tx.id} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {tx.type.toUpperCase()} • {tx.description || cat?.name || 'General'}
                          </Typography>
                          {tx.status === 'voided' && <Chip label="VOIDED" size="small" color="error" />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {tx.date} • Created by {tx.createdBy === 'mock-uid-123' ? 'You' : 'Partner'}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => onVoidTransaction(tx.id)}
                          disabled={tx.status === 'voided'}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
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
