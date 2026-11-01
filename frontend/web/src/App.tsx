import { useMemo, Suspense } from 'react';
import { Routes, Route, BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@monochrome-ui/design-system';
import { createMonochromeTheme } from '@monochrome-ui/design-system';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useAppContext } from '@/hooks/useAppContext';
import { AppLoadingScreen } from '@/components/app-shell/AppLoadingScreen';
import { AppShell } from '@/components/app-shell/AppShell';
import { useNotifications } from '@/notifications/useNotifications';
import { SystemStatusPage } from '@/features/shared/components/SystemStatusPage';
import { AppErrorBoundary } from '@/features/shared/components/AppErrorBoundary';
import { AppUpdatePrompt } from '@/features/shared/updates/AppUpdatePrompt';
import { lazyWithRetry } from '@/libs/lazyWithRetry';

const AuthScreen = lazyWithRetry(() => import('@/features/auth/AuthScreen').then((m) => ({ default: m.AuthScreen })));
const Dashboard = lazyWithRetry(() => import('@/features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const FastEntry = lazyWithRetry(() => import('@/features/fast-entry/FastEntry').then((m) => ({ default: m.FastEntry })));
const Reconciliation = lazyWithRetry(() =>
  import('@/features/reconciliation/Reconciliation').then((m) => ({ default: m.Reconciliation })),
);
const BudgetCycles = lazyWithRetry(() =>
  import('@/features/budget-cycles/BudgetCycles').then((m) => ({ default: m.BudgetCycles })),
);
const CycleReport = lazyWithRetry(() =>
  import('@/features/budget-cycles/CycleReport').then((m) => ({ default: m.CycleReport })),
);
const Accounts = lazyWithRetry(() => import('@/features/accounts/Accounts').then((m) => ({ default: m.Accounts })));
const AccountStatements = lazyWithRetry(() =>
  import('@/features/accounts/AccountStatements').then((m) => ({ default: m.AccountStatements })),
);
const Household = lazyWithRetry(() => import('@/features/household/Household').then((m) => ({ default: m.Household })));
const Categories = lazyWithRetry(() => import('@/features/categories/Categories').then((m) => ({ default: m.Categories })));
const Notifications = lazyWithRetry(() =>
  import('@/features/notifications/Notifications').then((m) => ({ default: m.Notifications })),
);
const TransactionHistory = lazyWithRetry(() =>
  import('@/features/transactions/TransactionHistory').then((m) => ({ default: m.TransactionHistory })),
);
const ActivityHistory = lazyWithRetry(() =>
  import('@/features/activity/ActivityHistory').then((m) => ({ default: m.ActivityHistory })),
);
const PendingTransactions = lazyWithRetry(() =>
  import('@/features/pending-transactions/PendingTransactions').then((m) => ({ default: m.PendingTransactions })),
);
const AiAssistant = lazyWithRetry(() => import('@/features/ai/AiAssistant').then((m) => ({ default: m.AiAssistant })));
const Loans = lazyWithRetry(() => import('@/features/loans/Loans').then((m) => ({ default: m.Loans })));
const McpConsentPage = lazyWithRetry(() => import('@/features/mcp/McpConsentPage').then((m) => ({ default: m.McpConsentPage })));

const AUTHENTICATED_APP_PATHS = new Set([
  '/',
  '/entry',
  '/reconciliation',
  '/cycles',
  '/cycles/report',
  '/transactions',
  '/pending',
  '/activity',
  '/accounts',
  '/accounts/statements',
  '/household',
  '/categories',
  '/notifications',
  '/ai',
  '/loans',
]);

function SignedOutRoute() {
  const { pathname } = useLocation();
  return AUTHENTICATED_APP_PATHS.has(pathname) ? <AuthScreen /> : <SystemStatusPage status="notFound" />;
}

export default function App() {
  const { userProfile, householdId, isAuthLoading } = useAppContext();
  const { resolvedMode } = useThemeMode();
  const theme = useMemo(() => createMonochromeTheme(resolvedMode), [resolvedMode]);

  // Register FCM push notifications once the user has a household. Side-effect
  // only — this instance handles the logout-unregister and re-register-on-reload
  // paths. It does NOT auto-prompt (iOS requires a user gesture for that);
  // the Notifications settings page owns the prompt via its own instance.
  useNotifications(householdId);

  if (isAuthLoading) return <AppLoadingScreen theme={theme} />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppUpdatePrompt />
      <BrowserRouter>
        <Suspense fallback={<AppLoadingScreen theme={theme} />}>
          <AppErrorBoundary>
            <Routes>
              <Route
                path="/mcp/authorize"
                element={userProfile && householdId ? <McpConsentPage /> : <AuthScreen />}
              />
              {userProfile && householdId ? (
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="entry" element={<FastEntry />} />
                  <Route path="reconciliation" element={<Reconciliation />} />
                  <Route path="cycles" element={<BudgetCycles />} />
                  <Route path="cycles/report" element={<CycleReport />} />
                  <Route path="transactions" element={<TransactionHistory />} />
                  <Route path="pending" element={<PendingTransactions />} />
                  <Route path="activity" element={<ActivityHistory />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="accounts/statements" element={<AccountStatements />} />
                  <Route path="household" element={<Household />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="ai" element={<AiAssistant />} />
                  <Route path="loans" element={<Loans />} />
                </Route>
              ) : (
                <Route path="*" element={<SignedOutRoute />} />
              )}
              {userProfile && householdId && <Route path="*" element={<SystemStatusPage status="notFound" />} />}
            </Routes>
          </AppErrorBoundary>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
