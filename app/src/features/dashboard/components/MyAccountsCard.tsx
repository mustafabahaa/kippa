import { useState } from 'react';
import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCards,
} from '@/hooks/useFinance';
import { useAppContext } from '@/hooks/useAppContext';
import { CardTile } from '@/features/cards/CardTile';
import { CardDetail } from '@/features/cards/CardDetail';
import { computeCardSummary } from '@/libs/cardSelectors';
import type { Card as CardType } from '@/domain/financeTypes';

export function MyAccountsCard() {
  const { householdId } = useAppContext();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: cards = [] } = useCards(householdId);
  const [detailCard, setDetailCard] = useState<CardType | null>(null);

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

  const isLoading = accountsLoading || txsLoading || linesLoading;

  if (isLoading || !accounts || !transactions || !ledgerLines) {
    return (
      <Box>
        <Skeleton variant="text" width="30%" height={24} animation="wave" sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {[1, 2].map(i => (
            <Card key={i} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
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

  // Calculate balances.
  const activeTxIds = new Set(transactions.filter(t => t.status === 'posted').map(t => t.id));
  const activeLines = ledgerLines.filter(line => activeTxIds.has(line.transactionId));
  const balancesMap: Record<string, number> = {};
  accounts.forEach(acc => { balancesMap[acc.id] = 0; });
  activeLines.forEach(line => {
    if (balancesMap[line.accountId] !== undefined) {
      balancesMap[line.accountId] += line.signedAmount;
    }
  });

  // Credit accounts are debt buckets — hide from the accounts list.
  const visibleAccounts = accounts.filter(a => a.type !== 'credit');

  const summaryFor = (card: CardType) => {
    const creditBalance = balancesMap[card.parentAccountId] ?? 0;
    return computeCardSummary(card, creditBalance, null, []);
  };

  return (
    <Stack spacing={1.5}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
          My Accounts
        </Typography>
      </Box>

      <Stack spacing={1}>
        {visibleAccounts.map(acc => {
          const bal = balancesMap[acc.id] || 0;
          const linked = cards.filter(c =>
            c.parentAccountId === acc.id || c.paymentAccountId === acc.id);
          return (
            <Box key={acc.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', bgcolor: 'background.paper', overflow: 'hidden' }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getAccountIcon(acc.type)}
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{acc.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>{acc.type}</Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: acc.currency === 'USD' ? 'primary.main' : 'text.primary' }}>
                  {acc.currency === 'USD' ? '$' : ''}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {acc.currency !== 'USD' ? acc.currency : ''}
                </Typography>
              </Box>

              {linked.length > 0 && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {linked.map(card => (
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

      {detailCard && <CardDetail card={detailCard} onClose={() => setDetailCard(null)} />}
    </Stack>
  );
}
