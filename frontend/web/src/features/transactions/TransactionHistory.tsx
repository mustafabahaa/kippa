import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Autocomplete, Box, Stack, TextField, Skeleton, Button, Chip } from '@monochrome-ui/design-system';

import {
  useAccounts,
  useCards,
  useCategories,
  useVoidTransactionMutation,
  useCycles,
  useActiveCycle,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { EditTransactionDialog } from './components/EditTransactionDialog';
import { VoidTransactionDialog } from './components/VoidTransactionDialog';
import { PageHeader } from '@monochrome-ui/design-system';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { TRANSACTION_PAGE_SIZE, useTransactionHistoryUi } from './hooks/useTransactionHistoryUi';
import { TransactionsListItem } from './components/TransactionsListItem';
import { MultiSelectFilter } from '@/features/shared/components/MultiSelectFilter';

import { financeQueryKeys } from '@/hooks/financeQueryKeys';
import { ledgerLib } from '@/libs/ledger';
import type { LedgerLine } from '@kippa/domain';

const EMPTY_LINES: LedgerLine[] = [];

export function TransactionHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { householdId } = useAppContext();
  const { data: cards = [] } = useCards(householdId);
  const [voidingTxId, setVoidingTxId] = useState<string | null>(null);

  // Filter States
  const {
    editingTx,
    searchTerm,
    selectedAccountIds,
    selectedCategoryIds,
    selectedCycleId,
    setEditingTx,
    setSearchTerm,
    setSelectedAccountIds,
    setSelectedCategoryIds,
    setSelectedCycleId,
  } = useTransactionHistoryUi();
  const selectedType = searchParams.get('type') ?? 'all';

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };
  const handleCategoryChange = (value: string[] | null) => {
    setSelectedCategoryIds(value);
  };
  const handleAccountChange = (value: string[] | null) => {
    setSelectedAccountIds(value);
  };
  const handleTypeChange = (value: string) => {
    setSearchParams(value === 'all' ? {} : { type: value });
  };
  const handleCycleChange = (value: string | null) => {
    setSelectedCycleId(value ?? 'all');
  };

  // Queries & Mutations
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(householdId);
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles(householdId);
  const { data: activeCycle, isLoading: activeCycleLoading } = useActiveCycle(householdId);

  const queryCycleId = useMemo(() => {
    if (selectedCycleId === 'all') return undefined;
    if (selectedCycleId === 'active') return activeCycle?.id || cycles[0]?.id;
    return selectedCycleId;
  }, [selectedCycleId, activeCycle, cycles]);

  const cycleReady = selectedCycleId !== 'active' || !!queryCycleId || (!cyclesLoading && !activeCycleLoading);
  const hasFilters = Boolean(searchTerm) || selectedAccountIds !== null ||
    selectedCategoryIds !== null || selectedType !== 'all';
  const canMatchFilters = selectedAccountIds?.length !== 0 && selectedCategoryIds?.length !== 0;
  const history = useInfiniteQuery({
    queryKey: [...financeQueryKeys.transactions(householdId), 'history', queryCycleId],
    queryFn: ({ pageParam }) =>
      ledgerLib.getTransactionHistoryPage(householdId, queryCycleId, TRANSACTION_PAGE_SIZE, pageParam),
    initialPageParam: undefined as import('firebase/firestore').QueryDocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!householdId && cycleReady && canMatchFilters,
  });
  const transactions = canMatchFilters ? history.data?.pages.flatMap((page) => page.transactions) ?? [] : [];
  const pageLines = useMemo(() => history.data?.pages.flatMap((page) => page.lines) ?? EMPTY_LINES, [history.data]);

  const accountOptions = accounts.map((account) => ({
    id: account.id,
    label: account.name,
  }));
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));
  const cycleOptions = [
    { id: 'all', label: 'All cycles' },
    { id: 'active', label: 'Active cycle' },
    ...cycles.filter((cycle) => cycle.status !== 'open').map((cycle) => ({ id: cycle.id, label: cycle.name })),
  ];
  const typeOptions = [
    { id: 'all', label: 'All types' },
    { id: 'expense', label: 'Expense' },
    { id: 'income', label: 'Income' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'adjustment', label: 'Reconciliation' },
  ];

  const voidTxMutation = useVoidTransactionMutation();

  // Void Transaction
  const handleVoid = async () => {
    if (!voidingTxId) return;
    try {
      await voidTxMutation.mutateAsync({ householdId, transactionId: voidingTxId });
      enqueueSnackbar('Transaction voided successfully.', { variant: 'success' });
      setVoidingTxId(null);
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to void transaction', { variant: 'error' });
    }
  };

  const accountTransactionIds = new Set(pageLines
    .filter((line) => selectedAccountIds?.includes(line.accountId))
    .map((line) => line.transactionId));
  const normalizedSearch = searchTerm.toLowerCase();
  const filteredTxs = transactions.filter((tx) =>
    (tx.description ?? '').toLowerCase().includes(normalizedSearch) &&
    (selectedCategoryIds === null || selectedCategoryIds.includes(tx.categoryId ?? '')) &&
    (selectedAccountIds === null || accountTransactionIds.has(tx.id)) &&
    (selectedType === 'all' || tx.type === selectedType),
  );

  const ledgerLines = pageLines;
  const isLoading = accountsLoading || categoriesLoading || !cycleReady ||
    (canMatchFilters && history.isLoading);
  const activityError = canMatchFilters && history.isError;
  const hasMore = canMatchFilters && history.hasNextPage;
  const editingLines = useMemo(
    () => editingTx ? ledgerLines.filter((line) => line.transactionId === editingTx.id) : undefined,
    [editingTx, ledgerLines],
  );

  if (isLoading) {
    return (
      <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: '100%' }}>
        <PageHeader title="Transactions" subtitle="Search and review your household activity." />
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 900, alignSelf: 'center' }}>
          <Box component="section" >
            <Stack spacing={2} >
              <Stack spacing={0.5}>
                <Skeleton variant="text" width={100} height={26} />
                <Skeleton variant="text" width="100%" height={20} sx={{ maxWidth: 350 }} />
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'repeat(4, minmax(0, 1fr))',
                  },
                  rowGap: { xs: 2, sm: 2.5 },
                  columnGap: 2,
                }}
              >
                <Skeleton variant="rounded" height={56} sx={{ gridColumn: { xs: 'auto', sm: 'span 2' } }} />
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} sx={{ gridColumn: { xs: 'auto', sm: 'span 2' } }} />
                <Skeleton variant="rounded" height={56} sx={{ gridColumn: { xs: 'auto', sm: 'span 2' } }} />
              </Box>
            </Stack>
          </Box>

          <Box component="section" >
            <Stack spacing={{ xs: 3, md: 4 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" >
                <Skeleton variant="text" width={120} height={28} />
                <Skeleton variant="rounded" width={64} height={28} />
              </Stack>
              <Stack spacing={2.5} >
                {[...Array(5).keys()].map((index) => (
                  <Stack key={index} direction="row" spacing={1.5} alignItems="center">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                      <Skeleton variant="text" width={120} height={28} />
                      <Skeleton variant="text" width={100} height={20} />
                      <Skeleton variant="text" width={88} height={18} />
                    </Stack>
                    <Stack spacing={0.25} alignItems="flex-end" sx={{ width: { xs: 96, sm: 220 } }}>
                      <Skeleton variant="text" width={80} height={22} />
                      <Skeleton variant="text" width="100%" height={18} />
                    </Stack>
                    <Skeleton variant="circular" width={24} height={24} />
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: '100%' }}>
      <PageHeader title="Transactions" subtitle="Search and review your household activity." />

      <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: '100%', maxWidth: 900, alignSelf: 'center' }}>
        <Box component="section" >
          <Stack spacing={3.5}>
            <SectionHeading title="Filters" subtitle="Narrow transactions by cycle, account, category, or type." />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                rowGap: { xs: 2, sm: 2.5 },
                columnGap: 2,
              }}
            >
              <TextField
                sx={{ gridColumn: { xs: 'auto', sm: 'span 2' } }}
                label="Search"
                placeholder="Search descriptions"
                value={searchTerm}
                onChange={(event) => handleSearch(event.target.value)}
                fullWidth
              />

              <Autocomplete
                options={cycleOptions}
                value={cycleOptions.find((option) => option.id === selectedCycleId) ?? cycleOptions[0]}
                onChange={(event, option) => {
                  void event;
                  handleCycleChange(option?.id ?? null);
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label="Cycle" />}
              />

              <Autocomplete
                options={typeOptions}
                value={typeOptions.find((option) => option.id === selectedType) ?? typeOptions[0]}
                onChange={(event, option) => {
                  void event;
                  handleTypeChange(option?.id ?? 'all');
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label="Type" />}
              />

              <Box sx={{ gridColumn: { xs: 'auto', sm: 'span 2' } }}>
                <MultiSelectFilter
                  label="Accounts"
                  allLabel="All accounts"
                  searchPlaceholder={selectedAccountIds?.length === 0 ? 'No accounts selected' : 'Search accounts'}
                  options={accountOptions}
                  selectedIds={selectedAccountIds}
                  onChange={handleAccountChange}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: 'auto', sm: 'span 2' } }}>
                <MultiSelectFilter
                  label="Categories"
                  allLabel="All categories"
                  searchPlaceholder={selectedCategoryIds?.length === 0 ? 'No categories selected' : 'Search categories'}
                  options={categoryOptions}
                  selectedIds={selectedCategoryIds}
                  onChange={handleCategoryChange}
                />
              </Box>
            </Box>
          </Stack>
        </Box>

        <Box component="section" >
          <Stack spacing={{ xs: 3, md: 4 }}>
            <SectionHeading title="Activity" trailing={<Chip size="small" label={`${filteredTxs.length} ${hasMore ? 'loaded' : 'results'}`} />} />
            <Stack spacing={1.5} >
              {activityError && <EmptyLayout
                title="Could not load transactions"
                description="Try loading the activity again."
                action={<Button onClick={() => {
                  if (history.isFetchNextPageError) void history.fetchNextPage();
                  else void history.refetch();
                }}>Try again</Button>}
              />}
              {!activityError && filteredTxs.length === 0 ? (
                <EmptyLayout
                  title={hasMore ? 'No matches in loaded transactions' : 'No matching transactions'}
                  description={hasMore ? 'Load more to search older transactions.' : 'Try changing your search or filters to find what you’re looking for.'}
                />
              ) : (
                <Stack
                  className="ds-stepper"
                  spacing={{ xs: 1.25, sm: 1.5 }}
                  sx={{ '--ds-stepper-gap-half': { xs: '5px', sm: '6px' } }}
                >
                  {filteredTxs.map((transaction) => (
                    <TransactionsListItem
                      key={transaction.id}
                      tx={transaction}
                      categories={categories}
                      ledgerLines={ledgerLines}
                      accounts={accounts}
                      cards={cards}
                      onEdit={setEditingTx}
                      onVoid={setVoidingTxId}
                    />
                  ))}
                </Stack>
              )}
              {hasMore && !activityError && (
                <Button variant="segmented" onClick={() => void history.fetchNextPage()} loading={history.isFetchingNextPage} sx={{ alignSelf: 'center' }}>
                  {hasFilters ? 'Search older transactions' : 'Load more'}
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </Stack>

      {/* Shared Edit Dialog */}
      {editingTx && <EditTransactionDialog open transaction={editingTx} initialLedgerLines={editingLines} onClose={() => setEditingTx(null)} />}
      <VoidTransactionDialog
        open={Boolean(voidingTxId)}
        loading={voidTxMutation.isPending}
        onClose={() => setVoidingTxId(null)}
        onConfirm={handleVoid}
      />
    </Stack>
  );
}
