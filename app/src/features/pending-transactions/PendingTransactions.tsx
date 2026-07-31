import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  Chip,
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
  Typography,
  alpha,
} from '@mui/material';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { TransactionIcon } from '@/features/transactions/components/TransactionIcon';
import { Money } from '@/components/Money';
import { CheckCircleIcon, ContentCopyIcon, DeleteIcon, KeyIcon } from '@/components/AppIcon';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useAccounts,
  useApprovePendingFinancialMessageMutation,
  useCategories,
  useDiscardPendingFinancialMessageMutation,
  usePendingFinancialMessages,
} from '@/hooks/useFinance';
import { messageIngestionLib } from '@/libs/messageIngestion';
import type { MessageIngestionCredential, PendingFinancialMessage } from '@/domain/financeTypes';

type GeneratedConnection = { token: string; endpoint: string };

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
  const { enqueueSnackbar } = useSnackbar();
  const { data: remotePending = [], isLoading: remoteLoading } = usePendingFinancialMessages(householdId);
  const { data: accounts = [] } = useAccounts(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const approveMutation = useApprovePendingFinancialMessageMutation();
  const discardMutation = useDiscardPendingFinancialMessageMutation();
  const [selected, setSelected] = useState<PendingFinancialMessage | null>(null);
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

  const openReview = (item: PendingFinancialMessage) => {
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
    if (!selected || !categoryId || !accountId || (selected.kind === 'transfer' && !destinationAccountId)) return;
    if (previewMode && selected.id.startsWith('preview-')) {
      enqueueSnackbar('Preview only — no transaction was created', { variant: 'success' });
      setSelected(null);
      return;
    }
    try {
      await approveMutation.mutateAsync({
        householdId,
        pendingId: selected.id,
        categoryId,
        accountId,
        destinationAccountId: selected.kind === 'transfer' ? destinationAccountId : undefined,
      });
      setSelected(null);
      setConfirmDiscard(false);
    } catch (error) {
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
    try {
      await discardMutation.mutateAsync({ householdId, pendingId: selected.id });
      enqueueSnackbar('Pending item discarded', { variant: 'success' });
      setSelected(null);
      setConfirmDiscard(false);
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Could not discard this item', { variant: 'error' });
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

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Pending review"
        subtitle="Approve detected bank activity only after confirming its category and account."
        action={<Chip label={`${pending.length} pending`} color={pending.length ? 'secondary' : 'default'} />}
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

      {isLoading ? (
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
                sx={{
                  width: '100%', minHeight: 72, px: { xs: 2, sm: 2.5 }, py: 1.25,
                  display: 'flex', alignItems: 'center', gap: 1.5, border: 0,
                  bgcolor: 'transparent', color: 'text.primary', textAlign: 'left', cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <TransactionIcon type={item.kind} size={40} />
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
      )}

      <Dialog open={!!selected} onClose={closeReview} fullWidth maxWidth="xs">
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
                  <Money amount={selected.amount} code={selected.currency} />
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
                  {selected.kind === 'transfer' && (
                    <FormControl fullWidth>
                      <InputLabel id="pending-destination-label">To account</InputLabel>
                      <Select labelId="pending-destination-label" value={destinationAccountId} label="To account" onChange={(event) => setDestinationAccountId(event.target.value)}>
                        {availableAccounts.filter((account) => account.id !== accountId).map((account) => <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
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
          <Button color="inherit" startIcon={<DeleteIcon />} onClick={discard} disabled={discardMutation.isPending}>
            {confirmDiscard ? 'Discard permanently' : 'Discard'}
          </Button>
          <Button
            variant="contained"
            sx={{ borderRadius: 12, boxShadow: 'none' }}
            startIcon={<CheckCircleIcon />}
            onClick={approve}
            disabled={!categoryId || !accountId || (selected?.kind === 'transfer' && !destinationAccountId) || approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Approving…' : 'Approve'}
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
