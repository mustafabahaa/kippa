import { AccountBalanceIcon } from '@/components/AppIcon';

import { Box, Card, CardContent, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCategories,
  useCycles,
  useDisplayRates,
  useHouseholdBaseCurrency,
  useBudgetAllocations,
  useExpectedIncomes,
} from '@/hooks/useFinance';
import { computeDashboard } from '@/libs/selectors';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import { InfoTooltip } from '@/features/shared/components/InfoTooltip';
import { metricExplanations } from '@/features/shared/constants/metricExplanations';
import { ForeignBalanceTooltip } from '@/features/shared/components/ForeignBalanceTooltip';
import { DashboardSectionHeading } from './DashboardSectionHeading';

export function TotalBalanceHeroSection() {
  const { householdId } = useAppContext();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCodes = Array.from(new Set((accounts ?? []).map((a) => a.currency).filter((c) => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);

  const activeCycle = cycles.find((c) => c.status === 'open') || null;
  const activeCycleId = activeCycle?.id;

  const { data: allocations = [] } = useBudgetAllocations(householdId, activeCycleId);
  const { data: expectedIncomes = [] } = useExpectedIncomes(householdId, activeCycleId);

  const isLoading = accountsLoading || txsLoading || linesLoading;

  if (isLoading || !accounts || !transactions || !ledgerLines) {
    return (
      <Card variant="dashboardSection">
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

  const data = computeDashboard(
    accounts,
    transactions,
    ledgerLines,
    categories,
    activeCycle,
    allocations,
    expectedIncomes,
    displayRates,
    baseCurrency,
  );
  const balanceFor = (accountId: string) =>
    data.accountBalances.find((item) => item.accountId === accountId)?.balance ?? 0;

  return (
    <Card variant="dashboardSection">
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
              <Money amount={data.totalBaseEquivalent} code={baseCurrency} maxDigits={2} />
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
                  <Paper key={account.id} variant="dashboardAccountRow" sx={{ minWidth: 0 }}>
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
