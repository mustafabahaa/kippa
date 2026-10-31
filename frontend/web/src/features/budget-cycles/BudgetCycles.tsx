import { useState, useMemo, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Stack, Typography, Button, Grid, Skeleton, Divider } from '@mui/material';
import {
  useCategories,
  useCycles,
  useTransactions,
  useLedgerLines,
  useAllBudgetAllocations,
  useAllExpectedIncomes,
  useAccounts,
  useLoans,
  useDisplayRates,
  useBudgetAllocations,
  useCreateCycleMutation,
  useUpdateCycleStatusMutation,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import { CycleAnalytics } from '@/features/budget-cycles/CycleAnalytics';
import { useAppContext } from '@/hooks/useAppContext';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { CloseCycleDialog, CreateCycleDialog, type NewCycleValues } from './components/CycleDialogs';
import { ActiveCycleSection, CycleHistoryItem, type CycleHistoryStats } from './components/CycleSections';
import { getDaysInfo } from './cycleUtils';
import { BudgetAllocationDialog } from './components/BudgetAllocationDialog';
import { calculateCycleData } from '@/libs/budgetAnalytics';
import { useNavigate } from 'react-router-dom';
import { DashboardSectionHeading } from '@/features/dashboard/components/DashboardSectionHeading';

const sectionIndent = { xs: 0, md: 4 } as const;
const contentIndent = { xs: 0, md: 4 } as const;

// ── Main Component ───────────────────────────────────────────────────────

export function BudgetCycles() {
  const navigate = useNavigate();
  const { householdId } = useAppContext();
  const { enqueueSnackbar } = useSnackbar();
  const baseCurrency = useHouseholdBaseCurrency();

  // Cycle Creation State
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openCloseDialog, setOpenCloseDialog] = useState(false);

  // UI state — which cycle's budget is being edited (null = none)
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const saveBudgetRef = useRef<(() => Promise<void>) | null>(null);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(householdId);

  const activeCycle = cycles.find((c) => c.status === 'open') || null;

  // Fetch allocations for whichever cycle is being edited
  const { data: dbAllocations = [], isLoading: allocsLoading } = useBudgetAllocations(
    householdId,
    editingCycleId ?? undefined,
  );

  // Per-cycle analytics (planned/spent/saved) + transaction counts for history items.
  // Mirrors the data already computed in CycleAnalytics so no new queries beyond what
  // that panel already loads.
  const { data: transactions = [] } = useTransactions(householdId);
  const { data: ledgerLines = [] } = useLedgerLines(householdId);
  const { data: allAllocations = [] } = useAllBudgetAllocations(householdId);
  const { data: allExpectedIncomes = [] } = useAllExpectedIncomes(householdId);
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: loans = [] } = useLoans(householdId);
  const foreignCodes = Array.from(new Set(accounts.map((a) => a.currency).filter((c) => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);

  const cycleStatsById = useMemo(() => {
    const map = new Map<string, CycleHistoryStats>();
    if (cycles.length === 0) return map;
    const cycleData = calculateCycleData(
      cycles,
      transactions,
      ledgerLines,
      allAllocations,
      allExpectedIncomes,
      baseCurrency,
      displayRates,
      loans,
    );
    cycleData.forEach((datum) => {
      map.set(datum.id, {
        baseCurrency,
        plannedBudget: datum.plannedBudget,
        actualExpense: datum.actualExpense,
      });
    });
    return map;
  }, [cycles, transactions, ledgerLines, allAllocations, allExpectedIncomes, displayRates, baseCurrency, loans]);

  // The cycle object being edited
  const editingCycle = editingCycleId ? cycles.find((c) => c.id === editingCycleId) : null;

  // Mutations
  const createCycleMutation = useCreateCycleMutation();
  const updateCycleStatusMutation = useUpdateCycleStatusMutation();

  // Sorted cycles: planned first, then closed by start date desc
  const sortedHistory = useMemo(() => {
    return [...cycles]
      .filter((c) => c.status !== 'open')
      .sort((a, b) => {
        if (a.status === 'planned' && b.status !== 'planned') return -1;
        if (b.status === 'planned' && a.status !== 'planned') return 1;
        return b.startDate.localeCompare(a.startDate);
      });
  }, [cycles]);

  const handleCreateCycle = async (values: NewCycleValues) => {
    try {
      if (values.status === 'open' && activeCycle) {
        await updateCycleStatusMutation.mutateAsync({
          householdId,
          cycleId: activeCycle.id,
          status: 'closed',
          extra: {
            endDate: new Date().toISOString().split('T')[0],
          },
        });
      }

      await createCycleMutation.mutateAsync({
        householdId,
        cycle: {
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate || null,
          status: values.status,
        },
      });

      setOpenCreateDialog(false);
      enqueueSnackbar('Budget cycle created.', { variant: 'success' });
      return true;
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to create budget cycle.', { variant: 'error' });
      return false;
    }
  };

  const handleCloseCycle = async () => {
    if (!activeCycle) return false;
    try {
      await updateCycleStatusMutation.mutateAsync({
        householdId,
        cycleId: activeCycle.id,
        status: 'closed',
        extra: { endDate: new Date().toISOString().split('T')[0], closedAt: new Date().toISOString() },
      });
      setOpenCloseDialog(false);
      return true;
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to close budget cycle.', { variant: 'error' });
      return false;
    }
  };

  const handleToggleBudgetForCycle = (cycleId: string) => {
    setEditingCycleId((prev) => (prev === cycleId ? null : cycleId));
  };

  const isLoading = categoriesLoading || cyclesLoading;

  if (isLoading) {
    return (
      <Stack spacing={{ xs: 2, md: 3 }}>
        <PageHeader title="Budget Cycles" subtitle="Plan your household budget and review past cycles." />
        <Stack spacing={3}>
          <Skeleton variant="text" width="45%" height={32} />
          <Skeleton variant="rounded" height={360} />
          <Skeleton variant="rounded" height={200} />
        </Stack>
      </Stack>
    );
  }

  const activeDaysInfo = activeCycle ? getDaysInfo(activeCycle.startDate, activeCycle.endDate) : null;

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <PageHeader
        title="Budget Cycles"
        subtitle={activeCycle ? `Keep your household plan on track · ${activeCycle.name}` : 'Plan your household budget and review past cycles.'}
        action={<Button variant="contained" onClick={() => setOpenCreateDialog(true)}>New cycle</Button>}
      />

      <Box component="section" sx={{ px: sectionIndent }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <DashboardSectionHeading
            title="Overview"
            subtitle="Compare spending across cycles and manage the current plan."
          />
          <Box sx={{ px: contentIndent }}>
            <Box sx={{ maxWidth: 1180 }}>
              <Grid container columns={{ xs: 12, md: 10 }} spacing={{ xs: 3, md: 5 }} alignItems="flex-start">
                <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
                  <CycleAnalytics />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                  {activeCycle ? (
                    <ActiveCycleSection
                      cycle={activeCycle}
                      daysInfo={activeDaysInfo!}
                      stats={cycleStatsById.get(activeCycle.id)}
                      onCloseCycle={() => setOpenCloseDialog(true)}
                      isEditingBudget={editingCycleId === activeCycle.id}
                      onToggleBudget={() => handleToggleBudgetForCycle(activeCycle.id)}
                    />
                  ) : (
                    <Stack spacing={1} alignItems="flex-start">
                      <Typography variant="h5">No active budget cycle</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create a cycle to start allocating budgets and tracking expenses.
                      </Typography>
                      <Button variant="contained" onClick={() => setOpenCreateDialog(true)}>
                        Start a cycle
                      </Button>
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Stack>
      </Box>

      <BudgetAllocationDialog
        allocations={dbAllocations}
        categories={categories}
        cycle={editingCycle}
        cycles={cycles}
        currency={baseCurrency}
        householdId={householdId}
        isLoading={allocsLoading}
        isSaving={isSavingBudget}
        saveRef={saveBudgetRef}
        totalBudget={totalBudget}
        onClose={() => setEditingCycleId(null)}
        onSavingChange={setIsSavingBudget}
        onTotalChange={setTotalBudget}
      />

      <Box component="section" sx={{ px: sectionIndent }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <DashboardSectionHeading title="Cycle history" subtitle="Review completed and planned budget periods." />

          <Box sx={{ px: contentIndent }}>
            <Box sx={{ maxWidth: 1180 }}>
              {sortedHistory.length > 0 ? (
                <Stack spacing={{ xs: 2.5, md: 3 }} divider={<Divider />}>
                  {sortedHistory.map((cycle) => (
                    <CycleHistoryItem
                      key={cycle.id}
                      cycle={cycle}
                      isEditing={editingCycleId === cycle.id}
                      onToggleBudget={() => handleToggleBudgetForCycle(cycle.id)}
                      onViewReport={
                        cycle.status === 'closed'
                          ? () => navigate(`/cycles/report?cycle=${encodeURIComponent(cycle.id)}`)
                          : undefined
                      }
                      stats={cycleStatsById.get(cycle.id)}
                    />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={1} alignItems="flex-start">
                  <Typography variant="h5">No previous cycles yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Closed and planned budget cycles will appear here.
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>

      <CreateCycleDialog
        busy={createCycleMutation.isPending || updateCycleStatusMutation.isPending}
        onClose={() => setOpenCreateDialog(false)}
        onCreate={handleCreateCycle}
        open={openCreateDialog}
      />
      <CloseCycleDialog
        busy={updateCycleStatusMutation.isPending}
        onClose={() => setOpenCloseDialog(false)}
        onConfirm={handleCloseCycle}
        open={openCloseDialog}
      />
    </Stack>
  );
}
