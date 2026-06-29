import { useMemo } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme';
import { useThemeMode } from './hooks/useThemeMode';
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
import { DotGridBackground } from './features/shared/components/DotGrid';
import { useAppContext } from './hooks/useAppContext';
import { AppLoadingScreen } from './components/app-shell/AppLoadingScreen';
import { AppShell } from './components/app-shell/AppShell';

export default function App() {
  const { userProfile, householdId, isAuthLoading } = useAppContext();
  const { resolvedMode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  if (isAuthLoading) return <AppLoadingScreen theme={theme} />;

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DotGridBackground />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="entry" element={<FastEntry />} />
            <Route path="reconciliation" element={<Reconciliation />} />
            <Route path="cycles" element={<BudgetCycles />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="activity" element={<AuditLog />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="household" element={<Household />} />
            <Route path="categories" element={<Categories />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
