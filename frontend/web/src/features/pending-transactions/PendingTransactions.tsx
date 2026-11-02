import { useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@monochrome-ui/design-system';
import { KeyIcon, SearchIcon } from '@/components/AppIcon';
import { PageHeader } from '@monochrome-ui/design-system';
import { PendingReviewDialog } from './components/PendingReviewDialog';
import { MessageConnectionDialog } from './components/MessageConnectionDialog';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import { TransactionIcon } from '@/features/transactions';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useAccounts,
  useApprovePendingFinancialMessageMutation,
  useCategories,
  useDiscardPendingFinancialMessageMutation,
  usePendingFinancialMessages,
  useResolvedPendingFinancialMessages,
  useRestoreDiscardedPendingFinancialMessageMutation,
} from '@/hooks/useFinance';
import type { PendingFinancialMessage } from '@kippa/domain';
import { suggestCategoryIds } from '@/libs/merchantSuggestions';
import { useMessageConnections } from './hooks/useMessageConnections';
import { usePendingReviewState } from './hooks/usePendingReviewState';
type PendingItemState = 'idle' | 'approving' | 'discarding' | 'settled';

const PREVIEW_PENDING_ITEMS: PendingFinancialMessage[] = [
  {
    id: 'preview-debit-purchase',
    householdId: 'preview',
    receivedBy: 'preview',
    kind: 'expense',
    source: 'ios-shortcut',
    provider: 'hsbc',
    amount: 325,
    currency: 'EGP',
    date: '2026-07-31',
    description: 'FAWRY · BEANOS',
    counterparty: 'FAWRY · BEANOS',
    messagePreview: 'HSBC card purchase · EGP 325.00 · 31 Jul 2026',
    suggestedAccountId: null,
    suggestedDestinationAccountId: null,
    createdAt: '2026-07-31T12:00:00.000Z',
    status: 'pending',
  },
  {
    id: 'preview-credit-purchase',
    householdId: 'preview',
    receivedBy: 'preview',
    kind: 'expense',
    source: 'ios-shortcut',
    provider: 'hsbc',
    amount: 999.99,
    currency: 'EGP',
    date: '2026-07-19',
    description: 'OPENAI · CHATGPT SUBSCR',
    counterparty: 'OPENAI · CHATGPT SUBSCR',
    accountHintLast4: '7281',
    messagePreview: 'HSBC credit-card purchase ending 7281 · EGP 999.99 · 19 Jul 2026',
    suggestedAccountId: null,
    suggestedDestinationAccountId: null,
    createdAt: '2026-07-31T11:00:00.000Z',
    status: 'pending',
  },
  {
    id: 'preview-inward',
    householdId: 'preview',
    receivedBy: 'preview',
    kind: 'income',
    source: 'ios-shortcut',
    provider: 'hsbc',
    amount: 225,
    currency: 'EGP',
    date: '2026-07-17',
    description: 'Incoming bank transfer',
    messagePreview: 'HSBC incoming transfer · EGP 225.00 · 17 Jul 2026',
    suggestedAccountId: null,
    suggestedDestinationAccountId: null,
    createdAt: '2026-07-31T10:00:00.000Z',
    status: 'pending',
  },
];

export function PendingTransactions() {
  const { householdId } = useAppContext();
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const {
    data: remotePending = [],
    isLoading: remoteLoading,
    isFetching: remoteFetching,
  } = usePendingFinancialMessages(householdId);
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const approveMutation = useApprovePendingFinancialMessageMutation();
  const discardMutation = useDiscardPendingFinancialMessageMutation();
  const restoreMutation = useRestoreDiscardedPendingFinancialMessageMutation();
  const {
    data: resolved = [],
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useResolvedPendingFinancialMessages(householdId);
  const [tab, setTab] = useState<'review' | 'history'>('review');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    accountId,
    categoryId,
    destinationAccountId,
    selected,
    suggestedCategoryIds,
    setAccountId,
    setCategoryId,
    setDestinationAccountId,
    setSelected,
    setSuggestedCategoryIds,
  } = usePendingReviewState();
  const [itemStates, setItemStates] = useState<Record<string, PendingItemState>>({});
  const [setupOpen, setSetupOpen] = useState(false);
  const connections = useMessageConnections(householdId);
  const previewMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview-pending') === '1';
  const pending = previewMode ? PREVIEW_PENDING_ITEMS : remotePending;
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredPending = useMemo(
    () =>
      !normalizedSearch
        ? pending
        : pending.filter((item) =>
            [item.description, item.counterparty, item.provider, item.kind, item.date, item.messagePreview]
              .filter(Boolean)
              .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch)),
          ),
    [normalizedSearch, pending],
  );
  const filteredResolved = useMemo(
    () =>
      !normalizedSearch
        ? resolved
        : resolved.filter((item) =>
            [
              item.snapshot.description,
              item.snapshot.counterparty,
              item.snapshot.provider,
              item.snapshot.kind,
              item.state,
              item.resolvedByDisplayName,
            ]
              .filter(Boolean)
              .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch)),
          ),
    [normalizedSearch, resolved],
  );
  // Show the empty state only after a check has actually settled. The query
  // is shared with the nav badge and polls every 30s, so a cached (possibly
  // stale, possibly empty) list often renders first — keep the skeleton up
  // while a fetch is in flight and we have nothing to show yet.
  const reviewChecking = !previewMode && (remoteLoading || (remoteFetching && remotePending.length === 0));
  const historyChecking = historyLoading || (historyFetching && resolved.length === 0);

  const availableCategories = useMemo(() => {
    if (!selected) return [];
    const expectedType = selected.kind === 'income' ? 'income' : 'expense';
    return categories.filter((category) => category.isActive && category.type === expectedType);
  }, [categories, selected]);

  const availableAccounts = useMemo(() => {
    if (!selected) return [];
    return accounts.filter((account) => account.isActive && account.currency === selected.currency);
  }, [accounts, selected]);

  const availableDestinationAccounts = useMemo(() => {
    if (!selected) return [];
    const targetCurrency = selected.destinationCurrency ?? selected.currency;
    return accounts.filter(
      (account) => account.isActive && account.currency === targetCurrency && account.id !== accountId,
    );
  }, [accounts, selected, accountId]);

  const openReview = (item: PendingFinancialMessage) => {
    if ((itemStates[item.id] ?? 'idle') !== 'idle') return;
    setSelected(item);
    const suggestions = suggestCategoryIds(item, categories);
    setCategoryId(suggestions.length === 1 ? suggestions[0] : '');
    setSuggestedCategoryIds(suggestions);
    setAccountId(item.suggestedAccountId ?? '');
    setDestinationAccountId(item.suggestedDestinationAccountId ?? '');
  };

  const closeReview = () => {
    if (approveMutation.isPending || discardMutation.isPending) return;
    setSelected(null);
  };

  const approve = async () => {
    if (
      !selected ||
      !accountId ||
      (selected.kind !== 'transfer' && !selected.suggestedLoanId && !categoryId) ||
      (selected.kind === 'transfer' && !destinationAccountId)
    )
      return;
    if (previewMode && selected.id.startsWith('preview-')) {
      enqueueSnackbar('Preview only — no transaction was created', { variant: 'success' });
      setSelected(null);
      return;
    }
    const pendingId = selected.id;
    setItemStates((current) => ({ ...current, [pendingId]: 'approving' }));
    try {
      await approveMutation.mutateAsync({
        householdId,
        pendingId: selected.id,
        categoryId: selected.suggestedLoanId ? undefined : categoryId,
        accountId,
        destinationAccountId: selected.kind === 'transfer' ? destinationAccountId : undefined,
      });
      setItemStates((current) => ({ ...current, [pendingId]: 'settled' }));
      enqueueSnackbar('Transaction approved', { variant: 'success' });
      setSelected(null);
    } catch (error) {
      setItemStates((current) => ({ ...current, [pendingId]: 'idle' }));
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not approve this item', { variant: 'error' });
    }
  };

  const discard = async () => {
    if (!selected || discardMutation.isPending || approveMutation.isPending) return;
    if (previewMode && selected.id.startsWith('preview-')) {
      enqueueSnackbar('Preview only — nothing was deleted', { variant: 'info' });
      setSelected(null);
      return;
    }
    const discardedItem = selected;
    setItemStates((current) => ({ ...current, [discardedItem.id]: 'discarding' }));
    try {
      await discardMutation.mutateAsync({ householdId, pendingId: discardedItem.id });
      setItemStates((current) => ({ ...current, [discardedItem.id]: 'settled' }));
      enqueueSnackbar('Pending item discarded', {
        variant: 'success',
        action: (snackbarKey) => (
          <Button
            color="inherit"
            size="small"
            loading={restoreMutation.isPending}
            onClick={async () => {
              try {
                await restoreMutation.mutateAsync({ householdId, pendingId: discardedItem.id });
                setItemStates((current) => ({ ...current, [discardedItem.id]: 'idle' }));
                closeSnackbar(snackbarKey);
                enqueueSnackbar('Pending item restored', { variant: 'success' });
              } catch (error) {
                closeSnackbar(snackbarKey);
                enqueueSnackbar(error instanceof Error ? error.message : 'Could not restore this item', {
                  variant: 'error',
                });
              }
            }}
          >
            Undo
          </Button>
        ),
      });
      setSelected(null);
    } catch (error) {
      setItemStates((current) => ({ ...current, [discardedItem.id]: 'idle' }));
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not discard this item', { variant: 'error' });
    }
  };

  const restoreDiscarded = async (pendingId: string) => {
    try {
      await restoreMutation.mutateAsync({ householdId, pendingId });
      setItemStates((current) => ({ ...current, [pendingId]: 'idle' }));
      enqueueSnackbar('Pending item restored for review', { variant: 'success' });
      setTab('review');
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not restore this item', { variant: 'error' });
    }
  };

  const activeConnections = connections.credentials.filter((credential) => credential.enabled).length;
  const selectedState = selected ? (itemStates[selected.id] ?? 'idle') : 'idle';
  const reviewBusy = selectedState === 'approving' || selectedState === 'discarding';

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Pending transactions"
        subtitle="Review detected activity before it is added to your household ledger."
        action={
          <Chip
            label={tab === 'review' ? `${pending.length} pending` : `${resolved.length} resolved`}
            color={tab === 'review' && pending.length ? 'secondary' : 'default'}
          />
        }
      />

      <Box component="section" >
        <Stack spacing={2.5}>
          <SectionHeading
            icon={<KeyIcon fontSize="small" />}
            title="Secure message connection"
            subtitle={
              activeConnections
                ? `${activeConnections} active secure connection${activeConnections === 1 ? '' : 's'}`
                : 'Connect your bank message automation securely.'
            }
            trailing={
              <Button variant="segmented" onClick={() => setSetupOpen(true)}>
                {activeConnections ? 'Manage' : 'Connect'}
              </Button>
            }
          />

          <Tabs
            value={tab}
            onChange={(event, value) => {
              void event;
              setTab(value);
            }}
          >
            <Tab value="review" label="Needs review" />
            <Tab value="history" label="History" />
          </Tabs>

          <Stack spacing={2.5} >
            {!(tab === 'review' ? reviewChecking : historyChecking) && (
              <TextField
                label={tab === 'review' ? 'Search pending activity' : 'Search review history'}
                placeholder="Description, provider, or person"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                sx={{ width: '100%', maxWidth: 440 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}

            {tab === 'review' &&
              (reviewChecking ? (
                <Stack spacing={1}>
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} variant="rounded" height={76} />
                  ))}
                </Stack>
              ) : filteredPending.length === 0 ? (
                <EmptyLayout
                  title={pending.length ? 'No matching activity' : 'Nothing waiting for you'}
                  description={
                    pending.length
                      ? 'Try another search to find a pending item.'
                      : 'Detected bank activity will appear here. No ledger entry is created until you approve it.'
                  }
                />
              ) : (
                <Stack spacing={1.5} component="section">
                  <SectionHeading
                    title="Needs review"
                    subtitle="Confirm or discard detected bank activity."
                    trailing={<Chip size="small" label={`${filteredPending.length} results`} />}
                  />
                  <Stack className="ds-stepper" >
                    {filteredPending.map((item) => (
                      <Paper
                        key={item.id}
                        component="button"
                        type="button"
                        onClick={() => openReview(item)}
                        disabled={(itemStates[item.id] ?? 'idle') !== 'idle'}
                        data-processing={(itemStates[item.id] ?? 'idle') !== 'idle' || undefined}
                        variant="timelineRow"
                        sx={{
                          width: '100%',
                          minHeight: 80,
                          px: { xs: 1, sm: 2 },
                          py: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        {(itemStates[item.id] ?? 'idle') === 'idle' ? (
                          <TransactionIcon className="ds-stepper-node" type={item.kind} size={36} />
                        ) : (
                          <CircularProgress size={32} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography noWrap variant="sectionLabel">
                            {item.description}
                          </Typography>
                          <Typography noWrap variant="sectionSubtitle" color="text.secondary">
                            {item.provider.toUpperCase()} · {item.kind} · {item.date}
                          </Typography>
                        </Box>
                        <Typography variant="activityAmount" sx={{ whiteSpace: 'nowrap' }}>
                          <Money amount={item.amount} code={item.currency} maxDigits={2} />
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              ))}

            {tab === 'history' &&
              (historyChecking ? (
                <Stack spacing={1}>
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} variant="rounded" height={76} />
                  ))}
                </Stack>
              ) : filteredResolved.length === 0 ? (
                <EmptyLayout
                  title={resolved.length ? 'No matching history' : 'No review history yet'}
                  description={
                    resolved.length
                      ? 'Try another search to find a resolved item.'
                      : 'Approved and discarded message activity will appear here after you resolve it.'
                  }
                />
              ) : (
                <Stack spacing={1.5} component="section">
                  <SectionHeading
                    title="Review history"
                    subtitle="The latest 100 resolved items."
                    trailing={<Chip size="small" label={`${filteredResolved.length} results`} />}
                  />
                  <Stack className="ds-stepper" >
                    {filteredResolved.map((item) => {
                      const restoring = restoreMutation.isPending && restoreMutation.variables?.pendingId === item.id;
                      return (
                        <Paper
                          key={item.id}
                          component="article"
                          variant="timelineRow"
                          sx={{
                            minHeight: 80,
                            px: { xs: 1, sm: 2 },
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <TransactionIcon className="ds-stepper-node" type={item.snapshot.kind} size={36} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                              <Typography noWrap variant="sectionLabel" sx={{ minWidth: 0 }}>
                                {item.snapshot.description}
                              </Typography>
                              <Typography variant="activityAmount" sx={{ whiteSpace: 'nowrap' }}>
                                <Money amount={item.snapshot.amount} code={item.snapshot.currency} maxDigits={2} />
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                              <Chip
                                label={item.state === 'approved' ? 'Approved' : 'Discarded'}
                                color={item.state === 'approved' ? 'success' : 'default'}
                                size="small"
                                variant="outlined"
                              />
                              <Typography noWrap variant="sectionSubtitle" color="text.secondary">
                                {new Date(item.resolvedAt).toLocaleString()} · {item.resolvedByDisplayName}
                              </Typography>
                            </Stack>
                          </Box>
                          {item.state === 'discarded' && (
                            <Button
                              size="small"
                              variant="segmented"
                              disabled={restoring}
                              onClick={() => restoreDiscarded(item.id)}
                              loading={restoring}
                            >
                              Restore
                            </Button>
                          )}
                        </Paper>
                      );
                    })}
                  </Stack>
                </Stack>
              ))}
          </Stack>
        </Stack>
      </Box>

      <PendingReviewDialog
        accountId={accountId}
        accounts={availableAccounts}
        busy={reviewBusy}
        categories={availableCategories}
        categoryId={categoryId}
        destinationAccountId={destinationAccountId}
        destinationAccounts={availableDestinationAccounts}
        item={selected}
        onAccountChange={setAccountId}
        onApprove={approve}
        onCategoryChange={setCategoryId}
        onClose={closeReview}
        onDestinationChange={setDestinationAccountId}
        onDiscard={discard}
        state={selectedState}
        suggestedCategoryIds={suggestedCategoryIds}
      />

      <MessageConnectionDialog
        busy={connections.busy}
        credentials={connections.credentials}
        generated={connections.generated}
        onClose={() => setSetupOpen(false)}
        onCopy={connections.copy}
        onCreate={connections.create}
        onRevoke={connections.revoke}
        onDelete={connections.remove}
        open={setupOpen}
      />
    </Stack>
  );
}
