import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { financeQueryKeys as keys } from './financeQueryKeys';

describe('household ledger query cache', () => {
  it('shares the full ledger result across cycle-specific screens', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
    const readLedger = vi.fn(async () => [{ id: 'line-a' }]);
    await client.fetchQuery({ queryKey: keys.ledgerLines('home', 'cycle-a'), queryFn: readLedger });
    await client.fetchQuery({ queryKey: keys.ledgerLines('home', 'cycle-b'), queryFn: readLedger });
    await client.fetchQuery({ queryKey: keys.ledgerLines('home'), queryFn: readLedger });
    expect(readLedger).toHaveBeenCalledOnce();
    client.clear();
  });

  it('invalidates a ledger loaded from a cycle screen after a household mutation', async () => {
    const client = new QueryClient();
    client.setQueryData(keys.ledgerLines('home', 'cycle-a'), [{ id: 'line-a' }]);
    client.setQueryData(keys.ledgerLines('other-home'), []);
    await client.invalidateQueries({ queryKey: keys.ledgerLines('home') });
    expect(client.getQueryState(keys.ledgerLines('home', 'cycle-a'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(keys.ledgerLines('other-home'))?.isInvalidated).toBe(false);
    client.clear();
  });

  it('invalidates scoped transaction history after a household transaction changes', async () => {
    const client = new QueryClient();
    client.setQueryData(keys.transactions('home'), []);
    client.setQueryData(keys.transactions('home', 'cycle-a'), []);
    client.setQueryData(keys.transactions('other-home', 'cycle-a'), []);
    await client.invalidateQueries({ queryKey: keys.transactions('home') });
    expect(client.getQueryState(keys.transactions('home'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(keys.transactions('home', 'cycle-a'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(keys.transactions('other-home', 'cycle-a'))?.isInvalidated).toBe(false);
    client.clear();
  });
});
