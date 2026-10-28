import { createHash } from 'node:crypto';
import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthorizationParams, OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

const mocks = vi.hoisted(() => {
  const documents = new Map<string, Record<string, unknown>>();
  const reference = (path: string) => ({
    get: async () => ({ exists: documents.has(path), data: () => documents.get(path) }),
    create: async (value: Record<string, unknown>) => {
      if (documents.has(path)) throw new Error('already exists');
      documents.set(path, value);
    },
    update: async (value: Record<string, unknown>) => {
      const existing = documents.get(path);
      if (!existing) throw new Error('missing document');
      documents.set(path, { ...existing, ...value });
    },
  });
  const getFirestore = vi.fn(() => ({
    collection: (name: string) => ({ doc: (id: string) => reference(`${name}/${id}`) }),
    doc: (path: string) => reference(path),
    runTransaction: async <T>(
      work: (transaction: {
        get: (ref: ReturnType<typeof reference>) => ReturnType<typeof reference>['get'];
        update: (ref: ReturnType<typeof reference>, value: Record<string, unknown>) => Promise<void>;
      }) => Promise<T>,
    ) =>
      work({
        get: async (ref) => ref.get(),
        update: async (ref, value) => ref.update(value),
      }),
    batch: () => {
      const operations: Array<() => Promise<void>> = [];
      return {
        create: (ref: ReturnType<typeof reference>, value: Record<string, unknown>) => {
          operations.push(() => ref.create(value));
        },
        commit: async () => Promise.all(operations.map((operation) => operation())),
      };
    },
  }));
  return {
    documents,
    getFirestore,
    getUser: vi.fn(async () => ({ disabled: false })),
  };
});

vi.mock('firebase-admin/firestore', () => ({ getFirestore: mocks.getFirestore }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ getUser: mocks.getUser }) }));

import { hash, KippaOAuthProvider, publicUrl, resourceUrl } from './oauthProvider.js';

const oauthProvider: OAuthServerProvider = new KippaOAuthProvider();

const userId = 'owner-1';
const householdId = 'household-1';
const registeredRedirect = 'https://client.example/callback';
const verifier = 'a'.repeat(43);
const challenge = createHash('sha256').update(verifier).digest('base64url');

function clientMetadata() {
  return {
    redirect_uris: [new URL(registeredRedirect)],
    token_endpoint_auth_method: 'client_secret_basic',
    client_name: 'Test client',
  };
}

async function registerClient(): Promise<OAuthClientInformationFull> {
  const register = oauthProvider.clientsStore.registerClient;
  if (!register) throw new Error('Client registration is unavailable');
  return register(clientMetadata());
}

async function beginAuthorization(client: OAuthClientInformationFull) {
  let destination = '';
  const response = {
    redirect: (url: string) => {
      destination = url;
    },
  } as unknown as Response;
  const params: AuthorizationParams = {
    state: 'state-1',
    scopes: ['kippa:read', 'offline_access'],
    codeChallenge: challenge,
    redirectUri: registeredRedirect,
    resource: new URL(resourceUrl()),
  };
  await oauthProvider.authorize(client, params, response);
  const requestId = new URL(destination).searchParams.get('request');
  if (!requestId) throw new Error('Authorization request id was not redirected');
  const stored = mocks.documents.get(`mcpOAuthRequests/${hash(requestId)}`);
  if (!stored) throw new Error('Authorization request was not stored');
  return stored;
}

function issueAuthorizationCode(client: OAuthClientInformationFull, request: Record<string, unknown>) {
  const authorizationCode = 'test-authorization-code';
  mocks.documents.set(`mcpOAuthCodes/${hash(authorizationCode)}`, {
    userId,
    householdId,
    clientId: client.client_id,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    resource: request.resource,
    scopes: request.scopes,
    expiresAt: Date.now() + 60_000,
    used: false,
  });
  return authorizationCode;
}

describe('Kippa OAuth provider', () => {
  beforeEach(() => {
    process.env.KIPPA_PUBLIC_URL = 'https://kippa.example';
    mocks.documents.clear();
    mocks.getUser.mockReset();
    mocks.getUser.mockResolvedValue({ disabled: false });
    mocks.documents.set(`users/${userId}`, { householdIds: [householdId] });
    mocks.documents.set(`households/${householdId}/householdInfo/info`, { createdBy: userId });
  });

  it('uses the configured HTTPS origin for the MCP resource', () => {
    expect(publicUrl()).toBe('https://kippa.example');
    expect(resourceUrl()).toBe('https://kippa.example/mcp');
  });

  it('registers public clients without issuing client secrets', async () => {
    const client = await registerClient();
    expect(client.client_id).toBeTruthy();
    expect(client.client_secret).toBeUndefined();
    expect(client.token_endpoint_auth_method).toBe('none');
    expect(await oauthProvider.clientsStore.getClient(client.client_id)).toMatchObject({
      client_id: client.client_id,
      token_endpoint_auth_method: 'none',
    });
  });

  it('issues scoped access and refresh tokens, rotates refresh tokens, and revokes access', async () => {
    const client = await registerClient();
    const request = await beginAuthorization(client);
    const authorizationCode = issueAuthorizationCode(client, request);

    await expect(oauthProvider.challengeForAuthorizationCode(client, authorizationCode)).resolves.toBe(challenge);
    const issued = await oauthProvider.exchangeAuthorizationCode(
      client,
      authorizationCode,
      verifier,
      registeredRedirect,
      new URL(resourceUrl()),
    );
    expect(issued.token_type).toBe('Bearer');
    expect(issued.scope).toBe('kippa:read offline_access');
    expect(issued.refresh_token).toBeTruthy();
    const originalAccessHash = hash(issued.access_token);
    expect(mocks.documents.get(`mcpCredentials/${originalAccessHash}`)).toMatchObject({
      userId,
      householdId,
      allowWrites: false,
    });
    await expect(oauthProvider.verifyAccessToken(issued.access_token)).resolves.toMatchObject({
      clientId: client.client_id,
      scopes: ['kippa:read', 'offline_access'],
    });

    const refreshed = await oauthProvider.exchangeRefreshToken(
      client,
      issued.refresh_token ?? '',
      undefined,
      new URL(resourceUrl()),
    );
    expect(refreshed.refresh_token).toBeTruthy();
    expect(mocks.documents.get(`mcpCredentials/${originalAccessHash}`)).toMatchObject({
      revokedAt: expect.any(Number),
    });
    await expect(
      oauthProvider.exchangeRefreshToken(client, issued.refresh_token ?? '', undefined, new URL(resourceUrl())),
    ).rejects.toThrow();
    await expect(oauthProvider.verifyAccessToken(refreshed.access_token)).rejects.toThrow();

    await expect(oauthProvider.verifyAccessToken(refreshed.access_token)).rejects.toThrow();

    await oauthProvider.revokeToken?.(client, { token: refreshed.access_token, token_type_hint: 'access_token' });
    await expect(oauthProvider.verifyAccessToken(refreshed.access_token)).rejects.toThrow();
  });
  it('rejects unrelated resources, missing read scope and unregistered redirect destinations', async () => {
    const client = await registerClient();
    const response = { redirect: vi.fn() } as unknown as Response;
    const params: AuthorizationParams = {
      scopes: ['kippa:read'],
      codeChallenge: challenge,
      redirectUri: registeredRedirect,
      resource: new URL(resourceUrl()),
    };
    await expect(
      oauthProvider.authorize(client, { ...params, resource: new URL('https://other.example/mcp') }, response),
    ).rejects.toThrow();
    await expect(
      oauthProvider.authorize(client, { ...params, scopes: ['offline_access'] }, response),
    ).rejects.toThrow();
    await expect(
      oauthProvider.authorize(client, { ...params, redirectUri: 'https://other.example/callback' }, response),
    ).rejects.toThrow();
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it('binds authorization codes to the client, redirect, expiry and PKCE verifier', async () => {
    const client = await registerClient();
    const request = await beginAuthorization(client);
    const code = issueAuthorizationCode(client, request);
    const wrongClient = { ...client, client_id: 'another-client' };
    await expect(
      oauthProvider.exchangeAuthorizationCode(wrongClient, code, verifier, registeredRedirect),
    ).rejects.toThrow();
    await expect(
      oauthProvider.exchangeAuthorizationCode(client, code, verifier, 'https://other.example/callback'),
    ).rejects.toThrow();
    await expect(oauthProvider.exchangeAuthorizationCode(client, code, 'wrong', registeredRedirect)).rejects.toThrow();
    const stored = mocks.documents.get(`mcpOAuthCodes/${hash(code)}`);
    if (!stored) throw new Error('Missing code fixture');
    stored.expiresAt = Date.now() - 1;
    await expect(oauthProvider.exchangeAuthorizationCode(client, code, verifier, registeredRedirect)).rejects.toThrow();
  });

  it('denies issued access when ownership is removed or the Firebase account is disabled', async () => {
    const client = await registerClient();
    const request = await beginAuthorization(client);
    const code = issueAuthorizationCode(client, request);
    const issued = await oauthProvider.exchangeAuthorizationCode(client, code, verifier, registeredRedirect);
    mocks.getUser.mockResolvedValue({ disabled: true });
    await expect(oauthProvider.verifyAccessToken(issued.access_token)).rejects.toThrow();
    mocks.getUser.mockResolvedValue({ disabled: false });
    mocks.documents.set(`users/${userId}`, { householdIds: [] });
    await expect(oauthProvider.verifyAccessToken(issued.access_token)).rejects.toThrow();
  });
  it('grants writes only with the explicit write scope and prevents refresh from restoring removed permissions', async () => {
    const client = await registerClient();
    const request = await beginAuthorization(client);
    request.scopes = ['kippa:read', 'kippa:write', 'offline_access'];
    const code = issueAuthorizationCode(client, request);
    const issued = await oauthProvider.exchangeAuthorizationCode(client, code, verifier, registeredRedirect);
    expect(mocks.documents.get(`mcpCredentials/${hash(issued.access_token)}`)).toMatchObject({ allowWrites: true });
    const narrowed = await oauthProvider.exchangeRefreshToken(client, issued.refresh_token ?? '', [
      'kippa:read',
      'offline_access',
    ]);
    expect(mocks.documents.get(`mcpCredentials/${hash(narrowed.access_token)}`)).toMatchObject({ allowWrites: false });
    await expect(
      oauthProvider.exchangeRefreshToken(client, narrowed.refresh_token ?? '', [
        'kippa:read',
        'kippa:write',
        'offline_access',
      ]),
    ).rejects.toThrow();
  });
});
