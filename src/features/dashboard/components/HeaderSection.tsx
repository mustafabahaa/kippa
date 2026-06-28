import { useCycles, useHouseholdName } from '../../../hooks/useFinance';
import { useAppContext } from '../../../hooks/useAppContext';
import { PageHeader } from '../../shared/PageHeader';

export function HeaderSection() {
  const { householdId } = useAppContext();
  const { data: householdName = 'My Household' } = useHouseholdName(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const activeCycle = cycles.find(c => c.status === 'open') || null;

  return (
    <PageHeader
      title="Household Dashboard"
      subtitle={`${householdName} • Cycle: ${activeCycle ? activeCycle.name : 'No active cycle'}`}
    />
  );
}
