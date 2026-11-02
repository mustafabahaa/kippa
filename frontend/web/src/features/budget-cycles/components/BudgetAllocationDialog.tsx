import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Typography,
} from '@monochrome-ui/design-system';
import { BudgetAllocation, BudgetCycle, Category, CurrencyCode } from '@kippa/domain';
import { Money } from '@/components/Money';
import { BudgetAllocationsConfig } from '../BudgetAllocationsConfig';

interface Props {
  allocations: BudgetAllocation[];
  categories: Category[];
  cycle: BudgetCycle | null | undefined;
  cycles: BudgetCycle[];
  currency: CurrencyCode;
  householdId: string;
  isLoading: boolean;
  isSaving: boolean;
  saveRef: React.RefObject<(() => Promise<void>) | null>;
  totalBudget: number;
  onClose: () => void;
  onSavingChange: (saving: boolean) => void;
  onTotalChange: (total: number) => void;
}

export function BudgetAllocationDialog({
  allocations,
  categories,
  cycle,
  cycles,
  currency,
  householdId,
  isLoading,
  isSaving,
  saveRef,
  totalBudget,
  onClose,
  onSavingChange,
  onTotalChange,
}: Props) {
  const save = async () => {
    await saveRef.current?.();
    onClose();
  };
  return (
    <Dialog
      open={!!cycle}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="budget-allocation-title"
      slotProps={{ paper: { sx: { maxHeight: 'calc(100dvh - 48px)', overflow: 'hidden' } } }}
    >
      <DialogTitle component="div" sx={{ pb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography id="budget-allocation-title" variant="h3">Edit budget</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">{cycle?.name}</Typography>
              {cycle && (
                <Chip
                  label={cycle.status === 'open' ? 'Active' : cycle.status === 'planned' ? 'Planned' : 'Closed'}
                  size="small"
                  color={cycle.status === 'open' ? 'success' : 'default'}
                />
              )}
            </Stack>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="fieldHint" color="text.secondary">Total budget</Typography>
            <Typography variant="metricValue">
              <Money amount={totalBudget} code={currency} />
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ mt: 2, pt: 2, px: { xs: 3, sm: 5 }, overflowY: 'auto' }}>
        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          {cycle &&
            (isLoading ? (
              <Skeleton variant="rounded" width="100%" height={300} />
            ) : (
              <BudgetAllocationsConfig
                key={`${cycle.id}-${allocations.length}`}
                householdId={householdId}
                activeCycle={cycle}
                categories={categories}
                dbAllocations={allocations}
                cycles={cycles}
                onSave={onClose}
                saveRef={saveRef}
                onSavingStatusChange={onSavingChange}
                onTotalBudgetChange={onTotalChange}
              />
            ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={save} variant="contained" loading={isSaving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
