import { useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Autocomplete, Box, Stack, TextField, Skeleton, Button, Chip } from '@monochrome-ui/design-system';

import {
  useAccounts,
  useCards,
  useCategories,
  useTransactions,
  useLedgerLines,
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
    loadMore,
    resetPage,
    searchTerm,
    selectedAccountIds,
    selectedCategoryIds,
    selectedCycleId,
    setEditingTx,
    setSearchTerm,
    setSelectedAccountIds,
    setSelectedCategoryIds,
    setSelectedCycleId,
    visibleCount,
  } = useTransactionHistoryUi();
  const selectedType = searchParams.get('type') ?? 'all';

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };
  const handleCategoryChange = (value: string[] | null) => {
    setSelectedCategoryIds(value);
    resetPage();
  };
  const handleAccountChange = (value: string[] | null) => {
    setSelectedAccountIds(value);
    resetPage();
  };
  const handleTypeChange = (value: string) => {
    setSearchParams(value === 'all' ? {} : { type: value });
    resetPage();
  };
  const handleCycleChange = (value: string | null) => {
    setSelectedCycleId(value ?? 'all');
    resetPage();
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
    enabled: !!householdId && cycleReady && !hasFilters,
  });
  // Description substring and ledger account filters must cover the whole selected cycle.
  const matchingCycle = useTransactions(householdId, queryCycleId, {
    enabled: cycleReady && hasFilters && canMatchFilters,
  });
  const accountLines = useQuery({
    queryKey: [...financeQueryKeys.ledgerLines(householdId), 'accounts', selectedAccountIds],
    queryFn: () => ledgerLib.getLedgerLinesBy(householdId, 'accountId', selectedAccountIds ?? []),
    enabled: !!householdId && canMatchFilters && selectedAccountIds !== null,
  });
  const transactions = hasFilters
    ? (canMatchFilters ? matchingCycle.data ?? [] : [])
    : history.data?.pages.flatMap((page) => page.transactions) ?? [];

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

  const accountTransactionIds = new Set(accountLines.data?.map((line) => line.transactionId));
  const filteredTxs = transactions.filter((tx) => {
    // 1. Text Search
    const searchMatch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Category Filter
    let catMatch = true;
    if (selectedCategoryIds !== null) {
      catMatch = selectedCategoryIds.includes(tx.categoryId ?? '');
    }

    // 3. Account Filter
    let accMatch = true;
    if (selectedAccountIds !== null) {
      accMatch = accountTransactionIds.has(tx.id);
    }

    // 4. Type Filter
    let typeMatch = true;
    if (selectedType !== 'all') {
      typeMatch = tx.type === selectedType;
    }

    return searchMatch && catMatch && accMatch && typeMatch;
  });

  const visibleTransactions = hasFilters ? filteredTxs.slice(0, visibleCount) : filteredTxs;
  const visibleIds = visibleTransactions.map((tx) => tx.id);
  const filteredLines = useQuery({
    queryKey: [...financeQueryKeys.ledgerLines(householdId), 'transactionRows', visibleIds],
    queryFn: () => ledgerLib.getLedgerLinesBy(householdId, 'transactionId', visibleIds),
    enabled: !!householdId && hasFilters && visibleIds.length > 0,
  });
  const pageLines = useMemo(() => history.data?.pages.flatMap((page) => page.lines) ?? EMPTY_LINES, [history.data]);
  const rawLines = hasFilters ? filteredLines.data ?? EMPTY_LINES : pageLines;
  const creditAccountIds = new Set(accounts.filter((account) => account.type === 'credit' && account.currency === 'EGP')
    .map((account) => account.id));
  const expenseIds = new Set(visibleTransactions.filter((tx) =>
    tx.type === 'expense' && tx.status === 'posted' && !tx.loanId && !tx.description?.startsWith('Card fee ('),
  ).map((tx) => tx.id));
  // Legacy purchases without a recorded fee need settlement history to tell whether they are paid.
  const needsFeeHistory = rawLines.some((line) => line.currency === 'EGP' && line.signedAmount < 0 &&
    !line.cardFee && creditAccountIds.has(line.accountId) && expenseIds.has(line.transactionId));
  const feeHistory = useLedgerLines(householdId, undefined, { enabled: needsFeeHistory });
  const ledgerLines = needsFeeHistory ? feeHistory.data ?? rawLines : rawLines;
  const isLoading = accountsLoading || categoriesLoading || !cycleReady ||
    (hasFilters ? canMatchFilters && (matchingCycle.isLoading || accountLines.isLoading) : history.isLoading);
  const activityError = (needsFeeHistory && feeHistory.isError) || (hasFilters
    ? canMatchFilters && (matchingCycle.isError || (selectedAccountIds !== null && accountLines.isError) ||
      (visibleIds.length > 0 && filteredLines.isError))
    : history.isError);
  const hasMore = hasFilters ? visibleCount < filteredTxs.length : history.hasNextPage;
  const loadNext = () => {
    if (hasFilters) loadMore();
    else void history.fetchNextPage();
  };
  const rowsLoading = (hasFilters && filteredLines.isLoading) || (needsFeeHistory && feeHistory.isLoading);
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
            <SectionHeading title="Activity" trailing={<Chip size="small" label={`${filteredTxs.length} ${hasFilters || !hasMore ? 'results' : 'loaded'}`} />} />
            <Stack spacing={1.5} >
              {activityError && <EmptyLayout
                title="Could not load transactions"
                description="Try loading the activity again."
                action={<Button onClick={() => {
                  if (needsFeeHistory && feeHistory.isError) void feeHistory.refetch();
                  else if (!hasFilters) {
                    if (history.isFetchNextPageError) void history.fetchNextPage();
                    else void history.refetch();
                  } else {
                    if (matchingCycle.isError) void matchingCycle.refetch();
                    if (accountLines.isError) void accountLines.refetch();
                    if (filteredLines.isError) void filteredLines.refetch();
                  }
                }}>Try again</Button>}
              />}
              {!activityError && !rowsLoading && filteredTxs.length === 0 ? (
                <EmptyLayout
                  title="No matching transactions"
                  description="Try changing your search or filters to find what you’re looking for."
                />
              ) : (
                <>
                  <Stack
                    className="ds-stepper"
                    spacing={{ xs: 1.25, sm: 1.5 }}
                    sx={{ '--ds-stepper-gap-half': { xs: '5px', sm: '6px' } }}
                  >
                    {(!rowsLoading && (!needsFeeHistory || feeHistory.data) && (!hasFilters || !!filteredLines.data) ? visibleTransactions : []).map((transaction) => (
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
                  {rowsLoading && <Skeleton variant="rounded" height={56} />}
                  {hasMore && !activityError && (
                    <Button variant="segmented" onClick={loadNext} loading={history.isFetchingNextPage || rowsLoading} sx={{ alignSelf: 'center' }}>
                      {hasFilters ? `Load more · ${filteredTxs.length - visibleCount} remaining` : 'Load more'}
                    </Button>
                  )}
                </>
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
