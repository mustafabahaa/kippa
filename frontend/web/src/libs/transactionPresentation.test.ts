import { describe, expect, it } from 'vitest';
import { getTransactionPresentation } from './transactionPresentation';

describe('transaction presentation', () => {
  it('describes a cross-currency transfer from its ledger lines', () => {
    const result = getTransactionPresentation(
      { id: 'tx', type: 'transfer' } as any,
      [{ transactionId: 'tx', accountId: 'cash', signedAmount: -100, currency: 'EGP' }, { transactionId: 'tx', accountId: 'bank', signedAmount: 2, currency: 'USD' }] as any,
      [{ id: 'cash', name: 'Cash' }, { id: 'bank', name: 'Bank' }] as any,
      'EGP',
    );
    expect(result.isCrossCurrencyTransfer).toBe(true);
    expect(result.details).toContain('Cash');
    expect(result.details).toContain('Bank');
  });
});
