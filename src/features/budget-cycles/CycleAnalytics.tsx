import { useState, useMemo } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Stack, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Skeleton,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { 
  useCycles, 
  useTransactions, 
  useLedgerLines, 
  useCategories, 
  useUsdRate,
  useAllBudgetAllocations,
  useAllExpectedIncomes
} from '../../hooks/useFinance';
import { useAppContext } from '../../hooks/useAppContext';

export function CycleAnalytics() {
  const { householdId } = useAppContext();
  const theme = useTheme();
  
  // Queries
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(householdId);
  const { data: transactions = [], isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: displayRate = 50.0 } = useUsdRate();
  const { data: allAllocations = [], isLoading: allocsLoading } = useAllBudgetAllocations(householdId);
  const { data: allExpectedIncomes = [], isLoading: incomesLoading } = useAllExpectedIncomes(householdId);

  // Tab State
  const [activeTab, setActiveTab] = useState(0);

  // Selected Category for Line Trend Chart
  const [selectedCategoryId, setSelectedCategoryId] = useState('masrof-bet');

  const isLoading = cyclesLoading || txsLoading || linesLoading || categoriesLoading || allocsLoading || incomesLoading;

  // Chronologically sorted active or closed cycles
  const sortedCycles = useMemo(() => {
    return [...cycles]
      .filter(c => c.status === 'open' || c.status === 'closed')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [cycles]);

  // Compute stats per cycle
  const cycleData = useMemo(() => {
    if (isLoading || sortedCycles.length === 0) return [];

    const activeTxIds = new Set(transactions.filter(t => t.status === 'posted').map(t => t.id));
    const activeLines = ledgerLines.filter(line => activeTxIds.has(line.transactionId));

    return sortedCycles.map(cycle => {
      // Find actual income and expenses in EGP equivalent
      let actualIncome = 0;
      let actualExpense = 0;

      // Filter transactions belonging to this cycle
      const cycleTxs = transactions.filter(t => t.budgetCycleId === cycle.id && t.status === 'posted');
      const cycleTxIds = new Set(cycleTxs.map(t => t.id));
      const cycleLines = activeLines.filter(l => cycleTxIds.has(l.transactionId));

      cycleTxs.forEach(tx => {
        const txLines = cycleLines.filter(l => l.transactionId === tx.id);
        txLines.forEach(l => {
          let amountEgp = Math.abs(l.signedAmount);
          if (l.currency === 'USD') {
            amountEgp = amountEgp * displayRate;
          }
          if (tx.type === 'income') {
            actualIncome += amountEgp;
          } else if (tx.type === 'expense') {
            actualExpense += amountEgp;
          }
        });
      });

      // Find planned budget (allocations)
      const cycleAllocations = allAllocations.filter(a => a.budgetCycleId === cycle.id);
      const plannedBudget = cycleAllocations.reduce((acc, curr) => acc + curr.plannedAmount, 0);

      // Find expected income
      const cycleExpectedIncomes = allExpectedIncomes.filter(i => i.budgetCycleId === cycle.id);
      const expectedIncome = cycleExpectedIncomes.reduce((acc, curr) => {
        const rate = curr.expectedRateToBaseCurrency || displayRate;
        return acc + (curr.amount * (curr.currency === 'USD' ? rate : 1));
      }, 0);

      return {
        id: cycle.id,
        name: cycle.name,
        actualIncome: Math.round(actualIncome),
        actualExpense: Math.round(actualExpense),
        plannedBudget: Math.round(plannedBudget),
        expectedIncome: Math.round(expectedIncome),
        savings: Math.round(actualIncome - actualExpense)
      };
    });
  }, [isLoading, sortedCycles, transactions, ledgerLines, allAllocations, allExpectedIncomes, displayRate]);

  // Compute category trends over cycles
  const categoryTrends = useMemo(() => {
    if (isLoading || sortedCycles.length === 0 || !selectedCategoryId) return [];

    const activeTxIds = new Set(transactions.filter(t => t.status === 'posted').map(t => t.id));
    const activeLines = ledgerLines.filter(line => activeTxIds.has(line.transactionId));

    return sortedCycles.map(cycle => {
      let spent = 0;
      
      const cycleTxs = transactions.filter(t => t.budgetCycleId === cycle.id && t.status === 'posted' && t.categoryId === selectedCategoryId);
      const cycleTxIds = new Set(cycleTxs.map(t => t.id));
      const cycleLines = activeLines.filter(l => cycleTxIds.has(l.transactionId));

      cycleTxs.forEach(tx => {
        const txLines = cycleLines.filter(l => l.transactionId === tx.id);
        txLines.forEach(l => {
          let amountEgp = Math.abs(l.signedAmount);
          if (l.currency === 'USD') {
            amountEgp = amountEgp * displayRate;
          }
          spent += amountEgp;
        });
      });

      return {
        cycleName: cycle.name,
        spent: Math.round(spent)
      };
    });
  }, [isLoading, sortedCycles, transactions, ledgerLines, selectedCategoryId, displayRate]);

  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense');
  }, [categories]);

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width="40%" height={28} animation="wave" />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '12px', mt: 2 }} animation="wave" />
        </CardContent>
      </Card>
    );
  }

  if (cycleData.length === 0) return null;

  return (
    <Card 
      sx={{ 
        borderRadius: '20px', 
        border: '1px solid', 
        borderColor: 'divider', 
        boxShadow: 'none', 
        mb: 3,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header & Tabs */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', sm: 'center' }} 
          spacing={2} 
          sx={{ mb: 2.5 }}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon sx={{ color: 'primary.main' }} />
            Cycle Analytics & Trends
          </Typography>
          
          <Tabs 
            value={activeTab} 
            onChange={(_, val) => setActiveTab(val)}
            sx={{ 
              minHeight: 36,
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTab-root': {
                minHeight: 32,
                py: 0.5,
                px: 2,
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'none',
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  color: 'primary.contrastText',
                  bgcolor: 'primary.main'
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'action.hover'
                }
              }
            }}
          >
            <Tab label="Cash Flow" id="analytics-tab-0" />
            <Tab label="Category Trends" id="analytics-tab-1" />
          </Tabs>
        </Stack>

        {/* Tab Panel 0: Cash Flow Bar Chart */}
        {activeTab === 0 && (
          <Box sx={{ height: 320, width: '100%' }}>
            <BarChart
              xAxis={[{ 
                scaleType: 'band', 
                data: cycleData.map(d => d.name) 
              }]}
              series={[
                { data: cycleData.map(d => d.actualIncome), label: 'Income', color: theme.palette.success.main },
                { data: cycleData.map(d => d.actualExpense), label: 'Spend', color: theme.palette.error.main }
              ]}
              height={300}
              margin={{ top: 20, bottom: 40, left: 60, right: 20 }}
              slotProps={{
                legend: {
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                  padding: -5
                }
              }}
              sx={{
                '& .MuiChartsAxis-line': {
                  stroke: theme.palette.divider,
                },
                '& .MuiChartsAxis-tick': {
                  stroke: theme.palette.divider,
                },
                '& .MuiChartsAxis-tickLabel text': {
                  fill: `${theme.palette.text.secondary} !important`,
                  fontSize: '11px !important',
                },
                '& .MuiChartsLegend-root text': {
                  fill: `${theme.palette.text.primary} !important`,
                  fontSize: '12px !important',
                }
              }}
            />
          </Box>
        )}

        {/* Tab Panel 1: Category Line Chart */}
        {activeTab === 1 && (
          <Box>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ width: 180 }}>
                <InputLabel id="trend-cat-select-label">Category</InputLabel>
                <Select
                  labelId="trend-cat-select-label"
                  value={selectedCategoryId}
                  label="Category"
                  onChange={e => setSelectedCategoryId(e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  {expenseCategories.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            
            <Box sx={{ height: 320, width: '100%' }}>
              {categoryTrends.length > 0 && (
                <LineChart
                  xAxis={[{ 
                    scaleType: 'point', 
                    data: categoryTrends.map(t => t.cycleName) 
                  }]}
                  series={[
                    { 
                      data: categoryTrends.map(t => t.spent), 
                      label: 'Spent', 
                      color: theme.palette.primary.main 
                    }
                  ]}
                  height={300}
                  margin={{ top: 20, bottom: 40, left: 60, right: 20 }}
                  slotProps={{
                    legend: {
                      direction: 'row',
                      position: { vertical: 'bottom', horizontal: 'middle' },
                      padding: -5
                    }
                  }}
                  sx={{
                    '& .MuiChartsAxis-line': {
                      stroke: theme.palette.divider,
                      strokeWidth: 1,
                    },
                    '& .MuiChartsAxis-tick': {
                      stroke: theme.palette.divider,
                    },
                    '& .MuiChartsAxis-tickLabel text': {
                      fill: `${theme.palette.text.secondary} !important`,
                      fontSize: '11px !important',
                    },
                    '& .MuiChartsLegend-root text': {
                      fill: `${theme.palette.text.primary} !important`,
                      fontSize: '12px !important',
                    }
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
