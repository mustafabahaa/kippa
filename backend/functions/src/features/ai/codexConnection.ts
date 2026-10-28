import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import {
  disconnectProviderCredential,
  hasProviderCredential,
  kippaAiEncryptionKey,
  withProviderCredential,
} from './credentialStore.js';

type ProviderRequest = { provider?: string };
const provider = (value: string | undefined): 'codex' => {
  if (value && value !== 'codex') throw new HttpsError('invalid-argument', 'Unsupported AI provider');
  return 'codex';
};

function userId(request: { auth?: { uid?: string } }) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in is required');
  return request.auth.uid;
}

const require = createRequire(import.meta.url);

async function runDeviceLogin(
  home: string,
  signal: AbortSignal,
  onDevice: (url: string, code: string) => Promise<void>,
) {
  const binary =
    process.env.KIPPA_CODEX_BIN || join(dirname(require.resolve('@openai/codex/package.json')), 'bin', 'codex.js');
  const child = spawn(process.execPath, [binary, 'login', '--device-auth', '-c', 'cli_auth_credentials_store="file"'], {
    env: { PATH: process.env.PATH ?? '/usr/bin:/bin', LANG: 'C.UTF-8', HOME: home, CODEX_HOME: home },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  let output = '';
  let sent = false;
  let deviceMessage: Promise<void> | undefined;
  const consume = (chunk: Buffer) => {
    output += chunk.toString().replace(/\u001b\[[0-9;]*m/g, '');
    if (output.length > 32_000) output = output.slice(-32_000);
    if (!sent) {
      const url = output.match(/https:\/\/(?:auth\.openai\.com|chatgpt\.com)\/codex\/device/)?.[0];
      const code = output.match(/\b[A-Z0-9]{4,8}(?:-[A-Z0-9]{4,8}){1,2}\b/)?.[0];
      if (url && code) {
        sent = true;
        deviceMessage = onDevice(url, code);
      }
    }
  };
  child.stdout.on('data', consume);
  child.stderr.on('data', consume);
  const abort = () => {
    try {
      if (child.pid) process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, closeSignal) => resolve({ code, signal: closeSignal }));
    });
    if (signal.aborted) throw new HttpsError('cancelled', 'Connection cancelled');
    if (result.code !== 0) throw new HttpsError('failed-precondition', 'Codex login failed');
    if (deviceMessage) await deviceMessage;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

async function readAuth(home: string) {
  for (const filename of ['auth.json', 'credentials.json']) {
    try {
      return JSON.parse(await fs.readFile(join(home, filename), 'utf8')) as Record<string, unknown>;
    } catch {
      /* try next */
    }
  }
  throw new HttpsError('failed-precondition', 'Codex login completed without credentials');
}

export const getAiConnection = onCall({ secrets: [kippaAiEncryptionKey] }, async (request) => {
  const uid = userId(request);
  const selected = provider((request.data as ProviderRequest | undefined)?.provider);
  return { provider: selected, connected: await hasProviderCredential(uid, selected) };
});

export const startAiConnection = onCall(
  { secrets: [kippaAiEncryptionKey], timeoutSeconds: 600 },
  async (request, response) => {
    const uid = userId(request);
    const selected = provider((request.data as ProviderRequest | undefined)?.provider);
    if (!request.acceptsStreaming || !response)
      throw new HttpsError('failed-precondition', 'Streaming is required for device login');
    const home = await fs.mkdtemp(join(tmpdir(), 'kippa-codex-'));
    const attemptId = randomUUID();
    const attempt = getFirestore().collection('aiLoginAttempts').doc(attemptId);
    await attempt.create({ uid, cancel: false, expiresAt: Date.now() + 600_000 });
    const controller = new AbortController();
    const abort = () => controller.abort();
    response.signal.addEventListener('abort', abort, { once: true });
    const unsubscribe = attempt.onSnapshot(
      (snapshot) => {
        if (snapshot.data()?.cancel === true) controller.abort();
      },
      () => controller.abort(),
    );
    try {
      await runDeviceLogin(home, controller.signal, async (verificationUrl, code) => {
        if (!controller.signal.aborted) await response.sendChunk({ type: 'device', verificationUrl, code, attemptId });
      });
      const credential = await readAuth(home);
      await withProviderCredential(uid, selected, async (_existing, save) => {
        await save(credential);
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Unable to connect Codex');
    } finally {
      response.signal.removeEventListener('abort', abort);
      unsubscribe();
      await attempt.delete().catch(() => undefined);
      await fs.rm(home, { recursive: true, force: true }).catch(() => undefined);
    }
    await response.sendChunk({ type: 'connected', provider: selected, connected: true });
    return { type: 'connected', provider: selected, connected: true };
  },
);

export const cancelAiConnection = onCall(async (request) => {
  const uid = userId(request);
  const attemptId = request.data?.attemptId;
  if (typeof attemptId !== 'string' || !/^[0-9a-f-]{36}$/.test(attemptId))
    throw new HttpsError('invalid-argument', 'Invalid connection attempt');
  const ref = getFirestore().collection('aiLoginAttempts').doc(attemptId);
  await getFirestore().runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data();
    if (!data || data.uid !== uid) throw new HttpsError('not-found', 'Connection attempt not found');
    tx.update(ref, { cancel: true });
  });
  return { cancelled: true };
});

export const disconnectAiConnection = onCall({ secrets: [kippaAiEncryptionKey] }, async (request) => {
  const uid = userId(request);
  const selected = provider((request.data as ProviderRequest | undefined)?.provider);
  try {
    await disconnectProviderCredential(uid, selected);
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('aborted', 'AI provider is busy');
  }
  return { provider: selected, connected: false };
});
