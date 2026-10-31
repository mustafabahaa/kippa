import { ChevronRightIcon, DarkModeIcon, LightModeIcon, MenuIcon } from '@/components/AppIcon';

import { useState } from 'react';
import { AppBar, Toolbar, Stack, Typography, IconButton, Tooltip, Breadcrumbs, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { ActivityBell } from '@/features/activity/ActivityBell';
import { ProfileMenu } from '@/components/app-shell/ProfileMenu';
import { QuickNavMenu } from '@/components/app-shell/QuickNavMenu';
import type { ThemeModePref } from '@/contexts/themeModeContext';
import type { UserProfile, Household } from '@kippa/domain';
import { UserAvatar } from '@/components/UserAvatar';

interface TopBarProps {
  logoSrc: string;
  modePref: ThemeModePref;
  setModePref: (pref: ThemeModePref) => void;
  userProfile: UserProfile | null;
  householdId: string;
  userHouseholds: Household[];
  switchHousehold: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function TopBar({
  logoSrc,
  modePref,
  setModePref,
  userProfile,
  householdId,
  userHouseholds,
  switchHousehold,
  logout,
}: TopBarProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const theme = useTheme();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);
  const [navAnchorEl, setNavAnchorEl] = useState<null | HTMLElement>(null);
  const isNavMenuOpen = Boolean(navAnchorEl);
  const currentHousehold = userHouseholds.find((hh) => hh.id === householdId);
  const householdName = currentHousehold ? currentHousehold.name : 'Personal Household';
  const pageLabel =
    pathname === '/transactions' && search
      ? ({ '?type=expense': 'Expenses', '?type=income': 'Income', '?type=transfer': 'Transfers' }[search] ??
        'Transactions')
      : ({
          '/': 'Dashboard',
          '/entry': 'Quick entry',
          '/reconciliation': 'Reconciliation',
          '/cycles': 'Budget cycles',
          '/cycles/report': 'Cycle report',
          '/transactions': 'Transactions',
          '/pending': 'Pending review',
          '/activity': 'Activity history',
          '/accounts': 'Accounts & cards',
          '/accounts/statements': 'Statements',
          '/household': 'Household',
          '/categories': 'Categories',
          '/notifications': 'Notifications',
          '/ai': 'Ask Kip',
          '/loans': 'Loans',
        }[pathname] ?? 'Workspace');
  const parentCrumb =
    pathname === '/cycles' || pathname === '/cycles/report' || pathname === '/categories'
      ? { label: 'Analytics', path: '/cycles' }
      : pathname === '/pending' || pathname === '/transactions'
        ? { label: 'Transactions', path: '/transactions' }
        : pathname === '/accounts/statements' || pathname === '/reconciliation'
          ? { label: 'Accounts & cards', path: '/accounts' }
          : pathname === '/notifications' || pathname === '/activity'
            ? { label: 'Household', path: '/household' }
            : null;

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{ top: 0, zIndex: (theme) => theme.zIndex.appBar, py: 0.5 }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 64, md: 76 }, px: { xs: 2, sm: 3, lg: 5 } }}>
          {/* Left: Logo & Brand Name */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer', userSelect: 'none', display: { xs: 'flex', md: 'none' } }}
          >
            <img src={logoSrc} alt="Kippa Logo" style={{ height: 32, width: 'auto' }} />
            <Typography variant="h3" color="primary.main">
              Kippa
            </Typography>
          </Stack>

          <Stack sx={{ display: { xs: 'none', md: 'flex' }, minWidth: 0, flex: 1, ml: 2 }}>
            <Breadcrumbs
              aria-label="Breadcrumb"
              separator={<ChevronRightIcon size={16} strokeWidth={1.8} />}
              sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
            >
              <Link component={RouterLink} to="/" underline="hover" color="text.secondary" variant="body2">
                Workspace
              </Link>
              {parentCrumb && parentCrumb.label !== pageLabel && (
                <Link
                  component={RouterLink}
                  to={parentCrumb.path}
                  underline="hover"
                  color="text.secondary"
                  variant="body2"
                >
                  {parentCrumb.label}
                </Link>
              )}
              <Typography variant="body2" color="text.primary" aria-current="page" noWrap>
                {pageLabel}
              </Typography>
            </Breadcrumbs>
          </Stack>

          {/* Right: Activity Bell, Quick Nav & Profile */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton
                aria-label={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}
                onClick={() => setModePref(theme.palette.mode === 'dark' ? 'light' : 'dark')}
                sx={{ width: 40, height: 40 }}
              >
                {theme.palette.mode === 'dark' ? (
                  <LightModeIcon size={20} strokeWidth={1.8} />
                ) : (
                  <DarkModeIcon size={20} strokeWidth={1.8} />
                )}
              </IconButton>
            </Tooltip>
            <ActivityBell onClick={() => navigate('/activity')} />
            <Tooltip title="Open navigation">
              <IconButton
                onClick={(e) => setNavAnchorEl(e.currentTarget)}
                aria-label="navigation menu"
                aria-controls="quick-nav-menu"
                aria-haspopup="true"
                sx={{ width: 40, height: 40 }}
              >
                <MenuIcon size={20} strokeWidth={1.8} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Account Menu">
              <IconButton
                onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                aria-label="account profile menu"
                aria-controls="profile-menu"
                aria-haspopup="true"
                sx={{ p: 0.5, width: 40, height: 40 }}
              >
                <UserAvatar
                  photoURLs={[userProfile?.photoURL]}
                  displayName={userProfile?.displayName}
                  variant="appBar"
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <ProfileMenu
        anchorEl={profileAnchorEl}
        open={isProfileMenuOpen}
        onClose={() => setProfileAnchorEl(null)}
        modePref={modePref}
        setModePref={setModePref}
        userProfile={userProfile}
        householdId={householdId}
        userHouseholds={userHouseholds}
        householdName={householdName}
        switchHousehold={switchHousehold}
        logout={logout}
      />

      <QuickNavMenu anchorEl={navAnchorEl} open={isNavMenuOpen} onClose={() => setNavAnchorEl(null)} />
    </>
  );
}
