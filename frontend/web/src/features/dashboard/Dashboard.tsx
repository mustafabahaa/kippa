import { Box, Divider, Grid, Stack } from '@mui/material';
import { HeaderSection } from '@/features/dashboard/components/HeaderSection';
import { TotalBalanceHeroSection } from '@/features/dashboard/components/TotalBalanceHeroSection';
import { BudgetPulseSection } from '@/features/dashboard/components/BudgetPulseSection';
import { BudgetBreakdownSection } from '@/features/dashboard/components/BudgetBreakdownSection';
import { MyAccountsSection } from '@/features/dashboard/components/MyAccountsSection';
import { TransactionsSection } from '@/features/dashboard/components/TransactionsSection';
import { LoanProgressSection } from '@/features/dashboard/components/LoanProgressSection';
import { DashboardSectionHeading } from './components/DashboardSectionHeading';

const dashboardSectionIndent = { xs: 0, md: 4 } as const;

export function Dashboard() {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      {/* Header Section */}
      <HeaderSection />

      <Box component="section" sx={{ pl: dashboardSectionIndent }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Box>
            <DashboardSectionHeading
              title="Overview"
              subtitle="Balances, loan progress, and monthly spending"
            />
          </Box>

          <Box sx={{ pl: { xs: 0, md: 4 } }}>
            <Grid container spacing={{ xs: 3, md: 5 }} alignItems="stretch">
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <TotalBalanceHeroSection />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <LoanProgressSection />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <BudgetPulseSection />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>

      <Box component="section" sx={{ pl: dashboardSectionIndent }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Box>
            <DashboardSectionHeading
              title="Accounts & activity"
              subtitle="Your accounts, budgets, and recent transactions"
            />
          </Box>

          <Box sx={{ pl: { xs: 0, md: 4 } }}>
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
