import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TopBar } from '@/components/app-shell/TopBar';
import { FloatingActionButton } from '@/components/app-shell/FloatingActionButton';
import { BottomNav } from '@/components/app-shell/BottomNav';
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
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', pb: { xs: 10, md: 12 }, bgcolor: 'transparent', overflowX: 'clip' }}>
        <OfflineBanner isOnline={isOnline} />
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

        <Box sx={{ py: { xs: 2, sm: 4 } }}>
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
        </Box>

        <FloatingActionButton />
        <BottomNav />
      </Box>
    </>
  );
}
