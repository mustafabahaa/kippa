import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import { HeaderSection } from '@/features/dashboard/components/HeaderSection';
import { TotalBalanceHeroCard } from '@/features/dashboard/components/TotalBalanceHeroCard';
import { BudgetPulseCard } from '@/features/dashboard/components/BudgetPulseCard';
import { BudgetBreakdownCard } from '@/features/dashboard/components/BudgetBreakdownCard';
import { MyAccountsCard } from '@/features/dashboard/components/MyAccountsCard';
import { TransactionsCard } from '@/features/dashboard/components/TransactionsCard';

export function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* Header Section */}
        <HeaderSection />

        {/* Responsive layout:
            • Mobile: single column (all cards stacked)
            • md+ (desktop): two columns —
              left (8/12) = Hero, BudgetPulse, MyAccounts
              right (4/12) = RecentActivity, BudgetBreakdown */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
                  Total Balance
                </Typography>
                <TotalBalanceHeroCard />
              </Box>
              <BudgetPulseCard />
              <BudgetBreakdownCard />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <MyAccountsCard />
              <TransactionsCard />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
