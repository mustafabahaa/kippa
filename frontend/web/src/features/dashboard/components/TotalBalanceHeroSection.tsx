import { AccountBalanceIcon } from '@/components/AppIcon';

import { Box, Card, CardContent, Chip, Paper, Skeleton, Stack, Typography } from '@monochrome-ui/design-system';
import {
  useAccounts,
  useLedgerSnapshot,
  useDisplayRates,
  useHouseholdBaseCurrency,
} from '@/hooks/useFinance';
import { convertToBaseCurrency } from '@/libs/financeCalculations';
import { EmptyLayout } from '@/features/shared/components/EmptyLayout';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import { InfoTooltip } from '@/features/shared/components/InfoTooltip';
import { metricExplanations } from '@/features/shared/constants/metricExplanations';
import { ForeignBalanceTooltip } from '@/features/shared/components/ForeignBalanceTooltip';
import { DashboardSectionHeading } from './DashboardSectionHeading';

export function TotalBalanceHeroSection() {
  const { householdId } = useAppContext();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId);
  const snapshot = useLedgerSnapshot(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCodes = Array.from(new Set((accounts ?? []).map((a) => a.currency).filter((c) => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);

  if (snapshot.isError) return <EmptyLayout title="Could not load balances" />;
  if (accountsLoading || !accounts || !snapshot.data) {
    return (
      <Card variant="sectionSurface">
        <CardContent>
          <Box>
            <Skeleton variant="text" width="50%" height={24} animation="wave" />
            <Skeleton variant="text" width="80%" height={48} animation="wave" sx={{ mt: 1 }} />
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Skeleton variant="rounded" width="30%" height={28} animation="wave" />
            <Skeleton variant="rounded" width="30%" height={28} animation="wave" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const { balances } = snapshot.data;
  const balanceFor = (accountId: string) => balances[accountId] ?? 0;
  const total = accounts.reduce((sum, account) =>
    sum + convertToBaseCurrency(balanceFor(account.id), account.currency, baseCurrency, displayRates), 0);

  return (
    <Card variant="sectionSurface">
      <CardContent>
        <Stack>
          <DashboardSectionHeading
            icon={<AccountBalanceIcon size={22} strokeWidth={1.8} />}
            title="My balance"
            trailing={<Chip label="All accounts" variant="outlined" />}
          />

          <Box sx={{ mt: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              <Box component="span">
                <InfoTooltip label={<span>Total balance</span>} text={metricExplanations.totalBaseEquivalent} />
              </Box>
            </Typography>
            <Typography variant="amountValue" color="text.primary" sx={{ mt: 0.5 }}>
              <Money amount={total} code={baseCurrency} maxDigits={2} />
            </Typography>
          </Box>

          <Box sx={{ mt: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5 }}>
              Accounts
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
              {accounts.map((account) => {
                const balance = balanceFor(account.id);
                return (
                  <Paper key={account.id} variant="dividedRow" sx={{ minWidth: 0 }}>
                    <Typography noWrap variant="body2" color="text.secondary">
                      {account.name}
                    </Typography>
                    <ForeignBalanceTooltip
                      amount={balance}
                      currency={account.currency}
                      baseCurrency={baseCurrency}
                      rate={displayRates[account.currency]}
                    >
                      <Typography
                        noWrap
                        variant="h6"
                        tabIndex={account.currency === baseCurrency ? undefined : 0}
                        color={account.type === 'credit' && balance < 0 ? 'error.main' : 'text.primary'}
                        sx={{ cursor: account.currency === baseCurrency ? 'default' : 'help' }}
                      >
                        <Money amount={balance} code={account.currency} maxDigits={2} />
                      </Typography>
                    </ForeignBalanceTooltip>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
