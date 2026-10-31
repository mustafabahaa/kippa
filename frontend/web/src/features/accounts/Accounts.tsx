import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Divider, IconButton, Paper, Skeleton, Stack, Typography } from '@mui/material';
import type { Account, AccountType, CurrencyCode, Card as CardType } from '@kippa/domain';
import {
  useAccounts,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useCards,
  useUpdateCardMutation,
  useLedgerLines,
  useTransactions,
  useCardStatements,
  useDisplayRates,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { CardTile } from '@/features/cards/CardTile';
import { AddCardDialog } from '@/features/cards/AddCardDialog';
import { CardDetail } from '@/features/cards/CardDetail';
import { calculateAccountBalance } from '@/libs/financeCalculations';
import { computeCardSummary } from '@/libs/cardSelectors';
import { Money } from '@/components/Money';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { ForeignBalanceTooltip } from '@/features/shared/components/ForeignBalanceTooltip';
import { PageHeader } from '@/features/shared/components/PageHeader';
import { SectionHeading } from '@/features/shared/components/SectionHeading';
import {
  AccountBalanceIcon,
  AddIcon,
  CreditCardIcon,
  EditIcon,
  PaymentsIcon,
  ReceiptLongIcon,
  SavingsIcon,
} from '@/components/AppIcon';
import { AddAccountDialog, EditAccountDialog } from './components/AccountForms';

const sectionIndent = { xs: 0, md: 4 } as const;
const contentIndent = { xs: 0, md: 4 } as const;

const accountTypeLabel = (type: AccountType) =>
  type === 'running' ? 'Running bank' : type === 'savings' ? 'Savings bank' : type === 'cash' ? 'Cash' : 'Wallet';

export function Accounts() {
  const navigate = useNavigate();
  const { householdId } = useAppContext();
  const baseCurrency = useHouseholdBaseCurrency();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  const [addCardForAccount, setAddCardForAccount] = useState<string | null>(null);
  const [detailCard, setDetailCard] = useState<CardType | null>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(householdId);
  const { data: cards = [], isLoading: cardsLoading } = useCards(householdId);
  const { data: ledgerLines = [], isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(householdId);
  const { data: statements = [] } = useCardStatements(householdId);
  const foreignCurrencies = Array.from(
    new Set(accounts.map((account) => account.currency).filter((currency) => currency !== baseCurrency)),
  );
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCurrencies);
  const createAccountMutation = useCreateAccountMutation();
  const updateAccountMutation = useUpdateAccountMutation();
  const updateCard = useUpdateCardMutation();

  const accountBalance = (accountId: string) => calculateAccountBalance(accountId, transactions, ledgerLines);

  const summaryFor = (card: CardType) => {
    const creditBalance = accountBalance(card.parentAccountId);
    const cardStmts = statements.filter((statement) => statement.cardId === card.id);
    return computeCardSummary(card, creditBalance, cardStmts[0] ?? null);
  };

  const handleUpdateAccount = async (updated: Account) => {
    if (!editingAccount) return;
    await updateAccountMutation.mutateAsync({ householdId, accountId: editingAccount.id, updated });
    setEditingAccount(null);
  };

  const handleCreateAccount = async (draft: { name: string; type: AccountType; currency: CurrencyCode }) => {
    const nextOrder = accounts.length > 0 ? Math.max(...accounts.map((account) => account.sortOrder)) + 1 : 1;
    await createAccountMutation.mutateAsync({
      householdId,
      account: { ...draft, isActive: true, sortOrder: nextOrder },
    });
    setAddAccountOpen(false);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <SavingsIcon variant="Linear" />;
      case 'cash':
      case 'wallet':
        return <PaymentsIcon variant="Linear" />;
      case 'credit':
        return <CreditCardIcon variant="Linear" />;
      case 'running':
      default:
        return <AccountBalanceIcon variant="Linear" />;
    }
  };

  const visibleAccounts = accounts.filter((account) => account.type !== 'credit');
  const isLoading = accountsLoading || cardsLoading || linesLoading || transactionsLoading;

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <PageHeader
        title="Accounts"
        subtitle="Balances, statements, and payment cards for your household."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon variant="Linear" fontSize="small" />}
            onClick={() => setAddAccountOpen(true)}
          >
            Add account
          </Button>
        }
      />

      <Box component="section" sx={{ px: sectionIndent }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <SectionHeading
            icon={<AccountBalanceIcon variant="Linear" />}
            title="Your accounts"
            subtitle="Balances and cards connected to each account."
            trailing={
              isLoading ? (
                <Skeleton variant="rounded" width={92} height={28} />
              ) : (
                <Chip
                  size="small"
                  label={`${visibleAccounts.length} ${visibleAccounts.length === 1 ? 'account' : 'accounts'}`}
                />
              )
            }
          />

          <Box sx={{ px: contentIndent }}>
            <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', minWidth: 0 }}>
              {isLoading ? (
                <Stack divider={<Divider flexItem />}>
                  {[1, 2].map((item) => (
                    <Stack key={item} spacing={2} sx={{ py: 2.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '55%' }}>
                          <Skeleton variant="rounded" width={44} height={44} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="45%" height={24} />
                            <Skeleton variant="text" width="32%" height={18} />
                          </Box>
                        </Stack>
                        <Skeleton variant="text" width={150} height={30} />
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <Skeleton variant="rounded" width={300} height={200} />
                        <Skeleton variant="rounded" width={300} height={200} />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              ) : visibleAccounts.length === 0 ? (
                <EmptyLayout
                  icon={<AccountBalanceIcon variant="Linear" />}
                  title="No accounts yet"
                  description="Create your first account to begin tracking balances and cards."
                  action={
                    <Button
                      variant="contained"
                      startIcon={<AddIcon variant="Linear" fontSize="small" />}
                      onClick={() => setAddAccountOpen(true)}
                    >
                      Add account
                    </Button>
                  }
                />
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {visibleAccounts.map((account) => {
                    const balance = accountBalance(account.id);
                    const linkedCards = cards.filter(
                      (card) => card.parentAccountId === account.id || card.paymentAccountId === account.id,
                    );
                    const canHoldCard = account.type === 'running' || account.type === 'savings';

                    return (
                      <Box key={account.id} sx={{ py: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
                        <Stack spacing={{ xs: 1.5, sm: 2 }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            justifyContent="space-between"
                            spacing={{ xs: 1.5, sm: 2 }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                              <Paper variant="iconBadge">{getAccountIcon(account.type)}</Paper>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="sectionTitle" noWrap>
                                  {account.name}
                                </Typography>
                                <Typography variant="sectionSubtitle" color="text.secondary">
                                  {accountTypeLabel(account.type)} · {account.currency}
                                  {!account.isActive ? ' · Inactive' : ''}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                              spacing={{ xs: 1, sm: 2 }}
                              sx={{ pl: { xs: 7, sm: 0 }, minWidth: 0 }}
                            >
                              <ForeignBalanceTooltip
                                amount={balance}
                                currency={account.currency}
                                baseCurrency={baseCurrency}
                                rate={displayRates[account.currency]}
                              >
                                <Typography
                                  variant="loanMetric"
                                  color={balance < 0 ? 'error.main' : 'text.primary'}
                                  noWrap
                                  tabIndex={account.currency === baseCurrency ? undefined : 0}
                                  sx={{ cursor: account.currency === baseCurrency ? 'default' : 'help' }}
                                >
                                  <Money amount={balance} code={account.currency} maxDigits={2} />
                                </Typography>
                              </ForeignBalanceTooltip>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Button
                                  size="small"
                                  startIcon={<ReceiptLongIcon variant="Linear" fontSize="small" />}
                                  onClick={() =>
                                    navigate(`/accounts/statements?account=${encodeURIComponent(account.id)}`)
                                  }
                                >
                                  Statement
                                </Button>
                                <IconButton
                                  aria-label={`Edit ${account.name}`}
                                  onClick={() => setEditingAccount(account)}
                                >
                                  <EditIcon variant="Linear" fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </Stack>

                          {canHoldCard && (
                            <Box sx={{ pl: { xs: 0, sm: 7.5 } }}>
                              {linkedCards.length > 0 && (
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                      xs: 'minmax(0, 1fr)',
                                      sm: 'repeat(auto-fit, minmax(min(100%, 280px), 340px))',
                                    },
                                    gap: 2,
                                  }}
                                >
                                  {linkedCards.map((card) => (
                                    <CardTile
                                      key={card.id}
                                      card={card}
                                      summary={summaryFor(card)}
                                      parentAccountBalance={accountBalance(card.parentAccountId)}
                                      onFreeze={() =>
                                        updateCard.mutate({
                                          householdId,
                                          cardId: card.id,
                                          updates: { isActive: !card.isActive },
                                          accounts,
                                        })
                                      }
                                      onOpenDetail={() => setDetailCard(card)}
                                    />
                                  ))}
                                </Box>
                              )}
                              <Button
                                size="small"
                                startIcon={<AddIcon variant="Linear" fontSize="small" />}
                                onClick={() => setAddCardForAccount(account.id)}
                                sx={{ mt: linkedCards.length > 0 ? 1.5 : 0 }}
                              >
                                {linkedCards.length > 0 ? 'Add another card' : 'Add card'}
                              </Button>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>

      <AddAccountDialog
        open={addAccountOpen}
        baseCurrency={baseCurrency}
        busy={createAccountMutation.isPending}
        onClose={() => setAddAccountOpen(false)}
        onCreate={handleCreateAccount}
      />
      <AddCardDialog
        open={addCardForAccount !== null}
        preselectAccountId={addCardForAccount}
        onClose={() => setAddCardForAccount(null)}
      />
      {detailCard && <CardDetail card={detailCard} onClose={() => setDetailCard(null)} />}
      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          busy={updateAccountMutation.isPending}
          onClose={() => setEditingAccount(null)}
          onSave={handleUpdateAccount}
        />
      )}
    </Stack>
  );
}
