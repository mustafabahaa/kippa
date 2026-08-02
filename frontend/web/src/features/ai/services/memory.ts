import type { AiMemory } from '../types';
import { dbLib } from '@/libs/db';

const MAX_CONTEXT_MEMORIES = 12;
const STOP_WORDS = new Set(['about', 'after', 'again', 'also', 'because', 'before', 'being', 'could', 'from', 'have', 'into', 'just', 'more', 'should', 'that', 'their', 'there', 'these', 'they', 'this', 'what', 'when', 'where', 'which', 'with', 'would', 'your']);

function terms(value: string): Set<string> {
  return new Set(value.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter(term => !STOP_WORDS.has(term)) ?? []);
}

function relevance(memory: AiMemory, queryTerms: Set<string>): number {
  const memoryTerms = terms(memory.content);
  let overlap = 0;
  queryTerms.forEach(term => { if (memoryTerms.has(term)) overlap += 1; });
  const durableKindBoost = memory.kind === 'preference' || memory.kind === 'decision' || memory.kind === 'goal' ? 1.5 : 0;
  const recencyDays = Math.max(0, (Date.now() - Date.parse(memory.updatedAt)) / 86_400_000);
  return overlap * 4 + durableKindBoost + memory.confidence + Math.max(0, 1 - recencyDays / 365);
}

export const aiMemoryService = {
  async listActive(householdId: string, userId: string): Promise<AiMemory[]> {
    const rows = await dbLib.getDocs(householdId, 'aiMemories', [{ field: 'userId', op: '==', value: userId }]);
    return (rows as AiMemory[]).filter(memory => memory.scope === 'user' && memory.userId === userId && !memory.supersededBy);
  },

  async relevant(householdId: string, userId: string, query: string): Promise<AiMemory[]> {
    const active = await this.listActive(householdId, userId);
    const queryTerms = terms(query);
    return active
      .map(memory => ({ memory, score: relevance(memory, queryTerms) }))
      .sort((a, b) => b.score - a.score || b.memory.updatedAt.localeCompare(a.memory.updatedAt))
      .slice(0, MAX_CONTEXT_MEMORIES)
      .map(item => item.memory);
  },

  async remember(args: { householdId: string; userId: string; kind: AiMemory['kind']; content: string; sourceMessageIds: string[]; replacesMemoryId?: string }): Promise<AiMemory> {
    const now = new Date().toISOString();
    const active = await this.listActive(args.householdId, args.userId);
    const normalized = args.content.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const duplicate = active.find(memory => memory.kind === args.kind && memory.content.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === normalized);
    if (duplicate) {
      const refreshed = { ...duplicate, confidence: Math.min(1, duplicate.confidence + 0.05), sourceMessageIds: [...new Set([...duplicate.sourceMessageIds, ...args.sourceMessageIds])].slice(-20), updatedAt: now, lastConfirmedAt: now };
      await dbLib.setDoc(args.householdId, 'aiMemories', duplicate.id, refreshed);
      return refreshed;
    }

    const id = crypto.randomUUID();
    const memory: AiMemory = { id, householdId: args.householdId, scope: 'user', userId: args.userId, kind: args.kind, content: args.content.trim(), confidence: 0.85, sourceMessageIds: args.sourceMessageIds.slice(-20), createdAt: now, updatedAt: now, lastConfirmedAt: now };
    if (args.replacesMemoryId) {
      const previous = active.find(item => item.id === args.replacesMemoryId);
      if (!previous) throw new Error('The memory being corrected was not found.');
      await dbLib.executeBatch(args.householdId, [
        { type: 'set', collectionName: 'aiMemories', docId: previous.id, data: { ...previous, supersededBy: id, updatedAt: now } },
        { type: 'set', collectionName: 'aiMemories', docId: id, data: memory },
      ]);
    } else {
      await dbLib.setDoc(args.householdId, 'aiMemories', id, memory);
    }
    return memory;
  },

  async forget(householdId: string, userId: string, memoryId: string): Promise<void> {
    const active = await this.listActive(householdId, userId);
    const memory = active.find(item => item.id === memoryId);
    if (!memory) throw new Error('That memory was not found.');
    await dbLib.setDoc(householdId, 'aiMemories', memoryId, { ...memory, supersededBy: 'forgotten', updatedAt: new Date().toISOString() });
  },
};
