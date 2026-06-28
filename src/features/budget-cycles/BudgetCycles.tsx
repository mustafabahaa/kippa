import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Stack, 
  Typography, 
  Button, 
  TextField, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControlLabel, 
  Checkbox, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Skeleton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { 
  useCategories, 
  useCycles, 
  useBudgetAllocations,
  useCreateCycleMutation,
  useUpdateCycleStatusMutation
} from '../../hooks/useFinance';
import { BudgetAllocationsConfig } from './BudgetAllocationsConfig';
import { useAppContext } from '../../hooks/useAppContext';

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

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(householdId);
  
  const activeCycle = cycles.find(c => c.status === 'open') || null;

  const { data: dbAllocations = [], isLoading: allocsLoading } = useBudgetAllocations(householdId, activeCycle?.id);

  // Mutations
  const createCycleMutation = useCreateCycleMutation();
  const updateCycleStatusMutation = useUpdateCycleStatusMutation();

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

  const isLoading = categoriesLoading || cyclesLoading;

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Skeleton variant="text" width="40%" height={40} />
            <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: '8px' }} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: '20px' }} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header Section */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h1">Budget Cycles</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenCreateDialog(true)}
          >
            New Cycle
          </Button>
        </Box>

        {/* Current Active Cycle Status */}
        {activeCycle ? (
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h3">Active Cycle: {activeCycle.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Started: {activeCycle.startDate} {activeCycle.endDate ? `• Target End: ${activeCycle.endDate}` : ''}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => setOpenCloseDialog(true)}
                >
                  Close Cycle
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Category Budget Allocations */}
              {allocsLoading ? (
                <Skeleton variant="rectangular" width="100%" height={200} />
              ) : (
                <BudgetAllocationsConfig 
                  key={`${activeCycle.id}-${dbAllocations.length}`}
                  householdId={householdId}
                  activeCycle={activeCycle}
                  categories={categories}
                  dbAllocations={dbAllocations}
                  cycles={cycles}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
            <Typography variant="body1" color="text.secondary">
              No active budget cycle. Create a new cycle to get started.
            </Typography>
          </Card>
        )}

        {/* Cycles History */}
        <Stack spacing={2}>
          <Typography variant="h2">Cycle History</Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cycles.map(c => (
                  <TableRow key={c.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                    <TableCell>{c.startDate}</TableCell>
                    <TableCell>{c.endDate || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={c.status.toUpperCase()} 
                        size="small" 
                        color={c.status === 'open' ? 'success' : c.status === 'planned' ? 'info' : 'default'}
                        sx={{ fontWeight: 'bold', borderRadius: '6px' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>

      {/* Create Cycle Dialog */}
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

      {/* Close Cycle Confirmation */}
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
