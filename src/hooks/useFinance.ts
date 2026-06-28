import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerLib } from '../libs/ledger';
import { cyclesLib } from '../libs/cycles';
import { transactionsLib } from '../libs/transactions';
import { authLib } from '../libs/auth';
import { currencyLib } from '../libs/currency';
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
  ConversionDetails
} from '../domain/financeTypes';

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

export function useTransactions(householdId: string) {
  return useQuery({
    queryKey: ['transactions', householdId],
    queryFn: () => ledgerLib.getTransactions(householdId),
    enabled: !!householdId,
  });
}

export function useLedgerLines(householdId: string) {
  return useQuery({
    queryKey: ['ledgerLines', householdId],
    queryFn: () => ledgerLib.getLedgerLines(householdId),
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

// --- Mutations ---

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      transaction: Omit<FinanceTransaction, 'id' | 'householdId' | 'createdAt' | 'updatedAt' | 'status'>;
      lines: Omit<LedgerLine, 'id' | 'householdId' | 'transactionId' | 'createdAt'>[];
      conversionDetails?: Omit<ConversionDetails, 'transactionId'>;
    }) => transactionsLib.createTransaction(data.householdId, data.transaction, data.lines, data.conversionDetails),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['ledgerLines', variables.householdId] });
    },
  });
}

export function useVoidTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { householdId: string; transactionId: string }) => 
      transactionsLib.voidTransaction(data.householdId, data.transactionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['ledgerLines', variables.householdId] });
    },
  });
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
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
      data.lineUpdates
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['ledgerLines', variables.householdId] });
    },
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      account: Omit<Account, 'id' | 'householdId' | 'createdAt'>;
    }) => ledgerLib.createAccount(data.householdId, data.account),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.householdId] });
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      accountId: string;
      updated: Account;
    }) => ledgerLib.updateAccount(data.householdId, data.accountId, data.updated),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.householdId] });
    },
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      category: Omit<Category, 'id' | 'householdId' | 'createdAt'>;
    }) => ledgerLib.createCategory(data.householdId, data.category),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.householdId] });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      categoryId: string;
      updates: Partial<Pick<Category, 'name' | 'isActive'>>;
    }) => ledgerLib.updateCategory(data.householdId, data.categoryId, data.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.householdId] });
    },
  });
}

export function useCreateCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      cycle: Omit<BudgetCycle, 'id' | 'householdId'>;
    }) => cyclesLib.createCycle(data.householdId, data.cycle),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetCycles', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['activeCycle', variables.householdId] });
    },
  });
}

export function useUpdateCycleStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      cycleId: string;
      status: 'planned' | 'open' | 'closed';
      extra?: Partial<BudgetCycle>;
    }) => cyclesLib.updateCycleStatus(data.householdId, data.cycleId, data.status, data.extra),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetCycles', variables.householdId] });
      queryClient.invalidateQueries({ queryKey: ['activeCycle', variables.householdId] });
    },
  });
}

export function useSaveAllocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      allocation: Omit<BudgetAllocation, 'id' | 'householdId'>;
    }) => cyclesLib.saveBudgetAllocation(data.householdId, data.allocation),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetAllocations', variables.householdId, variables.allocation.budgetCycleId] });
    },
  });
}

export function useSaveAllocationsBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      cycleId: string;
      allocations: Omit<BudgetAllocation, 'id' | 'householdId'>[];
    }) => cyclesLib.saveBudgetAllocationsBatch(data.householdId, data.allocations),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetAllocations', variables.householdId, variables.cycleId] });
    },
  });
}

export function useSaveExpectedIncomeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      income: Omit<ExpectedIncome, 'id' | 'householdId'>;
    }) => cyclesLib.saveExpectedIncome(data.householdId, data.income),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expectedIncome', variables.householdId, variables.income.budgetCycleId] });
    },
  });
}

export function useUpdateNotificationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      userId: string;
      settings: NotificationSettings;
    }) => ledgerLib.updateNotificationSettings(data.householdId, data.userId, data.settings),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', variables.householdId, variables.userId] });
    },
  });
}

export function useSaveReconciliationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      householdId: string;
      reconId: string;
      reconLog: Reconciliation;
    }) => ledgerLib.createReconciliation(data.householdId, data.reconId, data.reconLog),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations', variables.householdId] });
    },
  });
}

export function useCreateHouseholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      name: string;
    }) => authLib.createHousehold(data.userId, data.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userHouseholds'] });
    },
  });
}

export function useJoinHouseholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      householdId: string;
    }) => authLib.joinHousehold(data.userId, data.householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userHouseholds'] });
    },
  });
}
