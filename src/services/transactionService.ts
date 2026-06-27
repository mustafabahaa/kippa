import { dbService } from './dbService';
import { FinanceTransaction, LedgerLine, ConversionDetails } from '../domain/financeTypes';

export const transactionService = {
  async createTransaction(
    householdId: string,
    transaction: Omit<FinanceTransaction, 'id' | 'householdId' | 'createdAt' | 'updatedAt' | 'status'>,
    lines: Omit<LedgerLine, 'id' | 'householdId' | 'transactionId' | 'createdAt'>[],
    conversionDetails?: Omit<ConversionDetails, 'transactionId'>
  ): Promise<string> {
    const transactionId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    const newTransaction: FinanceTransaction = {
      ...transaction,
      id: transactionId,
      householdId,
      status: 'posted',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const newLines: LedgerLine[] = lines.map(line => ({
      ...line,
      id: crypto.randomUUID(),
      householdId,
      transactionId,
      createdAt: nowStr,
    }));

    const operations: { type: 'set' | 'delete'; collectionName: string; docId: string; data?: any }[] = [
      {
        type: 'set',
        collectionName: 'transactions',
        docId: transactionId,
        data: newTransaction,
      },
      ...newLines.map(line => ({
        type: 'set' as const,
        collectionName: 'ledgerLines',
        docId: line.id,
        data: line,
      })),
    ];

    if (conversionDetails) {
      const details: ConversionDetails = {
        ...conversionDetails,
        transactionId,
      };
      operations.push({
        type: 'set',
        collectionName: 'conversionDetails',
        docId: transactionId,
        data: details,
      });
    }

    await dbService.executeBatch(householdId, operations);
    return transactionId;
  },

  async voidTransaction(householdId: string, transactionId: string): Promise<void> {
    const transaction = await dbService.getDoc(householdId, 'transactions', transactionId) as FinanceTransaction | null;
    if (!transaction) throw new Error('Transaction not found');

    const updatedTransaction: FinanceTransaction = {
      ...transaction,
      status: 'voided',
      updatedAt: new Date().toISOString(),
    };

    // Keep the ledger lines but mark the transaction status as voided
    // When querying balances or cycle spend, selectors must check the transaction status
    await dbService.setDoc(householdId, 'transactions', transactionId, updatedTransaction);
  }
};
