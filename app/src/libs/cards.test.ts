import { describe, it, expect } from 'vitest';
import { validateCardInput, computeStatementStatus } from './cards';
import type { CardStatement, Account } from '@/domain/financeTypes';

const runningAcc = (id: string, currency: 'EGP' | 'USD' = 'EGP'): Account => ({
  id, householdId: 'h', name: id, type: 'running', currency, isActive: true, sortOrder: 1, createdAt: '',
});
const creditAcc = (id: string): Account => ({
  id, householdId: 'h', name: id, type: 'credit', currency: 'EGP', isActive: true, sortOrder: 2, createdAt: '',
});

describe('validateCardInput', () => {
  it('rejects a card with no parentAccountId', () => {
    expect(() => validateCardInput(
      { kind: 'debit', parentAccountId: '', name: 'X', currency: 'EGP', isActive: true } as any,
      [runningAcc('a')]
    )).toThrow(/parentAccountId/i);
  });

  it('rejects a debit card whose parent is not running/savings', () => {
    expect(() => validateCardInput(
      { kind: 'debit', parentAccountId: 'c', name: 'X', currency: 'EGP', isActive: true } as any,
      [runningAcc('a'), creditAcc('c')]
    )).toThrow(/running|savings/i);
  });

  it('rejects a credit card whose parent is not a credit account', () => {
    expect(() => validateCardInput(
      { kind: 'credit', parentAccountId: 'a', name: 'X', currency: 'EGP', creditLimit: 10000, paymentAccountId: 'a', isActive: true } as any,
      [runningAcc('a')]
    )).toThrow(/credit/i);
  });

  it('rejects a credit card whose currency != paymentAccountId currency', () => {
    expect(() => validateCardInput(
      { kind: 'credit', parentAccountId: 'c', name: 'X', currency: 'EGP', creditLimit: 10000, paymentAccountId: 'u', isActive: true } as any,
      [creditAcc('c'), runningAcc('u', 'USD')]
    )).toThrow(/currency/i);
  });

  it('rejects last4 longer than 4 chars', () => {
    expect(() => validateCardInput(
      { kind: 'debit', parentAccountId: 'a', name: 'X', currency: 'EGP', last4: '12345', isActive: true } as any,
      [runningAcc('a')]
    )).toThrow(/last4/i);
  });

  it('accepts a valid debit card', () => {
    expect(() => validateCardInput(
      { kind: 'debit', parentAccountId: 'a', name: 'X', currency: 'EGP', last4: '4242', isActive: true } as any,
      [runningAcc('a')]
    )).not.toThrow();
  });

  it('accepts a valid credit card', () => {
    expect(() => validateCardInput(
      { kind: 'credit', parentAccountId: 'c', name: 'X', currency: 'EGP', creditLimit: 10000, paymentAccountId: 'a', last4: '4242', isActive: true } as any,
      [creditAcc('c'), runningAcc('a')]
    )).not.toThrow();
  });
});

describe('computeStatementStatus', () => {
  const base = (over: Partial<CardStatement>): CardStatement => ({
    id: 's', householdId: 'h', cardId: 'card', creditAccountId: 'credit',
    statementDate: '2026-06-15', statementBalance: 700, dueDate: '2026-07-05',
    status: 'pending', createdAt: '', ...over,
  });

  it('returns pending when no payment linked', () => {
    expect(computeStatementStatus(base({}), 0)).toBe('pending');
  });

  it('returns partial when paid < balance', () => {
    expect(computeStatementStatus(base({}), 300)).toBe('partial');
  });

  it('returns paid when paid >= balance', () => {
    expect(computeStatementStatus(base({}), 700)).toBe('paid');
  });

  it('caps at paid when overpaid', () => {
    expect(computeStatementStatus(base({}), 800)).toBe('paid');
  });
});
