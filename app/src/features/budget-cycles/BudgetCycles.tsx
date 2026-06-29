import { useState, useMemo, useRef } from 'react';
import { 
  Box, 
  Container, 
  Stack, 
  Typography, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControlLabel, 
  Checkbox, 
  Grid, 
  Skeleton,
  Chip,
  IconButton,
  LinearProgress
} from '@mui/material';
import { EmptyLayout } from '../shared/components/EmptyLayout';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import TimerIcon from '@mui/icons-material/Timer';
import HistoryIcon from '@mui/icons-material/History';
import { 
  useCategories, 
  useCycles, 
  useBudgetAllocations,
  useCreateCycleMutation,
  useUpdateCycleStatusMutation
} from '../../hooks/useFinance';
import { BudgetAllocationsConfig } from './BudgetAllocationsConfig';
import { CycleAnalytics } from './CycleAnalytics';
import { useAppContext } from '../../hooks/useAppContext';
import { PageHeader } from '../shared/components/PageHeader';
import { BudgetCycle } from '../../domain/financeTypes';

// ── Helpers ──────────────────────────────────────────────────────────────

function getDaysInfo(startDate: string, endDate?: string) {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  if (!endDate) {
    return { elapsed, total: null, remaining: null, progress: null };
  }

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const total = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const remaining = Math.max(0, Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, Math.round((elapsed / total) * 100));

  return { elapsed, total, remaining, progress };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return '#1E8E3E';
    case 'planned': return '#005c55';
    case 'closed': return '#5f6675';
    default: return '#5f6675';
  }
}

function getStatusBgColor(status: string) {
  switch (status) {
    case 'open': return 'rgba(30, 142, 62, 0.08)';
    case 'planned': return 'rgba(0, 92, 85, 0.08)';
    case 'closed': return 'rgba(154, 160, 166, 0.12)';
    default: return 'rgba(154, 160, 166, 0.12)';
  }
}

// ── Main Component ───────────────────────────────────────────────────────

export function BudgetCycles() {
  const { householdId } = useAppContext();

  // Cycle Creation State
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newCycleNameState, setNewCycleNameState] = useState('');
  const [newCycleStart, setNewCycleStart] = useState(new Date().toISOString().split('T')[0]);
  const [newCycleEnd, setNewCycleEnd] = useState('');
  const [newCycleStatus, setNewCycleStatus] = useState<'open' | 'planned'>('open');

  // Close Cycle Dialog State
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);

  // UI state — which cycle's budget is being edited (null = none)
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const saveBudgetRef = useRef<(() => Promise<void>) | null>(null);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(householdId);
  
  const activeCycle = cycles.find(c => c.status === 'open') || null;

  // Fetch allocations for whichever cycle is being edited
  const { data: dbAllocations = [], isLoading: allocsLoading } = useBudgetAllocations(householdId, editingCycleId ?? undefined);

  // The cycle object being edited
  const editingCycle = editingCycleId ? cycles.find(c => c.id === editingCycleId) : null;

  // Mutations
  const createCycleMutation = useCreateCycleMutation();
  const updateCycleStatusMutation = useUpdateCycleStatusMutation();

  // Sorted cycles: planned first, then closed by start date desc
  const sortedHistory = useMemo(() => {
    return [...cycles]
      .filter(c => c.status !== 'open')
      .sort((a, b) => {
        if (a.status === 'planned' && b.status !== 'planned') return -1;
        if (b.status === 'planned' && a.status !== 'planned') return 1;
        return b.startDate.localeCompare(a.startDate);
      });
  }, [cycles]);

  const handleCreateCycle = async () => {
    if (!newCycleNameState.trim()) return;

    if (newCycleStatus === 'open' && activeCycle) {
      await updateCycleStatusMutation.mutateAsync({
        householdId,
        cycleId: activeCycle.id,
        status: 'closed',
        extra: {
          endDate: new Date().toISOString().split('T')[0]
        }
      });
    }

    await createCycleMutation.mutateAsync({
      householdId,
      cycle: {
        name: newCycleNameState,
        startDate: newCycleStart,
        endDate: newCycleEnd || undefined,
        status: newCycleStatus,
      }
    });

    setOpenCreateDialog(false);
    setNewCycleNameState('');
  };

  const handleCloseCycle = async () => {
    if (!activeCycle) return;
    if (!check1 || !check2 || !check3) return;

    await updateCycleStatusMutation.mutateAsync({
      householdId,
      cycleId: activeCycle.id,
      status: 'closed',
      extra: {
        endDate: new Date().toISOString().split('T')[0],
        closedAt: new Date().toISOString(),
      }
    });

    setOpenCloseDialog(false);
    setCheck1(false);
    setCheck2(false);
    setCheck3(false);
  };

  const handleToggleBudgetForCycle = (cycleId: string) => {
    setEditingCycleId(prev => prev === cycleId ? null : cycleId);
  };

  const isLoading = categoriesLoading || cyclesLoading;

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Box sx={{ mt: 1 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={180} sx={{ borderRadius: '20px' }} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: '20px' }} />
        </Stack>
      </Container>
    );
  }

  const activeDaysInfo = activeCycle ? getDaysInfo(activeCycle.startDate, activeCycle.endDate) : null;

  return (
    <Container maxWidth="md" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* Page Header */}
        <PageHeader
          title="Budget Cycles"
          subtitle={activeCycle
            ? `Active: ${activeCycle.name}`
            : 'No active cycle'
          }
          action={
            <IconButton
              onClick={() => setOpenCreateDialog(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                width: 40,
                height: 40,
                borderRadius: '12px',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <AddIcon sx={{ fontSize: 22 }} />
            </IconButton>
          }
        />

        <CycleAnalytics />

        {/* ── Active Cycle Hero Card ── */}
        {activeCycle ? (
          <ActiveCycleCard
            cycle={activeCycle}
            daysInfo={activeDaysInfo!}
            onCloseCycle={() => setOpenCloseDialog(true)}
            isEditingBudget={editingCycleId === activeCycle.id}
            onToggleBudget={() => handleToggleBudgetForCycle(activeCycle.id)}
          />
        ) : (
          <EmptyLayout
            title="No active budget cycle"
            description="Create a new cycle to start allocating budgets and tracking expenses."
            action={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  height: 44,
                  px: 3,
                  bgcolor: 'primary.dark',
                }}
              >
                New Cycle
              </Button>
            }
          />
        )}

        {/* ── Budget Allocations Editor Dialog (for any selected cycle) ── */}
        <Dialog 
          open={!!editingCycleId} 
          onClose={() => setEditingCycleId(null)}
          fullWidth
          maxWidth="md"
          slotProps={{
            paper: {
              sx: {
                borderRadius: '24px',
                p: 1.5,
              }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontSize: '20px', color: 'text.primary', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Configure Budget for
              </Typography>
              <Box display="flex" alignItems="center" gap={1.5} sx={{ mt: 0.25 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '20px', color: 'text.primary' }}>
                  {editingCycle?.name}
                </Typography>
                {editingCycle && (
                  <Chip
                    label={editingCycle.status.toUpperCase()}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '10px',
                      height: 20,
                      borderRadius: '6px',
                      bgcolor: getStatusBgColor(editingCycle.status),
                      color: getStatusColor(editingCycle.status),
                    }}
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Total Budget
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, fontSize: '20px', color: 'primary.main', mt: 0.25 }}>
                {totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0 })} EGP
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {editingCycle && (
              <Box sx={{ mt: 1 }}>
                {allocsLoading ? (
                  <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: '16px' }} />
                ) : (
                  <BudgetAllocationsConfig
                    key={`${editingCycle.id}-${dbAllocations.length}`}
                    householdId={householdId}
                    activeCycle={editingCycle}
                    categories={categories}
                    dbAllocations={dbAllocations}
                    cycles={cycles}
                    onSave={() => setEditingCycleId(null)}
                    saveRef={saveBudgetRef}
                    onSavingStatusChange={setIsSavingBudget}
                    onTotalBudgetChange={setTotalBudget}
                  />
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
            <Button 
              onClick={() => setEditingCycleId(null)} 
              variant="outlined"
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (saveBudgetRef.current) {
                  await saveBudgetRef.current();
                  setEditingCycleId(null);
                }
              }} 
              variant="contained"
              disabled={isSavingBudget}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', bgcolor: 'primary.dark' }}
            >
              {isSavingBudget ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Cycle History Timeline ── */}
        <Box>
          <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <HistoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '15px' }}>
              Previous Cycles
            </Typography>
          </Box>

          {sortedHistory.length > 0 ? (
            <Stack spacing={1.5}>
              {sortedHistory.map(cycle => (
                <CycleHistoryCard
                  key={cycle.id}
                  cycle={cycle}
                  isEditing={editingCycleId === cycle.id}
                  onToggleBudget={() => handleToggleBudgetForCycle(cycle.id)}
                />
              ))}
            </Stack>
          ) : (
            <EmptyLayout
              title="No previous cycles found"
              description="Closed budget cycles will be listed here."
            />
          )}
        </Box>
      </Stack>

      {/* ── Create Cycle Dialog ── */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 1,
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '20px', color: 'text.primary', pb: 1 }}>
          Create Budget Cycle
        </DialogTitle>
        <DialogContent sx={{ minWidth: 320, pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField 
              fullWidth
              label="Cycle Name"
              placeholder="e.g. July 2026"
              value={newCycleNameState}
              onChange={e => setNewCycleNameState(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={newCycleStart}
                  onChange={e => setNewCycleStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField 
                  fullWidth
                  type="date"
                  label="Target End Date"
                  value={newCycleEnd}
                  onChange={e => setNewCycleEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                />
              </Grid>
            </Grid>
            <FormControlLabel 
              control={
                <Checkbox 
                  checked={newCycleStatus === 'open'}
                  onChange={e => setNewCycleStatus(e.target.checked ? 'open' : 'planned')}
                />
              }
              label="Set as active immediately (will close current active cycle)"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setOpenCreateDialog(false)} 
            color="inherit"
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCycle} 
            variant="contained"
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', bgcolor: 'primary.dark' }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Close Cycle Confirmation ── */}
      <Dialog 
        open={openCloseDialog} 
        onClose={() => setOpenCloseDialog(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 1.5,
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '20px', color: 'error.main', pb: 1 }}>
          Close Budget Cycle
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Closing the active cycle compiles balances, carries forward leftovers and locks edits. Confirm items below:
          </Typography>
          <Stack spacing={2.5}>
            <FormControlLabel 
              control={<Checkbox checked={check1} onChange={e => setCheck1(e.target.checked)} />}
              label="I have reconciled and verified all bank balances for this month."
            />
            <FormControlLabel 
              control={<Checkbox checked={check2} onChange={e => setCheck2(e.target.checked)} />}
              label="All USD transactions and exchanges have been logged."
            />
            <FormControlLabel 
              control={<Checkbox checked={check3} onChange={e => setCheck3(e.target.checked)} />}
              label="I understand this locks the cycle and moves leftovers forward."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setOpenCloseDialog(false)} 
            color="inherit"
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCloseCycle} 
            disabled={!check1 || !check2 || !check3}
            variant="contained" 
            color="error"
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', bgcolor: '#ba1a1a' }}
          >
            Confirm & Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// ── Active Cycle Hero Card ───────────────────────────────────────────────

interface ActiveCycleCardProps {
  cycle: BudgetCycle;
  daysInfo: ReturnType<typeof getDaysInfo>;
  onCloseCycle: () => void;
  isEditingBudget: boolean;
  onToggleBudget: () => void;
}

function ActiveCycleCard({ cycle, daysInfo, onCloseCycle, isEditingBudget, onToggleBudget }: ActiveCycleCardProps) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 3,
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '180px',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Active Badge */}
        <Chip
          label="ACTIVE"
          size="small"
          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1E8E3E' }} />}
          sx={{
            fontWeight: 700,
            fontSize: '10px',
            height: 24,
            borderRadius: '6px',
            bgcolor: 'rgba(30, 142, 62, 0.08)',
            color: '#1E8E3E',
            alignSelf: 'flex-start',
            mb: 1.5,
            '& .MuiChip-icon': { display: 'block', ml: 1, mr: -0.5 }
          }}
        />

        {/* Cycle Name & Date range */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 800, color: 'text.primary' }}>
              {cycle.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.75} sx={{ mt: 0.5 }}>
              <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                {formatDate(cycle.startDate)}
                {cycle.endDate ? ` — ${formatDate(cycle.endDate)}` : ' — Ongoing'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Days & Progress details */}
        {daysInfo.progress !== null ? (
          <Box sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', fontWeight: 500 }}>
                Day {daysInfo.elapsed} of {daysInfo.total} days total
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', fontWeight: 'bold' }}>
                {daysInfo.progress}% Elapsed
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={daysInfo.progress}
              sx={{
                height: 8,
                borderRadius: '4px',
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: '4px',
                  bgcolor: daysInfo.progress > 85 ? 'warning.main' : 'primary.main',
                  transition: 'width 0.6s ease',
                },
              }}
            />
          </Box>
        ) : (
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary' }}>
              Day {daysInfo.elapsed + 1} — No end date set
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 3.5 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={isEditingBudget ? <ExpandLessIcon /> : <EditIcon />}
            onClick={onToggleBudget}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '13.5px',
              height: 44,
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.main', boxShadow: 'none' },
              '&:active': { transform: 'scale(0.98)' },
            }}
          >
            {isEditingBudget ? 'Hide Budget' : 'Edit Budget'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={onCloseCycle}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '13.5px',
              height: 44,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { borderColor: 'text.primary', color: 'text.primary', bgcolor: 'action.hover' },
              '&:active': { transform: 'scale(0.98)' },
            }}
          >
            Close Cycle
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

// ── Cycle History Card ───────────────────────────────────────────────────

interface CycleHistoryCardProps {
  cycle: BudgetCycle;
  isEditing: boolean;
  onToggleBudget: () => void;
}

function CycleHistoryCard({ cycle, isEditing, onToggleBudget }: CycleHistoryCardProps) {
  const statusColor = getStatusColor(cycle.status);
  const statusBg = getStatusBgColor(cycle.status);

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        borderRadius: '20px',
        border: '1px solid',
        borderColor: isEditing ? 'primary.main' : 'divider',
        boxShadow: isEditing ? '0px 4px 12px rgba(0, 92, 85, 0.05)' : 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: isEditing ? 'primary.main' : 'primary.light',
          boxShadow: '0px 6px 18px rgba(0,0,0,0.03)',
          transform: 'translateY(-1px)',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Timeline dot */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '12px',
            bgcolor: statusBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CalendarTodayIcon sx={{ fontSize: 18, color: statusColor }} />
        </Box>

        {/* Details */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px', color: 'text.primary' }}>
            {cycle.name}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.secondary', mt: 0.25 }}>
            {formatDate(cycle.startDate)}{cycle.endDate ? ` — ${formatDate(cycle.endDate)}` : ''}
          </Typography>
        </Box>

        {/* Status chip */}
        <Chip
          label={cycle.status.toUpperCase()}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '10px',
            height: 24,
            borderRadius: '6px',
            bgcolor: statusBg,
            color: statusColor,
            border: 'none',
            letterSpacing: '0.03em',
          }}
        />
      </Box>

      {/* Configure Budget button */}
      <Button
        fullWidth
        variant="outlined"
        size="small"
        startIcon={isEditing ? <ExpandLessIcon /> : <EditIcon />}
        onClick={onToggleBudget}
        sx={{
          mt: 2,
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 'bold',
          fontSize: '12px',
          height: 36,
          borderColor: isEditing ? 'primary.main' : 'divider',
          color: isEditing ? 'primary.main' : 'text.secondary',
          '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'action.hover' },
        }}
      >
        {isEditing ? 'Hide Budget' : 'Edit Budget'}
      </Button>
    </Box>
  );
}
