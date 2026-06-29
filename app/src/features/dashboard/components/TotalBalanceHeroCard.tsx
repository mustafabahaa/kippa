import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { 
  useAccounts, 
  useTransactions, 
  useLedgerLines, 
  useCategories, 
  useCycles, 
  useUsdRate, 
  useBudgetAllocations, 
  useExpectedIncomes 
} from '@/hooks/useFinance';
import { computeDashboard } from '@/libs/selectors';
import { useAppContext } from '@/hooks/useAppContext';
import { InfoTooltip } from '@/features/shared/components/InfoTooltip';
import { metricExplanations } from '@/features/shared/constants/metricExplanations';
import { PixelBlast } from '@/features/shared/components/PixelBlast';

export function TotalBalanceHeroCard() {
  const { householdId } = useAppContext();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const { data: displayRate = 50.0 } = useUsdRate();

  const activeCycle = cycles.find(c => c.status === 'open') || null;
  const activeCycleId = activeCycle?.id;

  const { data: allocations = [] } = useBudgetAllocations(householdId, activeCycleId);
  const { data: expectedIncomes = [] } = useExpectedIncomes(householdId, activeCycleId);

  const isLoading = accountsLoading || txsLoading || linesLoading;

  if (isLoading || !accounts || !transactions || !ledgerLines) {
    return (
      <Box sx={{ bgcolor: 'action.hover', p: 2.5, borderRadius: '24px', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton variant="text" width="50%" height={24} animation="wave" />
          <Skeleton variant="text" width="80%" height={48} animation="wave" sx={{ mt: 1 }} />
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" width="30%" height={28} sx={{ borderRadius: '16px' }} animation="wave" />
          <Skeleton variant="rectangular" width="30%" height={28} sx={{ borderRadius: '16px' }} animation="wave" />
        </Stack>
      </Box>
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
    displayRate
  );

  return (
    <Box 
      sx={{ 
        bgcolor: 'primary.dark', 
        p: 2.5, 
        borderRadius: '24px', 
        boxShadow: '0px 4px 12px rgba(0,0,0,0.08)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        minHeight: '180px', 
        position: 'relative', 
        overflow: 'hidden' 
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 0,
          pointerEvents: 'auto',
          opacity: 0.2
        }}
      >
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#9cf2e8"
          patternScale={2}
          patternDensity={1.2}
          pixelSizeJitter={0.1}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.3}
          edgeFade={0.3}
          transparent
        />
      </Box>

      <Box sx={{ zIndex: 1, position: 'relative', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minHeight: '130px' }}>
        <Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            <Box component="span" sx={{ pointerEvents: 'auto' }}>
              <InfoTooltip
                label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Total EGP Equivalent</span>}
                text={metricExplanations.totalEgpEquivalent}
              />
            </Box>
          </Typography>
          <Typography variant="h1" sx={{ color: 'primary.contrastText', fontSize: '32px', fontWeight: 800, mt: 0.5 }}>
            EGP {data.totalEgpEquivalent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            {accounts.map(acc => {
              const balanceObj = data.accountBalances.find(b => b.accountId === acc.id);
              const bal = balanceObj ? balanceObj.balance : 0;
              return (
                <Typography key={acc.id} variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 500 }}>
                  {acc.currency === 'USD' ? '$' : ''}{bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {acc.currency !== 'USD' ? acc.currency : ''}
                </Typography>
              );
            })}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', px: 1.5, py: 0.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 0.5, pointerEvents: 'auto' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fff' }}>payments</span>
            <Typography variant="body2" sx={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
              <InfoTooltip
                label={<span style={{ color: '#fff' }}>Safe Daily: EGP {data.safeDailySpend.budgetSafe.toFixed(0)}</span>}
                text={metricExplanations.safeDailyBudget}
              />
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
