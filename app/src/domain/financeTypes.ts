/**
 * ISO 4217 currency code as a plain string (e.g. 'EGP', 'USD', 'SAR', 'AED', 'EUR').
 * Kept as a string alias rather than a fixed union so the app supports any
 * currency without code changes. The curated list users pick from lives in
 * `app/src/libs/currencyMeta.ts`.
 */
export type CurrencyCode = string;

export type AccountType = 'running' | 'savings' | 'cash' | 'wallet' | 'credit' | 'adjustment';

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
  photoURL?: string;
  lastSeenActivities?: Record<string, string>;
};

export type Household = {
  id: string;
  name: string;
  baseCurrency: CurrencyCode;
  createdAt: string;
  createdBy: string;
};

export type JoinStatus = 'pending' | 'approved' | 'rejected';

export type JoinRequest = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  status: JoinStatus;
  requestedAt: number;
  decidedAt?: number;
  decidedBy?: string;
};

/**
 * Slim member shape returned by the listHouseholdMembers Callable.
 * Server returns only what the UI needs (no secrets).
 */
export type HouseholdMember = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  isOwner: boolean;
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

export type CardKind = 'debit' | 'credit';
export type CardNetwork = 'visa' | 'mastercard' | 'meeza' | 'other';
export type CardStatementStatus = 'pending' | 'partial' | 'paid';

export type Card = {
  id: string;
  householdId: string;
  kind: CardKind;
  parentAccountId: string;          // REQUIRED. debit → running/savings account; credit → credit account.
  name: string;
  last4?: string;
  network?: CardNetwork;
  bankId: string;                    // e.g. 'hsbc' | 'cib' | 'nbe' | 'other'
  tierId?: string;                   // e.g. 'premier' | 'platinum' | 'classic'
  expiryMonth?: number;             // 1–12
  expiryYear?: number;              // e.g. 2027
  isActive: boolean;
  createdAt: string;
  // Credit only:
  creditLimit?: number;
  paymentAccountId?: string;        // default source account for "Mark as paid"
  currency: CurrencyCode;           // must equal paymentAccountId's currency
};

export type CardStatement = {
  id: string;
  householdId: string;
  cardId: string;
  creditAccountId: string;          // denormalized for query
  statementDate: string;            // ISO date user entered (cycle close)
  statementBalance: number;         // user-entered bill amount
  minPayment?: number;
  dueDate: string;                  // ISO date user entered
  status: CardStatementStatus;
  paymentTransactionId?: string;    // linked transfer(s) — see markAsPaid
  notifiedCardExpiryAt?: string;    // sentinel so expiry push fires once
  createdAt: string;
};

export type FinanceTransaction = {
  id: string;
  householdId: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  description?: string | null;
  categoryId?: string | null;
  budgetCycleId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'posted' | 'voided';
  revisionOf?: string | null;
  // For card-payment transfers only: the expense transaction id(s) this payment
  // settles on the credit account. Lets the UI show a charge as "paid" as a
  // recorded fact instead of guessing via FIFO amount allocation.
  settlesChargeIds?: string[] | null;
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
  endDate?: string | null;  // YYYY-MM-DD
  status: BudgetCycleStatus;
  salaryTransactionId?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  revisedAt?: string | null;
};

export type Category = {
  id: string;
  householdId: string;
  name: string;
  type: 'income' | 'expense';
  isActive: boolean;
  parentCategoryId?: string | null;
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
  notes?: string | null;
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
  receivedTransactionId?: string | null;
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
  adjustmentTransactionId?: string | null;
  note?: string | null;
};

export type NotificationSettings = {
  userId: string;
  householdId: string;
  dailyReminderEnabled: boolean;
  categoryWarningEnabled: boolean;
  cardExpiryWarningEnabled: boolean;
  joinRequestEnabled: boolean;
};

export type AuditAction =
  | 'transaction_created'
  | 'transaction_voided'
  | 'transaction_updated'
  | 'account_created'
  | 'account_updated'
  | 'category_created'
  | 'category_updated'
  | 'cycle_created'
  | 'cycle_status_changed'
  | 'allocation_saved'
  | 'allocations_batch_saved'
  | 'expected_income_saved'
  | 'reconciliation_created'
  | 'notification_settings_updated'
  | 'household_joined'
  | 'household_left';

export type AuditLogEntry = {
  id: string;
  householdId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  action: AuditAction;
  summary: string;
  details?: Record<string, any>;
  createdAt: string;
};
