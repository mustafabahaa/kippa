import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Response } from 'express';
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidRequestError,
  InvalidScopeError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type { AuthorizationParams, OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';

const CLIENTS = 'mcpOAuthClients';
const REQUESTS = 'mcpOAuthRequests';
const CODES = 'mcpOAuthCodes';
const REFRESH_TOKENS = 'mcpOAuthRefreshTokens';
const CREDENTIALS = 'mcpCredentials';
const GRANTS = 'mcpOAuthGrants';
const ACCESS_TTL_MS = 60 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AUTHORIZATION_TTL_MS = 10 * 60 * 1000;
const ALLOWED_SCOPES = new Set(['kippa:read', 'kippa:write', 'offline_access']);

type OAuthRequest = {
  clientId: string;
  clientName?: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  resource: string;
  scopes: string[];
  expiresAt: number;
  used: boolean;
};

type AuthorizationCode = {
  userId: string;
  householdId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string;
  scopes: string[];
  expiresAt: number;
  used: boolean;
};

type RefreshToken = {
  userId: string;
  householdId: string;
  clientId: string;
  resource: string;
  scopes: string[];
  expiresAt: number;
  used: boolean;
  accessTokenHash: string;
  grantId: string;
};

type OAuthGrant = OwnerContext & {
  clientId: string;
  resource: string;
  scopes: string[];
  expiresAt: number;
  revokedAt?: number;
};

type StoredCredential = {
  userId: string;
  householdId: string;
  clientId: string;
  resource: string;
  scopes: string[];
  label: string;
  createdAt: number;
  expiresAt: number;
  revokedAt?: number;
  allowWrites: boolean;
  grantId: string;
};

type OwnerContext = { userId: string; householdId: string };

export function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function publicUrl(): string {
  const configured = process.env.KIPPA_PUBLIC_URL;
  if (!configured) throw new Error('KIPPA_PUBLIC_URL is required');
  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('KIPPA_PUBLIC_URL must be an HTTPS origin');
  }
  return url.origin;
}

export function resourceUrl(): string {
  return `${publicUrl()}/mcp`;
}

function token(): string {
  return `kippa_${randomBytes(32).toString('base64url')}`;
}

function validRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}

function requireResource(resource: URL | undefined): string {
  const expected = resourceUrl().toString();
  if (resource && resource.toString() !== expected) throw new InvalidRequestError('Invalid resource');
  return expected;
}

function parseScopes(scopes: string[] | undefined): string[] {
  const values = [...new Set(scopes?.length ? scopes : ['kippa:read'])];
  if (!values.includes('kippa:read') || values.some((scope) => !ALLOWED_SCOPES.has(scope))) {
    throw new InvalidScopeError('Unsupported scope');
  }
  return values;
}

function clientMetadata(client: OAuthClientInformationFull): OAuthClientInformationFull {
  const metadata = Object.fromEntries(
    Object.entries(client).filter(([key]) => key !== 'client_secret' && key !== 'client_secret_expires_at'),
  ) as OAuthClientInformationFull;
  return { ...metadata, token_endpoint_auth_method: 'none' };
}

function clientReference(clientId: string) {
  return getFirestore().collection(CLIENTS).doc(hash(clientId));
}

async function requireEnabledOwner(context: OwnerContext): Promise<void> {
  const [userSnapshot, householdSnapshot] = await Promise.all([
    getFirestore().doc(`users/${context.userId}`).get(),
    getFirestore().doc(`households/${context.householdId}/householdInfo/info`).get(),
  ]);
  let authUser;
  try {
    authUser = await getAuth().getUser(context.userId);
  } catch {
    throw new InvalidGrantError('The authorized account is no longer available');
  }
  const user = userSnapshot.data();
  const household = householdSnapshot.data();
  if (
    authUser.disabled ||
    !user?.householdIds?.includes(context.householdId) ||
    household?.createdBy !== context.userId
  ) {
    throw new InvalidGrantError('The authorized household is no longer available');
  }
}

function tokenResponse(accessToken: string, refreshToken: string | undefined, scopes: string[]): OAuthTokens {
  return {
    access_token: accessToken,
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
    token_type: 'Bearer',
    expires_in: ACCESS_TTL_MS / 1000,
    scope: scopes.join(' '),
  };
}

async function issueTokens(
  owner: OwnerContext,
  client: OAuthClientInformationFull,
  resource: string,
  scopes: string[],
  grantId?: string,
  refreshExpiresAt = Date.now() + REFRESH_TTL_MS,
): Promise<OAuthTokens> {
  const db = getFirestore();
  const now = Date.now();
  const accessToken = token();
  const accessTokenHash = hash(accessToken);
  const currentGrantId = grantId ?? randomUUID();
  const credential: StoredCredential = {
    userId: owner.userId,
    householdId: owner.householdId,
    clientId: client.client_id,
    resource,
    scopes,
    label: client.client_name ?? 'MCP client',
    createdAt: now,
    expiresAt: now + ACCESS_TTL_MS,
    allowWrites: scopes.includes('kippa:write'),
    grantId: currentGrantId,
  };
  const refreshToken = scopes.includes('offline_access') ? token() : undefined;
  const batch = db.batch();
  batch.create(db.collection(CREDENTIALS).doc(accessTokenHash), credential);
  if (refreshToken) {
    const refreshTokenHash = hash(refreshToken);
    const refresh: RefreshToken = {
      userId: owner.userId,
      householdId: owner.householdId,
      clientId: client.client_id,
      resource,
      scopes,
      expiresAt: refreshExpiresAt,
      used: false,
      accessTokenHash,
      grantId: currentGrantId,
    };
    batch.create(db.collection(REFRESH_TOKENS).doc(refreshTokenHash), refresh);
  }
  if (!grantId) {
    const grant: OAuthGrant = {
      userId: owner.userId,
      householdId: owner.householdId,
      clientId: client.client_id,
      resource,
      scopes,
      expiresAt: refreshExpiresAt,
    };
    batch.create(db.collection(GRANTS).doc(currentGrantId), grant);
  }
  await batch.commit();
  return tokenResponse(accessToken, refreshToken, scopes);
}

export class KippaOAuthProvider implements OAuthServerProvider {
  get clientsStore() {
    return {
      getClient: async (clientId: string) => {
        const snapshot = await clientReference(clientId).get();
        const data = snapshot.data() as OAuthClientInformationFull | undefined;
        return data ? clientMetadata(data) : undefined;
      },
      registerClient: async (
        metadata: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>,
      ): Promise<OAuthClientInformationFull> => {
        if (!metadata.redirect_uris.length || metadata.redirect_uris.some((uri) => !validRedirect(uri.toString()))) {
          throw new InvalidClientMetadataError('redirect_uris must use HTTPS or an HTTP loopback address');
        }
        const clientId = randomUUID();
        const safeMetadata = {
          redirect_uris: metadata.redirect_uris.map((uri) => uri.toString()),
          token_endpoint_auth_method: 'none',
          ...(metadata.grant_types === undefined ? {} : { grant_types: metadata.grant_types }),
          ...(metadata.response_types === undefined ? {} : { response_types: metadata.response_types }),
          ...(metadata.client_name === undefined ? {} : { client_name: metadata.client_name }),
          ...(metadata.client_uri === undefined ? {} : { client_uri: metadata.client_uri.toString() }),
          ...(metadata.logo_uri === undefined ? {} : { logo_uri: metadata.logo_uri.toString() }),
          ...(metadata.scope === undefined ? {} : { scope: metadata.scope }),
          ...(metadata.contacts === undefined ? {} : { contacts: metadata.contacts }),
          ...(metadata.tos_uri === undefined ? {} : { tos_uri: metadata.tos_uri.toString() }),
          ...(metadata.policy_uri === undefined ? {} : { policy_uri: metadata.policy_uri }),
          ...(metadata.jwks_uri === undefined ? {} : { jwks_uri: metadata.jwks_uri.toString() }),
          ...(metadata.jwks === undefined ? {} : { jwks: metadata.jwks }),
          ...(metadata.software_id === undefined ? {} : { software_id: metadata.software_id }),
          ...(metadata.software_version === undefined ? {} : { software_version: metadata.software_version }),
          ...(metadata.software_statement === undefined ? {} : { software_statement: metadata.software_statement }),
        };
        const client: OAuthClientInformationFull = {
          ...safeMetadata,
          client_id: clientId,
          client_id_issued_at: Math.floor(Date.now() / 1000),
        };
        await clientReference(clientId).create(clientMetadata(client));
        return clientMetadata(client);
      },
    };
  }

  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    if (params.resource && params.resource.toString() !== resourceUrl().toString()) {
      throw new InvalidRequestError('Invalid resource');
    }
    if (
      !validRedirect(params.redirectUri) ||
      !client.redirect_uris.some((uri) => uri.toString() === params.redirectUri)
    ) {
      throw new InvalidRequestError('Unregistered redirect_uri');
    }
    if (!/^[A-Za-z0-9_-]{43}$/.test(params.codeChallenge)) throw new InvalidRequestError('Invalid PKCE challenge');
    const scopes = parseScopes(params.scopes);
    const requestId = randomBytes(32).toString('base64url');
    const request: OAuthRequest = {
      clientId: client.client_id,
      ...(client.client_name ? { clientName: client.client_name } : {}),
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      state: params.state ?? '',
      resource: resourceUrl().toString(),
      scopes,
      expiresAt: Date.now() + AUTHORIZATION_TTL_MS,
      used: false,
    };
    await getFirestore().collection(REQUESTS).doc(hash(requestId)).create(request);
    const destination = new URL('/mcp/authorize', publicUrl());
    destination.searchParams.set('request', requestId);
    res.redirect(destination.toString());
  }

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const snapshot = await getFirestore().collection(CODES).doc(hash(authorizationCode)).get();
    const code = snapshot.data() as AuthorizationCode | undefined;
    if (!code || code.clientId !== client.client_id || code.used || code.expiresAt <= Date.now()) {
      throw new InvalidGrantError('Invalid authorization code');
    }
    return code.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    codeVerifier?: string,
    redirectUri?: string,
    resource?: URL,
  ): Promise<OAuthTokens> {
    const expectedResource = requireResource(resource);
    const codeReference = getFirestore().collection(CODES).doc(hash(authorizationCode));
    const code = await getFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(codeReference);
      const stored = snapshot.data() as AuthorizationCode | undefined;
      if (
        !stored ||
        stored.used ||
        stored.expiresAt <= Date.now() ||
        stored.clientId !== client.client_id ||
        stored.redirectUri !== redirectUri ||
        stored.resource !== expectedResource
      ) {
        throw new InvalidGrantError('Invalid authorization code');
      }
      if (codeVerifier) {
        const challenge = createHash('sha256').update(codeVerifier).digest('base64url');
        if (challenge !== stored.codeChallenge) throw new InvalidGrantError('Invalid PKCE verifier');
      }
      transaction.update(codeReference, { used: true });
      return stored;
    });
    await requireEnabledOwner(code);
    return issueTokens(code, client, code.resource, code.scopes);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL,
  ): Promise<OAuthTokens> {
    const expectedResource = requireResource(resource);
    const reference = getFirestore().collection(REFRESH_TOKENS).doc(hash(refreshToken));
    const rotation = await getFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const stored = snapshot.data() as RefreshToken | undefined;
      if (
        !stored ||
        stored.expiresAt <= Date.now() ||
        stored.clientId !== client.client_id ||
        stored.resource !== expectedResource
      ) {
        throw new InvalidGrantError('Invalid refresh token');
      }
      const grantReference = getFirestore().collection(GRANTS).doc(stored.grantId);
      const grantSnapshot = await transaction.get(grantReference);
      const grant = grantSnapshot.data() as OAuthGrant | undefined;
      if (!grant || grant.revokedAt || grant.expiresAt <= Date.now() || grant.clientId !== client.client_id) {
        throw new InvalidGrantError('Invalid refresh token');
      }
      if (stored.used) {
        transaction.update(grantReference, { revokedAt: Date.now() });
        return { replayed: true as const };
      }
      const nextScopes = scopes?.length ? parseScopes(scopes) : stored.scopes;
      if (nextScopes.some((scope) => !stored.scopes.includes(scope))) {
        throw new InvalidScopeError('Refresh token scope cannot be widened');
      }
      transaction.update(reference, { used: true });
      transaction.update(grantReference, { scopes: nextScopes });
      const credentialReference = getFirestore().collection(CREDENTIALS).doc(stored.accessTokenHash);
      transaction.update(credentialReference, { revokedAt: Date.now() });
      return { replayed: false as const, stored, nextScopes };
    });
    if (rotation.replayed) throw new InvalidGrantError('Refresh token reuse detected');
    await requireEnabledOwner(rotation.stored);
    return issueTokens(
      rotation.stored,
      client,
      rotation.stored.resource,
      rotation.nextScopes,
      rotation.stored.grantId,
      rotation.stored.expiresAt,
    );
  }

  async verifyAccessToken(accessToken: string): Promise<AuthInfo> {
    const snapshot = await getFirestore().collection(CREDENTIALS).doc(hash(accessToken)).get();
    const credential = snapshot.data() as StoredCredential | undefined;
    if (
      !credential ||
      credential.revokedAt ||
      credential.expiresAt <= Date.now() ||
      credential.resource !== resourceUrl().toString()
    ) {
      throw new InvalidGrantError('Invalid access token');
    }
    const clientSnapshot = await clientReference(credential.clientId).get();
    const grantSnapshot = await getFirestore().collection(GRANTS).doc(credential.grantId).get();
    const grant = grantSnapshot.data() as OAuthGrant | undefined;
    if (
      !clientSnapshot.exists ||
      !grant ||
      grant.revokedAt ||
      grant.expiresAt <= Date.now() ||
      grant.clientId !== credential.clientId ||
      grant.resource !== credential.resource ||
      credential.scopes.some((scope) => !grant.scopes.includes(scope))
    ) {
      throw new InvalidGrantError('Invalid access token');
    }
    await requireEnabledOwner(credential);
    return {
      token: accessToken,
      clientId: credential.clientId,
      scopes: credential.scopes,
      expiresAt: Math.floor(credential.expiresAt / 1000),
      resource: new URL(credential.resource),
      extra: { userId: credential.userId, householdId: credential.householdId },
    };
  }

  async revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    const digest = hash(request.token);
    const db = getFirestore();
    const credentialReference = db.collection(CREDENTIALS).doc(digest);
    const refreshReference = db.collection(REFRESH_TOKENS).doc(digest);
    await db.runTransaction(async (transaction) => {
      const [credentialSnapshot, refreshSnapshot] = await Promise.all([
        transaction.get(credentialReference),
        transaction.get(refreshReference),
      ]);
      const credential = credentialSnapshot.data() as StoredCredential | undefined;
      const refresh = refreshSnapshot.data() as RefreshToken | undefined;
      const grantId =
        credential?.clientId === client.client_id
          ? credential.grantId
          : refresh?.clientId === client.client_id
            ? refresh.grantId
            : undefined;
      if (!grantId) return;
      const grantReference = db.collection(GRANTS).doc(grantId);
      await transaction.get(grantReference);
      if (credential?.clientId === client.client_id) transaction.update(credentialReference, { revokedAt: Date.now() });
      if (refresh?.clientId === client.client_id) transaction.update(refreshReference, { used: true });
      transaction.update(grantReference, { revokedAt: Date.now() });
    });
  }
}

export const oauthProvider: OAuthServerProvider = new KippaOAuthProvider();
