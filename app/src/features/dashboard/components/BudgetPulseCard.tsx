import { Box, Card, CardContent, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCategories,
  useCycles,
  useUsdRate,
  useBudgetAllocations,
  useExpectedIncomes
} from '../../../hooks/useFinance';
import { computeDashboard, DashboardData } from '../../../libs/selectors';
import { useAppContext } from '../../../hooks/useAppContext';
import { InfoTooltip } from '../../shared/components/InfoTooltip';
import { metricExplanations } from '../../shared/constants/metricExplanations';

export function BudgetPulseCard() {
  const { householdId } = useAppContext();
  const { data: accounts } = useAccounts(householdId);
  const { data: transactions } = useTransactions(householdId);
  const { data: ledgerLines } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const { data: displayRate = 50.0 } = useUsdRate();

  const activeCycle = cycles.find(c => c.status === 'open') || null;
  const activeCycleId = activeCycle?.id;

  const { data: allocations = [], isLoading: allocationsLoading } = useBudgetAllocations(householdId, activeCycleId);
  const { data: expectedIncomes = [] } = useExpectedIncomes(householdId, activeCycleId);

  const isLoading = allocationsLoading || !accounts || !transactions || !ledgerLines;

  const getStatusColor = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return '#1E8E3E';
    if (status === 'warning') return '#F9AB00';
    return '#ba1a1a';
  };

  const getStatusBgColor = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return 'rgba(30, 142, 62, 0.1)';
    if (status === 'warning') return 'rgba(249, 171, 0, 0.1)';
    return 'rgba(186, 26, 26, 0.1)';
  };

  const getStatusLabel = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return 'ON TRACK';
    if (status === 'warning') return 'PACE WARNING';
    return 'OVER BUDGETING';
  };

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Skeleton variant="text" width="35%" height={24} animation="wave" />
            <Skeleton variant="rectangular" width="25%" height={24} sx={{ borderRadius: '12px' }} animation="wave" />
          </Stack>
          <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 4, mb: 1.5 }} animation="wave" />
          <Skeleton variant="text" width="70%" height={18} animation="wave" />
        </CardContent>
      </Card>
    );
  }

  const data = computeDashboard(
    accounts || [],
    transactions || [],
    ledgerLines || [],
    categories,
    activeCycle,
    allocations,
    expectedIncomes,
    displayRate
  );

  return (
    <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Budget Pulse
          </Typography>
          <Box sx={{ bgcolor: getStatusBgColor(data.saving.status), color: getStatusColor(data.saving.status), px: 1.2, py: 0.4, borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' }}>
            {getStatusLabel(data.saving.status)}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Box flex={1}>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(100, data.spending.plannedBudget > 0 ? (data.spending.actual / data.spending.plannedBudget) * 100 : 0)} 
              sx={{ 
                height: 8, 
                borderRadius: 4, 
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getStatusColor(data.saving.status)
                }
              }} 
            />
            <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                <InfoTooltip
                  label="Spending ratio"
                  text={metricExplanations.spendingRatio}
                />
                : {Math.round(data.spending.plannedBudget > 0 ? (data.spending.actual / data.spending.plannedBudget) * 100 : 0)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                <InfoTooltip
                  label="Cycle progress"
                  text={metricExplanations.cycleProgress}
                />
                : {data.cycleProgress ? Math.round(data.cycleProgress.ratio * 100) : 0}%
              </Typography>
            </Box>
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: getStatusBgColor(data.saving.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: getStatusColor(data.saving.status), fontSize: '24px', margin: 'auto' }}>
              {data.saving.status === 'on-track' ? 'trending_down' : 'trending_up'}
            </span>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          <Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              <InfoTooltip
                label="Projected cycle spending"
                text={metricExplanations.projectedCycleSpending}
              />
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="flex-end" gap={2}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Projected
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: getStatusColor(data.saving.status), lineHeight: 1.2 }}>
                EGP {data.spending.projected.toFixed(0)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Target
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                EGP {data.spending.plannedBudget.toFixed(0)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
