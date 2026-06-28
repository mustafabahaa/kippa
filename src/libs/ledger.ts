import { dbLib } from './db';
import { Account, Category, FinanceTransaction, ConversionDetails, Household, Reconciliation, NotificationSettings } from '../domain/financeTypes';

export const ledgerLib = {
  // Accounts
  async getAccounts(householdId: string): Promise<Account[]> {
    const list = await dbLib.getDocs(householdId, 'accounts');
    return (list as Account[]).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async createAccount(householdId: string, account: Omit<Account, 'id' | 'householdId' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newAccount: Account = {
      ...account,
      id,
      householdId,
      createdAt: new Date().toISOString(),
    };
    await dbLib.setDoc(householdId, 'accounts', id, newAccount);
    return id;
  },

  async seedDefaultAccounts(householdId: string): Promise<void> {
    const defaultAccounts: Omit<Account, 'id' | 'householdId' | 'createdAt'>[] = [
      { name: 'USD Bank', type: 'bank', currency: 'USD', isActive: true, sortOrder: 1 },
      { name: 'EGP Bank', type: 'bank', currency: 'EGP', isActive: true, sortOrder: 2 },
      { name: 'EGP Cash', type: 'cash', currency: 'EGP', isActive: true, sortOrder: 3 },
    ];

    for (const acc of defaultAccounts) {
      await this.createAccount(householdId, acc);
    }
  },

  // Categories
  async getCategories(householdId: string): Promise<Category[]> {
    const list = await dbLib.getDocs(householdId, 'categories');
    return (list as Category[]).filter(c => c.isActive);
  },

  async createCategory(householdId: string, category: Omit<Category, 'id' | 'householdId' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newCategory: Category = {
      ...category,
      id,
      householdId,
      createdAt: new Date().toISOString(),
    };
    await dbLib.setDoc(householdId, 'categories', id, newCategory);
    return id;
  },

  async updateCategory(householdId: string, categoryId: string, updates: Partial<Pick<Category, 'name' | 'isActive'>>): Promise<void> {
    const list = await dbLib.getDocs(householdId, 'categories');
    const existing = (list as Category[]).find(c => c.id === categoryId);
    if (!existing) throw new Error('Category not found');
    const updated = { ...existing, ...updates };
    await dbLib.setDoc(householdId, 'categories', categoryId, updated);
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
  async getLedgerLines(householdId: string): Promise<any[]> {
    return dbLib.getDocs(householdId, 'ledgerLines');
  },

  async getTransactions(householdId: string): Promise<FinanceTransaction[]> {
    const list = await dbLib.getDocs(householdId, 'transactions');
    return (list as FinanceTransaction[]).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getConversionDetails(householdId: string): Promise<ConversionDetails[]> {
    return dbLib.getDocs(householdId, 'conversionDetails');
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

  async ensureHouseholdExists(householdId: string, userId: string, name: string = 'My Household'): Promise<string> {
    try {
      const data = await dbLib.getDoc(householdId, 'householdInfo', 'info');
      if (!data) {
        const now = new Date().toISOString();
        const household: Household = {
          id: householdId,
          name,
          baseCurrency: 'EGP',
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
  async updateAccount(householdId: string, accountId: string, updated: Account): Promise<void> {
    await dbLib.setDoc(householdId, 'accounts', accountId, updated);
  },

  // Reconciliations
  async getReconciliations(householdId: string): Promise<Reconciliation[]> {
    const list = await dbLib.getDocs(householdId, 'reconciliations');
    return list as Reconciliation[];
  },

  async createReconciliation(householdId: string, reconId: string, reconLog: Reconciliation): Promise<void> {
    await dbLib.setDoc(householdId, 'reconciliations', reconId, reconLog);
  },

  // Notification Settings
  async getNotificationSettings(householdId: string, userId: string): Promise<NotificationSettings | null> {
    const data = await dbLib.getDoc(householdId, 'notificationSettings', userId);
    return data as NotificationSettings | null;
  },

  async updateNotificationSettings(householdId: string, userId: string, settings: NotificationSettings): Promise<void> {
    await dbLib.setDoc(householdId, 'notificationSettings', userId, settings);
  }
};
