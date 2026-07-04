import { Box, Skeleton, Stack, Typography, useTheme, alpha } from '@mui/material';
import {
  useAccounts,
  useTransactions,
  useLedgerLines,
  useCategories,
  useCycles,
  useDisplayRates,
  useHouseholdBaseCurrency,
  useBudgetAllocations,
  useExpectedIncomes
} from '@/hooks/useFinance';
import { computeDashboard } from '@/libs/selectors';
import { Money } from '@/components/Money';
import { useAppContext } from '@/hooks/useAppContext';
import { InfoTooltip } from '@/features/shared/components/InfoTooltip';
import { metricExplanations } from '@/features/shared/constants/metricExplanations';
import { PixelBlast } from '@/features/shared/components/PixelBlast';

export function TotalBalanceHeroCard() {
  const { householdId } = useAppContext();
  const theme = useTheme();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(householdId);
  const { data: transactions, isLoading: txsLoading } = useTransactions(householdId);
  const { data: ledgerLines, isLoading: linesLoading } = useLedgerLines(householdId);
  const { data: categories = [] } = useCategories(householdId);
  const { data: cycles = [] } = useCycles(householdId);
  const baseCurrency = useHouseholdBaseCurrency();
  const foreignCodes = Array.from(new Set((accounts ?? []).map(a => a.currency).filter(c => c !== baseCurrency)));
  const { data: displayRates = {} } = useDisplayRates(baseCurrency, foreignCodes);

  const activeCycle = cycles.find(c => c.status === 'open') || null;
  const activeCycleId = activeCycle?.id;

  const { data: allocations = [] } = useBudgetAllocations(householdId, activeCycleId);
  const { data: expectedIncomes = [] } = useExpectedIncomes(householdId, activeCycleId);

  const isDark = theme.palette.mode === 'dark';

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
    displayRates,
    baseCurrency
  );

  return (
    <Box
      sx={{
        // Theme-only: primary.dark fill in light mode; in dark mode a layered
        // primary tint so the hero reads as a calm teal surface instead of a
        // harsh saturated block against near-black.
        bgcolor: isDark ? alpha(theme.palette.primary.dark, 0.7) : 'primary.dark',
        p: 2.5,
        borderRadius: '24px',
        boxShadow: isDark
          ? `0px 4px 16px ${alpha(theme.palette.common.black, 0.4)}`
          : '0px 4px 12px rgba(0,0,0,0.08)',
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
          // Faint enough that it reads as ambient texture behind the numbers
          // without competing with them for attention.
          opacity: isDark ? 0.08 : 0.12
        }}
      >
        <PixelBlast
          variant="square"
          pixelSize={4}
          color={theme.palette.primary.light}
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

      <Box sx={{ zIndex: 1, position: 'relative', pointerEvents: 'none' }}>
        <Box>
          <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.95), fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            <Box component="span" sx={{ pointerEvents: 'auto' }}>
              <InfoTooltip
                label={<span style={{ color: alpha(theme.palette.common.white, 0.95) }}>Total Balance</span>}
                text={metricExplanations.totalBaseEquivalent}
              />
            </Box>
          </Typography>
          <Typography variant="h1" sx={{ color: 'primary.contrastText', fontSize: '32px', fontWeight: 800, mt: 0.5 }}>
            <Money amount={data.totalBaseEquivalent} code={baseCurrency} />
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
            {accounts.map(acc => {
              const balanceObj = data.accountBalances.find(b => b.accountId === acc.id);
              const bal = balanceObj ? balanceObj.balance : 0;
              return (
                <Box
                  key={acc.id}
                  sx={{
                    // Dark pills so white text/numbers have strong contrast.
                    bgcolor: alpha(theme.palette.common.black, 0.28),
                    px: 2,
                    py: 1.25,
                    borderRadius: '12px',
                  }}
                >
                  <Typography sx={{ color: alpha(theme.palette.common.white, 0.7), fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1 }}>
                    {acc.name}
                  </Typography>
                  <Typography sx={{ color: theme.palette.common.white, fontSize: '15px', fontWeight: 800, mt: 0.5, lineHeight: 1.3 }}>
                    <Money amount={bal} code={acc.currency} maxDigits={2} />
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
