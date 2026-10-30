export const financeQueryKeys = {
  accounts: (householdId: string) => ['accounts', householdId] as const,
  activeCycle: (householdId: string) => ['activeCycle', householdId] as const,
  allocations: (householdId: string, cycleId?: string) => ['budgetAllocations', householdId, cycleId] as const,
  cards: (householdId: string) => ['cards', householdId] as const,
  cardStatements: (householdId: string, cardId?: string) => ['cardStatements', householdId, cardId] as const,
  categories: (householdId: string) => ['categories', householdId] as const,
  cycles: (householdId: string) => ['budgetCycles', householdId] as const,
  expectedIncome: (householdId: string, cycleId?: string) => ['expectedIncome', householdId, cycleId] as const,
  ledgerLines: (householdId: string, cycleId?: string) => {
    // getLedgerLines returns all cycles. Share that data and invalidate it once
    // instead of downloading the same history under separate cycle keys.
    void cycleId;
    return ['ledgerLines', householdId] as const;
  },
  loans: (householdId: string) => ['loans', householdId] as const,
  pendingMessages: (householdId: string) => ['pendingFinancialMessages', householdId] as const,
  reconciliations: (householdId: string) => ['reconciliations', householdId] as const,
  resolvedMessages: (householdId: string) => ['resolvedPendingFinancialMessages', householdId] as const,
  transactions: (householdId: string, cycleId?: string) =>
    cycleId ? (['transactions', householdId, cycleId] as const) : (['transactions', householdId] as const),
} as const;
