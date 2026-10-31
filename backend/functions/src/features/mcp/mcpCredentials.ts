import { createHash, randomBytes } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type { Household, UserProfile } from '@kippa/domain';
import { requireAllowedUid } from '../../libs/allowedUsers.js';

const COLLECTION = 'mcpCredentials';
const TOKEN_PREFIX = 'kippa_';
const DEFAULT_CREDENTIAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Credential = {
  userId: string;
  householdId: string;
  label: string;
  createdAt: number;
  revokedAt?: number;
  expiresAt: number;
  allowWrites: boolean;
  tokenHash?: string;
  grantId?: string;
};

export function createMcpToken() {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

async function requireUid(request: { auth?: { uid?: string; token?: object } | null }) {
  return requireAllowedUid(request.auth);
}

async function requireHouseholdOwner(uid: string, householdId: string) {
  const db = getFirestore();
  const [householdSnapshot, userSnapshot] = await Promise.all([
    db.doc(`households/${householdId}/householdInfo/info`).get(),
    db.doc(`users/${uid}`).get(),
  ]);
  if (!householdSnapshot.exists) throw new HttpsError('not-found', 'Household not found');
  const household = householdSnapshot.data() as Household;
  const user = userSnapshot.data() as Partial<UserProfile> | undefined;
  if (household.createdBy !== uid || !user?.householdIds?.includes(householdId)) {
    throw new HttpsError('permission-denied', 'Only a household owner can manage MCP credentials');
  }
  return db;
}

function parseHouseholdId(value: unknown) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.trim())) {
    throw new HttpsError('invalid-argument', 'householdId must be a valid path segment');
  }
  return value.trim();
}

function publicCredential(id: string, credential: Credential) {
  return {
    id,
    userId: credential.userId,
    householdId: credential.householdId,
    label: credential.label,
    createdAt: credential.createdAt,
    expiresAt: credential.expiresAt,
    allowWrites: credential.allowWrites,
    ...(credential.revokedAt === undefined ? {} : { revokedAt: credential.revokedAt }),
  };
}

export const createMcpCredential = onCall(async (request) => {
  const uid = await requireUid(request);
  const data = (request.data ?? {}) as {
    householdId?: unknown;
    label?: unknown;
    expiresAt?: unknown;
    allowWrites?: unknown;
  };
  const householdId = parseHouseholdId(data.householdId);
  const label = typeof data.label === 'string' ? data.label.trim() : '';
  if (!label || label.length > 100) throw new HttpsError('invalid-argument', 'label must be 1 to 100 characters');
  if (
    data.expiresAt !== undefined &&
    (!Number.isSafeInteger(data.expiresAt) || (data.expiresAt as number) <= Date.now())
  ) {
    throw new HttpsError('invalid-argument', 'expiresAt must be a future timestamp in milliseconds');
  }
  if (data.allowWrites !== undefined && typeof data.allowWrites !== 'boolean') {
    throw new HttpsError('invalid-argument', 'allowWrites must be a boolean');
  }
  const db = await requireHouseholdOwner(uid, householdId);
  const { token, tokenHash } = createMcpToken();
  const id = tokenHash;
  const credential: Credential = {
    userId: uid,
    householdId,
    label,
    createdAt: Date.now(),
    expiresAt: data.expiresAt === undefined ? Date.now() + DEFAULT_CREDENTIAL_TTL_MS : (data.expiresAt as number),
    allowWrites: data.allowWrites === true,
    tokenHash,
  };
  await db.collection(COLLECTION).doc(id).create(credential);
  return { credential: publicCredential(id, credential), token };
});

export const listMcpCredentials = onCall(async (request) => {
  const uid = await requireUid(request);
  const householdId = parseHouseholdId((request.data as { householdId?: unknown } | undefined)?.householdId);
  const db = await requireHouseholdOwner(uid, householdId);
  const snapshot = await db.collection(COLLECTION).where('householdId', '==', householdId).get();
  const credentials = snapshot.docs
    .map((doc) => publicCredential(doc.id, doc.data() as Credential))
    .sort((a, b) => b.createdAt - a.createdAt);
  return { credentials };
});

export const revokeMcpCredential = onCall(async (request) => {
  const uid = await requireUid(request);
  const data = (request.data ?? {}) as { householdId?: unknown; credentialId?: unknown };
  const householdId = parseHouseholdId(data.householdId);
  if (typeof data.credentialId !== 'string' || !/^[0-9a-f]{64}$/.test(data.credentialId.trim())) {
    throw new HttpsError('invalid-argument', 'credentialId is required');
  }
  const db = await requireHouseholdOwner(uid, householdId);
  const reference = db.collection(COLLECTION).doc(data.credentialId.trim());
  const snapshot = await reference.get();
  const credential = snapshot.data() as Credential | undefined;
  if (!credential || credential.householdId !== householdId) {
    throw new HttpsError('not-found', 'MCP credential not found');
  }
  const batch = db.batch();
  batch.update(reference, { revokedAt: credential.revokedAt ?? Date.now() });
  if (credential.grantId) {
    batch.update(db.collection('mcpOAuthGrants').doc(credential.grantId), { revokedAt: Date.now() });
  }
  await batch.commit();
  return { revoked: true };
});
