import { Box, Divider, Grid, Stack } from '@monochrome-ui/design-system';
import { HeaderSection } from '@/features/dashboard/components/HeaderSection';
import { TotalBalanceHeroSection } from '@/features/dashboard/components/TotalBalanceHeroSection';
import { BudgetPulseSection } from '@/features/dashboard/components/BudgetPulseSection';
import { BudgetBreakdownSection } from '@/features/dashboard/components/BudgetBreakdownSection';
import { MyAccountsSection } from '@/features/dashboard/components/MyAccountsSection';
import { TransactionsSection } from '@/features/dashboard/components/TransactionsSection';
import { LoanProgressSection } from '@/features/dashboard/components/LoanProgressSection';
import { useAppContext } from '@/hooks/useAppContext';
import { useLoans } from '@/hooks/useFinance';
import { DashboardSectionHeading } from './components/DashboardSectionHeading';


export function Dashboard() {
  const { householdId } = useAppContext();
  const { data: loans = [], isLoading: loansLoading } = useLoans(householdId);
  const activeLoans = loans.filter((loan) => loan.status === 'active');
  const showLoan = loansLoading || activeLoans.length > 0;
  const overviewCardSize = { xs: 12, md: 6, lg: showLoan ? 4 : 6 };

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      {/* Header Section */}
      <HeaderSection />

      <Box component="section" >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Box>
            <DashboardSectionHeading
              title="Overview"
              subtitle={showLoan ? 'Balances, loan progress, and monthly spending' : 'Balances and monthly spending'}
            />
          </Box>

          <Box >
            <Grid container spacing={{ xs: 3, md: 5 }} alignItems="stretch">
              <Grid size={overviewCardSize} sx={{ minWidth: 0 }}>
                <TotalBalanceHeroSection />
              </Grid>
              {showLoan && (
                <Grid size={overviewCardSize} sx={{ minWidth: 0 }}>
                  <LoanProgressSection loans={activeLoans} loansLoading={loansLoading} />
                </Grid>
              )}
              <Grid size={{ ...overviewCardSize, md: showLoan ? 12 : 6 }} sx={{ minWidth: 0 }}>
                <BudgetPulseSection />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>

      <Box component="section" >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Box>
            <DashboardSectionHeading
              title="Accounts & activity"
              subtitle="Your accounts, budgets, and recent transactions"
            />
          </Box>

          <Box >
            <Grid container columns={{ xs: 12, md: 10 }} spacing={{ xs: 2, md: 3 }} alignItems="stretch">
              <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
                <Stack spacing={{ xs: 2, md: 3 }} divider={<Divider />} sx={{ minWidth: 0 }}>
                  <MyAccountsSection />
                  <BudgetBreakdownSection />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                <TransactionsSection />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>

    </Stack>
  );
}
