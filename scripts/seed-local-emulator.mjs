import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'demo-kippa-local';
const userId = 'kippa-visual-demo';
const householdId = 'demo-household';

if (process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIRESTORE_EMULATOR_HOST.includes('127.0.0.1')) {
  throw new Error('Refusing to seed a non-local Firestore host.');
}
if (process.env.FIREBASE_AUTH_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST.includes('127.0.0.1')) {
  throw new Error('Refusing to seed a non-local Auth host.');
}

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = projectId;

const app = initializeApp({ projectId }, 'kippa-local-seed');
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await auth.getUser(userId);
} catch {
  await auth.createUser({
    uid: userId,
    email: 'demo@kippa.local',
    password: 'local-demo-only-password',
    displayName: 'Demo User',
    emailVerified: true,
  });
}
await auth.updateUser(userId, {
  email: 'demo@kippa.local',
  password: 'local-demo-only-password',
  displayName: 'Demo User',
  emailVerified: true,
});
await auth.setCustomUserClaims(userId, { kippaAccess: true });

const now = '2026-11-19T00:00:00.000Z';
const household = {
  id: householdId,
  name: 'Demo Household',
  baseCurrency: 'EGP',
  createdAt: now,
  createdBy: userId,
};

const batch = db.batch();
batch.set(db.doc(`users/${userId}`), {
  uid: userId,
  displayName: 'Demo User',
  email: 'demo@kippa.local',
  householdId,
  householdIds: [householdId],
  role: 'owner',
  createdAt: now,
});
batch.set(db.doc(`households/${householdId}/householdInfo/info`), household);

const categories = [
  { id: 'demo-income-salary', name: 'Salary', type: 'income', isActive: true },
  { id: 'demo-expense-housing', name: 'Housing & bills', type: 'expense', isActive: true, essential: true },
  { id: 'demo-expense-groceries', name: 'Groceries', type: 'expense', isActive: true, essential: true },
  { id: 'demo-expense-transport', name: 'Transport', type: 'expense', isActive: true, essential: true },
  { id: 'demo-expense-health', name: 'Health', type: 'expense', isActive: true, essential: true },
  { id: 'demo-expense-fun', name: 'Eating out', type: 'expense', isActive: true },
  { id: 'demo-expense-over-budget', name: 'Demo over budget', type: 'expense', isActive: true },
  { id: 'demo-expense-source', name: 'Demo source category', type: 'expense', isActive: true },
  { id: 'demo-expense-target', name: 'Demo target category', type: 'expense', isActive: true },
  { id: 'demo-expense-unused', name: 'Unused demo category', type: 'expense', isActive: true },
];
for (const category of categories) {
  batch.set(db.doc(`households/${householdId}/categories/${category.id}`), {
    ...category,
    householdId,
    createdAt: now,
  });
}

batch.set(db.doc(`households/${householdId}/accounts/demo-account`), {
  id: 'demo-account',
  householdId,
  name: 'Demo checking account',
  type: 'running',
  currency: 'EGP',
  isActive: true,
  sortOrder: 1,
  createdAt: now,
});
batch.set(db.doc(`households/${householdId}/budgetCycles/demo-cycle`), {
  id: 'demo-cycle',
  householdId,
  name: 'Demo November',
  startDate: '2026-11-01',
  endDate: '2026-11-30',
  status: 'open',
  salaryTransactionId: 'demo-income-november',
});

// Additional linked records make the local demo useful for reviewing the main
// product surfaces. Every document below is synthetic and lives only in the
// demo-kippa-local emulator project.
const seedDoc = (collectionName, id, data) =>
  batch.set(db.doc(`households/${householdId}/${collectionName}/${id}`), data);

seedDoc('accounts', 'demo-savings-account', {
  id: 'demo-savings-account', householdId, name: 'Demo savings', type: 'savings', currency: 'EGP',
  isActive: true, sortOrder: 2, createdAt: now,
});
seedDoc('accounts', 'demo-credit-account', {
  id: 'demo-credit-account', householdId, name: 'Demo credit card balance', type: 'credit', currency: 'EGP',
  isActive: true, sortOrder: 3, createdAt: now,
});

seedDoc('cards', 'demo-debit-card', {
  id: 'demo-debit-card', householdId, kind: 'debit', parentAccountId: 'demo-account', name: 'Everyday debit',
  last4: '1842', network: 'visa', bankId: 'other', tierId: 'classic', expiryMonth: 8, expiryYear: 2028,
  isActive: true, currency: 'EGP', createdAt: now,
});
seedDoc('cards', 'demo-credit-card', {
  id: 'demo-credit-card', householdId, kind: 'credit', parentAccountId: 'demo-credit-account',
  name: 'Demo rewards card', last4: '6407', network: 'mastercard', bankId: 'other', tierId: 'classic',
  expiryMonth: 3, expiryYear: 2029, isActive: true, currency: 'EGP', creditLimit: 30000,
  paymentAccountId: 'demo-account', createdAt: now,
});

seedDoc('budgetCycles', 'demo-cycle-closed', {
  id: 'demo-cycle-closed', householdId, name: 'Demo October', startDate: '2026-10-01', endDate: '2026-10-31',
  status: 'closed', salaryTransactionId: 'demo-income-october', closedAt: '2026-11-01T08:00:00.000Z',
  closedBy: userId,
});
seedDoc('budgetCycles', 'demo-cycle-planned', {
  id: 'demo-cycle-planned', householdId, name: 'Demo December', startDate: '2026-12-01', endDate: '2026-12-31',
  status: 'planned',
});

const transaction = (id, type, date, description, categoryId, budgetCycleId, extra = {}) => ({
  id, householdId, type, date, description, categoryId, budgetCycleId, createdBy: userId,
  createdAt: now, updatedAt: now, status: 'posted', ...extra,
});
const ledgerLine = (id, transactionId, accountId, signedAmount) => ({
  id, householdId, transactionId, accountId, signedAmount, currency: 'EGP', createdAt: now,
});
const addTransaction = (tx, lines) => {
  seedDoc('transactions', tx.id, tx);
  lines.forEach((line) => seedDoc('ledgerLines', line.id, line));
};

addTransaction(
  transaction('demo-income-november', 'income', '2026-11-01', 'Monthly salary', 'demo-income-salary', 'demo-cycle'),
  [ledgerLine('demo-line-income-november', 'demo-income-november', 'demo-account', 32000)],
);
addTransaction(
  transaction('demo-housing-november', 'expense', '2026-11-03', 'Rent and utilities', 'demo-expense-housing', 'demo-cycle'),
  [ledgerLine('demo-line-housing-november', 'demo-housing-november', 'demo-account', -8500)],
);
addTransaction(
  transaction('demo-groceries-november', 'expense', '2026-11-05', 'Weekly groceries', 'demo-expense-groceries', 'demo-cycle'),
  [ledgerLine('demo-line-groceries-november', 'demo-groceries-november', 'demo-account', -1450)],
);
addTransaction(
  transaction('demo-transport-november', 'expense', '2026-11-07', 'Fuel and parking', 'demo-expense-transport', 'demo-cycle'),
  [ledgerLine('demo-line-transport-november', 'demo-transport-november', 'demo-account', -620)],
);
addTransaction(
  transaction('demo-health-november', 'expense', '2026-11-09', 'Pharmacy', 'demo-expense-health', 'demo-cycle'),
  [ledgerLine('demo-line-health-november', 'demo-health-november', 'demo-account', -285)],
);
addTransaction(
  transaction('demo-over-budget-november', 'expense', '2026-11-11', 'Unexpected home repair', 'demo-expense-over-budget', 'demo-cycle'),
  [ledgerLine('demo-line-over-budget-november', 'demo-over-budget-november', 'demo-account', -1200)],
);
addTransaction(
  transaction('demo-dining-november', 'expense', '2026-11-10', 'Dinner with friends', 'demo-expense-fun', 'demo-cycle'),
  [ledgerLine('demo-line-dining-november', 'demo-dining-november', 'demo-credit-account', -1600)],
);
addTransaction(
  transaction('demo-card-payment-november', 'transfer', '2026-11-12', 'Card payment — dinner', null, 'demo-cycle', {
    settlesChargeIds: ['demo-dining-november'],
  }),
  [
    ledgerLine('demo-line-card-payment-checking', 'demo-card-payment-november', 'demo-account', -500),
    ledgerLine('demo-line-card-payment-credit', 'demo-card-payment-november', 'demo-credit-account', 500),
  ],
);
addTransaction(
  transaction('demo-savings-transfer-november', 'transfer', '2026-11-14', 'Monthly savings', null, 'demo-cycle'),
  [
    ledgerLine('demo-line-savings-out', 'demo-savings-transfer-november', 'demo-account', -3000),
    ledgerLine('demo-line-savings-in', 'demo-savings-transfer-november', 'demo-savings-account', 3000),
  ],
);

const loanId = 'demo-loan-appliance';
seedDoc('loans', loanId, {
  id: loanId, householdId, name: 'Home appliance loan', currency: 'EGP', originalTotal: 12000,
  installmentAmount: 2000, totalInstallments: 6, openingPaidInstallments: 1, openingPaidAmount: 2000,
  firstPaymentDate: '2026-10-15', dueDay: 15, graceDay: 20, paymentAccountId: 'demo-account',
  status: 'active', notes: 'Demo loan for previewing installments.', createdAt: now, updatedAt: now,
});
addTransaction(
  transaction('demo-loan-payment-november', 'expense', '2026-11-15', 'Home appliance loan — installment 2/6', null, 'demo-cycle', {
    loanId, loanInstallmentNumber: 2,
  }),
  [ledgerLine('demo-line-loan-payment', 'demo-loan-payment-november', 'demo-account', -2000)],
);
seedDoc('loans', 'demo-loan-paid', {
  id: 'demo-loan-paid', householdId, name: 'Demo paid loan', currency: 'EGP', originalTotal: 3000,
  installmentAmount: 1000, totalInstallments: 3, openingPaidInstallments: 3, openingPaidAmount: 3000,
  firstPaymentDate: '2026-05-10', dueDay: 10, graceDay: null, paymentAccountId: 'demo-account',
  status: 'paid', notes: null, createdAt: now, updatedAt: now,
});

seedDoc('cardStatements', 'demo-statement-november', {
  id: 'demo-statement-november', householdId, cardId: 'demo-credit-card', creditAccountId: 'demo-credit-account',
  statementDate: '2026-11-10', statementBalance: 1600, minPayment: 160, dueDate: '2026-11-25',
  status: 'partial', createdAt: now,
});

addTransaction(
  transaction('demo-income-october', 'income', '2026-10-01', 'Monthly salary', 'demo-income-salary', 'demo-cycle-closed'),
  [ledgerLine('demo-line-income-october', 'demo-income-october', 'demo-account', 30000)],
);
addTransaction(
  transaction('demo-expense-october', 'expense', '2026-10-06', 'Home groceries', 'demo-expense-groceries', 'demo-cycle-closed'),
  [ledgerLine('demo-line-expense-october', 'demo-expense-october', 'demo-account', -1750)],
);

for (const [cycleId, categoryId, plannedAmount] of [
  ['demo-cycle', 'demo-expense-housing', 9000],
  ['demo-cycle', 'demo-expense-groceries', 4000],
  ['demo-cycle', 'demo-expense-transport', 1500],
  ['demo-cycle', 'demo-expense-health', 285],
  ['demo-cycle', 'demo-expense-fun', 1800],
  ['demo-cycle', 'demo-expense-over-budget', 800],
  ['demo-cycle-closed', 'demo-expense-housing', 8500],
  ['demo-cycle-closed', 'demo-expense-groceries', 3500],
]) {
  const id = `${cycleId}_${categoryId}`;
  seedDoc('budgetAllocations', id, {
    id, householdId, budgetCycleId: cycleId, categoryId, plannedAmount, currency: 'EGP', carryLeftover: true,
  });
}

seedDoc('expectedIncome', 'demo-income-expected', {
  id: 'demo-income-expected', householdId, budgetCycleId: 'demo-cycle-planned', expectedDate: '2026-12-01',
  amount: 32000, currency: 'EGP', expectedRateToBaseCurrency: 1, label: 'Monthly salary', status: 'expected',
});

seedDoc('reconciliations', 'demo-reconciliation', {
  id: 'demo-reconciliation', householdId, accountId: 'demo-account', date: '2026-11-18',
  calculatedBalance: 15645, actualBalance: 15595, difference: -50, currency: 'EGP', createdBy: userId,
  createdAt: now, note: 'Demo cash count adjustment.',
});
seedDoc('notificationSettings', userId, {
  userId, householdId, dailyReminderEnabled: true, categoryWarningEnabled: true,
  cardExpiryWarningEnabled: true, joinRequestEnabled: true,
});

seedDoc('pendingFinancialMessages', 'demo-pending-expense', {
  id: 'demo-pending-expense', householdId, receivedBy: userId, kind: 'expense', source: 'ios-shortcut',
  provider: 'nbe', amount: 245, currency: 'EGP', date: '2026-11-18', description: 'Demo market purchase',
  counterparty: 'DEMO MARKET', messagePreview: 'NBE demo message · EGP 245.00 · Demo Market · 18 Nov 2026',
  accountHintLast4: '1842', suggestedAccountId: 'demo-account', createdAt: '2026-11-18T16:20:00.000Z', status: 'pending',
});

for (const [id, action, summary, createdAt] of [
  ['demo-audit-transaction', 'transaction_created', 'Demo User recorded a grocery expense', '2026-11-18T12:00:00.000Z'],
  ['demo-audit-budget', 'allocation_saved', 'Demo User updated the November grocery budget', '2026-11-17T09:30:00.000Z'],
  ['demo-audit-reconciliation', 'reconciliation_created', 'Demo User reconciled the checking account', '2026-11-16T18:15:00.000Z'],
]) {
  seedDoc('auditLog', id, {
    id, householdId, userId, userDisplayName: 'Demo User', action, summary, details: {}, createdAt,
  });
}

const transactionId = 'demo-transaction-source';
batch.set(db.doc(`households/${householdId}/transactions/${transactionId}`), {
  id: transactionId,
  householdId,
  type: 'expense',
  date: '2026-11-18',
  description: 'Demo transaction for category reassignment',
  categoryId: 'demo-expense-source',
  budgetCycleId: 'demo-cycle',
  createdBy: userId,
  createdAt: now,
  updatedAt: now,
  status: 'posted',
});
batch.set(db.doc(`households/${householdId}/ledgerLines/demo-ledger-line`), {
  id: 'demo-ledger-line',
  householdId,
  transactionId,
  accountId: 'demo-account',
  signedAmount: -125,
  currency: 'EGP',
  createdAt: now,
});

for (const [categoryId, plannedAmount] of [
  ['demo-expense-source', 500],
  ['demo-expense-target', 1000],
]) {
  const id = `demo-cycle_${categoryId}`;
  batch.set(db.doc(`households/${householdId}/budgetAllocations/${id}`), {
    id,
    householdId,
    budgetCycleId: 'demo-cycle',
    categoryId,
    plannedAmount,
    currency: 'EGP',
    carryLeftover: false,
  });
}

await batch.commit();

if (process.env.KIPPA_SEED_SCENARIO === 'empty-budget') {
  const allocations = await db.collection(`households/${householdId}/budgetAllocations`)
    .where('budgetCycleId', '==', 'demo-cycle')
    .get();
  const emptyBudgetBatch = db.batch();
  allocations.docs.forEach((allocation) => emptyBudgetBatch.delete(allocation.ref));
  await emptyBudgetBatch.commit();
  console.log('Seeded the local demo with an empty active budget cycle.');
} else {
  console.log('Seeded the local demo with budget utilization states from 0% to 150%.');
}
console.log('Open the local preview with ?visual-preview=1; all records are synthetic and emulator-only.');
