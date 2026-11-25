import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  documents: new Map<string, Record<string, unknown>>(),
  pendingWrites: [] as Record<string, unknown>[],
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    doc: (path: string) => ({
      path,
      get: async () => {
        const data = mocks.documents.get(path);
        return { exists: !!data, data: () => data };
      },
      set: async (data: Record<string, unknown>) => { mocks.documents.set(path, data); },
      update: async (data: Record<string, unknown>) => {
        mocks.documents.set(path, { ...mocks.documents.get(path), ...data });
      },
    }),
    collection: () => ({
      get: async () => ({ docs: [] }),
      where: () => ({
        get: async () => ({ docs: [] }),
        limit: () => ({ get: async () => ({ docs: [], empty: true }) }),
      }),
    }),
    batch: () => ({
      create: (ref: { path: string }, data: Record<string, unknown>) => {
        if (ref.path.includes('/pendingFinancialMessages/')) mocks.pendingWrites.push(data);
      },
      update: () => {},
      commit: async () => {},
    }),
  }),
}));
vi.mock('firebase-functions/params', () => ({ projectID: { value: () => 'test-project' } }));
vi.mock('firebase-functions/v2/https', () => ({
  onCall: (handler: unknown) => handler,
  onRequest: (...[, handler]: unknown[]) => handler,
  HttpsError: class extends Error {
    constructor(public code: string, message: string) { super(message); }
  },
}));
vi.mock('../../libs/notifications/sendToMany.js', () => ({
  getTokensForUsers: async () => [],
  sendToMany: async () => {},
}));

import { approvePendingFinancialMessage, createMessageIngestionCredential, ingestFinancialMessage } from './messageIngestion.js';

const auth = { uid: 'test-user', token: { kippaAccess: true } };
const createCredential = createMessageIngestionCredential as unknown as (request: {
  auth: typeof auth;
  data: { householdId: string; bank?: string };
}) => Promise<{ credentialId: string }>;

const hsbc = 'Your Credit Card ending with *** 0000 has been used for EGP 12.34 on 15/01/2030 at EXAMPLE SHOP';
const nbe = 'تم خصم EGP 12.34 من بطاقة الخصم المباشر رقم 0000 عند EXAMPLE SHOP يوم 15/01/30 الساعه 14:02';

async function ingest(message: string, bank?: string) {
  mocks.documents.set('messageIngestionCredentials/test-id', {
    ownerUid: auth.uid, householdId: 'test-home', enabled: true,
    secretHash: createHash('sha256').update('test-secret').digest('hex'),
    ...(bank && { bank }),
  });
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const request = {
    method: 'POST',
    get: () => 'Bearer test-id.test-secret',
    body: { message, source: 'message-automation' },
  };
  await (ingestFinancialMessage as unknown as (req: typeof request, res: typeof response) => Promise<void>)(
    request, response,
  );
  return response;
}

describe('message connection bank routing', () => {
  beforeEach(() => {
    mocks.documents.clear();
    mocks.pendingWrites.length = 0;
    mocks.documents.set(`users/${auth.uid}`, { householdIds: ['test-home'] });
  });

  it.each([
    [{}, 'not-found'],
    [{ amount: null, note: null }, 'not-found'],
    [{ amount: 718.2, note: null }, 'not-found'],
    [{ amount: 0, note: null }, 'invalid-argument'],
    [{ amount: -1 }, 'invalid-argument'],
    [{ amount: 718.2, note: 3 }, 'invalid-argument'],
  ])('validates callable approval options %j before loading the pending item', async (edits, code) => {
    const request = { auth, data: { householdId: 'test-home', pendingId: 'missing', accountId: 'test-bank', ...edits } };
    const approve = approvePendingFinancialMessage as unknown as (input: typeof request) => Promise<unknown>;
    await expect(approve(request)).rejects.toMatchObject({ code });
  });

  it('defaults an older create request to HSBC and persists explicit NBE selection', async () => {
    const legacy = await createCredential({ auth, data: { householdId: 'test-home' } });
    const nbeConnection = await createCredential({ auth, data: { householdId: 'test-home', bank: 'nbe' } });
    expect(mocks.documents.get(`messageIngestionCredentials/${legacy.credentialId}`)?.bank).toBe('hsbc');
    expect(mocks.documents.get(`messageIngestionCredentials/${nbeConnection.credentialId}`)?.bank).toBe('nbe');
    await expect(createCredential({ auth, data: { householdId: 'test-home', bank: 'unknown' } }))
      .rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('accepts HSBC from an existing credential without a bank field', async () => {
    const response = await ingest(hsbc);
    expect(response.status).toHaveBeenCalledWith(202);
    expect(mocks.pendingWrites).toEqual([expect.objectContaining({ kind: 'expense', amount: 12.34 })]);
  });

  it('accepts NBE without changing the shortcut request body', async () => {
    const response = await ingest(nbe, 'nbe');
    expect(response.status).toHaveBeenCalledWith(202);
    expect(mocks.pendingWrites).toEqual([expect.objectContaining({
      kind: 'expense', provider: 'nbe', amount: 12.34, messagePreview: 'National Bank of Egypt bank message',
    })]);
  });

  it('does not fall back to HSBC when the credential is set to NBE', async () => {
    const response = await ingest(hsbc, 'nbe');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ accepted: false, ignored: true }));
    expect(mocks.pendingWrites).toHaveLength(0);
  });
});
