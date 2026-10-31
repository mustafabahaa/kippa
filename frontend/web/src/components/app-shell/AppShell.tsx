import { Suspense } from 'react';
import { Box, Container, useTheme } from '@monochrome-ui/design-system';
import { Outlet, useLocation } from 'react-router-dom';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TopBar } from '@/components/app-shell/TopBar';
import { BottomNav } from '@/components/app-shell/BottomNav';
import { SideNav } from '@/components/app-shell/SideNav';
import { useAppContext } from '@/hooks/useAppContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useLoanReminders } from '@/features/loans/useLoanReminders';
import { AppLoadingScreen } from './AppLoadingScreen';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/entry': 'Quick Entry',
  '/reconciliation': 'Reconciliation',
  '/cycles': 'Budget Cycles',
  '/cycles/report': 'Cycle Report',
  '/transactions': 'Transactions',
  '/pending': 'Pending Review',
  '/activity': 'Activity history',
  '/accounts': 'Bank Accounts',
  '/accounts/statements': 'Statements',
  '/household': 'Household',
  '/categories': 'Categories',
  '/notifications': 'Notifications',
  '/ai': 'Kip',
  '/loans': 'Loans',
};

export function AppShell() {
  const { userProfile, householdId, userHouseholds, switchHousehold, logout } = useAppContext();
  const isOnline = useOnlineStatus();
  const { modePref, setModePref } = useThemeMode();
  const theme = useTheme();
  const { pathname } = useLocation();

  const logoSrc =
    theme.palette.mode === 'dark' ? '/icons/logo_white_transparent.png' : '/icons/logo_black_transparent.png';
  const pageTitle = PAGE_TITLES[pathname];
  useLoanReminders();

  return (
    <>
      <title>{pageTitle ? `Kippa — ${pageTitle}` : 'Kippa'}</title>
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          pb: pathname === '/ai' ? 0 : { xs: 10, md: 0 },
          overflowX: 'clip',
        }}
      >
        <OfflineBanner isOnline={isOnline} />
        <SideNav />
        <Box
          component="main"
          sx={{ ml: { md: '72px' }, minHeight: '100dvh', overflowX: 'clip' }}
        >
          <TopBar
            logoSrc={logoSrc}
            modePref={modePref}
            setModePref={setModePref}
            userProfile={userProfile}
            householdId={householdId}
            userHouseholds={userHouseholds}
            switchHousehold={switchHousehold}
            logout={logout}
          />
          <Container
            maxWidth={false}
            sx={{
              py: pathname === '/ai' ? 0 : { xs: 2, sm: 3 },
              px: pathname === '/ai' ? 0 : { xs: 2, sm: 3 },
              maxWidth: pathname === '/ai' ? 'none' : 1440,
              mx: 'auto',
              '& > .MuiContainer-root': {
                maxWidth: 'none !important',
                p: '0 !important',
              },
            }}
          >
            <Suspense fallback={<AppLoadingScreen theme={theme} />}>
              <Outlet />
            </Suspense>
          </Container>
        </Box>

        <BottomNav />
      </Box>
    </>
  );
}
