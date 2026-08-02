import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiMemory } from '../types';

const store = new Map<string, AiMemory>();
vi.mock('@/libs/db', () => ({
  dbLib: {
    getDocs: vi.fn(async (_householdId: string, _collection: string, filters?: Array<{ value: string }>) => [...store.values()].filter(memory => !filters?.length || memory.userId === filters[0].value)),
    setDoc: vi.fn(async (_householdId: string, _collection: string, id: string, value: AiMemory) => { store.set(id, value); }),
    executeBatch: vi.fn(async (_householdId: string, operations: Array<{ docId: string; data: AiMemory }>) => { operations.forEach(operation => store.set(operation.docId, operation.data)); }),
  },
}));

import { aiMemoryService } from './memory';

describe('AI durable memory', () => {
  beforeEach(() => store.clear());

  it('deduplicates repeated memories and raises confidence', async () => {
    const first = await aiMemoryService.remember({ householdId: 'h', userId: 'u', kind: 'preference', content: 'I prefer concise answers', sourceMessageIds: ['m1'] });
    const second = await aiMemoryService.remember({ householdId: 'h', userId: 'u', kind: 'preference', content: '  I prefer concise answers  ', sourceMessageIds: ['m2'] });
    expect(second.id).toBe(first.id);
    expect(second.sourceMessageIds).toEqual(['m1', 'm2']);
    expect(second.confidence).toBeGreaterThan(first.confidence);
  });

  it('supersedes a correction without deleting its provenance', async () => {
    const previous = await aiMemoryService.remember({ householdId: 'h', userId: 'u', kind: 'goal', content: 'Save for a laptop', sourceMessageIds: ['m1'] });
    const replacement = await aiMemoryService.remember({ householdId: 'h', userId: 'u', kind: 'correction', content: 'Save for a desktop computer', replacesMemoryId: previous.id, sourceMessageIds: ['m2'] });
    expect(store.get(previous.id)?.supersededBy).toBe(replacement.id);
    await expect(aiMemoryService.listActive('h', 'u')).resolves.toEqual([replacement]);
  });

  it('ranks relevant memories ahead of unrelated ones', async () => {
    await aiMemoryService.remember({ householdId: 'h', userId: 'u', kind: 'preference', content: 'I prefer groceries paid in cash', sourceMessageIds: ['m1'] });
    await aiMemoryService.remember({ householdId: 'h', userId: 'u', kind: 'fact', content: 'My loan is with the bank', sourceMessageIds: ['m2'] });
    const result = await aiMemoryService.relevant('h', 'u', 'How do I usually pay for groceries?');
    expect(result[0].content).toContain('groceries');
  });
});
