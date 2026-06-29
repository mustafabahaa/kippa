import { useState, useMemo } from 'react';
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
  LinearProgress,
  Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
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
    case 'planned': return '#1a73e8';
    case 'closed': return '#9AA0A6';
    default: return '#9AA0A6';
  }
}

function getStatusBgColor(status: string) {
  switch (status) {
    case 'open': return 'rgba(30, 142, 62, 0.08)';
    case 'planned': return 'rgba(26, 115, 232, 0.08)';
    case 'closed': return 'rgba(154, 160, 166, 0.08)';
    default: return 'rgba(154, 160, 166, 0.08)';
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
          <Box
            sx={{
              py: 5,
              px: 3,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              No active budget cycle
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5, fontSize: '12px' }}>
              Create a new cycle to start tracking budgets
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{ mt: 2.5, borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
            >
              New Cycle
            </Button>
          </Box>
        )}

        {/* ── Budget Allocations Editor (for any selected cycle) ── */}
        {editingCycle && (
          <Collapse in={!!editingCycleId} timeout="auto">
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {/* Editor header — shows which cycle */}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  bgcolor: 'action.hover',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Editing budget for
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '14px', color: 'text.primary', mt: 0.25 }}>
                    {editingCycle.name}
                  </Typography>
                </Box>
                <Chip
                  label={editingCycle.status.toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '10px',
                    height: 24,
                    borderRadius: '6px',
                    bgcolor: getStatusBgColor(editingCycle.status),
                    color: getStatusColor(editingCycle.status),
                  }}
                />
              </Box>

              <Box sx={{ p: 2.5 }}>
                {allocsLoading ? (
                  <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '12px' }} />
                ) : (
                  <BudgetAllocationsConfig
                    key={`${editingCycle.id}-${dbAllocations.length}`}
                    householdId={householdId}
                    activeCycle={editingCycle}
                    categories={categories}
                    dbAllocations={dbAllocations}
                    cycles={cycles}
                  />
                )}
              </Box>
            </Box>
          </Collapse>
        )}

        {/* ── Cycle History Timeline ── */}
        {sortedHistory.length > 0 && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <HistoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '15px' }}>
                Cycle History
              </Typography>
            </Box>

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
          </Box>
        )}
      </Stack>

      {/* ── Create Cycle Dialog ── */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Budget Cycle</DialogTitle>
        <DialogContent sx={{ minWidth: 320, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              fullWidth
              label="Cycle Name"
              placeholder="e.g. July 2026"
              value={newCycleNameState}
              onChange={e => setNewCycleNameState(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
          <Button onClick={() => setOpenCreateDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateCycle} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* ── Close Cycle Confirmation ── */}
      <Dialog open={openCloseDialog} onClose={() => setOpenCloseDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Close Budget Cycle</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ mb: 3 }}>
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
          <Button onClick={() => setOpenCloseDialog(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleCloseCycle} 
            disabled={!check1 || !check2 || !check3}
            variant="contained" 
            color="error"
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
        borderRadius: '20px',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Status banner */}
      <Box
        sx={{
          px: 2.5,
          py: 1,
          bgcolor: 'rgba(30, 142, 62, 0.06)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1E8E3E' }} />
        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 600, color: '#1E8E3E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active Cycle
        </Typography>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {/* Cycle name */}
        <Typography variant="h2" sx={{ fontSize: '20px', fontWeight: 700, color: 'text.primary' }}>
          {cycle.name}
        </Typography>

        {/* Date range */}
        <Box display="flex" alignItems="center" gap={0.75} sx={{ mt: 1 }}>
          <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
            {formatDate(cycle.startDate)}
            {cycle.endDate ? ` — ${formatDate(cycle.endDate)}` : ' — Ongoing'}
          </Typography>
        </Box>

        {/* Progress section */}
        {daysInfo.progress !== null && (
          <Box sx={{ mt: 2.5 }}>
            <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                {daysInfo.progress}%
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
            <Box display="flex" justifyContent="space-between" sx={{ mt: 0.75 }}>
              <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.disabled' }}>
                Day {daysInfo.elapsed}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.disabled' }}>
                {daysInfo.total} days total
              </Typography>
            </Box>
          </Box>
        )}

        {daysInfo.progress === null && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TimerIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary' }}>
              Day {daysInfo.elapsed + 1} — No end date set
            </Typography>
          </Box>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={isEditingBudget ? <ExpandLessIcon /> : <SettingsIcon />}
            onClick={onToggleBudget}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              height: 42,
              borderColor: isEditingBudget ? 'primary.main' : 'divider',
              color: isEditingBudget ? 'primary.main' : 'text.primary',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            {isEditingBudget ? 'Hide Budget' : 'Configure Budget'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={onCloseCycle}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              height: 42,
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
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: isEditing ? 'primary.main' : 'divider',
        transition: 'border-color 0.15s',
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
        startIcon={isEditing ? <ExpandLessIcon /> : <SettingsIcon />}
        onClick={onToggleBudget}
        sx={{
          mt: 1.5,
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '12px',
          height: 34,
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
