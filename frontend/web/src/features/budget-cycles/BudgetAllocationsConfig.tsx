import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import { ContentCopyIcon } from '@/components/AppIcon';
import { AddIcon } from '@/components/AppIcon';
import {
  useSaveAllocationsBatchMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useHouseholdBaseCurrency
} from '@/hooks/useFinance';
import { Money } from '@/components/Money';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { cyclesLib } from '@/libs/cycles';
import { BudgetCycle, BudgetAllocation, Category } from '@kippa/domain';
import { AllocationRow, AllocationRows } from './components/AllocationRows';
import { CategoryNameDialog } from './components/CategoryNameDialog';
import { useAllocationCategoryDialogs } from './hooks/useAllocationCategoryDialogs';

interface BudgetAllocationsConfigProps {
  householdId: string;
  activeCycle: BudgetCycle;
  categories: Category[];
  dbAllocations: BudgetAllocation[];
  cycles: BudgetCycle[];
  onSave?: () => void;
  saveRef?: React.RefObject<(() => Promise<void>) | null>;
  onSavingStatusChange?: (isSaving: boolean) => void;
  onTotalBudgetChange?: (total: number) => void;
}

export function BudgetAllocationsConfig({
  householdId,
  activeCycle,
  categories,
  dbAllocations,
  cycles,
  onSave,
  saveRef,
  onSavingStatusChange,
  onTotalBudgetChange
}: BudgetAllocationsConfigProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { maskDigits, privacyMode } = usePrivacyMask();
  const baseCurrency = useHouseholdBaseCurrency();
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const [rows, setRows] = useState<AllocationRow[]>(() => {
    const initial: AllocationRow[] = [];

    // Add rows for existing allocations
    dbAllocations.forEach(alloc => {
      initial.push({
        categoryId: alloc.categoryId,
        plannedAmount: alloc.plannedAmount.toString(),
      });
    });

    // If no allocations exist yet, add all expense categories with 0
    if (initial.length === 0) {
      expenseCategories.forEach(cat => {
        initial.push({ categoryId: cat.id, plannedAmount: '0' });
      });
    }

    return initial;
  });

  const categoryDialog = useAllocationCategoryDialogs();

  // Mutations
  const saveAllocationsBatchMutation = useSaveAllocationsBatchMutation();
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();



  // Categories available to add (not already in rows)
  const usedCategoryIds = new Set(rows.map(r => r.categoryId));
  const availableCategories = expenseCategories.filter(c => !usedCategoryIds.has(c.id));

  const handleAddExistingCategory = (categoryId: string) => {
    setRows(prev => [...prev, { categoryId, plannedAmount: '0' }]);
  };

  const handleRemoveCategory = (categoryId: string) => {
    setRows(prev => prev.filter(r => r.categoryId !== categoryId));
  };

  const handleAmountChange = (categoryId: string, value: string) => {
    setRows(prev => prev.map(r =>
      r.categoryId === categoryId ? { ...r, plannedAmount: value } : r
    ));
  };

  const handleOpenRename = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    categoryDialog.openRename(categoryId, cat?.name || '');
  };

  const handleSaveRename = async () => {
    if (!categoryDialog.categoryId || !categoryDialog.value.trim()) return;
    await updateCategoryMutation.mutateAsync({
      householdId,
      categoryId: categoryDialog.categoryId,
      updates: { name: categoryDialog.value.trim() },
    });
    categoryDialog.close();
  };

  const handleCreateNewCategory = async () => {
    if (!categoryDialog.value.trim()) return;
    const newId = await createCategoryMutation.mutateAsync({
      householdId,
      category: { name: categoryDialog.value.trim(), type: 'expense', isActive: true },
    });
    // Add to rows immediately
    setRows(prev => [...prev, { categoryId: newId, plannedAmount: '0' }]);
    categoryDialog.close();
  };

  const handleSaveAllocations = useCallback(async () => {
    const payload: Omit<BudgetAllocation, 'id' | 'householdId'>[] = rows.map(row => ({
      budgetCycleId: activeCycle.id,
      categoryId: row.categoryId,
      plannedAmount: parseFloat(row.plannedAmount) || 0,
      currency: baseCurrency,
      carryLeftover: false,
    }));

    await saveAllocationsBatchMutation.mutateAsync({
      householdId,
      cycleId: activeCycle.id,
      allocations: payload
    });
    enqueueSnackbar('Allocations saved!', { variant: 'success' });
    if (onSave) onSave();
  }, [rows, activeCycle.id, householdId, saveAllocationsBatchMutation, enqueueSnackbar, onSave, baseCurrency]);

  const handleCopyPreviousAllocations = async () => {
    const closedCycle = cycles.find(c => c.status === 'closed');
    if (!closedCycle) {
      enqueueSnackbar('No previous cycle allocations found to copy.', { variant: 'warning' });
      return;
    }

    const prevAllocations = await cyclesLib.getBudgetAllocations(householdId, closedCycle.id);
    if (prevAllocations.length === 0) {
      enqueueSnackbar('Previous cycle had no allocations configured.', { variant: 'warning' });
      return;
    }

    const newRows: AllocationRow[] = prevAllocations.map(alloc => ({
      categoryId: alloc.categoryId,
      plannedAmount: alloc.plannedAmount.toString(),
    }));

    setRows(newRows);
  };

  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || 'Unknown';
  };

  const totalBudget = rows.reduce((sum, r) => sum + (parseFloat(r.plannedAmount) || 0), 0);

  // Register the save function ref for the parent to call
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSaveAllocations;
    }
  }, [rows, activeCycle, householdId, saveRef, handleSaveAllocations]);

  // Report saving status to parent
  useEffect(() => {
    if (onSavingStatusChange) {
      onSavingStatusChange(saveAllocationsBatchMutation.isPending);
    }
  }, [saveAllocationsBatchMutation.isPending, onSavingStatusChange]);

  // Notify parent of total budget changes
  useEffect(() => {
    if (onTotalBudgetChange) {
      onTotalBudgetChange(totalBudget);
    }
  }, [totalBudget, onTotalBudgetChange]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '15px' }}>
          Category Budgets ({baseCurrency})
        </Typography>
        <Button 
          variant="text" 
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyPreviousAllocations}
        >
          Copy previous
        </Button>
      </Box>

      <AllocationRows
        rows={rows}
        privacyMode={privacyMode}
        maskDigits={maskDigits}
        getCategoryName={getCategoryName}
        onAmountChange={handleAmountChange}
        onRename={handleOpenRename}
        onRemove={handleRemoveCategory}
      />

      {/* Category actions */}
      <Box sx={{ mt: 2.5, pt: 2.25, borderTop: 1, borderColor: 'divider' }}>
        <Stack spacing={0.25} sx={{ mb: 1.25 }}>
          <Typography sx={{ color: 'text.primary', fontSize: 14, fontWeight: 700 }}>
            Add to cycle
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            Choose an existing category or create a new one.
          </Typography>
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {availableCategories.map(cat => (
              <Chip
                key={cat.id}
                label={cat.name}
                variant="outlined"
                onClick={() => handleAddExistingCategory(cat.id)}
                sx={{
                  height: 36,
                  borderRadius: '12px',
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  borderColor: 'divider',
                  fontSize: 13,
                  fontWeight: 400,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              />
          ))}
          <Tooltip title="Create a new category">
            <IconButton
              aria-label="Create a new category"
              onClick={categoryDialog.openAdd}
              sx={{
                width: 36,
                height: 36,
                border: 1,
                borderColor: 'divider',
                borderRadius: '12px',
                bgcolor: 'background.paper',
                color: 'primary.main',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
              }}
            >
              <AddIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Total + Save */}
      {!saveRef && <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5, pt: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total Budget
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px' }}>
            <Money amount={totalBudget} code={baseCurrency} />
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleSaveAllocations} loading={saveAllocationsBatchMutation.isPending}>Save</Button>
      </Box>}

      <CategoryNameDialog open={categoryDialog.mode === 'rename'} title="Rename Category" confirmLabel="Save" value={categoryDialog.value} loading={updateCategoryMutation.isPending} onChange={categoryDialog.setValue} onClose={categoryDialog.close} onConfirm={handleSaveRename} />
      <CategoryNameDialog open={categoryDialog.mode === 'add'} title="Add New Category" confirmLabel="Create & Add" value={categoryDialog.value} placeholder="e.g. Entertainment" loading={createCategoryMutation.isPending} onChange={categoryDialog.setValue} onClose={categoryDialog.close} onConfirm={handleCreateNewCategory} />
    </Box>
  );
}
