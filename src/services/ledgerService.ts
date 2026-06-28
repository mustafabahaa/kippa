import { dbService } from './dbService';
import { Account, Category, FinanceTransaction, ConversionDetails } from '../domain/financeTypes';

export const ledgerService = {
  // Accounts
  async getAccounts(householdId: string): Promise<Account[]> {
    const list = await dbService.getDocs(householdId, 'accounts');
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
    await dbService.setDoc(householdId, 'accounts', id, newAccount);
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
    const list = await dbService.getDocs(householdId, 'categories');
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
    await dbService.setDoc(householdId, 'categories', id, newCategory);
    return id;
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
    return dbService.getDocs(householdId, 'ledgerLines');
  },

  async getTransactions(householdId: string): Promise<FinanceTransaction[]> {
    const list = await dbService.getDocs(householdId, 'transactions');
    return (list as FinanceTransaction[]).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getConversionDetails(householdId: string): Promise<ConversionDetails[]> {
    return dbService.getDocs(householdId, 'conversionDetails');
  }
};
