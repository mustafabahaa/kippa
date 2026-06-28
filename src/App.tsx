import { useState, useEffect } from 'react';
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
  Button,
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
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';

import { appTheme } from './theme';
import { AuthScreen } from './features/auth/AuthScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { FastEntry } from './features/transactions/FastEntry';
import { Reconciliation } from './features/reconciliation/Reconciliation';
import { Cycles } from './features/cycles/Cycles';
import { AccountsSection } from './features/settings/AccountsSection';
import { HouseholdSection } from './features/settings/HouseholdSection';
import { CategoriesSection } from './features/settings/CategoriesSection';
import { NotificationsSection } from './features/settings/NotificationsSection';
import { Activity } from './features/transactions/Activity';

import { authService } from './services/authService';
import { ledgerService } from './services/ledgerService';
import { cycleService } from './services/cycleService';
import { computeDashboard } from './services/selectors';
import { transactionService } from './services/transactionService';
import { currencyService } from './services/currencyService';

import { UserProfile, Account, Category, BudgetCycle, FinanceTransaction } from './domain/financeTypes';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('finance_active_tab') || 'dashboard';
  });
  const [displayRate, setDisplayRate] = useState<number>(50.0);

  // Auto-fetch live USD/EGP rate on mount
  useEffect(() => {
    currencyService.getUsdToEgpRate().then(setDisplayRate).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('finance_active_tab', activeTab);
  }, [activeTab]);
  
  // Loader states
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Profile dropdown menu state
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileAnchorEl(null);
  };

  // Ledger state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cycles, setCycles] = useState<BudgetCycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<BudgetCycle | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [expectedIncomes, setExpectedIncomes] = useState<any[]>([]);

  // Listen to Auth
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((profile) => {
      setUserProfile(profile);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all data for household
  const loadLedgerData = async () => {
    if (!userProfile?.householdId) return;
    const hhId = userProfile.householdId;
    setIsDataLoading(true);

    try {
      // 1. Load accounts & categories
      let accs = await ledgerService.getAccounts(hhId);
      let cats = await ledgerService.getCategories(hhId);

      // Auto-seed if empty
      if (accs.length === 0) {
        await ledgerService.seedDefaultAccounts(hhId);
        accs = await ledgerService.getAccounts(hhId);
      }
      if (cats.length === 0) {
        await ledgerService.seedDefaultCategories(hhId);
        cats = await ledgerService.getCategories(hhId);
      }

      setAccounts(accs);
      setCategories(cats);

      // 2. Load Cycles
      const cycleList = await cycleService.getCycles(hhId);
      setCycles(cycleList);

      const active = cycleList.find(c => c.status === 'open') || null;
      setActiveCycle(active);

      // 3. Load Transactions & Ledger Lines
      const txs = await ledgerService.getTransactions(hhId);
      setTransactions(txs);

      const lines = await ledgerService.getLedgerLines(hhId);
      setLedgerLines(lines);

      // 4. Load cycle specific Allocations & Expected Incomes
      if (active) {
        const allocList = await cycleService.getBudgetAllocations(hhId, active.id);
        setAllocations(allocList);

        const incList = await cycleService.getExpectedIncomes(hhId, active.id);
        setExpectedIncomes(incList);
      } else {
        setAllocations([]);
        setExpectedIncomes([]);
      }
    } catch (err) {
      console.error('Error loading ledger data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.householdId) {
      loadLedgerData();
    }
  }, [userProfile?.householdId]);

  const handleLogout = async () => {
    await authService.logout();
    setUserProfile(null);
  };

  const handleVoidTransaction = async (txId: string) => {
    if (!userProfile?.householdId) return;
    if (window.confirm('Are you sure you want to void this transaction? This updates derived balances immediately.')) {
      await transactionService.voidTransaction(userProfile.householdId, txId);
      loadLedgerData();
    }
  };

  if (isAuthLoading) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', gap: 2 }}>
          <img src="/icons/icon.svg" alt="FinanceFlow Logo" style={{ width: 64, height: 64, animation: 'pulse 1.5s infinite ease-in-out' }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '20px', color: 'primary.main' }}>
            FinanceFlow
          </Typography>
          <style>{`
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(0.95); opacity: 0.8; }
            }
          `}</style>
        </Box>
      </ThemeProvider>
    );
  }

  if (!userProfile || !userProfile.householdId) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <AuthScreen 
          userProfile={userProfile} 
          onProfileUpdated={(p) => setUserProfile(p)} 
        />
      </ThemeProvider>
    );
  }

  // Compute selectors dynamically
  const dashboardData = computeDashboard(
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
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', pb: { xs: 12, md: 14 }, bgcolor: 'background.default' }}>
        {/* Top Navbar */}
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1 }}>
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, position: 'relative' }}>
            {/* Left: User Profile Avatar */}
            <Tooltip title="Account Menu">
              <IconButton 
                onClick={handleOpenProfileMenu}
                aria-label="account profile menu"
                aria-controls="profile-menu"
                aria-haspopup="true"
                sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', width: 40, height: 40 }}
              >
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem', fontWeight: 600 }}>
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>

            {/* Center: Logo & Brand Name */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              <img src="/icons/icon.svg" alt="FinanceFlow Logo" style={{ height: 28, width: 'auto' }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                FinanceFlow
              </Typography>
            </Stack>

            {/* Right: Search Action */}
            <IconButton 
              aria-label="search"
              sx={{ width: 40, height: 40 }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--mui-palette-primary-main, #005c55)' }}>search</span>
            </IconButton>

            {/* Profile Dropdown Menu */}
            <Menu
              id="profile-menu"
              anchorEl={profileAnchorEl}
              open={isProfileMenuOpen}
              onClose={handleCloseProfileMenu}
              onClick={handleCloseProfileMenu}
              slotProps={{
                paper: {
                  elevation: 3,
                  sx: {
                    overflow: 'visible',
                    mt: 1.5,
                    minWidth: 280,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 4px 12px 0px',
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
                  <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: '1.1rem', fontWeight: 600 }}>
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {userProfile?.displayName || 'User'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                      {userProfile?.email || 'No email associated'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              {/* Household sharing info */}
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.675rem', letterSpacing: '0.05em' }}>
                  Current Household
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <HomeIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    ID: {userProfile?.householdId ? `${userProfile.householdId.slice(0, 8)}...` : 'None'}
                  </Typography>
                  {userProfile?.householdId && (
                    <Tooltip title="Copy ID">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(userProfile.householdId || '');
                        }}
                        sx={{ ml: 'auto', p: 0.5 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>

              <Divider />

              {/* Shortcuts */}
              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('accounts'); }}>
                <ListItemIcon>
                  <AccountBalanceIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Bank Accounts" />
              </MenuItem>

              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('household'); }}>
                <ListItemIcon>
                  <HomeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Household Sharing" />
              </MenuItem>

              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('categories'); }}>
                <ListItemIcon>
                  <CategoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Categories Settings" />
              </MenuItem>

              <MenuItem onClick={() => { handleCloseProfileMenu(); setActiveTab('notifications'); }}>
                <ListItemIcon>
                  <NotificationsActiveIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Reminders & Alerts" />
              </MenuItem>
              
              <MenuItem onClick={() => { handleCloseProfileMenu(); handleLogout(); }} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
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
              isLoading={isDataLoading}
              data={dashboardData}
              accounts={accounts}
              categories={categories}
              activeCycle={activeCycle}
              transactions={transactions}
              ledgerLines={ledgerLines}
              displayUsdToEgpRate={displayRate}
              onVoidTransaction={handleVoidTransaction}
              onNavigateToActivity={() => setActiveTab('activity')}
            />
          )}

          {activeTab === 'entry' && (
            <FastEntry
              householdId={userProfile.householdId}
              userProfile={userProfile}
              accounts={accounts}
              categories={categories}
              activeCycle={activeCycle}
              onTransactionSaved={loadLedgerData}
            />
          )}

          {activeTab === 'cycles' && (
            <Cycles
              householdId={userProfile.householdId}
              categories={categories}
              cycles={cycles}
              activeCycle={activeCycle}
              onCyclesUpdated={loadLedgerData}
            />
          )}

          {activeTab === 'reconciliation' && (
            <Reconciliation
              householdId={userProfile.householdId}
              userProfile={userProfile}
              accounts={accounts}
              balances={dashboardData.accountBalances}
              activeCycle={activeCycle}
              onReconciled={loadLedgerData}
            />
          )}
          {activeTab === 'activity' && (
            <Activity
              householdId={userProfile.householdId}
              transactions={transactions}
              ledgerLines={ledgerLines}
              categories={categories}
              accounts={accounts}
              onDataUpdated={loadLedgerData}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsSection
              householdId={userProfile.householdId}
              accounts={accounts}
              onDataUpdated={loadLedgerData}
            />
          )}

          {activeTab === 'household' && (
            <HouseholdSection
              householdId={userProfile.householdId}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesSection
              householdId={userProfile.householdId}
              categories={categories}
              onDataUpdated={loadLedgerData}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSection
              householdId={userProfile.householdId}
              userId={userProfile.uid}
            />
          )}
        </Box>

        {/* Floating Action Button (Stitch styled FAB) */}
        {activeTab !== 'entry' && (
          <Box
            onClick={() => setActiveTab('entry')}
            sx={{
              position: 'fixed',
              bottom: 88,
              right: 24,
              width: 56,
              height: 56,
              bgcolor: 'secondary.container',
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

        {/* Flat Bottom Navigation for Mobile-first layout */}
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 1000, 
            borderRadius: 0,
            borderTop: 1,
            borderColor: 'divider',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            bgcolor: 'background.paper',
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px -2px 6px 0px',
            overflow: 'hidden'
          }} 
          elevation={0}
        >
          <BottomNavigation
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            showLabels
            sx={{
              bgcolor: 'transparent',
              height: 72,
              '& .MuiBottomNavigationAction-root': {
                color: 'text.secondary',
                minWidth: 'auto',
                padding: '8px 0',
                transition: 'all 0.2s ease',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '12px',
                  fontWeight: 500,
                  marginTop: '4px',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '22px',
                  padding: '4px 16px',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease',
                },
                '&.Mui-selected': {
                  color: 'text.primary',
                  '& .MuiBottomNavigationAction-label': {
                    fontWeight: 'bold',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'primary.main',
                    backgroundColor: 'secondary.container',
                  }
                }
              }
            }}
          >
            <BottomNavigationAction label="Dashboard" value="dashboard" icon={<DashboardIcon />} />
            <BottomNavigationAction label="Fast Entry" value="entry" icon={<AddCircleIcon />} />
            <BottomNavigationAction label="Reconcile" value="reconciliation" icon={<SyncAltIcon />} />
            <BottomNavigationAction label="Cycles" value="cycles" icon={<CalendarMonthIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
