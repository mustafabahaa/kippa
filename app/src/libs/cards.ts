import { dbLib } from '@/libs/db';
import { transactionsLib } from '@/libs/transactions';
import { auditLogLib } from '@/libs/auditLog';
import { Account, Card, CardStatement, CardStatementStatus } from '@/domain/financeTypes';

type AuditUser = { uid: string; displayName: string; photoURL?: string };

export type CardInput = Omit<Card, 'id' | 'householdId' | 'createdAt'>;

/**
 * Validates a card against the rules in the spec §9. Throws on violation.
 * Pure function — safe to unit test without Firestore.
 */
export function validateCardInput(card: CardInput, accounts: Account[]): void {
  if (!card.parentAccountId) {
    throw new Error('parentAccountId is required (no card without an account).');
  }
  const parent = accounts.find(a => a.id === card.parentAccountId);
  if (!parent) throw new Error('parentAccountId does not reference a real account.');

  if (card.kind === 'debit') {
    if (parent.type !== 'running' && parent.type !== 'savings') {
      throw new Error('A debit card must link to a running or savings account.');
    }
  } else {
    // credit
    if (parent.type !== 'credit') {
      throw new Error('A credit card must link to a credit account.');
    }
    if (card.creditLimit == null) throw new Error('creditLimit is required for a credit card.');
    if (!card.paymentAccountId) throw new Error('paymentAccountId is required for a credit card.');
    const payAcc = accounts.find(a => a.id === card.paymentAccountId);
    if (!payAcc) throw new Error('paymentAccountId does not reference a real account.');
    if (payAcc.currency !== card.currency) {
      throw new Error('Card currency must equal the payment account currency.');
    }
  }

  if (card.last4 && card.last4.length > 4) {
    throw new Error('last4 must be at most 4 characters.');
  }
  if (card.expiryMonth != null && (card.expiryMonth < 1 || card.expiryMonth > 12)) {
    throw new Error('expiryMonth must be 1–12.');
  }
}

/**
 * Pure status computation per spec §9 rule 5 + §9.1 overpayment cap.
 */
export function computeStatementStatus(statement: CardStatement, totalPaid: number): CardStatementStatus {
  if (totalPaid <= 0) return 'pending';
  if (totalPaid >= statement.statementBalance) return 'paid';
  return 'partial';
}

export const cardsLib = {
  async getCards(householdId: string): Promise<Card[]> {
    const list = await dbLib.getDocs(householdId, 'cards');
    return (list as Card[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async getStatements(householdId: string, cardId?: string): Promise<CardStatement[]> {
    const filters = cardId ? [{ field: 'cardId', op: '==' as const, value: cardId }] : undefined;
    const list = await dbLib.getDocs(householdId, 'cardStatements', filters);
    return (list as CardStatement[]).sort((a, b) => b.statementDate.localeCompare(a.statementDate));
  },

  /**
   * Creates a debit card. No new account needed — links to an existing one.
   */
  async createDebitCard(householdId: string, card: CardInput, accounts: Account[], auditUser?: AuditUser): Promise<string> {
    if (card.kind !== 'debit') throw new Error('Use createCreditCard for credit cards.');
    validateCardInput(card, accounts);
    const id = crypto.randomUUID();
    const newCard: Card = { ...card, id, householdId, createdAt: new Date().toISOString() };
    await dbLib.setDoc(householdId, 'cards', id, newCard);
    if (auditUser) {
      auditLogLib.logAction(householdId, auditUser, 'account_created',
        `${auditUser.displayName} added debit card: ${newCard.name}`,
        { cardId: id, kind: 'debit' });
    }
    return id;
  },

  /**
   * Creates a credit card AND its credit account in one batch (spec §8.3).
   * Returns { cardId, creditAccountId }.
   */
  async createCreditCard(
    householdId: string,
    card: CardInput,
    accounts: Account[],
    sortOrder: number,
    auditUser?: AuditUser
  ): Promise<{ cardId: string; creditAccountId: string }> {
    // First create the credit account (the debt bucket), then validate + link.
    const creditAccountId = crypto.randomUUID();
    const creditAccount: Account = {
      id: creditAccountId,
      householdId,
      name: `${card.name} Debt`,
      type: 'credit',
      currency: card.currency,
      isActive: true,
      sortOrder,
      createdAt: new Date().toISOString(),
    };
    // Validate with the new credit account present.
    validateCardInput({ ...card, parentAccountId: creditAccountId }, [...accounts, creditAccount]);

    const cardId = crypto.randomUUID();
    const newCard: Card = {
      ...card, parentAccountId: creditAccountId, id: cardId,
      householdId, createdAt: new Date().toISOString(),
    };

    await dbLib.executeBatch(householdId, [
      { type: 'set', collectionName: 'accounts', docId: creditAccountId, data: creditAccount },
      { type: 'set', collectionName: 'cards', docId: cardId, data: newCard },
    ]);

    if (auditUser) {
      auditLogLib.logAction(householdId, auditUser, 'account_created',
        `${auditUser.displayName} added credit card: ${newCard.name}`,
        { cardId, creditAccountId, kind: 'credit' });
    }
    return { cardId, creditAccountId };
  },

  async updateCard(householdId: string, cardId: string, updates: Partial<Card>, accounts: Account[], auditUser?: AuditUser): Promise<void> {
    const existing = (await dbLib.getDoc(householdId, 'cards', cardId)) as Card | null;
    if (!existing) throw new Error('Card not found');
    const merged: Card = { ...existing, ...updates };
    validateCardInput(merged, accounts);
    await dbLib.setDoc(householdId, 'cards', cardId, merged);
    if (auditUser) {
      auditLogLib.logAction(householdId, auditUser, 'account_updated',
        `${auditUser.displayName} updated card: ${merged.name}`, { cardId });
    }
  },

  /**
   * Pay the card — creates a transfer paymentAccount → creditAccount.
   * No statement required. Works for any amount (a single charge, several, or all).
   * The credit account balance simply drops by the paid amount.
   */
  async payCard(
    householdId: string,
    card: Card,
    amount: number,
    auditUser?: AuditUser
  ): Promise<string> {
    if (amount <= 0) throw new Error('Payment amount must be greater than 0.');
    if (!card.paymentAccountId) throw new Error('Card has no paymentAccountId.');
    return transactionsLib.createTransaction(
      householdId,
      {
        type: 'transfer',
        date: new Date().toISOString().slice(0, 10),
        description: `Card payment — ${card.name}`,
        createdBy: auditUser?.uid ?? 'system',
      },
      [
        { accountId: card.paymentAccountId, signedAmount: -amount, currency: card.currency },
        { accountId: card.parentAccountId, signedAmount: amount, currency: card.currency },
      ],
      undefined,
      auditUser
    );
  },

  /**
   * "Mark as paid" — legacy statement-linked payment (spec §6.1, §9.5 idempotency).
   * Kept for backward compatibility but the UI now uses payCard instead.
   */
  async markAsPaid(
    householdId: string,
    statement: CardStatement,
    card: Card,
    amount: number,
    auditUser?: AuditUser
  ): Promise<string> {
    if (statement.paymentTransactionId) {
      throw new Error('This statement already has a linked payment.');
    }
    if (!card.paymentAccountId) throw new Error('Card has no paymentAccountId.');
    const txId = await this.payCard(householdId, card, amount, auditUser);
    const status = computeStatementStatus(statement, amount);
    const updated: CardStatement = { ...statement, paymentTransactionId: txId, status };
    await dbLib.setDoc(householdId, 'cardStatements', statement.id, updated);
    return txId;
  },

  /**
   * Delete a statement — blocked if it has a linked payment (spec §9.5).
   */
  async deleteStatement(householdId: string, statementId: string): Promise<void> {
    const stmt = (await dbLib.getDoc(householdId, 'cardStatements', statementId)) as CardStatement | null;
    if (!stmt) throw new Error('Statement not found');
    if (stmt.paymentTransactionId) {
      throw new Error('This statement has a linked payment. Void or delete that payment first.');
    }
    await dbLib.executeBatch(householdId, [
      { type: 'delete', collectionName: 'cardStatements', docId: statementId },
    ]);
  },
};
