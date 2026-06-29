
import { Box, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { 
  useTransactions, 
  useLedgerLines, 
  useCategories, 
  useCycles, 
  useUsdRate, 
  useBudgetAllocations 
} from '@/hooks/useFinance';
import { computeDashboard } from '@/libs/selectors';
import { useAppContext } from '@/hooks/useAppContext';

export function BudgetBreakdownCard() {
  const { householdId } = useAppContext();
  const theme = useTheme();

  const chartColors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary?.main || '#006a61',
    '#0f766e',
    '#80d5cb',
    '#495167',
    '#616980',
  ];
  const { data: transactions } = useTransactions(householdId);
  const { data: ledgerLines } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const { data: displayRate = 50.0 } = useUsdRate();

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
    displayRate
  );

  const pieData = data.categoryStatus
    .filter(cat => cat.spent > 0)
    .map((cat, idx) => ({
      id: idx,
      value: cat.spent,
      label: cat.categoryName,
    }));

  return (
    <Stack spacing={1.5}>
      <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
        Budget Breakdown
      </Typography>

      {pieData.length > 0 && (
        <Paper 
          sx={{ 
            borderRadius: '20px', 
            border: '1px solid', 
            borderColor: 'divider', 
            boxShadow: 'none', 
            p: 2, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            bgcolor: 'background.paper',
            height: 180,
            overflow: 'hidden'
          }}
        >
          <PieChart
            colors={chartColors}
            series={[
              {
                data: pieData,
                innerRadius: 50,
                outerRadius: 75,
                paddingAngle: 2,
                cornerRadius: 4,
              },
            ]}
            height={160}
            slotProps={{ legend: { hidden: true } as any }}
          />
        </Paper>
      )}

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: '20px', 
          border: '1px solid', 
          borderColor: 'divider', 
          boxShadow: 'none', 
          overflowX: 'auto',
          maxHeight: 380,
          overflowY: 'auto'
        }}
      >
        <Table 
          size="medium" 
          stickyHeader 
          aria-label="budget breakdown table" 
          sx={{ 
            '& .MuiTableCell-head': { bgcolor: 'action.hover' }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '100%' }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Planned</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Spent</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Remaining</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.categoryStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No budget allocations found for this cycle.
                </TableCell>
              </TableRow>
            ) : (
              data.categoryStatus.map(cat => {
                const remaining = cat.planned - cat.spent;
                const isOver = remaining < 0;
                return (
                  <TableRow key={cat.categoryId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                      {cat.categoryName}
                    </TableCell>
                    <TableCell align="right">
                      {cat.planned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell align="right" sx={{ color: cat.spent > 0 ? 'text.primary' : 'text.disabled' }}>
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
  );
}
