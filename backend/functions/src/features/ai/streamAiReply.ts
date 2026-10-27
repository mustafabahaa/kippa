import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { kippaAiEncryptionKey, withProviderCredential, type ProviderCredential } from './credentialStore.js';

type ClientTool = { name: string; description: string; schema: object };
type ClientMessage = { role: 'user' | 'assistant'; content: string };
type AiRequest = { provider: string; householdId: string; system: string; messages: ClientMessage[]; tools: ClientTool[] };
const toolCalls = () => getFirestore().collection('aiPendingToolCalls');

function validate(data: unknown): AiRequest {
  if (!data || typeof data !== 'object' || JSON.stringify(data).length > 500_000) throw new HttpsError('invalid-argument', 'Invalid AI request');
  const value = data as AiRequest;
  if (value.provider !== 'codex' || typeof value.householdId !== 'string' || !/^[A-Za-z0-9_-]{1,150}$/.test(value.householdId) || typeof value.system !== 'string' || value.system.length > 60_000 || !Array.isArray(value.messages) || value.messages.length > 100 || !Array.isArray(value.tools) || value.tools.length > 100) throw new HttpsError('invalid-argument', 'Invalid AI request');
  if (value.messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 50_000)) throw new HttpsError('invalid-argument', 'Invalid messages');
  if (value.tools.some(t => !t || typeof t.name !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(t.name) || typeof t.description !== 'string' || t.description.length > 2000 || !t.schema || typeof t.schema !== 'object')) throw new HttpsError('invalid-argument', 'Invalid tools');
  return value;
}

export const submitAiToolResult = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const { id, result, error } = request.data ?? {};
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id) || JSON.stringify(result ?? null).length > 600_000) throw new HttpsError('invalid-argument', 'Invalid tool result');
  const ref = toolCalls().doc(id);
  await getFirestore().runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    const data = snapshot.data();
    if (!data || data.uid !== request.auth!.uid || data.state !== 'waiting' || data.expiresAt < Date.now()) throw new HttpsError('not-found', 'Tool call expired');
    tx.update(ref, { state: 'finished', result: result ?? null, error: error === true });
  });
  return { accepted: true };
});

export const streamAiReply = onCall({ secrets: [kippaAiEncryptionKey], timeoutSeconds: 240, memory: '1GiB', concurrency: 1 }, async (request, response) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  if (!request.acceptsStreaming || !response) throw new HttpsError('failed-precondition', 'Streaming required');
  const uid = request.auth.uid;
  const data = validate(request.data);
  const profile = (await getFirestore().collection('users').doc(uid).get()).data();
  const households = profile?.householdIds ?? (profile?.householdId ? [profile.householdId] : []);
  if (!Array.isArray(households) || !households.includes(data.householdId)) throw new HttpsError('permission-denied', 'Household access required');

  return withProviderCredential(uid, 'codex', async (credential, save) => {
    if (!credential) throw new HttpsError('failed-precondition', 'Connect Codex first');
    const home = await mkdtemp(join(tmpdir(), 'kippa-ai-auth-'));
    const authPath = join(home, 'auth.json');
    await writeFile(authPath, JSON.stringify(credential), { mode: 0o600 });
    const pending = new Set<string>();
    const child = fork(fileURLToPath(new URL('../../../harness-runtime/runner.mjs', import.meta.url)), [], { env: { PATH: process.env.PATH ?? '/usr/bin:/bin', LANG: 'C.UTF-8', HOME: home, CODEX_HOME: home }, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    let queue = Promise.resolve();
    let completed = false;
    let failed = false;
    let failureDetail: { stage?: unknown; name?: unknown; code?: unknown; message?: unknown } | null = null;
    const abort = () => { child.kill('SIGTERM'); };
    response.signal.addEventListener('abort', abort, { once: true });
    child.on('message', (message: any) => {
      queue = queue.then(async () => {
        if (message?.type === 'text' && typeof message.text === 'string') await response.sendChunk({ type: 'text', text: message.text });
        if (message?.type === 'error') {
          failed = true;
          failureDetail = message;
          console.error('kippa:ai:runner-error', JSON.stringify({ stage: message.stage, name: message.name, code: message.code, message: message.message }));
        }
        if (message?.type === 'done') completed = true;
        if (message?.type === 'tool-call' && typeof message.id === 'string' && typeof message.name === 'string' && data.tools.some(t => t.name === message.name)) {
          const id = message.id;
          pending.add(id);
          const ref = toolCalls().doc(id);
          await ref.create({ uid, state: 'waiting', expiresAt: Date.now() + 60_000 });
          if (!(await response.sendChunk({ type: 'tool-call', id, name: message.name, input: message.input }))) throw new Error('Stream ended');
          const answer = await waitForToolResult(ref, response.signal);
          if (child.connected) child.send({ type: 'tool-result', id, ...answer });
          pending.delete(id);
          await ref.delete();
        }
      }).catch(() => { failed = true; abort(); });
    });
    try {
      child.send({ type: 'start', model: 'gpt-6-luna', system: data.system, tools: data.tools, prompt: JSON.stringify(data.messages) });
      const exit = await new Promise<number | null>((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
      await queue;
      if (response.signal.aborted) throw new HttpsError('cancelled', 'Request cancelled');
      if (failed || !completed || exit !== 0) throw classifyRunnerFailure(failureDetail);
      return { complete: true };
    } finally {
      response.signal.removeEventListener('abort', abort);
      child.kill('SIGTERM');
      await Promise.all([...pending].map(id => toolCalls().doc(id).delete().catch(() => {})));
      try { await save(JSON.parse(await readFile(authPath, 'utf8')) as ProviderCredential); } finally { await rm(home, { recursive: true, force: true }); }
    }
  });
});

function classifyRunnerFailure(failure: { stage?: unknown; name?: unknown; code?: unknown; message?: unknown } | null): HttpsError {
  const text = `${failure?.name ?? ''} ${failure?.message ?? failure?.code ?? ''}`;
  if (/usage limit|purchase more credits|rate.?limit|resource.?exhausted|\b429\b/i.test(text)) {
    // Codex renders the reset moment in the machine's local timezone, so parsing
    // it server-side in the same timezone yields the correct instant.
    const raw = text.match(/try again at ([^.]+)/i)?.[1]?.trim();
    const parsed = raw ? new Date(raw.replace(/(\d+)(st|nd|rd|th)/gi, '$1')) : undefined;
    const resetAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
    return new HttpsError('resource-exhausted', 'Kip reached your ChatGPT Codex usage limit. It resets automatically, and your message is saved.', resetAt ? { resetAt } : undefined);
  }
  if (/\b401\b|\b403\b|unauthorized|forbidden/i.test(text)) {
    return new HttpsError('failed-precondition', 'Kip lost its ChatGPT connection. Reconnect ChatGPT from the Kip page and try again.');
  }
  return new HttpsError('unavailable', 'Kip could not complete that response. Please try again.');
}

function waitForToolResult(ref: FirebaseFirestore.DocumentReference, signal: AbortSignal): Promise<{ result?: unknown; error?: boolean }> {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    const timeout = setTimeout(() => finish(new Error('Tool timed out')), 60_000);
    const onAbort = () => finish(new Error('Request cancelled'));
    const finish = (error?: Error, result?: { result?: unknown; error?: boolean }) => {
      clearTimeout(timeout); signal.removeEventListener('abort', onAbort); unsubscribe();
      if (error) reject(error); else resolve(result ?? {});
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) { onAbort(); return; }
    unsubscribe = ref.onSnapshot(snapshot => { const data = snapshot.data(); if (data?.state === 'finished') finish(undefined, { result: data.result, error: data.error }); }, () => finish(new Error('Tool unavailable')));
  });
}
