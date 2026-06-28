import { useState, useEffect } from 'react';
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
  Alert,
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
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { cycleService } from '../../services/cycleService';
import { BudgetCycle, BudgetAllocation, Category } from '../../domain/financeTypes';

interface CyclesProps {
  householdId: string;
  categories: Category[];
  cycles: BudgetCycle[];
  activeCycle: BudgetCycle | null;
  onCyclesUpdated: () => void;
}

export function Cycles({
  householdId,
  categories,
  cycles,
  activeCycle,
  onCyclesUpdated
}: CyclesProps) {
  const [, setAllocations] = useState<BudgetAllocation[]>([]);
  const [plannedAmounts, setPlannedAmounts] = useState<Record<string, string>>({});
  const [carryLeftovers, setCarryLeftovers] = useState<Record<string, boolean>>({});

  // Cycle Creation State
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleStart, setNewCycleStart] = useState(new Date().toISOString().split('T')[0]);
  const [newCycleEnd, setNewCycleEnd] = useState('');
  const [newCycleStatus, setNewCycleStatus] = useState<'open' | 'planned'>('open');

  // Close Cycle Dialog State
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);

  // Fetch allocations for active cycle
  useEffect(() => {
    if (activeCycle) {
      loadAllocations(activeCycle.id);
    }
  }, [activeCycle]);

  const loadAllocations = async (cycleId: string) => {
    const list = await cycleService.getBudgetAllocations(householdId, cycleId);
    setAllocations(list);

    const amounts: Record<string, string> = {};
    const leftovers: Record<string, boolean> = {};

    categories.filter(c => c.type === 'expense').forEach(cat => {
      const match = list.find(a => a.categoryId === cat.id);
      amounts[cat.id] = match ? match.plannedAmount.toString() : '0';
      leftovers[cat.id] = match ? match.carryLeftover : false;
    });

    setPlannedAmounts(amounts);
    setCarryLeftovers(leftovers);
  };

  const handleCreateCycle = async () => {
    if (!newCycleName.trim()) return;

    if (newCycleStatus === 'open' && activeCycle) {
      await cycleService.updateCycleStatus(householdId, activeCycle.id, 'closed', {
        endDate: new Date().toISOString().split('T')[0]
      });
    }

    await cycleService.createCycle(householdId, {
      name: newCycleName,
      startDate: newCycleStart,
      endDate: newCycleEnd || undefined,
      status: newCycleStatus,
    });

    setOpenCreateDialog(false);
    setNewCycleName('');
    onCyclesUpdated();
  };

  const handleCloseCycle = async () => {
    if (!activeCycle) return;
    if (!check1 || !check2 || !check3) return;

    await cycleService.updateCycleStatus(householdId, activeCycle.id, 'closed', {
      endDate: new Date().toISOString().split('T')[0],
      closedAt: new Date().toISOString(),
    });

    setOpenCloseDialog(false);
    setCheck1(false);
    setCheck2(false);
    setCheck3(false);
    onCyclesUpdated();
  };

  const handleSaveAllocations = async () => {
    if (!activeCycle) return;

    const payload: Omit<BudgetAllocation, 'id' | 'householdId'>[] = categories
      .filter(c => c.type === 'expense')
      .map(cat => ({
        budgetCycleId: activeCycle.id,
        categoryId: cat.id,
        plannedAmount: parseFloat(plannedAmounts[cat.id]) || 0,
        currency: 'EGP',
        carryLeftover: !!carryLeftovers[cat.id],
      }));

    await cycleService.saveBudgetAllocationsBatch(householdId, payload);
    loadAllocations(activeCycle.id);
    alert('Allocations saved successfully!');
  };

  const handleCopyPreviousAllocations = async () => {
    if (!activeCycle) return;
    const closedCycle = cycles.find(c => c.status === 'closed');
    if (!closedCycle) {
      alert('No previous cycle allocations found to copy.');
      return;
    }

    const prevAllocations = await cycleService.getBudgetAllocations(householdId, closedCycle.id);
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

                <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
                  <Table size="small" aria-label="configure budgets table">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5, width: '180px' }}>Budget (EGP)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5, width: '180px' }}>Carry Leftovers</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categories.filter(c => c.type === 'expense').map(cat => (
                        <TableRow key={cat.id} hover>
                          <TableCell sx={{ fontSize: '14px', py: 1 }}>
                            {cat.name}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={plannedAmounts[cat.id] || '0'}
                              onChange={e => setPlannedAmounts({ ...plannedAmounts, [cat.id]: e.target.value })}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px'
                                },
                                width: '140px'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            <Checkbox 
                              size="small"
                              checked={!!carryLeftovers[cat.id]} 
                              onChange={e => setCarryLeftovers({ ...carryLeftovers, [cat.id]: e.target.checked })} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button 
                  variant="contained" 
                  onClick={handleSaveAllocations} 
                  sx={{ mt: 3, px: 4 }}
                >
                  Save Budget Allocations
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="warning">
            No active budget cycle. Please create a new cycle to define budgets.
          </Alert>
        )}

        {/* History List of Cycles */}
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Cycle History</Typography>
            <Stack spacing={2} divider={<Divider />}>
              {cycles.map(c => (
                <Box key={c.id} display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.startDate} {c.endDate ? `to ${c.endDate}` : 'onwards'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 600, 
                    color: c.status === 'open' ? 'success.main' : c.status === 'planned' ? 'warning.main' : 'text.secondary' 
                  }}>
                    {c.status.toUpperCase()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Create Cycle Dialog */}
        <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
          <DialogTitle>Create Budget Cycle</DialogTitle>
          <DialogContent sx={{ minWidth: 320 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                required
                label="Cycle Name"
                placeholder="e.g. July 2026 Salary"
                value={newCycleName}
                onChange={e => setNewCycleName(e.target.value)}
              />
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={newCycleStart}
                onChange={e => setNewCycleStart(e.target.value)}
              />
              <TextField
                type="date"
                label="Expected End Date (Optional)"
                InputLabelProps={{ shrink: true }}
                value={newCycleEnd}
                onChange={e => setNewCycleEnd(e.target.value)}
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Status</Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant={newCycleStatus === 'open' ? 'contained' : 'outlined'} 
                    onClick={() => setNewCycleStatus('open')}
                    size="small"
                  >
                    Open Immediately
                  </Button>
                  <Button 
                    variant={newCycleStatus === 'planned' ? 'contained' : 'outlined'} 
                    onClick={() => setNewCycleStatus('planned')}
                    size="small"
                  >
                    Keep as Planned
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCycle} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>

        {/* Close Cycle Dialog */}
        <Dialog open={openCloseDialog} onClose={() => setOpenCloseDialog(false)}>
          <DialogTitle>Close Cycle Checklist</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Before closing the budget cycle, verify that all financial records are up to date.
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={<Checkbox checked={check1} onChange={e => setCheck1(e.target.checked)} />}
                label="Are all bank accounts reconciled with actual balances?"
              />
              <FormControlLabel
                control={<Checkbox checked={check2} onChange={e => setCheck2(e.target.checked)} />}
                label="Have all cash withdrawals and currency conversions been logged?"
              />
              <FormControlLabel
                control={<Checkbox checked={check3} onChange={e => setCheck3(e.target.checked)} />}
                label="Are all outstanding credit card charges recorded?"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCloseDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCloseCycle} 
              variant="contained" 
              color="error"
              disabled={!check1 || !check2 || !check3}
            >
              Verify & Close Cycle
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
