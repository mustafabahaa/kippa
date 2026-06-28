export type CurrencyCode = 'EGP' | 'USD';

export type AccountType = 'cash' | 'bank' | 'wallet' | 'card' | 'adjustment';

export type TransactionType = 'income' | 'expense' | 'transfer' | 'conversion' | 'adjustment';

export type BudgetCycleStatus = 'planned' | 'open' | 'closed';

export type UserRole = 'owner' | 'member';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  householdId: string | null;
  householdIds?: string[];
  role: UserRole;
  createdAt: string;
};

export type Household = {
  id: string;
  name: string;
  baseCurrency: CurrencyCode;
  createdAt: string;
  createdBy: string;
};

export type Account = {
  id: string;
  householdId: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export type FinanceTransaction = {
  id: string;
  householdId: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  description?: string;
  categoryId?: string;
  budgetCycleId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'posted' | 'voided';
  revisionOf?: string;
};

export type LedgerLine = {
  id: string;
  householdId: string;
  transactionId: string;
  accountId: string;
  signedAmount: number; // Positive is in, negative is out
  currency: CurrencyCode;
  createdAt: string;
};

export type ConversionDetails = {
  transactionId: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  effectiveRate: number;
  rateSource: 'manual' | 'bank' | 'expected' | 'api';
};

export type BudgetCycle = {
  id: string;
  householdId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  status: BudgetCycleStatus;
  salaryTransactionId?: string;
  closedAt?: string;
  closedBy?: string;
  revisedAt?: string;
};

export type Category = {
  id: string;
  householdId: string;
  name: string;
  type: 'income' | 'expense';
  isActive: boolean;
  parentCategoryId?: string;
  createdAt: string;
};

export type BudgetAllocation = {
  id: string;
  householdId: string;
  budgetCycleId: string;
  categoryId: string;
  plannedAmount: number;
  currency: CurrencyCode;
  carryLeftover: boolean;
  notes?: string;
};

export type ExpectedIncome = {
  id: string;
  householdId: string;
  budgetCycleId: string;
  expectedDate: string;
  amount: number;
  currency: CurrencyCode;
  expectedRateToBaseCurrency: number;
  label: string;
  status: 'expected' | 'received' | 'cancelled';
  receivedTransactionId?: string;
};

export type ExchangeRate = {
  id: string;
  householdId: string;
  date: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  source: 'manual' | 'bank' | 'api' | 'expected';
  createdAt: string;
};

export type Reconciliation = {
  id: string;
  householdId: string;
  accountId: string;
  date: string;
  calculatedBalance: number;
  actualBalance: number;
  difference: number;
  currency: CurrencyCode;
  createdBy: string;
  createdAt: string;
  adjustmentTransactionId?: string;
  note?: string;
};

export type NotificationSettings = {
  userId: string;
  householdId: string;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:MM
  timezone: string;
  categoryWarningEnabled: boolean;
  savingWarningEnabled: boolean;
  cycleCloseReminderEnabled: boolean;
};
