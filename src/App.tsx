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
  Stack
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

import { appTheme } from './theme';
import { AuthScreen } from './features/auth/AuthScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { FastEntry } from './features/transactions/FastEntry';
import { Reconciliation } from './features/reconciliation/Reconciliation';
import { Cycles } from './features/cycles/Cycles';
import { Settings } from './features/settings/Settings';

import { authService } from './services/authService';
import { ledgerService } from './services/ledgerService';
import { cycleService } from './services/cycleService';
import { computeDashboard } from './services/selectors';
import { transactionService } from './services/transactionService';

import { UserProfile, Account, Category, BudgetCycle, FinanceTransaction } from './domain/financeTypes';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [displayRate, setDisplayRate] = useState<number>(50.0); // Default USD/EGP display exchange rate

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
    });
    return () => unsubscribe();
  }, []);

  // Fetch all data for household
  const loadLedgerData = async () => {
    if (!userProfile?.householdId) return;
    const hhId = userProfile.householdId;

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
      <Box sx={{ minHeight: '100vh', pb: 10, bgcolor: 'background.default' }}>
        {/* Top Navbar */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AddCircleIcon sx={{ color: 'primary.contrastText', fontSize: 28 }} />
              <Typography variant="h3" sx={{ color: 'primary.contrastText', fontWeight: 600 }}>
                Finance Ledger
              </Typography>
            </Stack>
            <Button 
              color="inherit" 
              startIcon={<LogoutIcon />} 
              onClick={handleLogout}
              size="small"
            >
              Sign Out
            </Button>
          </Toolbar>
        </AppBar>

        {/* Dynamic Content Views */}
        <Box sx={{ py: 2 }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              data={dashboardData}
              accounts={accounts}
              categories={categories}
              activeCycle={activeCycle}
              transactions={transactions}
              displayUsdToEgpRate={displayRate}
              onUpdateDisplayRate={(rate) => setDisplayRate(rate)}
              onVoidTransaction={handleVoidTransaction}
              onNavigateToFastEntry={() => setActiveTab('entry')}
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

          {activeTab === 'settings' && (
            <Settings
              householdId={userProfile.householdId}
              userId={userProfile.uid}
              categories={categories}
              accounts={accounts}
              onDataUpdated={loadLedgerData}
            />
          )}
        </Box>

        {/* Bottom Navigation for Mobile-first layout */}
        <Paper 
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderTop: '1px solid', borderColor: 'divider' }} 
          elevation={3}
        >
          <BottomNavigation
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            showLabels
          >
            <BottomNavigationAction label="Dashboard" value="dashboard" icon={<DashboardIcon />} />
            <BottomNavigationAction label="Fast Entry" value="entry" icon={<AddCircleIcon />} />
            <BottomNavigationAction label="Reconcile" value="reconciliation" icon={<SyncAltIcon />} />
            <BottomNavigationAction label="Cycles" value="cycles" icon={<CalendarMonthIcon />} />
            <BottomNavigationAction label="Settings" value="settings" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
