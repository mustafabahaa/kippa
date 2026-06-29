import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import { HeaderSection } from './components/HeaderSection';
import { TotalBalanceHeroCard } from './components/TotalBalanceHeroCard';
import { BudgetPulseCard } from './components/BudgetPulseCard';
import { BudgetBreakdownCard } from './components/BudgetBreakdownCard';
import { MyAccountsCard } from './components/MyAccountsCard';
import { RecentActivityCard } from './components/RecentActivityCard';

interface DashboardProps {
  onNavigateToTransactions: () => void;
}

export function Dashboard({ onNavigateToTransactions }: DashboardProps) {
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
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
                  Total Balance
                </Typography>
                <TotalBalanceHeroCard />
              </Box>
              <BudgetPulseCard />
              <MyAccountsCard />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              <RecentActivityCard onNavigateToTransactions={onNavigateToTransactions} />
              <BudgetBreakdownCard />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
