import { AccountBalanceIcon, CreditCardIcon, PaymentsIcon, SavingsIcon } from '@/components/AppIcon';

import { useState } from 'react';
import { Box, Card, CardContent, Chip, Divider, Paper, Skeleton, Stack, Typography } from '@monochrome-ui/design-system';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCards,
  useDisplayRates,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { CardTile, CardDetail } from '@/features/cards';
import { computeCardSummary } from '@/libs/cardSelectors';
import { Money } from '@/components/Money';
import type { Card as CardType } from '@kippa/domain';
import { ForeignBalanceTooltip } from '@/features/shared/components/ForeignBalanceTooltip';
import { calculateAccountBalances } from '@/libs/financeCalculations';
import { DashboardSectionHeading } from './DashboardSectionHeading';

export function MyAccountsSection() {
  const { householdId } = useAppContext();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: cards = [] } = useCards(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCurrencies = Array.from(
    new Set((accounts ?? []).map((account) => account.currency).filter((currency) => currency !== baseCurrency)),
  );
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCurrencies);
  const [detailCard, setDetailCard] = useState<CardType | null>(null);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <SavingsIcon size={22} strokeWidth={1.8} />;
      case 'cash':
      case 'wallet':
        return <PaymentsIcon size={22} strokeWidth={1.8} />;
      case 'credit':
        return <CreditCardIcon size={22} strokeWidth={1.8} />;
      case 'running':
      default:
        return <AccountBalanceIcon size={22} strokeWidth={1.8} />;
    }
  };

  const isLoading = accountsLoading || txsLoading || linesLoading;

  if (isLoading || !accounts || !transactions || !ledgerLines) {
    return (
      <Box>
        <Skeleton variant="text" width="30%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {[1, 2].map((i) => (
            <Card key={i} variant="dashboardSection">
              <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '60%' }}>
                  <Skeleton variant="circular" width={40} height={40} animation="wave" />
                  <Box sx={{ width: '70%' }}>
                    <Skeleton variant="text" width="80%" height={20} animation="wave" />
                    <Skeleton variant="text" width="60%" height={16} animation="wave" />
                  </Box>
                </Stack>
                <Skeleton variant="text" width="20%" height={20} animation="wave" />
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  }

  const balancesMap = calculateAccountBalances(accounts, transactions, ledgerLines);

  // Credit accounts are debt buckets — hide from the accounts list.
  const visibleAccounts = accounts.filter((a) => a.type !== 'credit');

  const summaryFor = (card: CardType) => {
    const creditBalance = balancesMap[card.parentAccountId] ?? 0;
    return computeCardSummary(card, creditBalance, null);
  };

  return (
    <>
      <Card variant="dashboardSection">
        <CardContent>
          <Stack spacing={2.5}>
            <DashboardSectionHeading
              icon={<AccountBalanceIcon size={22} strokeWidth={1.8} />}
              title="My Accounts"
              subtitle="Cash, banks and linked cards"
              trailing={<Chip label={`${visibleAccounts.length} accounts`} />}
            />

            {visibleAccounts.length === 0 ? (
              <EmptyLayout title="No accounts yet" description="Add an account to start tracking your balances." />
            ) : (
              <Stack divider={<Divider />}>
                {visibleAccounts.map((acc) => {
                  const bal = balancesMap[acc.id] || 0;
                  const linked = cards.filter((c) => c.parentAccountId === acc.id || c.paymentAccountId === acc.id);
                  return (
                    <Box key={acc.id}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ minHeight: 72, py: 1.5 }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <Paper variant="iconBadge">{getAccountIcon(acc.type)}</Paper>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap variant="accountName" color="text.primary">
                              {acc.name}
                            </Typography>
                            <Typography variant="accountType" color="text.secondary">
                              {acc.type}
                            </Typography>
                          </Box>
                        </Stack>
                        <ForeignBalanceTooltip
                          amount={bal}
                          currency={acc.currency}
                          baseCurrency={baseCurrency}
                          rate={displayRates[acc.currency]}
                        >
                          <Typography
                            noWrap
                            tabIndex={acc.currency === baseCurrency ? undefined : 0}
                            variant="accountBalance"
                            color={bal < 0 ? 'error.main' : 'text.primary'}
                            sx={{ textAlign: 'right', cursor: acc.currency === baseCurrency ? 'default' : 'help' }}
                          >
                            <Money amount={bal} code={acc.currency} maxDigits={2} />
                          </Typography>
                        </ForeignBalanceTooltip>
                      </Stack>

                      {linked.length > 0 && (
                        <Box sx={{ pb: 2 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                            {linked.map((card) => (
                              <CardTile
                                key={card.id}
                                card={card}
                                summary={summaryFor(card)}
                                parentAccountBalance={balancesMap[card.parentAccountId]}
                                onOpenDetail={() => setDetailCard(card)}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {detailCard && <CardDetail card={detailCard} onClose={() => setDetailCard(null)} />}
    </>
  );
}
