import { dbLib } from './db';
import { BudgetCycle, BudgetAllocation, ExpectedIncome } from '../domain/financeTypes';

export const cyclesLib = {
  async getCycles(householdId: string): Promise<BudgetCycle[]> {
    const list = await dbLib.getDocs(householdId, 'budgetCycles');
    return (list as BudgetCycle[]).sort((a, b) => b.startDate.localeCompare(a.startDate));
  },

  async getActiveCycle(householdId: string): Promise<BudgetCycle | null> {
    const cycles = await this.getCycles(householdId);
    return cycles.find(c => c.status === 'open') || null;
  },

  async createCycle(
    householdId: string,
    cycle: Omit<BudgetCycle, 'id' | 'householdId'>
  ): Promise<string> {
    const id = crypto.randomUUID();
    const newCycle: BudgetCycle = {
      ...cycle,
      id,
      householdId,
    };
    await dbLib.setDoc(householdId, 'budgetCycles', id, newCycle);
    return id;
  },

  async updateCycleStatus(
    householdId: string,
    cycleId: string,
    status: 'planned' | 'open' | 'closed',
    extra: Partial<BudgetCycle> = {}
  ): Promise<void> {
    const cycle = await dbLib.getDoc(householdId, 'budgetCycles', cycleId) as BudgetCycle | null;
    if (!cycle) throw new Error('Budget cycle not found');

    const updated: BudgetCycle = {
      ...cycle,
      ...extra,
      status,
    };
    await dbLib.setDoc(householdId, 'budgetCycles', cycleId, updated);
  },

  // Allocations
  async getBudgetAllocations(householdId: string, cycleId: string): Promise<BudgetAllocation[]> {
    const allAllocations = await dbLib.getDocs(householdId, 'budgetAllocations');
    return (allAllocations as BudgetAllocation[]).filter(a => a.budgetCycleId === cycleId);
  },

  async saveBudgetAllocation(
    householdId: string,
    allocation: Omit<BudgetAllocation, 'id' | 'householdId'>
  ): Promise<string> {
    const id = crypto.randomUUID();
    const newAlloc: BudgetAllocation = {
      ...allocation,
      id,
      householdId,
    };
    await dbLib.setDoc(householdId, 'budgetAllocations', id, newAlloc);
    return id;
  },

  async saveBudgetAllocationsBatch(
    householdId: string,
    allocations: Omit<BudgetAllocation, 'id' | 'householdId'>[]
  ): Promise<void> {
    const ops = allocations.map(a => {
      const id = crypto.randomUUID();
      return {
        type: 'set' as const,
        collectionName: 'budgetAllocations',
        docId: id,
        data: {
          ...a,
          id,
          householdId,
        },
      };
    });
    await dbLib.executeBatch(householdId, ops);
  },

  // Expected Income
  async getExpectedIncomes(householdId: string, cycleId: string): Promise<ExpectedIncome[]> {
    const list = await dbLib.getDocs(householdId, 'expectedIncome');
    return (list as ExpectedIncome[]).filter(i => i.budgetCycleId === cycleId);
  },

  async saveExpectedIncome(
    householdId: string,
    income: Omit<ExpectedIncome, 'id' | 'householdId'>
  ): Promise<string> {
    const id = crypto.randomUUID();
    const newInc: ExpectedIncome = {
      ...income,
      id,
      householdId,
    };
    await dbLib.setDoc(householdId, 'expectedIncome', id, newInc);
    return id;
  }
};
