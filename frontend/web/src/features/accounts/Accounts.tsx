import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControlLabel,
  Checkbox,
  Skeleton,
  Chip
} from '@mui/material';
import { AccountBalanceIcon } from '@/components/AppIcon';
import { SavingsIcon } from '@/components/AppIcon';
import { PaymentsIcon } from '@/components/AppIcon';
import { CreditCardIcon } from '@/components/AppIcon';
import { EditIcon } from '@/components/AppIcon';
import { AddIcon } from '@/components/AppIcon';
import {
  useAccounts,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useCards,
  useUpdateCardMutation,
  useLedgerLines,
  useTransactions,
  useCardStatements,
} from '@/hooks/useFinance';
import { Account, AccountType, CurrencyCode, Card as CardType } from '@kippa/domain';
import { useAppContext } from '@/hooks/useAppContext';
import { CardTile } from '@/features/cards/CardTile';
import { AddCardDialog } from '@/features/cards/AddCardDialog';
import { CardDetail } from '@/features/cards/CardDetail';
import { computeCardSummary } from '@/libs/cardSelectors';
import { CurrencySelect } from '@/features/shared/components/CurrencySelect';
import { useHouseholdBaseCurrency } from '@/hooks/useFinance';
import { Money } from '@/components/Money';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';

export function Accounts() {
  const { householdId } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('running');
  const [newAccCurrency, setNewAccCurrency] = useState<CurrencyCode>(baseCurrency);

  // Edit Account State
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccType, setEditAccType] = useState<AccountType>('running');
  const [editAccCurrency, setEditAccCurrency] = useState<CurrencyCode>(baseCurrency);
  const [editAccIsActive, setEditAccIsActive] = useState(true);

  // Card UI state
  const [addCardForAccount, setAddCardForAccount] = useState<string | null>(null);
  const [detailCard, setDetailCard] = useState<CardType | null>(null);

  // Queries & Mutations
  const { data: accounts = [], isLoading } = useAccounts(householdId);
  const { data: cards = [] } = useCards(householdId);
  const { data: ledgerLines = [] } = useLedgerLines(householdId);
  const { data: transactions = [] } = useTransactions(householdId);
  const { data: statements = [] } = useCardStatements(householdId);
  const createAccountMutation = useCreateAccountMutation();
  const updateAccountMutation = useUpdateAccountMutation();
  const updateCard = useUpdateCardMutation();

  // Balance of an account from the ledger.
  const accountBalance = (accountId: string) => {
    const postedTxIds = new Set(transactions.filter(t => t.status === 'posted').map(t => t.id));
    return ledgerLines
      .filter(l => l.accountId === accountId && postedTxIds.has(l.transactionId))
      .reduce((s, l) => s + l.signedAmount, 0);
  };

  // Compute the summary for a credit card from ledger + statements.
  const summaryFor = (card: CardType) => {
    const creditBalance = accountBalance(card.parentAccountId);
    const cardStmts = statements.filter(s => s.cardId === card.id);
    const last = cardStmts[0] ?? null;
    return computeCardSummary(card, creditBalance, last, cardStmts);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccType(acc.type);
    setEditAccCurrency(acc.currency);
    setEditAccIsActive(acc.isActive);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !editAccName.trim()) return;

    const updated: Account = {
      ...editingAccount,
      name: editAccName,
      type: editAccType,
      currency: editAccCurrency,
      isActive: editAccIsActive
    };

    await updateAccountMutation.mutateAsync({
      householdId,
      accountId: editingAccount.id,
      updated
    });
    setEditingAccount(null);
  };

  const handleCreateAccount = async () => {
    if (!newAccName.trim()) return;

    const nextOrder = accounts.length > 0 ? Math.max(...accounts.map(a => a.sortOrder)) + 1 : 1;

    await createAccountMutation.mutateAsync({
      householdId,
      account: {
        name: newAccName,
        type: newAccType,
        currency: newAccCurrency,
        isActive: true,
        sortOrder: nextOrder
      }
    });

    setNewAccName('');
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'savings': return <SavingsIcon sx={{ color: 'text.secondary' }} />;
      case 'cash':
      case 'wallet': return <PaymentsIcon sx={{ color: 'text.secondary' }} />;
      case 'credit': return <CreditCardIcon sx={{ color: 'text.secondary' }} />;
      case 'running':
      default: return <AccountBalanceIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  // Credit accounts are debt buckets owned by their cards — hide them from the
  // accounts list (you never transact with them directly outside card flows).
  const visibleAccounts = accounts.filter(a => a.type !== 'credit');

  return (
    <Box sx={{ py: 0.5 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} flexWrap="wrap" useFlexGap>
          <Box>
            <Typography variant="h2" sx={{ fontSize: 24, fontWeight: 800, color: 'text.primary' }}>
              Accounts & Cards
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13, mt: 0.5 }}>
              Manage accounts, cash, wallets and cards
            </Typography>
          </Box>
          {!isLoading && (
            <Chip
              label={`${visibleAccounts.length} ${visibleAccounts.length === 1 ? 'account' : 'accounts'} connected`}
              sx={{ bgcolor: 'action.hover', color: 'primary.main' }}
            />
          )}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 7fr) minmax(280px, 3fr)' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          {/* Accounts List — cards nested inside their account */}
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            {isLoading ? (
              [1, 2].map(i => (
                <Skeleton key={i} variant="rectangular" width="100%" height={160} sx={{ borderRadius: '20px' }} animation="wave" />
              ))
            ) : visibleAccounts.length === 0 ? (
              <EmptyLayout
                icon={<AccountBalanceIcon sx={{ fontSize: 28 }} />}
                title="No accounts yet"
                description="Create your first account to begin tracking balances and cards."
              />
            ) : (
              visibleAccounts.map(acc => {
                const bal = accountBalance(acc.id);
                const linked = cards.filter(c => c.parentAccountId === acc.id || c.paymentAccountId === acc.id);
                const canHoldCard = acc.type === 'running' || acc.type === 'savings';
                return (
                  <Card key={acc.id} sx={{ overflow: 'hidden' }}>
                    <CardContent>
                      <Stack spacing={2.5}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {getAccountIcon(acc.type)}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography noWrap sx={{ fontSize: 16, lineHeight: '22px', fontWeight: 800, color: 'text.primary' }}>{acc.name}</Typography>
                              <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                                {acc.type.toUpperCase()} • {acc.currency}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography sx={{ fontSize: 14, fontWeight: 800, color: 'text.primary', whiteSpace: 'nowrap' }}>
                              <Money amount={bal} code={acc.currency} maxDigits={2} />
                            </Typography>
                            <IconButton aria-label={`Edit ${acc.name}`} onClick={() => handleOpenEdit(acc)}>
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>
                        </Stack>

                        {canHoldCard && (
                          <Box>
                            {linked.length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                                {linked.map(card => (
                                  <CardTile
                                    key={card.id}
                                    card={card}
                                    summary={summaryFor(card)}
                                    parentAccountBalance={accountBalance(card.parentAccountId)}
                                    onFreeze={() => updateCard.mutate({
                                      householdId, cardId: card.id,
                                      updates: { isActive: !card.isActive }, accounts,
                                    })}
                                    onOpenDetail={() => setDetailCard(card)}
                                  />
                                ))}
                              </Box>
                            )}
                            <Button startIcon={<AddIcon />} onClick={() => setAddCardForAccount(acc.id)} sx={{ color: 'text.secondary' }}>
                              {linked.length > 0 ? 'Add another card' : 'Add card'}
                            </Button>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Stack>

          {/* Add Account Card */}
          <Card sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ fontSize: 16, lineHeight: '22px', fontWeight: 800, color: 'text.primary' }}>Add new account</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'text.secondary' }}>
                    Connect cash, a wallet, or a bank balance.
                  </Typography>
                </Box>

                <Stack spacing={2}>
              <TextField
                fullWidth
                label="Account Name"
                placeholder="e.g. My Bank"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel id="acc-type-label">Account Type</InputLabel>
                <Select
                  labelId="acc-type-label"
                  value={newAccType}
                  label="Account Type"
                  onChange={e => setNewAccType(e.target.value as AccountType)}
                >
                  <MenuItem value="running">Running Bank</MenuItem>
                  <MenuItem value="savings">Savings Bank</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="wallet">Wallet</MenuItem>
                </Select>
              </FormControl>
              <CurrencySelect
                labelId="acc-currency-label"
                value={newAccCurrency}
                onChange={setNewAccCurrency}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreateAccount}
                loading={createAccountMutation.isPending}
              >
                Create Account
              </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Card dialogs */}
      <AddCardDialog
        open={addCardForAccount !== null}
        preselectAccountId={addCardForAccount}
        onClose={() => setAddCardForAccount(null)}
      />
      {detailCard && <CardDetail card={detailCard} onClose={() => setDetailCard(null)} />}

      {/* Edit Account Dialog */}
      <Dialog open={Boolean(editingAccount)} onClose={() => setEditingAccount(null)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Account</DialogTitle>
        <DialogContent sx={{ minWidth: 280, pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Account Name"
              value={editAccName}
              onChange={e => setEditAccName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-acc-type-label">Account Type</InputLabel>
              <Select
                labelId="edit-acc-type-label"
                value={editAccType}
                label="Account Type"
                onChange={e => setEditAccType(e.target.value as AccountType)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="running">Running Bank</MenuItem>
                <MenuItem value="savings">Savings Bank</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="wallet">Wallet</MenuItem>
              </Select>
            </FormControl>
            <CurrencySelect
              labelId="edit-acc-currency-label"
              value={editAccCurrency}
              onChange={setEditAccCurrency}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editAccIsActive}
                  onChange={e => setEditAccIsActive(e.target.checked)}
                />
              }
              label="Account is Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditingAccount(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleUpdateAccount} variant="contained" loading={updateAccountMutation.isPending} sx={{ borderRadius: '12px', boxShadow: 'none' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
