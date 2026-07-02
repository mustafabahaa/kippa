
import { Box, Card, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme, Grid, LinearProgress } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCategories,
  useCycles,
  useDisplayRates,
  useHouseholdBaseCurrency,
  useBudgetAllocations
} from '@/hooks/useFinance';
import { computeDashboard } from '@/libs/selectors';
import { useAppContext } from '@/hooks/useAppContext';
import { formatCurrency } from '@/libs/format';

export function BudgetBreakdownCard() {
  const { householdId } = useAppContext();
  const theme = useTheme();

  const chartColors = theme.palette.chart.colors;
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: transactions } = useTransactions(householdId);
  const { data: ledgerLines } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCodes = Array.from(new Set(accounts.map(a => a.currency).filter(c => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);

  const activeCycle = cycles.find(c => c.status === 'open') || null;
  const activeCycleId = activeCycle?.id;

  const { data: allocations, isLoading: allocsLoading } = useBudgetAllocations(householdId, activeCycleId);

  const isLoading = allocsLoading || !transactions || !ledgerLines;

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: '20px' }} animation="wave" />
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
    baseCurrency
  );

  const pieData = data.categoryStatus
    .filter(cat => cat.spent > 0)
    .map((cat, idx) => ({
      id: idx,
      value: cat.spent,
      label: cat.categoryName,
    }));

  const totalPlanned = data.categoryStatus.reduce((sum, cat) => sum + cat.planned, 0);
  const totalSpent = data.categoryStatus.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalPlanned - totalSpent;
  const totalSpentPercent = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
  
  const hasSpending = pieData.length > 0;
  const displayPieData = hasSpending
    ? pieData
    : [{ id: 0, value: 1, label: 'No spending yet' }];
  const displayPieColors = hasSpending
    ? chartColors
    : [theme.palette.action.disabledBackground || theme.palette.divider];

  return (
    <Card 
      sx={{ 
        borderRadius: '20px', 
        border: '1px solid', 
        borderColor: 'divider', 
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
          Budget Breakdown
        </Typography>
        {activeCycle && (
          <Box sx={{ bgcolor: 'action.hover', px: 1.5, py: 0.5, borderRadius: '999px', fontSize: '12px', fontWeight: 500, color: 'text.secondary' }}>
            Cycle: {activeCycle.name}
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={3}>
          {/* Top Section: Chart on left, Summary stats on right */}
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: 180,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <PieChart
                  colors={displayPieColors}
                  series={[
                    {
                      data: displayPieData,
                      innerRadius: 55,
                      outerRadius: 80,
                      cx: '50%',
                      cy: '50%',
                      paddingAngle: hasSpending ? 2 : 0,
                      cornerRadius: hasSpending ? 4 : 0,
                    },
                  ]}
                  height={170}
                  margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  hideLegend
                />
                {!hasSpending && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block' }}>
                      No Spent
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>
                      Record first expense
                    </Typography>
                  </Box>
                )}
                {hasSpending && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Spent Ratio
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
                      {Math.round(totalSpentPercent)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 7 }}>
              {/* Summary Stats */}
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: 'action.hover', 
                  border: '1px solid', 
                  borderColor: 'divider' 
                }}
              >
                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Planned Budget</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {formatCurrency(totalPlanned, baseCurrency)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Spent</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: totalSpent > totalPlanned ? 'error.main' : 'text.primary' }}>
                      {formatCurrency(totalSpent, baseCurrency)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Remaining</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: totalRemaining < 0 ? 'error.main' : 'success.main' }}>
                      {totalRemaining < 0 ? '-' : ''}{formatCurrency(Math.abs(totalRemaining), baseCurrency)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* Bottom Section: Breakdown Table (Full Width) */}
          <TableContainer 
            sx={{ 
              overflowX: 'auto',
              maxHeight: 380,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              bgcolor: 'background.paper',
              overflowY: 'auto'
            }}
          >
            <Table 
              size="medium" 
              stickyHeader 
              aria-label="budget breakdown table" 
              sx={{ 
                '& .MuiTableCell-head': { bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' },
                '& .MuiTableCell-body': { borderBottom: '1px solid', borderColor: 'divider' }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Progress</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Planned</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Spent</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Remaining</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.categoryStatus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No budget allocations found for this cycle.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.categoryStatus.map((cat, idx) => {
                    const remaining = cat.planned - cat.spent;
                    const isOver = remaining < 0;
                    const percent = cat.planned > 0 ? (cat.spent / cat.planned) * 100 : (cat.spent > 0 ? 100 : 0);
                    const catColor = chartColors[idx % chartColors.length];

                    const getCategoryStatusColor = (status: 'on-track' | 'warning' | 'over') => {
                      if (status === 'on-track') return theme.palette.success.main;
                      if (status === 'warning') return theme.palette.warning.main;
                      return theme.palette.error.main;
                    };

                    const statusColor = getCategoryStatusColor(cat.status);

                    return (
                      <TableRow key={cat.categoryId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row">
                          <Stack spacing={0.5}>
                            <Box display="flex" alignItems="center" gap={1.2}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {cat.categoryName}
                              </Typography>
                            </Box>
                            
                            {/* Mobile Only progress bar under Category Name */}
                            <Box sx={{ display: { xs: 'block', sm: 'none' }, width: '100px', mt: 0.5 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(100, percent)} 
                                sx={{ 
                                  height: 4, 
                                  borderRadius: 2, 
                                  bgcolor: 'action.hover',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: statusColor
                                  }
                                }} 
                              />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '9px', fontWeight: 'bold' }}>
                                {Math.round(percent)}% spent
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        
                        {/* Desktop Only Progress Column */}
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ flexGrow: 1, minWidth: 60 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(100, percent)} 
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3, 
                                  bgcolor: 'action.hover',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: statusColor
                                  }
                                }} 
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', minWidth: 32, textAlign: 'right' }}>
                              {Math.round(percent)}%
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {cat.planned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell align="right" sx={{ color: cat.spent > 0 ? 'text.primary' : 'text.disabled', fontWeight: 500 }}>
                          {cat.spent > 0 ? cat.spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: isOver ? 'error.main' : remaining > 0 ? 'success.main' : 'text.secondary' 
                          }}
                        >
                          {isOver ? '' : '+'}{remaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Box>
    </Card>
  );
}
