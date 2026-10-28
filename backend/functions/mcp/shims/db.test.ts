import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mcpRequestContext } from '../requestContext';

const firestore = vi.hoisted(() => {
  const doc = vi.fn((path: string) => ({
    get: vi.fn(async () => ({ exists: true, data: () => ({ path }) })),
    set: vi.fn(async () => undefined),
  }));
  const where = vi.fn();
  const queryGet = vi.fn(async () => ({ docs: [] as { data: () => unknown }[] }));
  const collection = vi.fn((path: string) => ({ where, get: queryGet, path }));
  const set = vi.fn();
  const deleteDoc = vi.fn();
  const commit = vi.fn(async () => undefined);
  const batch = vi.fn(() => ({ set, delete: deleteDoc, commit }));
  return { doc, where, queryGet, collection, set, deleteDoc, commit, batch };
});

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ doc: firestore.doc, collection: firestore.collection, batch: firestore.batch }),
}));

import { dbLib } from './db';

const context = { uid: 'user-a', householdId: 'home-a', label: 'Test' };
const inContext = <T>(action: () => Promise<T>) => mcpRequestContext.run(context, action);

describe('MCP database path guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads documents only from the linked household', async () => {
    await expect(inContext(() => dbLib.getDoc('home-b', 'records', 'r1'))).rejects.toThrow('Access outside the linked household');
    await expect(inContext(() => dbLib.getDocs('home-b', 'records'))).rejects.toThrow('Access outside the linked household');
    expect(firestore.doc).not.toHaveBeenCalled();
    expect(firestore.collection).not.toHaveBeenCalled();
  });

  it('rejects slash and traversal segments before building Firestore paths', async () => {
    await expect(inContext(() => dbLib.getDoc('home-a', 'records/private', 'r1'))).rejects.toThrow('Invalid database path');
    await expect(inContext(() => dbLib.getDoc('home-a', 'records', '../other'))).rejects.toThrow('Invalid database path');
    await expect(inContext(() => dbLib.getDocs('home-a', '..'))).rejects.toThrow('Invalid database path');
    expect(firestore.doc).not.toHaveBeenCalled();
    expect(firestore.collection).not.toHaveBeenCalled();
  });

  it('permits only the linked user document under system scope and denies system writes', async () => {
    const ownUser = await inContext(() => dbLib.getDoc('system', 'users', context.uid));
    expect(ownUser).toEqual({ path: `users/${context.uid}` });
    expect(firestore.doc).toHaveBeenCalledWith(`users/${context.uid}`);

    await expect(inContext(() => dbLib.getDoc('system', 'users', 'user-b'))).rejects.toThrow('System access is forbidden');
    await expect(inContext(() => dbLib.setDoc('system', 'users', context.uid, { name: 'changed' }))).rejects.toThrow('System access is forbidden');
    expect(firestore.doc).toHaveBeenCalledTimes(1);
  });

  it('rejects database access without MCP request identity', async () => {
    await expect(dbLib.getDoc('home-a', 'records', 'r1')).rejects.toThrow('Access outside the linked household');
    expect(firestore.doc).not.toHaveBeenCalled();
  });
});
