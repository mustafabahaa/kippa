import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
} from '@mui/material';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { TransactionIcon } from '@/features/transactions/components/TransactionIcon';
import { Money } from '@/components/Money';
import { CheckCircleIcon, ContentCopyIcon, DeleteIcon, HistoryIcon, KeyIcon } from '@/components/AppIcon';
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
import { messageIngestionLib } from '@/libs/messageIngestion';
import type { MessageIngestionCredential, PendingFinancialMessage } from '@kippa/domain';

type GeneratedConnection = { token: string; endpoint: string };
type PendingItemState = 'idle' | 'approving' | 'discarding' | 'settled';

const PREVIEW_PENDING_ITEMS: PendingFinancialMessage[] = [
  {
    id: 'preview-debit-purchase', householdId: 'preview', receivedBy: 'preview', kind: 'expense',
    source: 'ios-shortcut', provider: 'hsbc', amount: 325, currency: 'EGP', date: '2026-07-31',
    description: 'FAWRY · BEANOS', counterparty: 'FAWRY · BEANOS',
    messagePreview: 'HSBC card purchase · EGP 325.00 · 31 Jul 2026',
    suggestedAccountId: null, suggestedDestinationAccountId: null, createdAt: '2026-07-31T12:00:00.000Z', status: 'pending',
  },
  {
    id: 'preview-credit-purchase', householdId: 'preview', receivedBy: 'preview', kind: 'expense',
    source: 'ios-shortcut', provider: 'hsbc', amount: 999.99, currency: 'EGP', date: '2026-07-19',
    description: 'OPENAI · CHATGPT SUBSCR', counterparty: 'OPENAI · CHATGPT SUBSCR', accountHintLast4: '7281',
    messagePreview: 'HSBC credit-card purchase ending 7281 · EGP 999.99 · 19 Jul 2026',
    suggestedAccountId: null, suggestedDestinationAccountId: null, createdAt: '2026-07-31T11:00:00.000Z', status: 'pending',
  },
  {
    id: 'preview-inward', householdId: 'preview', receivedBy: 'preview', kind: 'income',
    source: 'ios-shortcut', provider: 'hsbc', amount: 225, currency: 'EGP', date: '2026-07-17',
    description: 'Incoming bank transfer',
    messagePreview: 'HSBC incoming transfer · EGP 225.00 · 17 Jul 2026',
    suggestedAccountId: null, suggestedDestinationAccountId: null, createdAt: '2026-07-31T10:00:00.000Z', status: 'pending',
  },
];

export function PendingTransactions() {
  const { householdId } = useAppContext();
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const { data: remotePending = [], isLoading: remoteLoading } = usePendingFinancialMessages(householdId);
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const approveMutation = useApprovePendingFinancialMessageMutation();
  const discardMutation = useDiscardPendingFinancialMessageMutation();
  const restoreMutation = useRestoreDiscardedPendingFinancialMessageMutation();
  const { data: resolved = [], isLoading: historyLoading } = useResolvedPendingFinancialMessages(householdId);
  const [tab, setTab] = useState<'review' | 'history'>('review');
  const [selected, setSelected] = useState<PendingFinancialMessage | null>(null);
  const [itemStates, setItemStates] = useState<Record<string, PendingItemState>>({});
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [credentials, setCredentials] = useState<MessageIngestionCredential[]>([]);
  const [generated, setGenerated] = useState<GeneratedConnection | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const previewMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview-pending') === '1';
  const pending = previewMode ? PREVIEW_PENDING_ITEMS : remotePending;
  const isLoading = previewMode ? false : remoteLoading;

  useEffect(() => {
    messageIngestionLib.listCredentials(householdId)
      .then(setCredentials)
      .catch(() => setCredentials([]));
  }, [householdId]);

  const availableCategories = useMemo(() => {
    if (!selected) return [];
    const expectedType = selected.kind === 'income' ? 'income' : 'expense';
    return categories.filter((category) => category.isActive && category.type === expectedType);
  }, [categories, selected]);

  const availableAccounts = useMemo(() => {
    if (!selected) return [];
    return accounts.filter((account) => account.isActive && account.currency === selected.currency);
  }, [accounts, selected]);

  const isCrossCurrency = !!selected?.destinationCurrency && selected.destinationCurrency !== selected.currency;
  const isHalfPending = !!selected?.transferLeg;

  const availableDestinationAccounts = useMemo(() => {
    if (!selected) return [];
    const targetCurrency = selected.destinationCurrency ?? selected.currency;
    return accounts.filter((account) => account.isActive && account.currency === targetCurrency && account.id !== accountId);
  }, [accounts, selected, accountId]);

  const openReview = (item: PendingFinancialMessage) => {
    if ((itemStates[item.id] ?? 'idle') !== 'idle') return;
    setSelected(item);
    setCategoryId('');
    setAccountId(item.suggestedAccountId ?? '');
    setDestinationAccountId(item.suggestedDestinationAccountId ?? '');
    setConfirmDiscard(false);
  };

  const closeReview = () => {
    if (approveMutation.isPending || discardMutation.isPending) return;
    setSelected(null);
    setConfirmDiscard(false);
  };

  const approve = async () => {
    if (!selected || !accountId || (selected.kind !== 'transfer' && !categoryId) || (selected.kind === 'transfer' && !destinationAccountId)) return;
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
        categoryId,
        accountId,
        destinationAccountId: selected.kind === 'transfer' ? destinationAccountId : undefined,
      });
      setItemStates((current) => ({ ...current, [pendingId]: 'settled' }));
      enqueueSnackbar('Transaction approved', { variant: 'success' });
      setSelected(null);
      setConfirmDiscard(false);
    } catch (error) {
      setItemStates((current) => ({ ...current, [pendingId]: 'idle' }));
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not approve this item', { variant: 'error' });
    }
  };

  const discard = async () => {
    if (!selected) return;
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    if (previewMode && selected.id.startsWith('preview-')) {
      enqueueSnackbar('Preview only — nothing was deleted', { variant: 'info' });
      setSelected(null);
      setConfirmDiscard(false);
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
            onClick={async () => {
              closeSnackbar(snackbarKey);
              try {
                await restoreMutation.mutateAsync({ householdId, pendingId: discardedItem.id });
                setItemStates((current) => ({ ...current, [discardedItem.id]: 'idle' }));
                enqueueSnackbar('Pending item restored', { variant: 'success' });
              } catch (error) {
                enqueueSnackbar(error instanceof Error ? error.message : 'Could not restore this item', { variant: 'error' });
              }
            }}
          >
            Undo
          </Button>
        ),
      });
      setSelected(null);
      setConfirmDiscard(false);
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

  const createConnection = async () => {
    setSetupBusy(true);
    try {
      const result = await messageIngestionLib.createCredential(householdId);
      setGenerated({ token: result.token, endpoint: result.endpoint });
      setCredentials(await messageIngestionLib.listCredentials(householdId));
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not create the connection', { variant: 'error' });
    } finally {
      setSetupBusy(false);
    }
  };

  const revokeConnection = async (credentialId: string) => {
    try {
      await messageIngestionLib.revokeCredential(credentialId);
      setCredentials(await messageIngestionLib.listCredentials(householdId));
      enqueueSnackbar('Connection revoked', { variant: 'info' });
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not revoke the connection', { variant: 'error' });
    }
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    enqueueSnackbar(`${label} copied`, { variant: 'success' });
  };

  const activeConnections = credentials.filter((credential) => credential.enabled).length;
  const selectedState = selected ? (itemStates[selected.id] ?? 'idle') : 'idle';
  const reviewBusy = selectedState === 'approving' || selectedState === 'discarding';

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Message activity"
        subtitle="Review detected bank activity and keep a complete resolution history."
        action={<Chip label={tab === 'review' ? `${pending.length} pending` : `${resolved.length} resolved`} color={tab === 'review' && pending.length ? 'secondary' : 'default'} />}
      />

      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          borderRadius: 'card',
          bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <KeyIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 750 }}>iPhone message connection</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {activeConnections ? `${activeConnections} active secure connection` : 'Connect the HSBC message automation securely'}
            </Typography>
          </Box>
        </Stack>
        <Button variant="outlined" onClick={() => setSetupOpen(true)}>
          {activeConnections ? 'Manage' : 'Connect'}
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, value: 'review' | 'history') => setTab(value)} variant="fullWidth">
        <Tab value="review" label="Review" />
        <Tab value="history" label="History" icon={<HistoryIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {tab === 'review' && (isLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2].map((item) => <Skeleton key={item} variant="rounded" height={76} />)}
        </Stack>
      ) : pending.length === 0 ? (
        <EmptyLayout
          icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
          title="Nothing waiting for you"
          description="Detected bank activity will appear here. No ledger entry is created until you approve it."
        />
      ) : (
        <Card sx={{ overflow: 'hidden', '&:hover': { transform: 'none' } }}>
          <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Detected activity</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>Tap an item to review it</Typography>
          </Box>
          <Divider />
          {pending.map((item, index) => (
            <Box key={item.id}>
              <Box
                component="button"
                type="button"
                onClick={() => openReview(item)}
                disabled={(itemStates[item.id] ?? 'idle') !== 'idle'}
                sx={{
                  width: '100%', minHeight: 72, px: { xs: 2, sm: 2.5 }, py: 1.25,
                  display: 'flex', alignItems: 'center', gap: 1.5, border: 0,
                  bgcolor: 'transparent', color: 'text.primary', textAlign: 'left', cursor: 'pointer',
                  opacity: (itemStates[item.id] ?? 'idle') === 'idle' ? 1 : 0.6,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {(itemStates[item.id] ?? 'idle') === 'idle'
                  ? <TransactionIcon type={item.kind} size={40} />
                  : <CircularProgress size={32} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 800, flex: 1 }}>{item.description}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      <Money amount={item.amount} code={item.currency} />
                    </Typography>
                  </Stack>
                  <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.25 }}>
                    {item.provider.toUpperCase()} · {item.kind} · {item.date}
                  </Typography>
                </Box>
              </Box>
              {index < pending.length - 1 && <Divider sx={{ ml: 8.5 }} />}
            </Box>
          ))}
        </Card>
      ))}

      {tab === 'history' && (historyLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2].map((item) => <Skeleton key={item} variant="rounded" height={76} />)}
        </Stack>
      ) : resolved.length === 0 ? (
        <EmptyLayout
          icon={<HistoryIcon sx={{ fontSize: 28 }} />}
          title="No review history yet"
          description="Approved and discarded message activity will appear here after you resolve it."
        />
      ) : (
        <Card sx={{ overflow: 'hidden', '&:hover': { transform: 'none' } }}>
          <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Resolved activity</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>The latest 100 reviewed messages</Typography>
          </Box>
          <Divider />
          {resolved.map((item, index) => {
            const restoring = restoreMutation.isPending && restoreMutation.variables?.pendingId === item.id;
            return (
              <Box key={item.id}>
                <Box sx={{ minHeight: 72, px: { xs: 2, sm: 2.5 }, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TransactionIcon type={item.snapshot.kind} size={40} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 800, flex: 1 }}>{item.snapshot.description}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        <Money amount={item.snapshot.amount} code={item.snapshot.currency} />
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                      <Chip
                        label={item.state === 'approved' ? 'Approved' : 'Discarded'}
                        color={item.state === 'approved' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                      <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                        {new Date(item.resolvedAt).toLocaleString()} · {item.resolvedByDisplayName}
                      </Typography>
                    </Stack>
                  </Box>
                  {item.state === 'discarded' && (
                    <Button size="small" variant="outlined" disabled={restoring} onClick={() => restoreDiscarded(item.id)}>
                      {restoring ? 'Restoring…' : 'Restore'}
                    </Button>
                  )}
                </Box>
                {index < resolved.length - 1 && <Divider sx={{ ml: 8.5 }} />}
              </Box>
            );
          })}
        </Card>
      ))}

      <Dialog open={!!selected && selected.kind !== 'transfer'} onClose={closeReview} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Review detected {selected?.kind}
          <Typography component="span" sx={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
            Nothing enters your ledger until you approve.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {selected && (
            <Stack spacing={2.5}>
              <Box>
                <Typography sx={{ fontSize: 34, lineHeight: 1.25, fontWeight: 800 }}>
                  <Money amount={selected.amount} code={selected.currency} maxDigits={2} />
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>{selected.description}</Typography>
              </Box>

              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Classification
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>
                  A category is required. This is never guessed from the message.
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="pending-category-label">Category</InputLabel>
                    <Select labelId="pending-category-label" value={categoryId} label="Category" onChange={(event) => setCategoryId(event.target.value)}>
                      {availableCategories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="pending-account-label">{selected.kind === 'income' ? 'To account' : 'From account'}</InputLabel>
                    <Select labelId="pending-account-label" value={accountId} label={selected.kind === 'income' ? 'To account' : 'From account'} onChange={(event) => setAccountId(event.target.value)}>
                      {availableAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Bank message
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>Sensitive balances and references are removed.</Typography>
                <Typography sx={{ p: 1.5, borderRadius: 'control', bgcolor: 'action.hover', fontSize: 12, lineHeight: 1.6, color: 'text.secondary' }}>
                  {selected.messagePreview}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" startIcon={selectedState === 'discarding' ? <CircularProgress size={18} /> : <DeleteIcon />} onClick={discard} disabled={reviewBusy}>
            {selectedState === 'discarding' ? 'Discarding…' : confirmDiscard ? 'Discard permanently' : 'Discard'}
          </Button>
          <Button
            variant="contained"
            sx={{ borderRadius: 12, boxShadow: 'none' }}
            startIcon={selectedState === 'approving' ? <CircularProgress color="inherit" size={18} /> : <CheckCircleIcon />}
            onClick={approve}
            disabled={!categoryId || !accountId || reviewBusy}
          >
            {selectedState === 'approving' ? 'Approving…' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selected && selected.kind === 'transfer'} onClose={closeReview} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Review transfer
          <Typography component="span" sx={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
            Nothing enters your ledger until you approve.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {selected && selected.kind === 'transfer' && (
            <Stack spacing={2.5}>
              <Box>
                {isCrossCurrency ? (
                  <Typography sx={{ fontSize: 26, lineHeight: 1.3, fontWeight: 800 }}>
                    <Money amount={selected.amount} code={selected.currency} maxDigits={2} />
                    <Box component="span" sx={{ color: 'text.secondary', mx: 1 }}>→</Box>
                    <Money amount={selected.destinationAmount ?? 0} code={selected.destinationCurrency ?? selected.currency} maxDigits={2} />
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: 34, lineHeight: 1.25, fontWeight: 800 }}>
                    <Money amount={selected.amount} code={selected.currency} maxDigits={2} />
                  </Typography>
                )}
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>{selected.description}</Typography>
                {isCrossCurrency && selected.destinationAmount && (
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
                    Rate: {(selected.destinationAmount / selected.amount).toFixed(2)} {selected.destinationCurrency}/{selected.currency}
                  </Typography>
                )}
                {isHalfPending && (
                  <Typography sx={{ fontSize: 11, color: 'warning.main', mt: 0.5 }}>
                    Waiting for the other leg of this transfer…
                  </Typography>
                )}
              </Box>

              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Accounts
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>
                  Confirm where the money moves.
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="pending-from-label">From account</InputLabel>
                    <Select labelId="pending-from-label" value={accountId} label="From account" onChange={(event) => setAccountId(event.target.value)}>
                      {availableAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="pending-to-label">To account</InputLabel>
                    <Select labelId="pending-to-label" value={destinationAccountId} label="To account" onChange={(event) => setDestinationAccountId(event.target.value)}>
                      {availableDestinationAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Bank message
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>Sensitive balances and references are removed.</Typography>
                <Typography sx={{ p: 1.5, borderRadius: 'control', bgcolor: 'action.hover', fontSize: 12, lineHeight: 1.6, color: 'text.secondary' }}>
                  {selected.messagePreview}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" startIcon={selectedState === 'discarding' ? <CircularProgress size={18} /> : <DeleteIcon />} onClick={discard} disabled={reviewBusy}>
            {selectedState === 'discarding' ? 'Discarding…' : confirmDiscard ? 'Discard permanently' : 'Discard'}
          </Button>
          <Button
            variant="contained"
            sx={{ borderRadius: 12, boxShadow: 'none' }}
            startIcon={selectedState === 'approving' ? <CircularProgress color="inherit" size={18} /> : <CheckCircleIcon />}
            onClick={approve}
            disabled={isHalfPending || !accountId || !destinationAccountId || reviewBusy}
          >
            {selectedState === 'approving' ? 'Approving…' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={setupOpen} onClose={() => !setupBusy && setSetupOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Connect iPhone messages
          <Typography component="span" sx={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
            Create a private, revocable connection for the Shortcut.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={2.5}>
            {credentials.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>Existing connections</Typography>
                <Divider sx={{ mt: 1, mb: 1.5 }} />
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>Active credentials the Shortcut can use to send messages.</Typography>
                <Stack spacing={1}>
                  {credentials.map((cred) => (
                    <Box key={cred.id} sx={{ p: 1.5, borderRadius: 'control', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <KeyIcon sx={{ fontSize: 18, color: cred.enabled ? 'primary.main' : 'text.disabled' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{cred.label}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                          {cred.lastUsedAt ? `Used ${new Date(cred.lastUsedAt).toLocaleDateString()}` : 'Never used'}
                        </Typography>
                      </Box>
                      <Chip label={cred.enabled ? 'Active' : 'Disabled'} size="small" color={cred.enabled ? 'success' : 'default'} variant="outlined" />
                      {cred.enabled && (
                        <IconButton aria-label={`Revoke ${cred.label}`} size="small" onClick={() => revokeConnection(cred.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>Connection</Typography>
              <Divider sx={{ mt: 1, mb: 1.5 }} />
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>The secret is shown once and never stored in readable form.</Typography>
              {generated ? (
                <Stack spacing={1.5}>
                  {[
                    ['Endpoint', generated.endpoint],
                    ['Bearer token', generated.token],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ p: 1.5, borderRadius: 'control', bgcolor: 'action.hover' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
                          <Typography noWrap sx={{ fontSize: 12, fontWeight: 700 }}>{value}</Typography>
                        </Box>
                        <IconButton aria-label={`Copy ${label}`} onClick={() => copy(value, label)}><ContentCopyIcon fontSize="small" /></IconButton>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Button variant="contained" sx={{ borderRadius: 12, boxShadow: 'none' }} onClick={createConnection} disabled={setupBusy}>
                  {setupBusy ? 'Creating…' : 'Create secure connection'}
                </Button>
              )}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>Shortcut request</Typography>
              <Divider sx={{ mt: 1, mb: 1.5 }} />
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>POST JSON using the endpoint and Bearer token above.</Typography>
              <Typography component="pre" sx={{ m: 0, p: 1.5, borderRadius: 'control', bgcolor: 'action.hover', fontSize: 11, whiteSpace: 'pre-wrap' }}>
                {'{\n  "message": "Shortcut Input",\n  "source": "ios-shortcut"\n}'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSetupOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
