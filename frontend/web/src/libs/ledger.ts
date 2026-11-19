import { orderBy, where, type QueryConstraint, type QueryDocumentSnapshot } from 'firebase/firestore';
import { includeUnrecordedCardFees } from './creditCardFees';
import { dbLib } from '@/libs/db';
import { auditLogLib } from '@/libs/auditLog';
import { detectBaseCurrency, currencySymbol } from '@/libs/currencyMeta';
import {
  Account,
  BudgetAllocation,
  Category,
  FinanceTransaction,
  Household,
  Reconciliation,
  NotificationSettings,
  CurrencyCode,
  LedgerLine,
} from '@kippa/domain';
import { allocationDocId, dedupeAllocations } from './allocations';

type AuditUser = { uid: string; displayName: string; photoURL?: string };

export const RECONCILIATION_HISTORY_PAGE_SIZE = 7;

export const ledgerLib = {
  // Accounts
  async getAccounts(householdId: string): Promise<Account[]> {
    const list = await dbLib.getDocs(householdId, 'accounts');
    return (list as Account[]).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },

  async createAccount(
    householdId: string,
    account: Omit<Account, 'id' | 'householdId' | 'createdAt'>,
    auditUser?: AuditUser,
  ): Promise<string> {
    const id = crypto.randomUUID();
    const newAccount: Account = {
      ...account,
      id,
      householdId,
      createdAt: new Date().toISOString(),
    };
    await dbLib.setDoc(householdId, 'accounts', id, newAccount);

    // Audit log — awaited so server-side (MCP) writes land; logAction never throws.
    if (auditUser) {
      await auditLogLib.logAction(        householdId,
        auditUser,
        'account_created',
        `${auditUser.displayName} added account: ${newAccount.name} (${newAccount.currency})`,
        { accountId: id, name: newAccount.name, type: newAccount.type, currency: newAccount.currency },
      );
    }
    return id;
  },

  async seedDefaultAccounts(householdId: string, baseCurrency?: CurrencyCode): Promise<void> {
    const base = baseCurrency || detectBaseCurrency();
    const symbol = currencySymbol(base);
    const defaultAccounts: Omit<Account, 'id' | 'householdId' | 'createdAt'>[] = [
      { name: `${symbol} Bank`, type: 'running', currency: base, isActive: true, sortOrder: 1 },
      { name: `${symbol} Cash`, type: 'cash', currency: base, isActive: true, sortOrder: 2 },
    ];

    for (const acc of defaultAccounts) {
      await this.createAccount(householdId, acc);
    }
  },

  // Categories
  async getCategories(householdId: string): Promise<Category[]> {
    const list = await dbLib.getDocs(householdId, 'categories');
    return (list as Category[]).filter((c) => c.isActive);
  },

  async createCategory(
    householdId: string,
    category: Omit<Category, 'id' | 'householdId' | 'createdAt'>,
    auditUser?: AuditUser,
  ): Promise<string> {
    const id = crypto.randomUUID();
    const newCategory: Category = {
      ...category,
      id,
      householdId,
      createdAt: new Date().toISOString(),
    };
    await dbLib.setDoc(householdId, 'categories', id, newCategory);

    // Audit log — awaited so server-side (MCP) writes land; logAction never throws.
    if (auditUser) {
      await auditLogLib.logAction(        householdId,
        auditUser,
        'category_created',
        `${auditUser.displayName} created category: ${newCategory.name} (${newCategory.type})`,
        { categoryId: id, name: newCategory.name, type: newCategory.type },
      );
    }
    return id;
  },

  async updateCategory(
    householdId: string,
    categoryId: string,
    updates: Partial<Pick<Category, 'name' | 'isActive' | 'essential' | 'merchantKeywords'>>,
    auditUser?: AuditUser,
  ): Promise<void> {
    const list = await dbLib.getDocs(householdId, 'categories');
    const existing = (list as Category[]).find((c) => c.id === categoryId);
    if (!existing) throw new Error('Category not found');
    const updated = { ...existing, ...updates };
    await dbLib.setDoc(householdId, 'categories', categoryId, updated);

    // Audit log — awaited so server-side (MCP) writes land; logAction never throws.
    if (auditUser) {
      const action = updates.isActive === false ? 'deactivated' : 'updated';
      await auditLogLib.logAction(        householdId,
        auditUser,
        'category_updated',
        `${auditUser.displayName} ${action} category: ${updated.name}`,
        { categoryId, name: updated.name, ...updates },
      );
    }
  },

  async isCategoryUsed(householdId: string, categoryId: string): Promise<boolean> {
    const [transactions, allocations] = await Promise.all([
      dbLib.getDocs(householdId, 'transactions', [{ field: 'categoryId', op: '==', value: categoryId }]),
      dbLib.getDocs(householdId, 'budgetAllocations', [{ field: 'categoryId', op: '==', value: categoryId }]),
    ]);
    return transactions.length > 0 || allocations.length > 0;
  },

  async deleteCategoryAndReassign(
    householdId: string,
    categoryId: string,
    replacementCategoryId?: string,
    auditUser?: AuditUser,
  ): Promise<void> {
    if (categoryId === replacementCategoryId) throw new Error('Choose a different replacement category.');

    const [categories, transactions, allocations] = await Promise.all([
      dbLib.getDocs(householdId, 'categories') as Promise<Category[]>,
      dbLib.getDocs(householdId, 'transactions', [
        { field: 'categoryId', op: '==', value: categoryId },
      ]) as Promise<FinanceTransaction[]>,
      dbLib.getDocs(householdId, 'budgetAllocations', replacementCategoryId
        ? [{ field: 'categoryId', op: 'in', value: [categoryId, replacementCategoryId] }]
        : [{ field: 'categoryId', op: '==', value: categoryId }]) as Promise<BudgetAllocation[]>,
    ]);
    const source = categories.find((category) => category.id === categoryId);
    if (!source) throw new Error('Category not found.');
    if (!replacementCategoryId) {
      if (transactions.length || allocations.length) {
        throw new Error('This category is in use. Choose a replacement category first.');
      }
      await dbLib.executeBatch(householdId, [{ type: 'delete', collectionName: 'categories', docId: categoryId }]);
      if (auditUser) {
        await auditLogLib.logAction(
          householdId,
          auditUser,
          'category_deleted',
          `${auditUser.displayName} deleted unused category: ${source.name}`,
          { categoryId, name: source.name },
        );
      }
      return;
    }

    const replacement = categories.find((category) => category.id === replacementCategoryId && category.isActive);
    if (!replacement || replacement.type !== source.type) {
      throw new Error('Choose an active replacement category of the same type.');
    }

    // Move transaction references in bounded batches. The source category is
    // deleted last, so a failed migration can be safely retried.
    const transactionRefs = transactions.filter((transaction) => transaction.categoryId === categoryId);
    for (let offset = 0; offset < transactionRefs.length; offset += 450) {
      await dbLib.executeBatch(
        householdId,
        transactionRefs.slice(offset, offset + 450).map((transaction) => ({
          type: 'set' as const,
          collectionName: 'transactions',
          docId: transaction.id,
          data: { ...transaction, categoryId: replacementCategoryId },
        })),
      );
    }

    const sourceAllocations = allocations.filter((allocation) => allocation.categoryId === categoryId);
    const cycles = [...new Set(sourceAllocations.map((allocation) => allocation.budgetCycleId))];
    for (const budgetCycleId of cycles) {
      const inCycle = allocations.filter((allocation) => allocation.budgetCycleId === budgetCycleId);
      const sourceAllocation = dedupeAllocations(inCycle.filter((allocation) => allocation.categoryId === categoryId))[0];
      if (!sourceAllocation) continue;
      const targetAllocation = dedupeAllocations(inCycle.filter((allocation) => allocation.categoryId === replacementCategoryId))[0];
      const id = allocationDocId(budgetCycleId, replacementCategoryId);
      const merged: BudgetAllocation = {
        ...(targetAllocation ?? sourceAllocation),
        id,
        categoryId: replacementCategoryId,
        plannedAmount: (sourceAllocation.plannedAmount ?? 0) + (targetAllocation?.plannedAmount ?? 0),
        carryLeftover: Boolean(sourceAllocation.carryLeftover || targetAllocation?.carryLeftover),
        ...(targetAllocation?.notes || sourceAllocation.notes
          ? { notes: [targetAllocation?.notes, sourceAllocation.notes].filter(Boolean).join('\n') }
          : {}),
      };
      const operations = [
        { type: 'set' as const, collectionName: 'budgetAllocations', docId: id, data: merged },
        ...inCycle
          .filter(
            (allocation) =>
              (allocation.categoryId === categoryId || allocation.categoryId === replacementCategoryId) &&
              allocation.id !== id,
          )
          .map((allocation) => ({
            type: 'delete' as const,
            collectionName: 'budgetAllocations',
            docId: allocation.id,
          })),
      ];
      await dbLib.executeBatch(householdId, operations);
    }

    await dbLib.executeBatch(householdId, [
      { type: 'delete', collectionName: 'categories', docId: categoryId },
    ]);
    if (auditUser) {
      await auditLogLib.logAction(
        householdId,
        auditUser,
        'category_deleted',
        `${auditUser.displayName} deleted category: ${source.name} and reassigned its records to ${replacement.name}`,
        { categoryId, name: source.name, replacementCategoryId, replacementCategoryName: replacement.name },
      );
    }
  },

  async seedDefaultCategories(householdId: string): Promise<void> {
    const defaultCategories: Omit<Category, 'id' | 'householdId' | 'createdAt'>[] = [
      // Income
      { name: 'Salary', type: 'income', isActive: true },
      { name: 'Other Income', type: 'income', isActive: true },
      // Expense - Essential
      { name: 'Rent', type: 'expense', isActive: true },
      { name: 'Utilities', type: 'expense', isActive: true },
      { name: 'Groceries', type: 'expense', isActive: true },
      { name: 'Medical & Health', type: 'expense', isActive: true },
      { name: 'Debt Repayment', type: 'expense', isActive: true },
      // Expense - Flexible
      { name: 'Dining Out', type: 'expense', isActive: true },
      { name: 'Shopping', type: 'expense', isActive: true },
      { name: 'Entertainment', type: 'expense', isActive: true },
      { name: 'Transport & Fuel', type: 'expense', isActive: true },
      // Saving
      { name: 'General Saving', type: 'expense', isActive: true },
    ];

    for (const cat of defaultCategories) {
      await this.createCategory(householdId, cat);
    }
  },

  // Raw Lines & Transactions Fetchers
  async getLedgerLines(
    householdId: string,
    context?: { accounts: Account[]; transactions: FinanceTransaction[] },
  ): Promise<LedgerLine[]> {
    // Ledger lines don't have a budgetCycleId field — only transactions do.
    // Callers already match lines to transactions in-memory via transactionId.
    const [lines, accounts, transactions] = await Promise.all([
      dbLib.getDocs(householdId, 'ledgerLines'),
      context ? Promise.resolve(context.accounts) : dbLib.getDocs(householdId, 'accounts'),
      context ? Promise.resolve(context.transactions) : dbLib.getDocs(householdId, 'transactions'),
    ]);
    return includeUnrecordedCardFees(
      accounts as Account[],
      transactions as FinanceTransaction[],
      lines as LedgerLine[],
    );
  },

  async getTransactionHistoryPage(
    householdId: string,
    cycleId: string | undefined,
    pageSize: number,
    cursor?: QueryDocumentSnapshot,
  ) {
    const constraints: QueryConstraint[] = [orderBy('date', 'desc'), orderBy('createdAt', 'desc')];
    if (cycleId) constraints.unshift(where('budgetCycleId', '==', cycleId));
    const page = await dbLib.getDocsPage(householdId, 'transactions', pageSize, cursor, constraints);
    const transactions = page.items as FinanceTransaction[];
    return {
      transactions,
      lines: await this.getLedgerLinesBy(householdId, 'transactionId', transactions.map((tx) => tx.id)),
      nextCursor: transactions.length === pageSize ? page.nextCursor : null,
    };
  },

  async getLedgerLinesBy(householdId: string, field: 'transactionId' | 'accountId', ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    const queries = [];
    for (let offset = 0; offset < uniqueIds.length; offset += 30) {
      queries.push(dbLib.getDocs(householdId, 'ledgerLines', [
        { field, op: 'in', value: uniqueIds.slice(offset, offset + 30) },
      ]));
    }
    return (await Promise.all(queries)).flat() as LedgerLine[];
  },

  async getTransactions(householdId: string, cycleId?: string): Promise<FinanceTransaction[]> {
    const filters = cycleId ? [{ field: 'budgetCycleId', op: '==' as const, value: cycleId }] : undefined;
    const list = await dbLib.getDocs(householdId, 'transactions', filters);
    return (list as FinanceTransaction[]).sort(
      (a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
  },

  async getHouseholdName(householdId: string): Promise<string> {
    try {
      const data = await dbLib.getDoc(householdId, 'householdInfo', 'info');
      if (data) {
        return (data as Household).name || 'My Household';
      }
    } catch {
      // ignore
    }
    return 'My Household';
  },

  async getHouseholdInfo(householdId: string): Promise<Household | null> {
    try {
      const data = await dbLib.getDoc(householdId, 'householdInfo', 'info');
      return data as Household | null;
    } catch {
      return null;
    }
  },

  async updateHouseholdBaseCurrency(householdId: string, baseCurrency: CurrencyCode): Promise<void> {
    const info = await this.getHouseholdInfo(householdId);
    if (!info) throw new Error('Household not found');
    await dbLib.setDoc(householdId, 'householdInfo', 'info', { ...info, baseCurrency });
  },

  async ensureHouseholdExists(householdId: string, userId: string, name: string = 'My Household'): Promise<string> {
    try {
      const data = await dbLib.getDoc(householdId, 'householdInfo', 'info');
      if (!data) {
        const now = new Date().toISOString();
        const household: Household = {
          id: householdId,
          name,
          baseCurrency: detectBaseCurrency(),
          createdAt: now,
          createdBy: userId,
        };
        await dbLib.setDoc(householdId, 'householdInfo', 'info', household);
        return name;
      }
      return (data as Household).name || name;
    } catch {
      return name;
    }
  },

  // Accounts CRUD support
  async updateAccount(householdId: string, accountId: string, updated: Account, auditUser?: AuditUser): Promise<void> {
    await dbLib.setDoc(householdId, 'accounts', accountId, updated);

    // Audit log — awaited so server-side (MCP) writes land; logAction never throws.
    if (auditUser) {
      await auditLogLib.logAction(        householdId,
        auditUser,
        'account_updated',
        `${auditUser.displayName} updated account: ${updated.name}`,
        { accountId, name: updated.name, type: updated.type, currency: updated.currency },
      );
    }
  },

  // Reconciliations
  async getReconciliations(householdId: string): Promise<Reconciliation[]> {
    const list = await dbLib.getDocs(householdId, 'reconciliations');
    return list as Reconciliation[];
  },

  async getReconciliationsPage(
    householdId: string,
    pageSize: number,
    cursor?: QueryDocumentSnapshot,
  ) {
    return dbLib.getDocsPage(householdId, 'reconciliations', pageSize, cursor, [orderBy('createdAt', 'desc')]);
  },

  async createReconciliation(
    householdId: string,
    reconId: string,
    reconLog: Reconciliation,
    auditUser?: AuditUser,
  ): Promise<void> {
    await dbLib.setDoc(householdId, 'reconciliations', reconId, reconLog);

    // Audit log — awaited so server-side (MCP) writes land; logAction never throws.
    if (auditUser) {
      const diff = Number(Math.abs(reconLog.difference).toFixed(2));
      const cleanDifference = Number(reconLog.difference.toFixed(2));
      const verdict =
        cleanDifference === 0
          ? 'matched'
          : `had a ${cleanDifference > 0 ? 'surplus' : 'shortfall'} of ${diff} ${reconLog.currency}`;
      await auditLogLib.logAction(        householdId,
        auditUser,
        'reconciliation_created',
        `${auditUser.displayName} reconciled an account (${verdict})`,
        {
          reconciliationId: reconId,
          accountId: reconLog.accountId,
          difference: cleanDifference,
          currency: reconLog.currency,
        },
      );
    }
  },

  // Notification Settings
  async getNotificationSettings(householdId: string, userId: string): Promise<NotificationSettings | null> {
    const data = await dbLib.getDoc(householdId, 'notificationSettings', userId);
    return data as NotificationSettings | null;
  },

  async updateNotificationSettings(
    householdId: string,
    userId: string,
    settings: NotificationSettings,
    auditUser?: AuditUser,
  ): Promise<void> {
    await dbLib.setDoc(householdId, 'notificationSettings', userId, settings);

    // Audit log — awaited so server-side (MCP) writes land; logAction never throws.
    if (auditUser) {
      await auditLogLib.logAction(        householdId,
        auditUser,
        'notification_settings_updated',
        `${auditUser.displayName} updated reminder & alert settings`,
        { userId },
      );
    }
  },
};
