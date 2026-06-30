import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerLib } from '@/libs/ledger';
import { cyclesLib } from '@/libs/cycles';
import { transactionsLib } from '@/libs/transactions';
import { cardsLib, type CardInput } from '@/libs/cards';
import { auditLogLib } from '@/libs/auditLog';
import { authLib } from '@/libs/auth';
import { currencyLib } from '@/libs/currency';
import { useAppContext } from '@/hooks/useAppContext';
import { useSnackbar } from 'notistack';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { notifyOfflineAwareSuccess } from '@/lib/offlineToast';
import {
  Account,
  Category,
  BudgetCycle,
  FinanceTransaction,
  LedgerLine,
  BudgetAllocation,
  ExpectedIncome,
  Reconciliation,
  NotificationSettings,
  UserProfile,
  CurrencyCode,
  ConversionDetails,
  AuditLogEntry,
  Card,
  CardStatement,
} from '@/domain/financeTypes';

/**
 * Builds the audit user context (who performed the action) from the
 * authenticated profile. Returns undefined when no profile is available,
 * which gracefully disables audit logging for that call.
 */
function useAuditUser() {
  const { userProfile } = useAppContext();
  if (!userProfile) return undefined;
  return {
    uid: userProfile.uid,
    displayName: userProfile.displayName,
    photoURL: userProfile.photoURL,
  };
}

/**
 * Shared notifier for mutation onSuccess handlers. When offline, a successful
 * mutation means the Firestore SDK buffered the write locally — surface the
 * "will sync" toast so the user knows it wasn't lost.
 */
function useOfflineSuccessNotifier() {
  const isOnline = useOnlineStatus();
  const { enqueueSnackbar } = useSnackbar();
  return () => notifyOfflineAwareSuccess({ isOnline, enqueue: enqueueSnackbar });
}

// --- Queries ---

export function useAccounts(householdId: string) {
  return useQuery({
    queryKey: ['accounts', householdId],
    queryFn: () => ledgerLib.getAccounts(householdId),
    enabled: !!householdId,
  });
}

export function useCategories(householdId: string) {
  return useQuery({
    queryKey: ['categories', householdId],
    queryFn: () => ledgerLib.getCategories(householdId),
    enabled: !!householdId,
  });
}

export function useCycles(householdId: string) {
  return useQuery({
    queryKey: ['budgetCycles', householdId],
    queryFn: () => cyclesLib.getCycles(householdId),
    enabled: !!householdId,
  });
}

export function useTransactions(householdId: string, cycleId?: string) {
  return useQuery({
    queryKey: ['transactions', householdId, cycleId],
    queryFn: () => ledgerLib.getTransactions(householdId, cycleId),
    enabled: !!householdId,
  });
}

export function useLedgerLines(householdId: string, cycleId?: string) {
  return useQuery({
    queryKey: ['ledgerLines', householdId, cycleId],
    queryFn: () => ledgerLib.getLedgerLines(householdId, cycleId),
    enabled: !!householdId,
  });
}

export function useActiveCycle(householdId: string) {
  return useQuery({
    queryKey: ['activeCycle', householdId],
    queryFn: () => cyclesLib.getActiveCycle(householdId),
    enabled: !!householdId,
  });
}

export function useBudgetAllocations(householdId: string, cycleId: string | undefined) {
  return useQuery({
    queryKey: ['budgetAllocations', householdId, cycleId],
    queryFn: () => cyclesLib.getBudgetAllocations(householdId, cycleId!),
    enabled: !!householdId && !!cycleId,
  });
}

export function useExpectedIncomes(householdId: string, cycleId: string | undefined) {
  return useQuery({
    queryKey: ['expectedIncome', householdId, cycleId],
    queryFn: () => cyclesLib.getExpectedIncomes(householdId, cycleId!),
    enabled: !!householdId && !!cycleId,
  });
}

export function useReconciliationHistory(householdId: string) {
  return useQuery({
    queryKey: ['reconciliations', householdId],
    queryFn: () => ledgerLib.getReconciliations(householdId),
    enabled: !!householdId,
  });
}

export function useNotificationSettings(householdId: string, userId: string) {
  return useQuery({
    queryKey: ['notificationSettings', householdId, userId],
    queryFn: () => ledgerLib.getNotificationSettings(householdId, userId),
    enabled: !!householdId && !!userId,
  });
}

export function useCards(householdId: string) {
  return useQuery({
    queryKey: ['cards', householdId],
    queryFn: () => cardsLib.getCards(householdId),
    enabled: !!householdId,
  });
}

export function useCardStatements(householdId: string, cardId?: string) {
  return useQuery({
    queryKey: ['cardStatements', householdId, cardId],
    queryFn: () => cardsLib.getStatements(householdId, cardId),
    enabled: !!householdId,
  });
}

export function useUsdRate() {
  return useQuery({
    queryKey: ['usdToEgpRate'],
    queryFn: () => currencyLib.getUsdToEgpRate(),
    staleTime: 1000 * 60 * 15, // 15 mins cache
  });
}

export function useHouseholdName(householdId: string) {
  return useQuery({
    queryKey: ['householdName', householdId],
    queryFn: () => ledgerLib.getHouseholdName(householdId),
    enabled: !!householdId,
  });
}

export function useUserHouseholds(userProfile: UserProfile | null) {
  return useQuery({
    queryKey: ['userHouseholds', userProfile?.householdIds],
    queryFn: async () => {
      if (!userProfile?.householdIds) return [];
      return Promise.all(
        userProfile.householdIds.map(async (id) => {
          const info = await ledgerLib.getHouseholdInfo(id);
          return info || {
            id,
            name: `Household (${id})`,
            baseCurrency: 'EGP' as const,
            createdAt: '',
            createdBy: ''
          };
        })
      );
    },
    enabled: !!userProfile?.householdIds,
  });
}

export function useAuditLog(householdId: string, count: number = 50) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!householdId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsubscribe = auditLogLib.subscribeToLogs(householdId, count, (next) => {
      setEntries(next);
      setIsLoading(false);
      setError(null);
    });
    return () => {
      unsubscribe();
      // Reset when the household/count subscription changes so we don't show
      // stale entries from a previous household while the new one loads.
      setEntries([]);
      setIsLoading(true);
    };
  }, [householdId, count]);

  // When no household is selected, derive an empty (non-loading) result rather
  // than calling setState synchronously inside the effect body.
  const activeEntries = householdId ? entries : [];
  const activeLoading = householdId ? isLoading : false;

  return { data: activeEntries, entries: activeEntries, isLoading: activeLoading, error };
}

const LAST_SEEN_KEY_PREFIX = 'finance_activity_last_seen_';

function getLastSeenKey(householdId: string, userId: string) {
  return `${LAST_SEEN_KEY_PREFIX}${householdId}_${userId}`;
}

/**
 * Subscribes to localStorage so last-seen stays in sync across tabs and when
 * the active household/user changes. Uses useSyncExternalStore to avoid the
 * "setState in effect" anti-pattern.
 */
function useLastSeen(householdId: string, userId: string | undefined): [string, (value: string) => void] {
  const { userProfile, updateUserProfile } = useAppContext();
  const key = householdId && userId ? getLastSeenKey(householdId, userId) : null;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!key) return () => {};
      window.addEventListener('storage', onStoreChange);
      return () => window.removeEventListener('storage', onStoreChange);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    if (!key) return '';
    return localStorage.getItem(key) || '';
  }, [key]);

  const lastSeen = useSyncExternalStore(subscribe, getSnapshot, () => '');

  // Keep localStorage in sync with userProfile.lastSeenActivities from Firestore
  useEffect(() => {
    if (!key || !householdId || !userProfile?.lastSeenActivities?.[householdId]) return;
    const local = localStorage.getItem(key);
    const profileVal = userProfile.lastSeenActivities[householdId];
    if (profileVal && profileVal > (local || '')) {
      localStorage.setItem(key, profileVal);
      // Dispatch storage event to trigger update in useSyncExternalStore across components/tabs
      window.dispatchEvent(new StorageEvent('storage', { key }));
    }
  }, [key, householdId, userProfile?.lastSeenActivities]);

  const setLastSeen = useCallback((value: string) => {
    if (!key) return;
    localStorage.setItem(key, value);
    // useSyncExternalStore can't observe same-tab writes, so dispatch a
    // synthetic 'storage' event to re-trigger the subscription.
    window.dispatchEvent(new StorageEvent('storage', { key }));

    if (userId && householdId) {
      authLib.updateLastSeenActivity(userId, householdId, value)
        .then((updatedProfile) => {
          if (updatedProfile) {
            updateUserProfile(updatedProfile);
          }
        })
        .catch((err) => {
          console.error('Failed to update last seen activity in firestore:', err);
        });
    }
  }, [key, userId, householdId, updateUserProfile]);

  return [lastSeen, setLastSeen];
}

/**
 * Tracks how many audit entries were created by OTHER household members since
 * the current user last viewed the activity feed. Used to drive the bell badge.
 */
export function useUnreadActivityCount(householdId: string, userId: string | undefined) {
  const { entries } = useAuditLog(householdId, 50);
  const [lastSeen, setLastSeen] = useLastSeen(householdId, userId);

  const unreadCount = entries.filter(
    (e) => e.userId !== userId && e.createdAt > lastSeen
  ).length;

  const markSeen = useCallback(() => {
    setLastSeen(new Date().toISOString());
  }, [setLastSeen]);

  return { unreadCount, markSeen };
}

// --- Mutations ---

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      transaction: Omit<FinanceTransaction, 'id' | 'householdId' | 'createdAt' | 'updatedAt' | 'status'>;
      lines: Omit<LedgerLine, 'id' | 'householdId' | 'transactionId' | 'createdAt'>[];
      conversionDetails?: Omit<ConversionDetails, 'transactionId'>;
    }) => transactionsLib.createTransaction(data.householdId, data.transaction, data.lines, data.conversionDetails, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['ledgerLines', variables.householdId] });
    },
  });
}

export function useVoidTransactionMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: { householdId: string; transactionId: string }) =>
      transactionsLib.voidTransaction(data.householdId, data.transactionId, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['ledgerLines', variables.householdId] });
    },
  });
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      transactionId: string;
      transactionUpdates: Partial<FinanceTransaction>;
      lineUpdates: { accountId: string; signedAmount: number; currency: CurrencyCode };
    }) => transactionsLib.updateTransaction(
      data.householdId,
      data.transactionId,
      data.transactionUpdates,
      data.lineUpdates,
      auditUser
    ),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['ledgerLines', variables.householdId] });
    },
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      account: Omit<Account, 'id' | 'householdId' | 'createdAt'>;
    }) => ledgerLib.createAccount(data.householdId, data.account, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.householdId] });
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      accountId: string;
      updated: Account;
    }) => ledgerLib.updateAccount(data.householdId, data.accountId, data.updated, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.householdId] });
    },
  });
}

export function useCreateDebitCardMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: { householdId: string; card: CardInput; accounts: Account[] }) =>
      cardsLib.createDebitCard(data.householdId, data.card, data.accounts, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['cards', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.householdId] });
    },
  });
}

export function useCreateCreditCardMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: { householdId: string; card: CardInput; accounts: Account[]; sortOrder: number }) =>
      cardsLib.createCreditCard(data.householdId, data.card, data.accounts, data.sortOrder, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['cards', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.householdId] });
    },
  });
}

export function useUpdateCardMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: { householdId: string; cardId: string; updates: Partial<Card>; accounts: Account[] }) =>
      cardsLib.updateCard(data.householdId, data.cardId, data.updates, data.accounts, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['cards', variables.householdId] });
    },
  });
}

export function useMarkAsPaidMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: { householdId: string; statement: CardStatement; card: Card; amount: number }) =>
      cardsLib.markAsPaid(data.householdId, data.statement, data.card, data.amount, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['ledgerLines', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['cardStatements', variables.householdId] });
    },
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      category: Omit<Category, 'id' | 'householdId' | 'createdAt'>;
    }) => ledgerLib.createCategory(data.householdId, data.category, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['categories', variables.householdId] });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      categoryId: string;
      updates: Partial<Pick<Category, 'name' | 'isActive'>>;
    }) => ledgerLib.updateCategory(data.householdId, data.categoryId, data.updates, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['categories', variables.householdId] });
    },
  });
}

export function useCreateCycleMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      cycle: Omit<BudgetCycle, 'id' | 'householdId'>;
    }) => cyclesLib.createCycle(data.householdId, data.cycle, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['budgetCycles', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['activeCycle', variables.householdId] });
    },
  });
}

export function useUpdateCycleStatusMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      cycleId: string;
      status: 'planned' | 'open' | 'closed';
      extra?: Partial<BudgetCycle>;
    }) => cyclesLib.updateCycleStatus(data.householdId, data.cycleId, data.status, data.extra, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['budgetCycles', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['activeCycle', variables.householdId] });
    },
  });
}

export function useSaveAllocationMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      allocation: Omit<BudgetAllocation, 'id' | 'householdId'>;
    }) => cyclesLib.saveBudgetAllocation(data.householdId, data.allocation, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['budgetAllocations', variables.householdId, variables.allocation.budgetCycleId] });
    },
  });
}

export function useSaveAllocationsBatchMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      cycleId: string;
      allocations: Omit<BudgetAllocation, 'id' | 'householdId'>[];
    }) => cyclesLib.saveBudgetAllocationsBatch(data.householdId, data.allocations, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['budgetAllocations', variables.householdId, variables.cycleId] });
    },
  });
}

export function useSaveExpectedIncomeMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      income: Omit<ExpectedIncome, 'id' | 'householdId'>;
    }) => cyclesLib.saveExpectedIncome(data.householdId, data.income, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['expectedIncome', variables.householdId, variables.income.budgetCycleId] });
    },
  });
}

export function useUpdateNotificationSettingsMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      userId: string;
      settings: NotificationSettings;
    }) => ledgerLib.updateNotificationSettings(data.householdId, data.userId, data.settings, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', variables.householdId, variables.userId] });
    },
  });
}

export function useSaveReconciliationMutation() {
  const queryClient = useQueryClient();
  const auditUser = useAuditUser();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      reconId: string;
      reconLog: Reconciliation;
    }) => ledgerLib.createReconciliation(data.householdId, data.reconId, data.reconLog, auditUser),
    onSuccess: (_, variables) => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['reconciliations', variables.householdId] });
    },
  });
}

export function useCreateHouseholdMutation() {
  const queryClient = useQueryClient();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      name: string;
    }) => authLib.createHousehold(data.userId, data.name),
    onSuccess: () => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['userHouseholds'] });
    },
  });
}

export function useJoinHouseholdMutation() {
  const queryClient = useQueryClient();
  const notifyOfflineSuccess = useOfflineSuccessNotifier();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      householdId: string;
    }) => authLib.joinHousehold(data.userId, data.householdId),
    onSuccess: () => {
      notifyOfflineSuccess();
      queryClient.invalidateQueries({ queryKey: ['userHouseholds'] });
    },
  });
}

export function useAllBudgetAllocations(householdId: string) {
  return useQuery({
    queryKey: ['allBudgetAllocations', householdId],
    queryFn: () => cyclesLib.getAllBudgetAllocations(householdId),
    enabled: !!householdId,
  });
}

export function useAllExpectedIncomes(householdId: string) {
  return useQuery({
    queryKey: ['allExpectedIncomes', householdId],
    queryFn: () => cyclesLib.getAllExpectedIncomes(householdId),
    enabled: !!householdId,
  });
}
