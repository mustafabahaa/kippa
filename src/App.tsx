import { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper, 
  AppBar, 
  Toolbar, 
  Typography, 
  Stack, 
  IconButton, 
  Tooltip, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider, 
  ListItemIcon, 
  ListItemText
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HistoryIcon from '@mui/icons-material/History';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import CheckIcon from '@mui/icons-material/Check';

import { createAppTheme } from './theme';
import { useThemeMode, type ThemeModePref } from './hooks/useThemeMode';
import { AuthScreen } from './features/auth/AuthScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { FastEntry } from './features/fast-entry/FastEntry';
import { Reconciliation } from './features/reconciliation/Reconciliation';
import { BudgetCycles } from './features/budget-cycles/BudgetCycles';
import { Accounts } from './features/accounts/Accounts';
import { Household } from './features/household/Household';
import { Categories } from './features/categories/Categories';
import { Notifications } from './features/notifications/Notifications';
import { TransactionHistory } from './features/transactions/TransactionHistory';
import { AuditLog } from './features/activity/AuditLog';
import { ActivityBell } from './features/activity/ActivityBell';
import { useAppContext } from './hooks/useAppContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { OfflineBanner } from './components/OfflineBanner';
import { DotGridBackground } from './features/shared/components/DotGrid';

export default function App() {
  const {
    userProfile,
    householdId,
    isAuthLoading,
    userHouseholds,
    logout,
    switchHousehold
  } = useAppContext();

  const isOnline = useOnlineStatus();

  const { modePref, resolvedMode, setModePref } = useThemeMode();
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);
  const logoSrc = resolvedMode === 'dark' ? '/icons/icon-dark.svg' : '/icons/icon.svg';

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('finance_active_tab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('finance_active_tab', activeTab);
  }, [activeTab]);

  // Profile dropdown menu state
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isAuthLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DotGridBackground />
        <Box 
          sx={{ 
            position: 'relative', 
            zIndex: 1, 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'transparent'
          }}
        >
          {/* Logo container with float & pulse animation */}
          <Box 
            sx={{ 
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'logoPulseFloat 2.5s infinite ease-in-out',
            }}
          >
            <img 
              src={logoSrc} 
              alt="Kippa Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain'
              }} 
            />
          </Box>

          <style>{`
            @keyframes logoPulseFloat {
              0% { transform: scale(0.92) translateY(0px); opacity: 0.85; }
              50% { transform: scale(1.08) translateY(-6px); opacity: 1; }
              100% { transform: scale(0.92) translateY(0px); opacity: 0.85; }
            }
          `}</style>
        </Box>
      </ThemeProvider>
    );
  }

  if (!userProfile || !householdId) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DotGridBackground />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <AuthScreen />
        </Box>
      </ThemeProvider>
    );
  }

  const currentHousehold = userHouseholds.find(hh => hh.id === householdId);
  const householdName = currentHousehold ? currentHousehold.name : 'Personal Household';

  const menuItemStyle = {
    mx: 1,
    my: 0.25,
    px: 1.5,
    py: 1,
    borderRadius: '8px',
    '&.MuiMenuItem-root': {
      borderRadius: '8px',
    },
    '& .MuiListItemIcon-root': {
      minWidth: 30,
      color: 'text.secondary',
    },
    '& .MuiListItemText-primary': {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: 'text.primary',
    },
    '& .MuiListItemText-secondary': {
      fontSize: '0.75rem',
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DotGridBackground />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', pb: { xs: 10, md: 12 }, bgcolor: 'transparent' }}>
        <OfflineBanner isOnline={isOnline} />
        {/* Top Navbar */}
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ py: 1 }}>
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
            {/* Left: Logo & Brand Name */}
            <Stack direction="row" spacing={1} alignItems="center">
              <img src={logoSrc} alt="Kippa Logo" style={{ height: 28, width: 'auto' }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold', letterSpacing: '0.05em', color: 'primary.main' }}>
                Kippa
              </Typography>
            </Stack>

            {/* Right: Activity Bell & Profile */}
            <Stack direction="row" spacing={1} alignItems="center">
              <ActivityBell onClick={() => setActiveTab('auditLog')} />
              <Tooltip title="Account Menu">
                <IconButton 
                  onClick={handleOpenProfileMenu}
                  aria-label="account profile menu"
                  aria-controls="profile-menu"
                  aria-haspopup="true"
                  sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', width: 40, height: 40 }}
                >
                  <Avatar 
                    src={userProfile?.photoURL || undefined}
                    sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem', fontWeight: 600 }}
                  >
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Profile Dropdown Menu */}
            <Menu
              id="profile-menu"
              anchorEl={profileAnchorEl}
              open={isProfileMenuOpen}
              onClose={handleCloseProfileMenu}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    mt: 1.5,
                    minWidth: 280,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'rgba(0, 0, 0, 0.08) 0px 12px 24px -4px, rgba(0, 0, 0, 0.04) 0px 4px 12px -2px',
                    '&::before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 18,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                      borderLeft: '1px solid',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    },
                  },
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* User details */}
              <Box sx={{ px: 2.5, py: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar 
                    src={userProfile?.photoURL || undefined}
                    sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {userProfile?.displayName || 'User'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {userProfile?.email || 'No email associated'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Household sharing info */}
              <Box sx={{ py: 0.75 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'text.secondary', 
                    textTransform: 'uppercase', 
                    fontSize: '0.65rem', 
                    letterSpacing: '0.08em',
                    px: 2.5,
                    mb: 1,
                    display: 'block'
                  }}
                >
                  Current Household
                </Typography>
                
                <Stack 
                  direction="row" 
                  spacing={1.5} 
                  alignItems="center" 
                  sx={{ 
                    mx: 1,
                    px: 1.5, 
                    py: 1.25, 
                    borderRadius: '8px', 
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <HomeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
                      {householdName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.6875rem' }}>
                      ID: {householdId ? `${householdId.slice(0, 8)}...` : 'None'}
                    </Typography>
                  </Box>
                  {householdId && (
                    <Tooltip title="Copy Household ID">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(householdId || '');
                        }}
                        sx={{ 
                          p: 0.5, 
                          bgcolor: 'background.paper', 
                          border: '1px solid', 
                          borderColor: 'divider', 
                          borderRadius: '6px',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>

              {/* Quick Switch Households */}
              {userHouseholds.length > 1 && (
                <>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'text.secondary', 
                      textTransform: 'uppercase', 
                      fontSize: '0.65rem', 
                      letterSpacing: '0.08em',
                      px: 2.5,
                      mt: 1.5,
                      mb: 0.5,
                      display: 'block'
                    }}
                  >
                    Switch Household
                  </Typography>
                  {userHouseholds.map(hh => {
                    if (hh.id === householdId) return null;
                    return (
                      <MenuItem 
                        key={hh.id} 
                        onClick={async () => {
                          handleCloseProfileMenu();
                          try {
                            await switchHousehold(hh.id);
                          } catch (err) {
                            console.error('Failed to switch household:', err);
                          }
                        }}
                        sx={menuItemStyle}
                      >
                        <ListItemIcon>
                          <HomeIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={hh.name} 
                          secondary={`ID: ${hh.id.slice(0, 8)}...`}
                        />
                      </MenuItem>
                    );
                  })}
                </>
              )}

              <Divider sx={{ my: 1 }} />

              {/* Appearance / Theme */}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'text.secondary', 
                  textTransform: 'uppercase', 
                  fontSize: '0.65rem', 
                  letterSpacing: '0.08em',
                  px: 2.5,
                  mt: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}
              >
                Appearance
              </Typography>
              {([
                { value: 'light' as ThemeModePref, label: 'Light', Icon: LightModeIcon },
                { value: 'dark' as ThemeModePref, label: 'Dark', Icon: DarkModeIcon },
                { value: 'system' as ThemeModePref, label: 'System default', Icon: SettingsBrightnessIcon },
              ]).map(({ value, label, Icon }) => {
                const selected = modePref === value;
                return (
                  <MenuItem
                    key={value}
                    onClick={() => { setModePref(value); handleCloseProfileMenu(); }}
                    sx={{ ...menuItemStyle, py: 0.75 }}
                  >
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={label} />
                    {selected && (
                      <CheckIcon fontSize="small" sx={{ color: 'primary.main', ml: 'auto' }} />
                    )}
                  </MenuItem>
                );
              })}

              <Divider sx={{ my: 1 }} />

              {/* Shortcuts */}
              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('accounts'); }} sx={menuItemStyle}>
                <ListItemIcon>
                  <AccountBalanceIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Bank Accounts" />
              </MenuItem>

              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('household'); }} sx={menuItemStyle}>
                <ListItemIcon>
                  <HomeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Household Sharing" />
              </MenuItem>

              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('categories'); }} sx={menuItemStyle}>
                <ListItemIcon>
                  <CategoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Categories Settings" />
              </MenuItem>

              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('notifications'); }} sx={menuItemStyle}>
                <ListItemIcon>
                  <NotificationsActiveIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Reminders & Alerts" />
              </MenuItem>

              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('auditLog'); }} sx={menuItemStyle}>
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Activity Log" />
              </MenuItem>
              
              <Divider sx={{ my: 1 }} />

              <MenuItem 
                onClick={() => { handleCloseProfileMenu(); handleLogout(); }} 
                sx={{ 
                  ...menuItemStyle, 
                  color: 'error.main', 
                  '& .MuiListItemIcon-root': { 
                    minWidth: 30, 
                    color: 'error.main' 
                  },
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'error.main'
                  }
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Dynamic Content Views */}
        <Box sx={{ py: { xs: 2, sm: 4 } }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateToTransactions={() => setActiveTab('transactions')}
            />
          )}

          {activeTab === 'entry' && (
            <FastEntry />
          )}

          {activeTab === 'cycles' && (
            <BudgetCycles />
          )}

          {activeTab === 'reconciliation' && (
            <Reconciliation />
          )}
          {activeTab === 'transactions' && (
            <TransactionHistory />
          )}
          {activeTab === 'auditLog' && (
            <AuditLog />
          )}

          {activeTab === 'accounts' && (
            <Accounts />
          )}

          {activeTab === 'household' && (
            <Household />
          )}

          {activeTab === 'categories' && (
            <Categories />
          )}

          {activeTab === 'notifications' && (
            <Notifications />
          )}
        </Box>

        {/* Floating Action Button (Stitch styled FAB) */}
        {activeTab !== 'entry' && (
          <Box
            onClick={() => setActiveTab('entry')}
            sx={{
              position: 'fixed',
              bottom: { xs: 92, md: 100 },
              right: 16,
              width: 56,
              height: 56,
              bgcolor: 'background.paper',
              color: 'primary.main',
              borderRadius: '16px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'all 0.2s ease-in-out',
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>add</span>
          </Box>
        )}

        {/* Floating Bottom Navigation (pill, not full-width) */}
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, md: 24 },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            bgcolor: 'background.paper',
            borderRadius: '32px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
            padding: '6px',
            maxWidth: 'calc(100vw - 24px)',
            overflow: 'hidden',
            animation: 'navFloatIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            '@keyframes navFloatIn': {
              from: { opacity: 0, transform: 'translateX(-50%) translateY(20px)' },
              to: { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
            },
          }}
        >
          <BottomNavigation
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            showLabels
            sx={{
              bgcolor: 'transparent',
              height: 64,
              '& .MuiBottomNavigationAction-root': {
                color: 'text.secondary',
                minWidth: 'auto',
                paddingX: { xs: 1.5, sm: 2.5 },
                paddingY: '4px',
                borderRadius: '24px',
                transition: 'all 0.2s ease',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '11px',
                  fontWeight: 500,
                  marginTop: '2px',
                  '&.Mui-selected': { fontSize: '11px' },
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '22px',
                  transition: 'all 0.2s ease',
                },
                '&.Mui-selected': {
                  color: 'primary.main',
                  '& .MuiBottomNavigationAction-label': {
                    fontWeight: 700,
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'primary.main',
                  },
                },
              },
            }}
          >
            <BottomNavigationAction label="Dashboard" value="dashboard" icon={<DashboardIcon />} />
            <BottomNavigationAction label="Entry" value="entry" icon={<AddCircleIcon />} />
            <BottomNavigationAction label="Reconcile" value="reconciliation" icon={<SyncAltIcon />} />
            <BottomNavigationAction label="Cycles" value="cycles" icon={<CalendarMonthIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
