import { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Checkbox, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { 
  useSaveAllocationsBatchMutation 
} from '../../hooks/useFinance';
import { cyclesLib } from '../../libs/cycles';
import { BudgetCycle, BudgetAllocation, Category } from '../../domain/financeTypes';

interface BudgetAllocationsConfigProps {
  householdId: string;
  activeCycle: BudgetCycle;
  categories: Category[];
  dbAllocations: BudgetAllocation[];
  cycles: BudgetCycle[];
}

export function BudgetAllocationsConfig({
  householdId,
  activeCycle,
  categories,
  dbAllocations,
  cycles
}: BudgetAllocationsConfigProps) {
  const [plannedAmounts, setPlannedAmounts] = useState<Record<string, string>>(() => {
    const amounts: Record<string, string> = {};
    categories.filter(c => c.type === 'expense').forEach(cat => {
      const match = dbAllocations.find(a => a.categoryId === cat.id);
      amounts[cat.id] = match ? match.plannedAmount.toString() : '0';
    });
    return amounts;
  });

  const [carryLeftovers, setCarryLeftovers] = useState<Record<string, boolean>>(() => {
    const leftovers: Record<string, boolean> = {};
    categories.filter(c => c.type === 'expense').forEach(cat => {
      const match = dbAllocations.find(a => a.categoryId === cat.id);
      leftovers[cat.id] = match ? match.carryLeftover : false;
    });
    return leftovers;
  });

  const saveAllocationsBatchMutation = useSaveAllocationsBatchMutation();

  const handleSaveAllocations = async () => {
    const payload: Omit<BudgetAllocation, 'id' | 'householdId'>[] = categories
      .filter(c => c.type === 'expense')
      .map(cat => ({
        budgetCycleId: activeCycle.id,
        categoryId: cat.id,
        plannedAmount: parseFloat(plannedAmounts[cat.id]) || 0,
        currency: 'EGP',
        carryLeftover: !!carryLeftovers[cat.id],
      }));

    await saveAllocationsBatchMutation.mutateAsync({
      householdId,
      cycleId: activeCycle.id,
      allocations: payload
    });
    alert('Allocations saved successfully!');
  };

  const handleCopyPreviousAllocations = async () => {
    const closedCycle = cycles.find(c => c.status === 'closed');
    if (!closedCycle) {
      alert('No previous cycle allocations found to copy.');
      return;
    }

    const prevAllocations = await cyclesLib.getBudgetAllocations(householdId, closedCycle.id);
    if (prevAllocations.length === 0) {
      alert('Previous cycle had no allocations configured.');
      return;
    }

    const amounts: Record<string, string> = {};
    const leftovers: Record<string, boolean> = {};

    categories.filter(c => c.type === 'expense').forEach(cat => {
      const match = prevAllocations.find(a => a.categoryId === cat.id);
      amounts[cat.id] = match ? match.plannedAmount.toString() : '0';
      leftovers[cat.id] = match ? match.carryLeftover : false;
    });

    setPlannedAmounts(amounts);
    setCarryLeftovers(leftovers);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h3">Configure Category Budgets (EGP)</Typography>
        <Button 
          variant="text" 
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyPreviousAllocations}
        >
          Copy from previous
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Expense Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1.5 }} width="180px">Planned Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1.5 }} width="150px">Carry Leftover?</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.filter(c => c.type === 'expense').map(cat => (
              <TableRow key={cat.id}>
                <TableCell sx={{ fontWeight: 500 }}>{cat.name}</TableCell>
                <TableCell>
                  <TextField 
                    size="small"
                    type="number"
                    value={plannedAmounts[cat.id] || '0'}
                    onChange={e => setPlannedAmounts({ ...plannedAmounts, [cat.id]: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, width: '130px' }}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox 
                    checked={!!carryLeftovers[cat.id]}
                    onChange={e => setCarryLeftovers({ ...carryLeftovers, [cat.id]: e.target.checked })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleSaveAllocations}
          disabled={saveAllocationsBatchMutation.isPending}
        >
          Save Allocations
        </Button>
      </Box>
    </Box>
  );
}
