import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { 
  useSaveAllocationsBatchMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation
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

interface AllocationRow {
  categoryId: string;
  plannedAmount: string;
}

export function BudgetAllocationsConfig({
  householdId,
  activeCycle,
  categories,
  dbAllocations,
  cycles
}: BudgetAllocationsConfigProps) {
  const { enqueueSnackbar } = useSnackbar();
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

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameCategoryId, setRenameCategoryId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Add new category dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
    setRenameCategoryId(categoryId);
    setRenameValue(cat?.name || '');
    setRenameDialogOpen(true);
  };

  const handleSaveRename = async () => {
    if (!renameCategoryId || !renameValue.trim()) return;
    await updateCategoryMutation.mutateAsync({
      householdId,
      categoryId: renameCategoryId,
      updates: { name: renameValue.trim() },
    });
    setRenameDialogOpen(false);
    setRenameCategoryId(null);
    setRenameValue('');
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newId = await createCategoryMutation.mutateAsync({
      householdId,
      category: { name: newCategoryName.trim(), type: 'expense', isActive: true },
    });
    // Add to rows immediately
    setRows(prev => [...prev, { categoryId: newId, plannedAmount: '0' }]);
    setAddDialogOpen(false);
    setNewCategoryName('');
  };

  const handleSaveAllocations = async () => {
    const payload: Omit<BudgetAllocation, 'id' | 'householdId'>[] = rows.map(row => ({
      budgetCycleId: activeCycle.id,
      categoryId: row.categoryId,
      plannedAmount: parseFloat(row.plannedAmount) || 0,
      currency: 'EGP',
      carryLeftover: false,
    }));

    await saveAllocationsBatchMutation.mutateAsync({
      householdId,
      cycleId: activeCycle.id,
      allocations: payload
    });
    enqueueSnackbar('Allocations saved!', { variant: 'success' });
  };

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

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '15px' }}>
          Category Budgets (EGP)
        </Typography>
        <Button 
          variant="text" 
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyPreviousAllocations}
        >
          Copy previous
        </Button>
      </Box>

      {/* Allocation Rows */}
      <List disablePadding>
        {rows.map((row, idx) => (
          <Box key={row.categoryId}>
            {idx > 0 && <Divider />}
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemText
                primary={getCategoryName(row.categoryId)}
                primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
              />
              <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TextField
                  size="small"
                  type="number"
                  value={row.plannedAmount}
                  onChange={e => handleAmountChange(row.categoryId, e.target.value)}
                  sx={{ width: '100px' }}
                  inputProps={{ style: { textAlign: 'right' } }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleOpenRename(row.categoryId)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveCategory(row.categoryId)}
                  color="error"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </Box>
        ))}
      </List>

      {/* Add buttons */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {availableCategories.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              // Add the first available one, or if you want a picker we could do a menu
              // For simplicity, just add all available as a dropdown-like approach
              handleAddExistingCategory(availableCategories[0].id);
            }}
          >
            Add Existing ({availableCategories.length})
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          New Category
        </Button>
      </Stack>

      {/* Total + Save */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 2.5,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total Budget
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px' }}>
            {totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0 })} EGP
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleSaveAllocations}
          disabled={saveAllocationsBatchMutation.isPending}
        >
          {saveAllocationsBatchMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {/* Rename Category Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Category</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <TextField
            fullWidth
            label="Category Name"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} color="inherit">Cancel</Button>
          <Button
            onClick={handleSaveRename}
            variant="contained"
            disabled={updateCategoryMutation.isPending || !renameValue.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Category Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <TextField
            fullWidth
            label="Category Name"
            placeholder="e.g. Entertainment"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">Cancel</Button>
          <Button
            onClick={handleCreateNewCategory}
            variant="contained"
            disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
          >
            Create & Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
