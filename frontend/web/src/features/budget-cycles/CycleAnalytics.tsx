import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CycleCashFlowColumn,
  CycleCashFlowGuide,
  CycleChartSwatch,
  CycleTrendLineChart,
} from '@kippa/design-system';
import {
  useCycles,
  useTransactions,
  useLedgerLines,
  useCategories,
  useAccounts,
  useDisplayRates,
  useHouseholdBaseCurrency,
  useAllBudgetAllocations,
  useAllExpectedIncomes,
  useLoans,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { buildCashFlowSeries, calculateCategoryTrends, calculateCycleData } from '@/libs/budgetAnalytics';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { AnalyticsPlaceholder } from './components/AnalyticsPlaceholder';

export function CycleAnalytics() {
  const { householdId } = useAppContext();
  const theme = useTheme();

  // Queries
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(householdId);
  const { data: transactions = [], isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: accounts = [] } = useAccounts(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCodes = Array.from(new Set(accounts.map((a) => a.currency).filter((c) => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);
  const { data: allAllocations = [], isLoading: allocsLoading } = useAllBudgetAllocations(householdId);
  const { data: allExpectedIncomes = [], isLoading: incomesLoading } = useAllExpectedIncomes(householdId);
  const { data: loans = [], isLoading: loansLoading } = useLoans(householdId);

  // Tab State
  const [activeTab, setActiveTab] = useState(0);

  // Selected Category for Line Trend Chart
  const [selectedCategoryId, setSelectedCategoryId] = useState('masrof-bet');

  const isLoading =
    cyclesLoading || txsLoading || linesLoading || categoriesLoading || allocsLoading || incomesLoading || loansLoading;

  // Chronologically sorted active or closed cycles
  const sortedCycles = useMemo(() => {
    return [...cycles]
      .filter((c) => c.status === 'open' || c.status === 'closed')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [cycles]);

  // Compute stats per cycle
  const cycleData = useMemo(() => {
    if (isLoading || sortedCycles.length === 0) return [];
    return calculateCycleData(
      sortedCycles,
      transactions,
      ledgerLines,
      allAllocations,
      allExpectedIncomes,
      baseCurrency,
      displayRates,
      loans,
    );
  }, [
    isLoading,
    sortedCycles,
    transactions,
    ledgerLines,
    allAllocations,
    allExpectedIncomes,
    displayRates,
    baseCurrency,
    loans,
  ]);

  // Compute category trends over cycles
  const categoryTrends = useMemo(() => {
    if (isLoading || sortedCycles.length === 0 || !selectedCategoryId) return [];

    return calculateCategoryTrends(
      sortedCycles,
      transactions,
      ledgerLines,
      selectedCategoryId,
      baseCurrency,
      displayRates,
    );
  }, [isLoading, sortedCycles, transactions, ledgerLines, selectedCategoryId, displayRates, baseCurrency]);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  const cashFlowSeries = useMemo(() => buildCashFlowSeries(cycleData), [cycleData]);

  if (isLoading) {
    return <AnalyticsPlaceholder loading />;
  }

  if (cycleData.length === 0) {
    return <AnalyticsPlaceholder loading={false} />;
  }

  return (
    <Stack spacing={2} sx={{ width: '100%', minWidth: 0 }}>
      <Box>
        <SectionHeading
          title="Cycle analytics"
          subtitle="Cash flow and category trends over time."
          trailing={
            <Stack direction="row" spacing={1}>
              <Button
                variant={activeTab === 0 ? 'segmentedSelected' : 'segmented'}
                aria-pressed={activeTab === 0}
                onClick={() => setActiveTab(0)}
              >
                Cash flow
              </Button>
              <Button
                variant={activeTab === 1 ? 'segmentedSelected' : 'segmented'}
                aria-pressed={activeTab === 1}
                onClick={() => setActiveTab(1)}
              >
                Category trends
              </Button>
            </Stack>
          }
        />
      </Box>

      {/* Tab Panel 0: Cash Flow Bar Chart */}
      {activeTab === 0 && (
        <Box>
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 2.5 }}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
            sx={{ minHeight: 44, mb: 0.5 }}
          >
            {[
              { label: 'Spent', color: theme.palette.secondary.main },
              { label: 'Retained', color: theme.palette.primary.dark },
              {
                label: 'Plan space',
                color: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.1),
              },
            ].map((item) => (
              <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
                <CycleChartSwatch swatchColor={item.color} />
                <Typography variant="chartLegendLabel" color="text.secondary">
                  {item.label}
                </Typography>
              </Stack>
            ))}
            <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: 'auto' } }}>
              Actual cash flow by cycle
            </Typography>
          </Stack>

          <Box sx={{ width: '100%', overflowX: 'auto', pb: 0.5 }}>
            <Box
              role="img"
              aria-label={`Cash flow by budget cycle in ${baseCurrency}`}
              sx={{
                height: { xs: 300, sm: 360 },
                // Mobile/tablet: fit the viewport so nothing is cut off;
                // desktop keeps the comfortable per-cycle spacing.
                minWidth: { xs: '100%', md: Math.max(620, cycleData.length * 92) },
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                gap: { xs: 1, sm: 1.5 },
                px: 1,
                pt: 4,
                pb: 4,
              }}
            >
              <CycleCashFlowGuide />

              {cycleData.map((cycle, index) => {
                const capacity =
                  cashFlowSeries.spend[index] + cashFlowSeries.retained[index] + cashFlowSeries.planGap[index] || 1;
                const incomeHeight = Math.max(4, Math.min(100, (cycle.actualIncome / capacity) * 100));
                const spendHeight = Math.max(3, Math.min(100, (cycle.actualExpense / capacity) * 100));
                const capacityHeight = Math.max(
                  34,
                  Math.min(
                    100,
                    (capacity /
                      Math.max(
                        ...cycleData.map((item) =>
                          Math.max(item.expectedIncome, item.plannedBudget, item.actualIncome, item.actualExpense, 1),
                        ),
                      )) *
                      100,
                  ),
                );

                return (
                  <CycleCashFlowColumn
                    key={cycle.id}
                    cycleName={cycle.name}
                    income={cycle.actualIncome}
                    spent={cycle.actualExpense}
                    currency={baseCurrency}
                    capacityHeight={capacityHeight}
                    incomeHeight={incomeHeight}
                    spendHeight={spendHeight}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* Tab Panel 1: Category Line Chart */}
      {activeTab === 1 && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <FormControl sx={{ width: 180 }}>
              <InputLabel id="trend-cat-select-label">Category</InputLabel>
              <Select
                size="medium"
                labelId="trend-cat-select-label"
                value={selectedCategoryId}
                label="Category"
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                {expenseCategories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ height: { xs: 300, sm: 380 }, width: '100%' }}>
            {categoryTrends.length > 0 && (
              <CycleTrendLineChart
                xAxis={[
                  {
                    scaleType: 'point',
                    data: categoryTrends.map((t) => t.cycleName),
                  },
                ]}
                series={[
                  {
                    data: categoryTrends.map((t) => t.spent),
                    label: 'Spent',
                    color: theme.palette.primary.main,
                    area: true,
                    curve: 'catmullRom',
                    showMark: false,
                    valueFormatter: (value) => `${value?.toLocaleString() ?? 0} ${baseCurrency}`,
                  },
                ]}
                height={370}
                margin={{ top: 20, bottom: 40, left: 60, right: 20 }}
                grid={{ horizontal: true }}
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'bottom', horizontal: 'center' },
                    padding: -5,
                  } as any,
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Stack>
  );
}
