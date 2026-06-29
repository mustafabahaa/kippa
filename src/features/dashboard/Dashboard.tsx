import { Container, Grid, Stack } from '@mui/material';
import { HeaderSection } from './components/HeaderSection';
import { TotalBalanceHeroCard } from './components/TotalBalanceHeroCard';
import { BudgetPulseCard } from './components/BudgetPulseCard';
import { BudgetBreakdownCard } from './components/BudgetBreakdownCard';
import { MyAccountsCard } from './components/MyAccountsCard';
import { RecentActivityCard } from './components/RecentActivityCard';

interface DashboardProps {
  onNavigateToActivity: () => void;
}

export function Dashboard({ onNavigateToActivity }: DashboardProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {/* Header Section */}
        <HeaderSection />

        {/* Responsive layout:
            • Mobile: single column (all cards stacked)
            • md+ (desktop): two columns —
              left (8/12) = Hero, BudgetPulse, MyAccounts
              right (4/12) = BudgetBreakdown, RecentActivity */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <TotalBalanceHeroCard />
              <BudgetPulseCard />
              <MyAccountsCard />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <BudgetBreakdownCard />
              <RecentActivityCard onNavigateToActivity={onNavigateToActivity} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
