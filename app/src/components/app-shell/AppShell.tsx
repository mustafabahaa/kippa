import { Suspense } from 'react';
import { Box, CircularProgress, Container } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TopBar } from '@/components/app-shell/TopBar';
import { BottomNav } from '@/components/app-shell/BottomNav';
import { SideNav } from '@/components/app-shell/SideNav';
import { useAppContext } from '@/hooks/useAppContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useThemeMode } from '@/hooks/useThemeMode';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/entry': 'Quick Entry',
  '/reconciliation': 'Reconciliation',
  '/cycles': 'Budget Cycles',
  '/transactions': 'Transactions',
  '/activity': 'Activity Log',
  '/accounts': 'Bank Accounts',
  '/household': 'Household',
  '/categories': 'Categories',
  '/notifications': 'Notifications',
};

export function AppShell() {
  const { userProfile, householdId, userHouseholds, switchHousehold, logout } = useAppContext();
  const isOnline = useOnlineStatus();
  const { modePref, setModePref, resolvedMode } = useThemeMode();
  const { pathname } = useLocation();

  const logoSrc = resolvedMode === 'dark' ? '/icons/icon-dark.svg' : '/icons/icon.svg';
  const pageTitle = PAGE_TITLES[pathname];

  return (
    <>
      <title>{pageTitle ? `Kippa — ${pageTitle}` : 'Kippa'}</title>
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100dvh', pb: { xs: 10, md: 0 }, bgcolor: 'transparent', overflowX: 'clip' }}>
        <OfflineBanner isOnline={isOnline} />
        <SideNav />
        <Box component="main" sx={{ ml: { md: '264px' }, minHeight: '100dvh', bgcolor: 'background.paper', overflow: 'hidden' }}>
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
            maxWidth="lg"
            sx={{
              py: { xs: 2, sm: 3 },
              px: { xs: 2, sm: 3 },
              '& > .MuiContainer-root': {
                maxWidth: 'none !important',
                p: '0 !important',
              },
            }}
          >
            <Suspense
              fallback={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '40vh',
                  }}
                >
                  <CircularProgress color="primary" size={32} thickness={4} />
                </Box>
              }
            >
              <Outlet />
            </Suspense>
          </Container>
        </Box>

        <BottomNav />
      </Box>
    </>
  );
}
