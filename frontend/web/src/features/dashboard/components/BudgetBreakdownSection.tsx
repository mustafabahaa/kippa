import { BarChartIcon, PaymentsIcon, SavingsIcon } from '@/components/AppIcon';

import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
  useTheme,
  LinearProgress,
  Paper,
} from '@monochrome-ui/design-system';
import { MetricBadge, ChartColorMarker } from '@monochrome-ui/design-system';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCategories,
  useCycles,
  useDisplayRates,
  useHouseholdBaseCurrency,
  useBudgetAllocations,
  useLoans,
} from '@/hooks/useFinance';
import { computeDashboard } from '@/libs/selectors';
import { useAppContext } from '@/hooks/useAppContext';
import { Money } from '@/components/Money';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { DashboardSectionHeading } from './DashboardSectionHeading';
import { CategoryPaceChart } from './CategoryPaceChart';

const formatMaskedValue = (value: number, mask: (value: string) => string) => mask(Math.round(value).toLocaleString());

export function BudgetBreakdownSection() {
  const { householdId } = useAppContext();
  const theme = useTheme();
  const { maskNumber } = usePrivacyMask();

  const chartColors = theme.palette.chart.colors;
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: transactions } = useTransactions(householdId);
  const { data: ledgerLines } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCodes = Array.from(new Set(accounts.map((a) => a.currency).filter((c) => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);

  const activeCycle = cycles.find((c) => c.status === 'open') || null;
  const activeCycleId = activeCycle?.id;

  const { data: allocations, isLoading: allocsLoading } = useBudgetAllocations(householdId, activeCycleId);
  const { data: loans = [] } = useLoans(householdId);

  const isLoading = allocsLoading || !transactions || !ledgerLines;

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" width="100%" height={150} animation="wave" />
      </Box>
    );
  }

  const data = computeDashboard(
    [],
    transactions || [],
    ledgerLines || [],
    categories,
    activeCycle,
    allocations || [],
    [],
    displayRates,
    baseCurrency,
    loans,
  );

  const totalPlanned = data.categoryStatus.reduce((sum, cat) => sum + cat.planned, 0);
  const totalSpent = data.categoryStatus.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalPlanned - totalSpent;
  const spentPercent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

  return (
    <Card variant="sectionSurface">
      <CardContent>
        <Stack spacing={3}>
          <DashboardSectionHeading
            title="Budget Breakdown"
            subtitle="Planned versus actual spending by category"
            trailing={activeCycle ? <Chip label={activeCycle.name} /> : undefined}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
              gap: { xs: 1, sm: 1.5, lg: 2 },
            }}
          >
            {[
              {
                label: 'Planned budget',
                value: totalPlanned,
                valueColor: 'text.primary',
                tone: 'primary' as const,
                meta: `${data.categoryStatus.length} category allocations`,
                Icon: PaymentsIcon,
              },
              {
                label: 'Total spent',
                value: totalSpent,
                valueColor: totalSpent > totalPlanned ? 'error.main' : 'text.primary',
                tone: totalSpent > totalPlanned ? ('error' as const) : ('secondary' as const),
                meta: `${spentPercent}% of the cycle plan`,
                Icon: BarChartIcon,
              },
              {
                label: totalRemaining < 0 ? 'Over budget' : 'Remaining',
                value: Math.abs(totalRemaining),
                valueColor: totalRemaining < 0 ? 'error.main' : 'success.main',
                tone: totalRemaining < 0 ? ('error' as const) : ('success' as const),
                meta: totalRemaining < 0 ? 'Requires budget attention' : 'Available to spend',
                Icon: SavingsIcon,
              },
            ].map((metric) => (
              <Box
                key={metric.label}
                sx={{
                  minWidth: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  py: 1,
                  px: { xs: 0, sm: 1 },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography variant="metricLabelCompact" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Typography
                      variant="summaryValue"
                      color={metric.valueColor}
                      sx={{ overflowWrap: 'anywhere' }}
                    >
                      <Money amount={metric.value} code={baseCurrency} maxDigits={0} />
                    </Typography>
                  </Stack>
                  <MetricBadge tone={metric.tone}>
                    <metric.Icon size={22} />
                  </MetricBadge>
                </Stack>
                <Typography noWrap variant="metricMetadataCompact" color="text.secondary" sx={{ mt: 1.25 }}>
                  {metric.meta}
                </Typography>
              </Box>
            ))}
          </Box>

          {data.loanCommitments.length > 0 && (
            <Stack spacing={1.5}>
              <Typography variant="sectionLabel">Fixed commitments</Typography>
              {data.loanCommitments.map((commitment) => (
                <Stack
                  key={commitment.loanId}
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PaymentsIcon size={22} strokeWidth={1.8} />
                    <Box>
                      <Typography variant="body1">{commitment.loanName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Included in this cycle outside category spending
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={
                      commitment.paid > 0
                        ? `Paid ${commitment.paid.toLocaleString()} ${baseCurrency}`
                        : `Due ${commitment.planned.toLocaleString()} ${baseCurrency}`
                    }
                    color={commitment.paid >= commitment.planned ? 'success' : 'warning'}
                  />
                </Stack>
              ))}
            </Stack>
          )}

          <CategoryPaceChart categories={data.categoryStatus} />

          <Stack spacing={1.5} aria-label="Budget breakdown details">
            <Box
              sx={{
                display: { xs: 'none', lg: 'grid' },
                gridTemplateColumns: 'minmax(140px, 1.4fr) minmax(150px, 1fr) repeat(3, minmax(84px, .7fr))',
                gap: 2,
                px: 1,
              }}
            >
              {['Category', 'Progress', 'Planned', 'Spent', 'Remaining'].map((label, index) => (
                <Typography
                  key={label}
                  variant="tableColumnHeading"
                  color="text.secondary"
                  sx={{
                    textAlign: index > 1 ? 'right' : 'left',
                  }}
                >
                  {label}
                </Typography>
              ))}
            </Box>

            {data.categoryStatus.length === 0 ? (
              <Typography align="center" variant="tableEmptyMessage" color="text.secondary" sx={{ py: 4 }}>
                No budget allocations found for this cycle.
              </Typography>
            ) : (
              data.categoryStatus.map((cat, idx) => {
                const remaining = cat.planned - cat.spent;
                const isOver = remaining < 0;
                const percent = cat.planned > 0 ? (cat.spent / cat.planned) * 100 : cat.spent > 0 ? 100 : 0;
                const catColor = chartColors[idx % chartColors.length];

                return (
                  <Paper
                    key={cat.categoryId}
                    variant="detailRow"
                    sx={{ px: 1, py: 1 }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          lg: 'minmax(140px, 1.4fr) minmax(150px, 1fr) repeat(3, minmax(84px, .7fr))',
                        },
                        gap: { xs: 1.5, lg: 2 },
                        alignItems: 'center',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                        <ChartColorMarker color={catColor} />
                        <Typography noWrap variant="listItemTitle" color="text.primary">
                          {cat.categoryName}
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, percent)}
                          color={percent > 100 ? 'error' : 'success'}
                          sx={{ flex: 1 }}
                        />
                        <Typography
                          variant="metricPercent"
                          color="text.secondary"
                          sx={{
                            minWidth: 34,
                            textAlign: 'right',
                          }}
                        >
                          {Math.round(percent)}%
                        </Typography>
                      </Stack>
                      <Box
                        sx={{
                          display: { xs: 'grid', lg: 'contents' },
                          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                          gap: 1.5,
                        }}
                      >
                        {[
                          {
                            label: 'Planned',
                            value: formatMaskedValue(cat.planned, maskNumber),
                            color: 'text.primary',
                          },
                          {
                            label: 'Spent',
                            value: cat.spent > 0 ? formatMaskedValue(cat.spent, maskNumber) : '—',
                            color: cat.spent > 0 ? 'text.primary' : 'text.disabled',
                          },
                          {
                            label: 'Remaining',
                            value: `${isOver ? '' : '+'}${formatMaskedValue(remaining, maskNumber)}`,
                            color: isOver ? 'error.main' : remaining > 0 ? 'success.main' : 'text.secondary',
                          },
                        ].map((item) => (
                          <Box key={item.label} sx={{ minWidth: 0, textAlign: { xs: 'left', lg: 'right' } }}>
                            <Typography
                              variant="tableCellLabel"
                              color="text.secondary"
                              sx={{
                                display: { xs: 'block', lg: 'none' },
                              }}
                            >
                              {item.label}
                            </Typography>
                            <Typography
                              noWrap
                              variant="tableCellValue"
                              color={item.color}
                              sx={{
                                display: 'block',
                              }}
                            >
                              {item.value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
