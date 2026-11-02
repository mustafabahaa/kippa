import { ContentCopyIcon } from '@/components/AppIcon';

import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Button, Divider, Stack, Typography, Chip } from '@monochrome-ui/design-system';
import { useSaveAllocationsBatchMutation, useHouseholdBaseCurrency } from '@/hooks/useFinance';
import { Money } from '@/components/Money';
import { usePrivacyMask } from '@/hooks/usePrivacyMask';
import { cyclesLib } from '@/libs/cycles';
import { BudgetCycle, BudgetAllocation, Category } from '@kippa/domain';
import { AllocationRow, AllocationRows } from './components/AllocationRows';

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
  onTotalBudgetChange,
}: BudgetAllocationsConfigProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { maskDigits, privacyMode } = usePrivacyMask();
  const baseCurrency = useHouseholdBaseCurrency();
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [rows, setRows] = useState<AllocationRow[]>(() => {
    const initial: AllocationRow[] = [];

    // Add rows for existing allocations
    dbAllocations.forEach((alloc) => {
      initial.push({
        categoryId: alloc.categoryId,
        plannedAmount: alloc.plannedAmount.toString(),
      });
    });

    // If no allocations exist yet, add all expense categories with 0
    if (initial.length === 0) {
      expenseCategories.forEach((cat) => {
        initial.push({ categoryId: cat.id, plannedAmount: '0' });
      });
    }

    return initial;
  });
  const [isCopyingPrevious, setIsCopyingPrevious] = useState(false);

  // Mutations
  const saveAllocationsBatchMutation = useSaveAllocationsBatchMutation();

  // Categories available to add (not already in rows)
  const usedCategoryIds = new Set(rows.map((r) => r.categoryId));
  const availableCategories = expenseCategories.filter((c) => !usedCategoryIds.has(c.id));

  const handleAddExistingCategory = (categoryId: string) => {
    setRows((prev) => [...prev, { categoryId, plannedAmount: '0' }]);
  };

  const handleRemoveCategory = (categoryId: string) => {
    setRows((prev) => prev.filter((r) => r.categoryId !== categoryId));
  };

  const handleAmountChange = (categoryId: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.categoryId === categoryId ? { ...r, plannedAmount: value } : r)));
  };

  const handleSaveAllocations = useCallback(async () => {
    const payload: Omit<BudgetAllocation, 'id' | 'householdId'>[] = rows.map((row) => ({
      budgetCycleId: activeCycle.id,
      categoryId: row.categoryId,
      plannedAmount: parseFloat(row.plannedAmount) || 0,
      currency: baseCurrency,
      carryLeftover: false,
    }));

    await saveAllocationsBatchMutation.mutateAsync({
      householdId,
      cycleId: activeCycle.id,
      allocations: payload,
    });
    enqueueSnackbar('Allocations saved!', { variant: 'success' });
    if (onSave) onSave();
  }, [rows, activeCycle.id, householdId, saveAllocationsBatchMutation, enqueueSnackbar, onSave, baseCurrency]);

  const handleCopyPreviousAllocations = async () => {
    const closedCycle = cycles.find((c) => c.status === 'closed');
    if (!closedCycle) {
      enqueueSnackbar('No previous cycle allocations found to copy.', { variant: 'warning' });
      return;
    }
    setIsCopyingPrevious(true);
    try {
      const prevAllocations = await cyclesLib.getBudgetAllocations(householdId, closedCycle.id);
      if (prevAllocations.length === 0) {
        enqueueSnackbar('Previous cycle had no allocations configured.', { variant: 'warning' });
        return;
      }

      const newRows: AllocationRow[] = prevAllocations.map((alloc) => ({
        categoryId: alloc.categoryId,
        plannedAmount: alloc.plannedAmount.toString(),
      }));

      setRows(newRows);
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Previous cycle allocations could not be loaded.', {
        variant: 'error',
      });
    } finally {
      setIsCopyingPrevious(false);
    }
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'Unknown';
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
        <Typography variant="sectionTitle" color="text.primary">
          Category Budgets ({baseCurrency})
        </Typography>
        <Button
          variant="text"
          startIcon={<ContentCopyIcon size={22} strokeWidth={1.8} />}
          onClick={handleCopyPreviousAllocations}
          loading={isCopyingPrevious}
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
        onRemove={handleRemoveCategory}
      />

      {/* Category actions */}
      <Box sx={{ mt: 2.5 }}>
        <Divider sx={{ mb: 2.25 }} />
        <Stack spacing={0.25} sx={{ mb: 1.25 }}>
          <Typography variant="sectionLabel" color="text.primary">
            Add to cycle
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose an existing category. Categories are managed on the Categories page.
          </Typography>
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {availableCategories.map((cat) => (
            <Chip key={cat.id} label={cat.name} variant="filter" onClick={() => handleAddExistingCategory(cat.id)} />
          ))}
        </Box>
      </Box>

      {/* Total + Save */}
      {!saveRef && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5, pt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Budget
            </Typography>
            <Typography variant="sectionTitle">
              <Money amount={totalBudget} code={baseCurrency} />
            </Typography>
          </Box>
          <Button variant="contained" onClick={handleSaveAllocations} loading={saveAllocationsBatchMutation.isPending}>
            Save
          </Button>
        </Box>
      )}
    </Box>
  );
}
