// Mirrors src/domain/financeTypes.ts for server-side use.
// Kept separate so the functions package has no dependency on the client app.

export interface FinanceTransaction {
  id: string;
  householdId: string;
  type: 'income' | 'expense' | 'transfer' | 'conversion' | 'adjustment';
  date: string; // YYYY-MM-DD
  description?: string;
  categoryId?: string;
  budgetCycleId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'posted' | 'voided';
}

export interface LedgerLine {
  id: string;
  householdId: string;
  transactionId: string;
  accountId: string;
  signedAmount: number;
  currency: string;
  createdAt: string;
}

export interface BudgetCycle {
  id: string;
  householdId: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'open' | 'closed';
}

export interface BudgetAllocation {
  id: string;
  householdId: string;
  budgetCycleId: string;
  categoryId: string;
  plannedAmount: number;
  currency: string;
}

export interface NotificationSettings {
  userId: string;
  householdId: string;
  dailyReminderEnabled: boolean;
  categoryWarningEnabled: boolean;
}

export interface FcmToken {
  token: string;
  uid: string;
  deviceType: 'ios' | 'android' | 'web';
  createdAt: string;
  lastSeenAt: string;
}

export interface NotificationState {
  lastReminderSentDate?: string; // YYYY-MM-DD in user's tz
  lastWarningFor?: Record<string, string>; // `${categoryId}_${cycleId}` -> YYYY-MM-DD
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  householdId: string | null;
  householdIds?: string[];
  role: 'owner' | 'member';
}
