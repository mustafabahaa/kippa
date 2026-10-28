import { createHash } from 'node:crypto';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const documents = new Map<string, Record<string, unknown>>();
  const ref = (path: string) => ({
    path,
    get: async () => ({ exists: documents.has(path), data: () => documents.get(path) }),
    create: async (value: Record<string, unknown>) => {
      if (documents.has(path)) throw new Error('exists');
      if (Object.values(value).includes(undefined)) throw new Error('undefined fields');
      documents.set(path, structuredClone(value));
    },
    update: async (value: Record<string, unknown>) => {
      if (!documents.has(path)) throw new Error('missing');
      documents.set(path, { ...documents.get(path), ...value });
    },
  });
  const writes = () => {
    const operations: Array<() => Promise<void>> = [];
    return {
      get: (reference: ReturnType<typeof ref>) => reference.get(),
      create: (reference: ReturnType<typeof ref>, value: Record<string, unknown>) =>
        operations.push(() => reference.create(value)),
      update: (reference: ReturnType<typeof ref>, value: Record<string, unknown>) =>
        operations.push(() => reference.update(value)),
      commit: async () => {
        for (const operation of operations) await operation();
      },
    };
  };
  return {
    documents,
    verifyIdToken: vi.fn(async (token: string) => {
      if (token !== 'signed-owner-session') throw new Error('invalid');
      return { uid: 'owner' };
    }),
    getUser: vi.fn(async () => ({ disabled: false })),
    firestore: {
      doc: ref,
      collection: (collection: string) => ({ doc: (id: string) => ref(`${collection}/${id}`) }),
      batch: writes,
      runTransaction: async <T>(run: (transaction: ReturnType<typeof writes>) => Promise<T>) => {
        const transaction = writes();
        const value = await run(transaction);
        await transaction.commit();
        return value;
      },
    },
  };
});
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => mocks.firestore }));
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: mocks.verifyIdToken, getUser: mocks.getUser }),
}));
vi.mock('firebase-functions/v2/https', () => ({ onRequest: (...args: unknown[]) => args.at(-1) }));
import { createOAuthApp } from './oauth';

const origin = 'https://kippa.example';
const resource = `${origin}/mcp`;
const redirectUri = 'https://client.example/callback';
const verifier = 'b'.repeat(43);
const challenge = createHash('sha256').update(verifier).digest('base64url');

describe('MCP OAuth HTTP flow', () => {
  let server: Server;
  let base: string;
  beforeEach(async () => {
    vi.stubEnv('KIPPA_PUBLIC_URL', origin);
    mocks.documents.clear();
    mocks.documents.set('users/owner', { householdIds: ['home'] });
    mocks.documents.set('households/home/householdInfo/info', { createdBy: 'owner' });
    const app = createOAuthApp();
    server = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    vi.unstubAllEnvs();
  });
  async function authorize() {
    const registered = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'MCP test client',
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
      }),
    });
    expect(registered.status).toBe(201);
    const client = (await registered.json()) as { client_id: string };
    const params = new URLSearchParams({
      client_id: client.client_id,
      response_type: 'code',
      redirect_uri: redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      resource,
      scope: 'kippa:read offline_access',
      state: 'keep-this-state',
    });
    const started = await fetch(`${base}/authorize?${params}`, { redirect: 'manual' });
    expect(started.status).toBe(302);
    const destination = new URL(started.headers.get('location') ?? '');
    return { clientId: client.client_id, requestId: destination.searchParams.get('request') ?? '' };
  }
  async function consent(
    requestId: string,
    options: { decision?: string; token?: string; requestOrigin?: string; householdId?: string } = {},
  ) {
    return fetch(`${base}/mcp-auth/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: options.requestOrigin ?? origin,
        Authorization: `Bearer ${options.token ?? 'signed-owner-session'}`,
      },
      body: JSON.stringify({
        requestId,
        householdId: options.householdId ?? 'home',
        decision: options.decision ?? 'approve',
      }),
    });
  }
  it('publishes discovery metadata with the same resource and OAuth issuer', async () => {
    const protectedResource = await fetch(`${base}/.well-known/oauth-protected-resource/mcp`);
    expect(await protectedResource.json()).toMatchObject({ resource, authorization_servers: [origin + '/'] });
    const metadata = await fetch(`${base}/.well-known/oauth-authorization-server`);
    expect(await metadata.json()).toMatchObject({
      authorization_endpoint: `${origin}/authorize`,
      token_endpoint: `${origin}/token`,
      registration_endpoint: `${origin}/register`,
      code_challenge_methods_supported: ['S256'],
    });
  });
  it('completes consent, validates PKCE, and issues read-only tokens without allowing code reuse', async () => {
    const { clientId, requestId } = await authorize();
    const details = await fetch(`${base}/mcp-auth/consent?request=${requestId}`);
    expect(await details.json()).toMatchObject({
      clientName: 'MCP test client',
      scopes: ['kippa:read', 'offline_access'],
    });
    const approved = await consent(requestId);
    expect(approved.status).toBe(200);
    const { redirectUrl } = (await approved.json()) as { redirectUrl: string };
    const callback = new URL(redirectUrl);
    expect(callback.origin + callback.pathname).toBe(redirectUri);
    expect(callback.searchParams.get('state')).toBe('keep-this-state');
    const tokenParams = {
      grant_type: 'authorization_code',
      code: callback.searchParams.get('code') ?? '',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      resource,
    };
    const badVerifier = await fetch(`${base}/token`, {
      method: 'POST',
      body: new URLSearchParams({ ...tokenParams, code_verifier: 'wrong' }),
    });
    expect(badVerifier.status).toBe(400);
    const issued = await fetch(`${base}/token`, { method: 'POST', body: new URLSearchParams(tokenParams) });
    expect(issued.status).toBe(200);
    const tokens = (await issued.json()) as { access_token: string; refresh_token: string };
    const stored = mocks.documents.get(
      `mcpCredentials/${createHash('sha256').update(tokens.access_token).digest('hex')}`,
    );
    expect(stored).toMatchObject({ userId: 'owner', householdId: 'home', resource, allowWrites: false });
    expect(tokens.refresh_token).toBeTruthy();
    const reused = await fetch(`${base}/token`, { method: 'POST', body: new URLSearchParams(tokenParams) });
    expect(reused.status).toBe(400);
    expect((await consent(requestId)).status).toBe(400);
  });
  it('rejects cross-origin, unauthenticated and non-owner consent', async () => {
    const { requestId } = await authorize();
    expect((await consent(requestId, { requestOrigin: 'https://hostile.example' })).status).toBe(403);
    expect((await consent(requestId, { token: 'invalid' })).status).toBe(401);
    expect((await consent(requestId, { householdId: 'another-home' })).status).toBe(403);
  });
  it('returns access_denied with the original state when the user declines', async () => {
    const { requestId } = await authorize();
    const response = await consent(requestId, { decision: 'deny' });
    const body = (await response.json()) as { redirectUrl: string };
    const callback = new URL(body.redirectUrl);
    expect(callback.searchParams.get('error')).toBe('access_denied');
    expect(callback.searchParams.get('state')).toBe('keep-this-state');
    expect(callback.searchParams.has('code')).toBe(false);
  });
});
