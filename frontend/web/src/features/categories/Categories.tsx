import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@monochrome-ui/design-system';
import type { Category } from '@kippa/domain';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { PageHeader } from '@monochrome-ui/design-system';
import { dedupeMerchantKeywords } from '@/libs/merchantSuggestions';
import {
  useCategories,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '@/hooks/useFinance';
import { CategoryNameDialog } from './components/CategoryNameDialog';
import { ledgerLib } from '@/libs/ledger';

import { useAppContext } from '@/hooks/useAppContext';


export function Categories() {
  const { householdId } = useAppContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatMerchants, setNewCatMerchants] = useState<string[]>([]);
  const [renameCategory, setRenameCategory] = useState<{
    id: string;
    name: string;
    type: Category['type'];
    merchants: string[];
  } | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [replacementCategoryId, setReplacementCategoryId] = useState('');
  const [categoryInUse, setCategoryInUse] = useState(false);
  const [isCheckingCategoryUsage, setIsCheckingCategoryUsage] = useState(false);

  // Queries & Mutations
  const { data: categories = [], isLoading } = useCategories(householdId);
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;

    await createCategoryMutation.mutateAsync({
      householdId,
      category: {
        name: newCatName,
        type: newCatType,
        isActive: true,
        ...(newCatMerchants.length > 0 ? { merchantKeywords: dedupeMerchantKeywords(newCatMerchants) } : {}),
      },
    });

    setNewCatName('');
    setNewCatMerchants([]);
    setIsCreateDialogOpen(false);
  };

  const handleRenameCategory = async () => {
    if (!renameCategory || !renameCategory.name.trim() || updateCategoryMutation.isPending) return;
    try {
      await updateCategoryMutation.mutateAsync({
        householdId,
        categoryId: renameCategory.id,
        updates: {
          name: renameCategory.name.trim(),
          merchantKeywords: dedupeMerchantKeywords(renameCategory.merchants),
        },
      });
      setRenameCategory(null);
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not rename category', { variant: 'error' });
    }
  };

  const handleToggleEssential = async (category: Category) => {
    const isEssential = category.essential !== true;
    try {
      await updateCategoryMutation.mutateAsync({
        householdId,
        categoryId: category.id,
        updates: { essential: isEssential },
      });
      enqueueSnackbar(isEssential ? 'Category marked as essential' : 'Category marked as non-essential', {
        variant: 'success',
        autoHideDuration: 3500,
        persist: false,
      });
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not update category', {
        variant: 'error',
        autoHideDuration: 4500,
        persist: false,
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!renameCategory || (categoryInUse && !replacementCategoryId) || deleteCategoryMutation.isPending) return;
    try {
      await deleteCategoryMutation.mutateAsync({
        householdId,
        categoryId: renameCategory.id,
        replacementCategoryId: categoryInUse ? replacementCategoryId : undefined,
      });
      enqueueSnackbar(
        categoryInUse
          ? `Deleted ${renameCategory.name} and moved its records to another category.`
          : `Deleted ${renameCategory.name}.`,
        { variant: 'success' },
      );
      setRenameCategory(null);
      setIsDeleteConfirmationOpen(false);
      setReplacementCategoryId('');
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not delete category', { variant: 'error' });
    }
  };

  const handleRequestDelete = async () => {
    if (!renameCategory) return;
    setIsCheckingCategoryUsage(true);
    try {
      const inUse = await ledgerLib.isCategoryUsed(householdId, renameCategory.id);
      setCategoryInUse(inUse);
      const firstReplacement = categories.find(
        (item) => item.isActive && item.type === renameCategory.type && item.id !== renameCategory.id,
      );
      setIsDeleteConfirmationOpen(true);
      setReplacementCategoryId(inUse ? firstReplacement?.id ?? '' : '');
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not check category usage', { variant: 'error' });
    } finally {
      setIsCheckingCategoryUsage(false);
    }
  };

  const openEditCategory = (category: Category) => {
    setIsDeleteConfirmationOpen(false);
    setCategoryInUse(false);
    setReplacementCategoryId('');
    setRenameCategory({
      id: category.id,
      name: category.name,
      type: category.type,
      merchants: category.merchantKeywords ?? [],
    });
  };

  const categoryDeleteBusy = deleteCategoryMutation.isPending || isCheckingCategoryUsage;

  const renderCategoryGroup = (type: 'income' | 'expense', title: string) => {
    const items = categories.filter((category) => category.type === type);
    return (
      <Box component="section" >
        <Stack spacing={{ xs: 2, md: 2.5 }}>
          <SectionHeading
            title={title}
            subtitle={`${items.length} configured`}
            trailing={<Chip label={type} size="small" color={type === 'income' ? 'success' : 'default'} />}
          />

          {isLoading ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                columnGap: { xs: 0, md: 3 },
              }}
            >
              {[...Array(6).keys()].map((item) => (
                <Skeleton key={item} height={56} />
              ))}
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No {type} categories yet.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                columnGap: { xs: 0, md: 3 },
              }}
            >
              {items.map((category) => (
                <Paper
                  component={Stack}
                  key={category.id}
                  variant="dividedListRow"
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                  sx={{ minWidth: 0 }}
                >
                  <ButtonBase
                    component="button"
                    aria-label={`Edit category ${category.name}`}
                    onClick={() => openEditCategory(category)}
                    sx={{ minWidth: 0, flex: 1, display: 'block', textAlign: 'left' }}
                  >
                    <Typography variant="sectionTitle" noWrap>
                      {category.name}
                    </Typography>
                    <Typography variant="sectionSubtitle" color="text.secondary" noWrap>
                      {category.merchantKeywords?.length ?? 0} merchant matches
                    </Typography>
                  </ButtonBase>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                    {type === 'expense' && (
                      <Tooltip
                        title={
                          category.essential === true
                            ? 'Essential — counted as a fixed bill; excluded from flexible budget and Safe Daily Spend'
                            : 'Mark essential — fixed bills are excluded from flexible budget and Safe Daily Spend'
                        }
                      >
                        <Switch
                          size="small"
                          checked={category.essential === true}
                          onChange={() => handleToggleEssential(category)}
                          slotProps={{ input: { 'aria-label': `Mark ${category.name} as essential` } }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 1, px: { xs: 2, sm: 3, lg: 5 } }}>
      <Stack spacing={{ xs: 2, md: 3 }} sx={{ width: '100%', maxWidth: 1160, mx: 'auto' }}>
        <PageHeader
          title="Categories"
          subtitle="Organize income and spending for reports and budget cycles"
          action={
            <Button variant="contained" onClick={() => setIsCreateDialogOpen(true)}>
              Add category
            </Button>
          }
        />

        <Stack spacing={{ xs: 3, md: 4 }}>
          {renderCategoryGroup('income', 'Income categories')}
          {renderCategoryGroup('expense', 'Expense categories')}
        </Stack>
      </Stack>
      <CategoryNameDialog
        open={isCreateDialogOpen}
        title="Add category"
        description="New categories are available immediately in entry and budgeting."
        confirmLabel="Create category"
        value={newCatName}
        placeholder="e.g. Subscriptions"
        categoryType={newCatType}
        loading={createCategoryMutation.isPending}
        merchants={newCatMerchants}
        onChange={setNewCatName}
        onCategoryTypeChange={setNewCatType}
        onMerchantsChange={setNewCatMerchants}
        onClose={() => {
          if (!createCategoryMutation.isPending) setIsCreateDialogOpen(false);
        }}
        onConfirm={handleCreateCategory}
      />
      <CategoryNameDialog
        open={!!renameCategory}
        title="Edit category"
        description="Update the category name and merchant matches."
        confirmLabel="Save"
        value={renameCategory?.name ?? ''}
        merchants={renameCategory?.merchants ?? []}
        loading={updateCategoryMutation.isPending || categoryDeleteBusy}
        dangerZone={
          <Stack spacing={2.5}>
            {!isDeleteConfirmationOpen ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Delete this category. If it has transactions or budget allocations, you’ll choose where to move them.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  loading={isCheckingCategoryUsage}
                  disabled={categoryDeleteBusy || updateCategoryMutation.isPending}
                  onClick={() => void handleRequestDelete()}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Delete category
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  {categoryInUse && renameCategory
                    ? `Records and budget allocations in “${renameCategory.name}” will be moved to the category you choose. If both categories have a budget allocation in the same cycle, their planned amounts will be combined.`
                    : `“${renameCategory?.name ?? ''}” has no linked transactions or budget allocations and can be deleted directly.`}
                </Typography>
                {categoryInUse && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel id="replacement-category-label">Move records to</InputLabel>
                      <Select
                        labelId="replacement-category-label"
                        label="Move records to"
                        value={replacementCategoryId}
                        onChange={(event) => setReplacementCategoryId(event.target.value)}
                        disabled={categoryDeleteBusy}
                      >
                        {categories
                          .filter(
                            (item) =>
                              item.isActive &&
                              item.type === renameCategory?.type &&
                              item.id !== renameCategory?.id,
                          )
                          .map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    {!categories.some(
                      (item) =>
                        item.isActive &&
                        item.type === renameCategory?.type &&
                        item.id !== renameCategory?.id,
                    ) && (
                      <Typography variant="sectionSubtitle" color="text.secondary">
                        Create another {renameCategory?.type} category first so these records have somewhere to move.
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </Stack>
        }
        actions={
          isDeleteConfirmationOpen ? (
            <>
              <Button
                onClick={() => setIsDeleteConfirmationOpen(false)}
                disabled={categoryDeleteBusy}
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCategory}
                variant="contained"
                color="error"
                loading={deleteCategoryMutation.isPending}
                disabled={categoryInUse && !replacementCategoryId}
              >
                {categoryInUse ? 'Move & delete' : 'Delete category'}
              </Button>
            </>
          ) : undefined
        }
        onChange={(name) => setRenameCategory((current) => (current ? { ...current, name } : current))}
        onMerchantsChange={(merchants) =>
          setRenameCategory((current) => (current ? { ...current, merchants } : current))
        }
        onClose={() => {
          if (!updateCategoryMutation.isPending && !categoryDeleteBusy) setRenameCategory(null);
        }}
        onConfirm={handleRenameCategory}
      />
    </Container>
  );
}
