import { describe, expect, it } from 'vitest';
import { createTransactionEditFields, resolveEditedSignedAmount } from './transactionEdit';

const transaction = { id: 'tx', date: '2026-08-02', createdAt: '', description: 'Lunch', categoryId: 'food', type: 'expense', status: 'posted' } as any;
const line = { id: 'line', transactionId: 'tx', accountId: 'cash', signedAmount: -12.5, currency: 'EGP' } as any;

describe('transaction editing', () => {
  it('derives editable fields from the primary ledger line', () => expect(createTransactionEditFields(transaction, [line])).toMatchObject({ accountId: 'cash', amount: '12.5', type: 'expense' }));
  it('uses the selected sign for regular transactions', () => expect(resolveEditedSignedAmount(10, 'income', line, true)).toBe(10));
  it('retains the original sign for special transactions', () => expect(resolveEditedSignedAmount(10, 'income', line, false)).toBe(-10));
});
