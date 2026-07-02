import { describe, it, expect } from 'vitest';
import { BANKS, BANK_LIST, getBank, getTier } from './banks';

describe('bank catalog', () => {
  it('every bank has a unique id and at least one tier (except "other")', () => {
    const ids = new Set<string>();
    for (const b of BANK_LIST) {
      expect(ids.has(b.id)).toBe(false);
      ids.add(b.id);
      if (b.id !== 'other') expect(b.tiers.length).toBeGreaterThan(0);
    }
  });

  it('every tier has at least one network and one kind', () => {
    for (const b of BANK_LIST) {
      for (const t of b.tiers) {
        expect(t.networks.length).toBeGreaterThan(0);
        expect(t.kinds.length).toBeGreaterThan(0);
      }
    }
  });

  it('every bank background returns a non-empty css string for both kinds', () => {
    for (const b of BANK_LIST) {
      for (const kind of ['debit', 'credit'] as const) {
        expect(b.background({ kind }).css.length).toBeGreaterThan(0);
      }
    }
  });

  it('logo returns a React node for both kinds', () => {
    for (const b of BANK_LIST) {
      for (const kind of ['debit', 'credit'] as const) {
        expect(b.logo({ kind })).toBeDefined();
      }
    }
  });

  it('HSBC has premier, advance tiers', () => {
    expect(getTier('hsbc', 'premier')).toBeDefined();
    expect(getTier('hsbc', 'advance')).toBeDefined();
  });

  it('NBE and Banque Misr issue Meeza', () => {
    const nbeMeeza = getBank('nbe')!.tiers.some(t => t.networks.includes('meeza'));
    const bmMeeza = getBank('banque-misr')!.tiers.some(t => t.networks.includes('meeza'));
    expect(nbeMeeza && bmMeeza).toBe(true);
  });

  it('getBank returns undefined for unknown bank', () => {
    expect(getBank('does-not-exist')).toBeUndefined();
  });

  it('getTier returns undefined for unknown tier', () => {
    expect(getTier('hsbc', 'nope')).toBeUndefined();
  });

  it('"other" bank has empty tiers', () => {
    expect(BANKS['other'].tiers).toEqual([]);
  });
});
