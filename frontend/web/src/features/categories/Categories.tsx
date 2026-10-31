import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Chip, Container, Stack, Typography, Button, ButtonBase, Skeleton, Tooltip, Switch } from '@mui/material';
import type { Category } from '@kippa/domain';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { dedupeMerchantKeywords } from '@/libs/merchantSuggestions';
import { useCategories, useCreateCategoryMutation, useUpdateCategoryMutation } from '@/hooks/useFinance';
import { CategoryNameDialog } from './components/CategoryNameDialog';

import { useAppContext } from '@/hooks/useAppContext';

const sectionIndent = { xs: 0, md: 2 } as const;
const contentIndent = { xs: 0, md: 2 } as const;

export function Categories() {
  const { householdId } = useAppContext();
  const { enqueueSnackbar } = useSnackbar();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatMerchants, setNewCatMerchants] = useState<string[]>([]);
  const [renameCategory, setRenameCategory] = useState<{ id: string; name: string; merchants: string[] } | null>(null);

  // Queries & Mutations
  const { data: categories = [], isLoading } = useCategories(householdId);
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();

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

  const renderCategoryGroup = (type: 'income' | 'expense', title: string) => {
    const items = categories.filter((category) => category.type === type);
    return (
      <Box component="section" sx={{ px: sectionIndent }}>
        <Stack spacing={{ xs: 2, md: 2.5 }}>
          <SectionHeading
            title={title}
            subtitle={`${items.length} configured`}
            trailing={<Chip label={type} size="small" color={type === 'income' ? 'success' : 'default'} />}
          />

          {isLoading ? (
            <Box
              sx={{
                px: contentIndent,
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
            <Box sx={{ px: contentIndent, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No {type} categories yet.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                px: contentIndent,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                columnGap: { xs: 0, md: 3 },
              }}
            >
              {items.map((category) => (
                <Stack
                  key={category.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                  sx={{ minWidth: 0, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
                >
                  <ButtonBase
                    component="button"
                    aria-label={`Edit category ${category.name}`}
                    onClick={() =>
                      setRenameCategory({
                        id: category.id,
                        name: category.name,
                        merchants: category.merchantKeywords ?? [],
                      })
                    }
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
                </Stack>
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
        loading={updateCategoryMutation.isPending}
        onChange={(name) => setRenameCategory((current) => (current ? { ...current, name } : current))}
        onMerchantsChange={(merchants) =>
          setRenameCategory((current) => (current ? { ...current, merchants } : current))
        }
        onClose={() => {
          if (!updateCategoryMutation.isPending) setRenameCategory(null);
        }}
        onConfirm={handleRenameCategory}
      />
    </Container>
  );
}
