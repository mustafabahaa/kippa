import { BarChartIcon } from '@/components/AppIcon';

import { Box, Card, CardContent, Skeleton, Stack } from '@monochrome-ui/design-system';
import {
  RankedMetricTile,
  PulseSkeleton,
  StatusBadge,
  SupportingSummary,
  PercentageValue,
  type MetricTileRank,
  type MetricTileTone,
  type StatusBadgeTone,
} from '@monochrome-ui/design-system';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCategories,
  useCycles,
  useDisplayRates,
  useHouseholdBaseCurrency,
  useBudgetAllocations,
  useExpectedIncomes,
  useLoans,
} from '@/hooks/useFinance';
import { computeDashboard, DashboardData } from '@/libs/selectors';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import { DashboardSectionHeading } from './DashboardSectionHeading';

export function BudgetPulseSection() {
  const { householdId } = useAppContext();
  const { data: accounts } = useAccounts(householdId);
  const { data: transactions } = useTransactions(householdId);
  const { data: ledgerLines } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCodes = Array.from(new Set((accounts ?? []).map((a) => a.currency).filter((c) => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);

  const activeCycle = cycles.find((c) => c.status === 'open') || null;
  const activeCycleId = activeCycle?.id;

  const { data: allocations = [], isLoading: allocationsLoading } = useBudgetAllocations(householdId, activeCycleId);
  const { data: expectedIncomes = [] } = useExpectedIncomes(householdId, activeCycleId);
  const { data: loans = [] } = useLoans(householdId);

  const isLoading = allocationsLoading || !accounts || !transactions || !ledgerLines;

  const getStatusLabel = (status: DashboardData['saving']['status']) => {
    if (status === 'on-track') return 'ON TRACK';
    if (status === 'warning') return 'PACE WARNING';
    return 'OVER BUDGETING';
  };

  const getStatusTone = (status: DashboardData['saving']['status']): StatusBadgeTone => {
    if (status === 'on-track') return 'success';
    return status === 'warning' ? 'warning' : 'error';
  };

  if (isLoading) {
    return (
      <Card variant="sectionSurface">
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Skeleton variant="text" width="35%" height={24} animation="wave" />
          <PulseSkeleton shape="status" width="25%" height={24} animation="wave" />
          </Stack>
        <PulseSkeleton
          shape="progress"
          width="100%"
          height={8}
          sx={{ mb: 1.5 }}
          animation="wave"
        />
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
    displayRates,
    baseCurrency,
    loans,
  );
  const remainingPercent =
    data.spending.plannedBudget > 0
      ? Math.max(0, Math.round((1 - data.spending.actual / data.spending.plannedBudget) * 100))
      : 0;
  const featuredCategories = [...data.categoryStatus]
    .filter((category) => category.planned > 0)
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 3);

  return (
    <Card variant="sectionSurface" sx={{ height: 375 }}>
      <CardContent sx={{ height: '100%' }}>
        <DashboardSectionHeading
          icon={<BarChartIcon size={22} strokeWidth={1.8} />}
          title="Remaining monthly"
          trailing={
            <StatusBadge tone={getStatusTone(data.saving.status)}>{getStatusLabel(data.saving.status)}</StatusBadge>
          }
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
          <PercentageValue value={remainingPercent} />
          <SupportingSummary sx={{ maxWidth: 150 }}>
            {data.saving.status === 'on-track'
              ? 'You are in good shape—your monthly spending remains within plan.'
              : 'Spending is running ahead of the monthly plan.'}
          </SupportingSummary>
        </Stack>

        <Box sx={{ mt: 1.25 }}>
          <StatusBadge tone={getStatusTone(data.saving.status)}>
            Cycle progress {data.cycleProgress ? Math.round(data.cycleProgress.ratio * 100) : 0}%
          </StatusBadge>
        </Box>

        <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ mt: 2.5, minHeight: 150 }}>
          {featuredCategories.map((category, index) => {
            const used = Math.round(category.ratio * 100);
            const remaining = Math.max(0, category.planned - category.spent);
            const rank = (['first', 'second', 'third'] as const)[index] as MetricTileRank;
            const tone = (['primary', 'secondary', 'accent'] as const)[index] as MetricTileTone;
            return (
              <RankedMetricTile
                key={category.categoryId}
                rank={rank}
                tone={tone}
                percent={used}
                label={category.categoryName}
                valueTitle={`${remaining.toLocaleString()} ${baseCurrency} left`}
              >
                <Money amount={remaining} code={baseCurrency} maxDigits={0} />
              </RankedMetricTile>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
