import { describe, expect, it } from 'vitest';
import { createTransactionTool } from './createTransaction';
import { parseToolInput } from '../toolRegistry';

const baseInput = {
  type: 'expense',
  date: '2026-11-02',
  lines: [{ accountId: 'cash-egp', signedAmount: -32, currency: 'EGP' }],
};

describe('createTransaction input schema', () => {
  it('accepts a well-formed expense with negative lines', async () => {
    await expect(parseToolInput(createTransactionTool, baseInput)).resolves.toBeDefined();
  });

  it('rejects expense lines with positive amounts', async () => {
    await expect(
      parseToolInput(createTransactionTool, {
        ...baseInput,
        lines: [{ accountId: 'cash-egp', signedAmount: 32, currency: 'EGP' }],
      }),
    ).rejects.toThrow(/negative/i);
  });

  it('rejects income lines with negative amounts', async () => {
    await expect(
      parseToolInput(createTransactionTool, {
        ...baseInput,
        type: 'income',
        lines: [{ accountId: 'cash-egp', signedAmount: -32, currency: 'EGP' }],
      }),
    ).rejects.toThrow(/positive/i);
  });

  it('rejects zero line amounts', async () => {
    await expect(
      parseToolInput(createTransactionTool, {
        ...baseInput,
        lines: [{ accountId: 'cash-egp', signedAmount: 0, currency: 'EGP' }],
      }),
    ).rejects.toThrow();
  });

  it('still enforces the transfer balance rules', async () => {
    await expect(
      parseToolInput(createTransactionTool, {
        ...baseInput,
        type: 'transfer',
        lines: [
          { accountId: 'cash-egp', signedAmount: -32, currency: 'EGP' },
          { accountId: 'cash-egp', signedAmount: 32, currency: 'EGP' },
        ],
      }),
    ).rejects.toThrow(/different/i);
  });

  it('keeps budgetCycleId tri-state: omitted, explicit id, or explicit null', async () => {
    const omitted = (await parseToolInput(createTransactionTool, baseInput)) as Record<string, unknown>;
    expect('budgetCycleId' in omitted).toBe(false);
    const explicit = (await parseToolInput(createTransactionTool, {
      ...baseInput,
      budgetCycleId: 'cycle-1',
    })) as Record<string, unknown>;
    expect(explicit.budgetCycleId).toBe('cycle-1');
    const optedOut = (await parseToolInput(createTransactionTool, {
      ...baseInput,
      budgetCycleId: null,
    })) as Record<string, unknown>;
    expect(optedOut.budgetCycleId).toBeNull();
  });
});
