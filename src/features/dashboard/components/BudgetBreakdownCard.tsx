import { Box, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { 
  useTransactions, 
  useLedgerLines, 
  useCategories, 
  useCycles, 
  useUsdRate, 
  useBudgetAllocations 
} from '../../../hooks/useFinance';
import { computeDashboard } from '../../../libs/selectors';
import { useAppContext } from '../../../hooks/useAppContext';
import { InfoTooltip } from '../../shared/components/InfoTooltip';
import { metricExplanations } from '../../shared/constants/metricExplanations';

export function BudgetBreakdownCard() {
  const { householdId } = useAppContext();
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

  return (
    <Stack spacing={1.5}>
      <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
        Budget Breakdown
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflowX: 'auto' }}>
        <Table size="small" aria-label="budget breakdown table" sx={{ '& .MuiTableCell-root': { px: 1 } }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5, width: '100%' }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>
                <InfoTooltip label="Planned" text={metricExplanations.budgetBreakdownPlanned} />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>
                <InfoTooltip label="Spent" text={metricExplanations.budgetBreakdownSpent} />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '12px', py: 1.5 }}>
                <InfoTooltip label="Remaining" text={metricExplanations.budgetBreakdownRemaining} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.categoryStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '13px' }}>
                  No budget allocations found for this cycle.
                </TableCell>
              </TableRow>
            ) : (
              data.categoryStatus.map(cat => {
                const remaining = cat.planned - cat.spent;
                const isOver = remaining < 0;
                return (
                  <TableRow key={cat.categoryId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ fontSize: '13px', fontWeight: 500, py: 1.2 }}>
                      {cat.categoryName}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '13px', py: 1.2 }}>
                      {cat.planned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '13px', py: 1.2, color: cat.spent > 0 ? 'text.primary' : 'text.disabled' }}>
                      {cat.spent > 0 ? cat.spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontSize: '13px', 
                        fontWeight: 'bold', 
                        py: 1.2, 
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
