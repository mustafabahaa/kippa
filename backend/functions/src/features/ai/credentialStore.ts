import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

export const kippaAiEncryptionKey = defineSecret('KIPPA_AI_ENCRYPTION_KEY');

export type AiProvider = 'codex';
export type ProviderCredential = Record<string, unknown>;

type StoredCredential = {
  provider: AiProvider;
  ciphertext: string;
  iv: string;
  tag: string;
  updatedAt: number;
  lock?: { id: string; until: number };
};

const COLLECTION = 'aiProviderCredentials';
const LEASE_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 20 * 1000;

function keyBytes(): Buffer {
  const raw = kippaAiEncryptionKey.value() || process.env.KIPPA_AI_ENCRYPTION_KEY;
  if (!raw) throw new Error('KIPPA_AI_ENCRYPTION_KEY is not configured');
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('KIPPA_AI_ENCRYPTION_KEY must be a 32-byte base64 or hex value');
  return key;
}

function encrypt(value: ProviderCredential, uid: string, provider: AiProvider) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(), iv);
  cipher.setAAD(Buffer.from(`${uid}:${provider}`));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

function decrypt(stored: StoredCredential, uid: string, provider: AiProvider): ProviderCredential {
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(stored.iv, 'base64'));
  decipher.setAAD(Buffer.from(`${uid}:${provider}`));
  decipher.setAuthTag(Buffer.from(stored.tag, 'base64'));
  return JSON.parse(
    Buffer.concat([decipher.update(Buffer.from(stored.ciphertext, 'base64')), decipher.final()]).toString('utf8'),
  ) as ProviderCredential;
}

function ref(uid: string, provider: AiProvider) {
  return getFirestore().collection(COLLECTION).doc(`${uid}_${provider}`);
}

function assertUid(uid: string) {
  if (!uid || uid.length > 128 || !/^[A-Za-z0-9:_-]+$/.test(uid)) throw new Error('Invalid user id');
}

export async function hasProviderCredential(uid: string, provider: AiProvider): Promise<boolean> {
  assertUid(uid);
  const snapshot = await ref(uid, provider).get();
  const value = snapshot.data() as StoredCredential | undefined;
  return Boolean(value?.ciphertext && value.iv && value.tag);
}

export async function withProviderCredential<T>(
  uid: string,
  provider: AiProvider,
  callback: (access: {
    credential: ProviderCredential | null;
    save: (next: ProviderCredential) => Promise<void>;
  }) => Promise<T>,
): Promise<T> {
  assertUid(uid);
  const document = ref(uid, provider);
  const lockId = randomBytes(18).toString('hex');
  const now = Date.now();
  let current: StoredCredential | undefined;
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(document);
    const value = snapshot.exists ? (snapshot.data() as StoredCredential) : undefined;
    if (value?.lock && value.lock.until > now && value.lock.id !== lockId) throw new Error('AI provider is busy');
    current = value;
    transaction.set(
      document,
      { ...(value ?? { provider }), provider, lock: { id: lockId, until: now + LEASE_MS } },
      { merge: true },
    );
  });

  let latest: ProviderCredential | null = null;
  let stopped = false;
  const heartbeat = setInterval(() => {
    if (stopped) return;
    void getFirestore()
      .runTransaction(async (transaction) => {
        const snapshot = await transaction.get(document);
        const value = snapshot.data() as StoredCredential | undefined;
        if (value?.lock?.id === lockId) transaction.update(document, { 'lock.until': Date.now() + LEASE_MS });
      })
      .catch(() => undefined);
  }, HEARTBEAT_MS);
  const save = async (next: ProviderCredential) => {
    latest = next;
    const encrypted = encrypt(next, uid, provider);
    await getFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(document);
      const value = snapshot.data() as StoredCredential | undefined;
      if (value?.lock?.id !== lockId) throw new Error('AI provider lock expired');
      transaction.update(document, {
        ...encrypted,
        provider,
        updatedAt: Date.now(),
        lock: { id: lockId, until: Date.now() + LEASE_MS },
      });
    });
  };
  try {
    latest = current?.ciphertext ? decrypt(current, uid, provider) : null;
    return await callback({ credential: latest, save });
  } finally {
    stopped = true;
    clearInterval(heartbeat);
    const encrypted = latest ? encrypt(latest, uid, provider) : undefined;
    await getFirestore()
      .runTransaction(async (transaction) => {
        const snapshot = await transaction.get(document);
        const value = snapshot.data() as StoredCredential | undefined;
        if (value?.lock?.id !== lockId) return;
        if (encrypted) transaction.update(document, { ...encrypted, provider, updatedAt: Date.now(), lock: null });
        else transaction.update(document, { lock: null });
      })
      .catch(() => undefined);
  }
}

export async function disconnectProviderCredential(uid: string, provider: AiProvider) {
  assertUid(uid);
  const document = ref(uid, provider);
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(document);
    const value = snapshot.data() as StoredCredential | undefined;
    if (value?.lock && value.lock.until > Date.now()) throw new Error('AI provider is busy');
    transaction.delete(document);
  });
}
