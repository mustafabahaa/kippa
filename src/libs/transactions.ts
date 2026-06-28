import { dbLib } from './db';
import { auditLogLib } from './auditLog';
import { FinanceTransaction, LedgerLine, ConversionDetails, CurrencyCode } from '../domain/financeTypes';

type AuditUser = { uid: string; displayName: string; photoURL?: string };

export const transactionsLib = {
  async createTransaction(
    householdId: string,
    transaction: Omit<FinanceTransaction, 'id' | 'householdId' | 'createdAt' | 'updatedAt' | 'status'>,
    lines: Omit<LedgerLine, 'id' | 'householdId' | 'transactionId' | 'createdAt'>[],
    conversionDetails?: Omit<ConversionDetails, 'transactionId'>,
    auditUser?: AuditUser
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

    await dbLib.executeBatch(householdId, operations);

    // Audit log (fire-and-forget)
    if (auditUser) {
      const amount = Math.abs(newLines[0]?.signedAmount || 0);
      const currency = newLines[0]?.currency || '';
      const desc = transaction.description || transaction.type;
      auditLogLib.logAction(
        householdId,
        auditUser,
        'transaction_created',
        `${auditUser.displayName} logged ${transaction.type}: ${amount} ${currency}${desc ? ` — ${desc}` : ''}`,
        { transactionId, type: transaction.type, amount, currency }
      );
    }

    return transactionId;
  },

  async voidTransaction(householdId: string, transactionId: string, auditUser?: AuditUser): Promise<void> {
    const transaction = await dbLib.getDoc(householdId, 'transactions', transactionId) as FinanceTransaction | null;
    if (!transaction) throw new Error('Transaction not found');

    const updatedTransaction: FinanceTransaction = {
      ...transaction,
      status: 'voided',
      updatedAt: new Date().toISOString(),
    };

    // Keep the ledger lines but mark the transaction status as voided
    // When querying balances or cycle spend, selectors must check the transaction status
    await dbLib.setDoc(householdId, 'transactions', transactionId, updatedTransaction);

    // Audit log (fire-and-forget)
    if (auditUser) {
      const desc = transaction.description || transaction.type;
      auditLogLib.logAction(
        householdId,
        auditUser,
        'transaction_voided',
        `${auditUser.displayName} voided transaction: ${desc}`,
        { transactionId, type: transaction.type }
      );
    }
  },

  async updateTransaction(
    householdId: string,
    transactionId: string,
    transactionUpdates: Partial<FinanceTransaction>,
    lineUpdates: { accountId: string; signedAmount: number; currency: CurrencyCode },
    auditUser?: AuditUser
  ): Promise<void> {
    const transaction = await dbLib.getDoc(householdId, 'transactions', transactionId) as FinanceTransaction | null;
    if (!transaction) throw new Error('Transaction not found');

    const updatedTransaction: FinanceTransaction = {
      ...transaction,
      ...transactionUpdates,
      updatedAt: new Date().toISOString()
    };

    // Get current ledger lines for this transaction
    const allLines = await dbLib.getDocs(householdId, 'ledgerLines') as LedgerLine[];
    const txLines = allLines.filter(l => l.transactionId === transactionId);

    const operations: { type: 'set' | 'delete'; collectionName: string; docId: string; data?: any }[] = [
      {
        type: 'set',
        collectionName: 'transactions',
        docId: transactionId,
        data: updatedTransaction
      }
    ];

    if (txLines.length > 0) {
      const firstLine = txLines[0];
      const updatedLine: LedgerLine = {
        ...firstLine,
        accountId: lineUpdates.accountId,
        signedAmount: lineUpdates.signedAmount,
        currency: lineUpdates.currency
      };
      operations.push({
        type: 'set',
        collectionName: 'ledgerLines',
        docId: firstLine.id,
        data: updatedLine
      });
    }

    await dbLib.executeBatch(householdId, operations);

    // Audit log (fire-and-forget)
    if (auditUser) {
      const desc = updatedTransaction.description || updatedTransaction.type;
      auditLogLib.logAction(
        householdId,
        auditUser,
        'transaction_updated',
        `${auditUser.displayName} updated transaction: ${desc}`,
        { transactionId, type: updatedTransaction.type }
      );
    }
  }
};
