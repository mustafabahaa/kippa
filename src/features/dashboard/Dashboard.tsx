import { Container, Stack } from '@mui/material';
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
    <Container maxWidth="xs" sx={{ py: 1, px: 2 }}>
      <Stack spacing={3}>
        {/* Header Section */}
        <HeaderSection />

        {/* Total Balance Hero */}
        <TotalBalanceHeroCard />

        {/* Budget Pulse */}
        <BudgetPulseCard />

        {/* Budget Breakdown Table */}
        <BudgetBreakdownCard />

        {/* My Accounts */}
        <MyAccountsCard />

        {/* Recent Activity */}
        <RecentActivityCard onNavigateToActivity={onNavigateToActivity} />
      </Stack>
    </Container>
  );
}
