import { Box, Typography } from '@mui/material';
import { useCycles, useHouseholdName } from '../../../hooks/useFinance';
import { useAppContext } from '../../../hooks/useAppContext';

export function HeaderSection() {
  const { householdId } = useAppContext();
  const { data: householdName = 'My Household' } = useHouseholdName(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const activeCycle = cycles.find(c => c.status === 'open') || null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h2" sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
        Household Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '13px', mt: 0.5 }}>
        {householdName} • Cycle: {activeCycle ? activeCycle.name : 'No active cycle'}
      </Typography>
    </Box>
  );
}
