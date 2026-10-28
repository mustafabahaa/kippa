import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  documents: new Map<string, Record<string, unknown>>(),
  create: vi.fn(),
  update: vi.fn(),
  batchUpdate: vi.fn(),
  commit: vi.fn(),
}));

vi.mock('firebase-functions/v2/https', () => ({
  onCall: (handler: (request: unknown) => unknown) => handler,
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    batch: () => ({ update: mocks.batchUpdate, commit: mocks.commit }),
    doc: (path: string) => ({
      get: async () => {
        const value = mocks.documents.get(path);
        return { exists: Boolean(value), data: () => value };
      },
    }),
    collection: (name: string) => ({
      doc: (id: string) => ({
        create: mocks.create,
        get: async () => {
          const value = mocks.documents.get(`${name}/${id}`);
          return { data: () => value };
        },
        update: mocks.update,
      }),
      where: () => ({ get: async () => ({ docs: [] }) }),
    }),
  }),
}));

import { createMcpCredential, createMcpToken, revokeMcpCredential } from './mcpCredentials.js';

const householdId = 'household-1';
const uid = 'owner-1';
type CreatedCredential = {
  credential: { id: string; allowWrites: boolean; expiresAt: number };
  token: string;
};

function seedOwner() {
  mocks.documents.set(`households/${householdId}/householdInfo/info`, { createdBy: uid });
  mocks.documents.set(`users/${uid}`, { householdIds: [householdId] });
}

describe('MCP credentials', () => {
  beforeEach(() => {
    mocks.documents.clear();
    mocks.create.mockReset();
    mocks.update.mockReset();
    mocks.batchUpdate.mockReset();
    mocks.commit.mockReset();
  });

  it('creates a hash-addressed credential with a default 30-day expiry and read-only access', async () => {
    seedOwner();
    let saved: Record<string, unknown> | undefined;
    mocks.create.mockImplementation(async (value: Record<string, unknown>) => {
      saved = value;
    });

    const result = await (createMcpCredential as (request: unknown) => Promise<CreatedCredential>)({
      auth: { uid },
      data: { householdId, label: 'Personal MCP client' },
    });

    expect(result.credential.id).toBe(saved?.tokenHash);
    expect(result.credential.allowWrites).toBe(false);
    expect(saved?.expiresAt).toBeGreaterThan(Date.now());
    expect(saved?.tokenHash).toBe(createHash('sha256').update(result.token).digest('hex'));
    expect(result.token).toMatch(/^kippa_[A-Za-z0-9_-]{43}$/);
  });

  it('rejects a caller who is not the household owner', async () => {
    seedOwner();

    await expect(
      (createMcpCredential as (request: unknown) => Promise<unknown>)({
        auth: { uid: 'member-2' },
        data: { householdId, label: 'Personal MCP client' },
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('does not allow revoking a credential belonging to another household', async () => {
    seedOwner();
    const credentialId = 'a'.repeat(64);
    mocks.documents.set(`mcpCredentials/${credentialId}`, { householdId: 'different-household' });

    await expect(
      (revokeMcpCredential as (request: unknown) => Promise<unknown>)({
        auth: { uid },
        data: { householdId, credentialId },
      }),
    ).rejects.toMatchObject({ code: 'not-found' });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('hashes a complete high-entropy token', () => {
    const { token, tokenHash } = createMcpToken();
    expect(Buffer.from(token.slice('kippa_'.length), 'base64url')).toHaveLength(32);
    expect(tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
  });
  it('revokes the entire OAuth grant as well as the selected credential', async () => {
    seedOwner();
    const credentialId = 'c'.repeat(64);
    mocks.documents.set(`mcpCredentials/${credentialId}`, { householdId, grantId: 'grant-1' });
    await (revokeMcpCredential as (request: unknown) => Promise<unknown>)({
      auth: { uid },
      data: { householdId, credentialId },
    });
    expect(mocks.batchUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.commit).toHaveBeenCalledTimes(1);
  });
});
