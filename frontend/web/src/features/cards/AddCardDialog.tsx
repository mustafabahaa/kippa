import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  IconButton,
  Grid,
  Stack,
} from '@monochrome-ui/design-system';
import { ArrowBackIcon } from '@/components/AppIcon';
import { useAppContext } from '@/hooks/useAppContext';
import {
  useAccounts,
  useCreateDebitCardMutation,
  useCreateCreditCardMutation,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import type { Card, CardKind, CardNetwork } from '@kippa/domain';
import { getBank, getTier } from './banks/banks';
import { BankPicker } from './BankPicker';
import { CardTile } from './CardTile';
import { useAddCardForm } from './hooks/useAddCardForm';

export function AddCardDialog({
  open,
  preselectAccountId,
  onClose,
}: {
  open: boolean;
  preselectAccountId: string | null;
  onClose: () => void;
}) {
  return open ? (
    <AddCardDialogInner key={preselectAccountId ?? 'none'} preselectAccountId={preselectAccountId} onClose={onClose} />
  ) : null;
}

function AddCardDialogInner({
  preselectAccountId,
  onClose,
}: {
  preselectAccountId: string | null;
  onClose: () => void;
}) {
  const { householdId } = useAppContext();
  const { data: accounts = [] } = useAccounts(householdId);
  const createDebit = useCreateDebitCardMutation();
  const createCredit = useCreateCreditCardMutation();
  const baseCurrency = useHouseholdBaseCurrency();

  const preAcc = preselectAccountId ? accounts.find((a) => a.id === preselectAccountId) : undefined;
  const {
    bankId,
    creditLimit,
    currency,
    error,
    expiryMonth,
    expiryYear,
    kind,
    last4,
    name,
    network,
    parentAccountId,
    paymentAccountId,
    setBankId,
    setCreditLimit,
    setCurrency,
    setError,
    setExpiryMonth,
    setExpiryYear,
    setKind,
    setLast4,
    setName,
    setNetwork,
    setParentAccountId,
    setPaymentAccountId,
    setStep,
    setTierId,
    step,
    tierId,
  } = useAddCardForm(preAcc?.currency ?? baseCurrency, preselectAccountId ?? '');

  const depositAccounts = accounts.filter((a) => a.type === 'running' || a.type === 'savings');

  const bank = getBank(bankId);
  const bankTiers = bank?.tiers ?? [];
  const availableTiers = bankTiers.filter((t) => t.kinds.includes(kind));
  const isOtherBank = bankTiers.length === 0;
  const tier = getTier(bankId, tierId);
  const availableNetworks: CardNetwork[] = tier?.networks ?? ['visa', 'mastercard', 'meeza', 'other'];

  const previewCard = {
    id: 'preview',
    householdId: householdId ?? 'preview',
    kind,
    name: name.trim() || bank?.name || 'Card',
    last4: last4 || undefined,
    network,
    bankId,
    tierId: tierId || undefined,
    currency,
    isActive: true,
    createdAt: new Date().toISOString(),
    parentAccountId: kind === 'debit' ? parentAccountId : '',
    expiryMonth: expiryMonth || undefined,
    expiryYear: expiryYear || undefined,
    creditLimit: kind === 'credit' && creditLimit ? Number(creditLimit) : undefined,
  } as Card;

  const goBackToBank = () => {
    setStep('bank');
    setBankId('');
    setTierId('');
  };

  const handleKindChange = (next: CardKind) => {
    setKind(next);
    setTierId('');
    // clamp network against the (possibly reset) tier's networks
    const nextTier = tier;
    if (nextTier && !nextTier.networks.includes(network)) {
      setNetwork(nextTier.networks[0]);
    }
  };

  const handleTierChange = (nextTierId: string) => {
    setTierId(nextTierId);
    const nextTier = getTier(bankId, nextTierId);
    if (nextTier && !nextTier.networks.includes(network)) {
      setNetwork(nextTier.networks[0]);
    }
  };

  const handleSave = async () => {
    setError('');
    try {
      const base = {
        kind,
        name: name.trim(),
        last4: last4 || undefined,
        network,
        currency,
        isActive: true,
        bankId,
        tierId: tierId || undefined,
        expiryMonth: expiryMonth || undefined,
        expiryYear: expiryYear || undefined,
        parentAccountId: kind === 'debit' ? parentAccountId : '',
      } as any;
      if (kind === 'debit') {
        await createDebit.mutateAsync({ householdId, card: base, accounts });
      } else {
        if (creditLimit === '' || !paymentAccountId) throw new Error('Credit limit and payment account are required.');
        const nextOrder = accounts.length > 0 ? Math.max(...accounts.map((a) => a.sortOrder)) + 1 : 1;
        await createCredit.mutateAsync({
          householdId,
          card: { ...base, creditLimit: Number(creditLimit), paymentAccountId },
          accounts,
          sortOrder: nextOrder,
        });
      }
      onClose();
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  };

  const isBankStep = step === 'bank';

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {!isBankStep && (
          <IconButton size="small" onClick={goBackToBank}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        {isBankStep ? 'Add a card' : (bank?.name ?? 'Add a card')}
      </DialogTitle>
      <DialogContent>
        {isBankStep ? (
          <Box sx={{ mt: 1 }}>
            <BankPicker
              onPick={(id) => {
                setBankId(id);
                setStep('details');
              }}
            />
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ maxWidth: 340 }}>
              <CardTile card={previewCard} />
            </Box>

            <Box sx={{ height: 3 }} />

            <Grid container spacing={2.5}>
              {/* ── Section 1: Card Type ─────────────────────────────── */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="sectionTitle">Card type</Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={kind === 'debit' ? 'segmentedSelected' : 'segmented'}
                    onClick={() => handleKindChange('debit')}
                  >
                    Debit
                  </Button>
                  <Button
                    variant={kind === 'credit' ? 'segmentedSelected' : 'segmented'}
                    onClick={() => handleKindChange('credit')}
                  >
                    Credit
                  </Button>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                {isOtherBank ? (
                  <TextField
                    label="Tier"
                    value={tierId}
                    onChange={(e) => setTierId(e.target.value)}
                    placeholder="e.g. Platinum"
                    fullWidth
                  />
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>Tier</InputLabel>
                    <Select
                      size="medium"
                      value={tierId}
                      label="Tier"
                      onChange={(e) => handleTierChange(e.target.value as string)}
                    >
                      {availableTiers.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Network</InputLabel>
                  <Select
                    size="medium"
                    value={network}
                    label="Network"
                    onChange={(e) => setNetwork(e.target.value as CardNetwork)}
                  >
                    {availableNetworks.map((n) => (
                      <MenuItem key={n} value={n}>
                        {n.charAt(0).toUpperCase() + n.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ── Section 2: Card Details ──────────────────────────── */}
              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                <Typography variant="sectionTitle">Card details</Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField label="Card name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last 4 digits"
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.slice(0, 4))}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Expiry month"
                  type="number"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value ? Number(e.target.value) : '')}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Expiry year"
                  type="number"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value ? Number(e.target.value) : '')}
                  fullWidth
                />
              </Grid>

              {/* ── Section 3: Account ───────────────────────────────── */}
              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                <Typography variant="sectionTitle">
                  {kind === 'debit' ? 'Linked Account' : 'Payment & Limit'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: kind === 'credit' ? 6 : 12 }}>
                <FormControl fullWidth>
                  <InputLabel>{kind === 'debit' ? 'Draws from account' : 'Payment account'}</InputLabel>
                  <Select
                    size="medium"
                    value={kind === 'debit' ? parentAccountId : paymentAccountId}
                    label={kind === 'debit' ? 'Draws from account' : 'Payment account'}
                    onChange={(e) => {
                      const id = e.target.value as string;
                      const acc = accounts.find((a) => a.id === id);
                      if (kind === 'debit') setParentAccountId(id);
                      else setPaymentAccountId(id);
                      if (acc) setCurrency(acc.currency);
                    }}
                  >
                    {depositAccounts.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {kind === 'credit' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Credit limit"
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value ? Number(e.target.value) : '')}
                    fullWidth
                  />
                </Grid>
              )}

              {error && (
                <Grid size={{ xs: 12 }}>
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {!isBankStep && (
          <Button
            variant="primaryAction"
            onClick={handleSave}
            disabled={!name.trim() || (kind === 'debit' ? !parentAccountId : !paymentAccountId)}
            loading={createDebit.isPending || createCredit.isPending}
          >
            Save card
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
