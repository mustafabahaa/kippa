import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { runCodexHarness } from '@monochrome-ai/core';
import { requireAllowedUid } from '../../libs/allowedUsers.js';
import { kippaAiEncryptionKey, withProviderCredential } from './credentialStore.js';

type ClientTool = { name: string; description: string; schema: object };
type ClientMessage = { role: 'user' | 'assistant'; content: string };
type AiRequest = {
  provider: string;
  householdId: string;
  system: string;
  messages: ClientMessage[];
  tools: ClientTool[];
};
const toolCalls = () => getFirestore().collection('aiPendingToolCalls');

function validate(data: unknown): AiRequest {
  if (!data || typeof data !== 'object' || JSON.stringify(data).length > 500_000)
    throw new HttpsError('invalid-argument', 'Invalid AI request');
  const value = data as AiRequest;
  if (
    value.provider !== 'codex' ||
    typeof value.householdId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,150}$/.test(value.householdId) ||
    typeof value.system !== 'string' ||
    value.system.length > 60_000 ||
    !Array.isArray(value.messages) ||
    value.messages.length > 100 ||
    !Array.isArray(value.tools) ||
    value.tools.length > 100
  )
    throw new HttpsError('invalid-argument', 'Invalid AI request');
  if (
    value.messages.some(
      (m) =>
        !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 50_000,
    )
  )
    throw new HttpsError('invalid-argument', 'Invalid messages');
  if (
    value.tools.some(
      (t) =>
        !t ||
        typeof t.name !== 'string' ||
        !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(t.name) ||
        typeof t.description !== 'string' ||
        t.description.length > 2000 ||
        !t.schema ||
        typeof t.schema !== 'object',
    )
  )
    throw new HttpsError('invalid-argument', 'Invalid tools');
  return value;
}

export const submitAiToolResult = onCall(async (request) => {
  const uid = requireAllowedUid(request.auth);
  const { id, result, error } = request.data ?? {};
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id) || JSON.stringify(result ?? null).length > 600_000)
    throw new HttpsError('invalid-argument', 'Invalid tool result');
  const ref = toolCalls().doc(id);
  await getFirestore().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const data = snapshot.data();
    if (!data || data.uid !== uid || data.state !== 'waiting' || data.expiresAt < Date.now())
      throw new HttpsError('not-found', 'Tool call expired');
    tx.update(ref, { state: 'finished', result: result ?? null, error: error === true });
  });
  return { accepted: true };
});

export const streamAiReply = onCall(
  { secrets: [kippaAiEncryptionKey], timeoutSeconds: 240, memory: '1GiB', concurrency: 1 },
  async (request, response) => {
    const uid = requireAllowedUid(request.auth);
    if (!request.acceptsStreaming || !response) throw new HttpsError('failed-precondition', 'Streaming required');
    const data = validate(request.data);
    const profile = (await getFirestore().collection('users').doc(uid).get()).data();
    const households = profile?.householdIds ?? (profile?.householdId ? [profile.householdId] : []);
    if (!Array.isArray(households) || !households.includes(data.householdId))
      throw new HttpsError('permission-denied', 'Household access required');

    return withProviderCredential(uid, 'codex', async ({ credential, save }) => {
      if (!credential) throw new HttpsError('failed-precondition', 'Connect Codex first');
      const pending = new Set<string>();
      try {
        await runCodexHarness({
          credential: credential as Record<string, unknown>,
          saveCredential: (value) => save(value as typeof credential),
          model: process.env.KIPPA_CODEX_MODEL || 'gpt-6-luna',
          system: data.system,
          tools: data.tools,
          toolPolicy: { inactiveTools: ['bash', 'apply_patch', 'view_image', 'webSearch'] },
          prompt: JSON.stringify(data.messages),
          signal: response.signal,
          onText: async (text) => {
            if (!(await response.sendChunk({ type: 'text', text }))) throw new Error('Stream ended');
          },
          onTool: async ({ id, name, input }, signal) => {
            if (!data.tools.some((tool) => tool.name === name)) throw new Error('Unknown app tool');
            pending.add(id);
            const ref = toolCalls().doc(id);
            try {
              await ref.create({ uid, state: 'waiting', expiresAt: Date.now() + 60_000 });
              if (!(await response.sendChunk({ type: 'tool-call', id, name, input }))) throw new Error('Stream ended');
              return await waitForToolResult(ref, signal);
            } finally {
              pending.delete(id);
              await ref.delete().catch(() => {});
            }
          },
        });
        return { complete: true };
      } catch (error) {
        if (response.signal.aborted) throw new HttpsError('cancelled', 'Request cancelled');
        const detail = error as { stage?: unknown; name?: unknown; code?: unknown; message?: unknown };
        console.error('kippa:ai:runner-error', JSON.stringify({ stage: detail.stage, name: detail.name, code: detail.code, message: detail.message }));
        throw classifyRunnerFailure(detail);
      } finally {
        await Promise.all([...pending].map((id) => toolCalls().doc(id).delete().catch(() => {})));
      }
    });
  },
);

function classifyRunnerFailure(
  failure: { stage?: unknown; name?: unknown; code?: unknown; message?: unknown } | null,
): HttpsError {
  const text = `${failure?.name ?? ''} ${failure?.message ?? failure?.code ?? ''}`;
  if (/usage limit|purchase more credits|rate.?limit|resource.?exhausted|\b429\b/i.test(text)) {
    // Codex renders the reset moment in the machine's local timezone, so parsing
    // it server-side in the same timezone yields the correct instant.
    const raw = text.match(/try again at ([^.]+)/i)?.[1]?.trim();
    const parsed = raw ? new Date(raw.replace(/(\d+)(st|nd|rd|th)/gi, '$1')) : undefined;
    const resetAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
    return new HttpsError(
      'resource-exhausted',
      'Kip reached your ChatGPT Codex usage limit. It resets automatically, and your message is saved.',
      resetAt ? { resetAt } : undefined,
    );
  }
  if (/\b401\b|\b403\b|unauthorized|forbidden/i.test(text)) {
    return new HttpsError(
      'failed-precondition',
      'Kip lost its ChatGPT connection. Reconnect ChatGPT from the Kip page and try again.',
    );
  }
  return new HttpsError('unavailable', 'Kip could not complete that response. Please try again.');
}

function waitForToolResult(
  ref: FirebaseFirestore.DocumentReference,
  signal: AbortSignal,
): Promise<{ result?: unknown; error?: boolean }> {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    const timeout = setTimeout(() => finish(new Error('Tool timed out')), 60_000);
    const onAbort = () => finish(new Error('Request cancelled'));
    const finish = (error?: Error, result?: { result?: unknown; error?: boolean }) => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      unsubscribe();
      if (error) reject(error);
      else resolve(result ?? {});
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    unsubscribe = ref.onSnapshot(
      (snapshot) => {
        const data = snapshot.data();
        if (data?.state === 'finished') finish(undefined, { result: data.result, error: data.error });
      },
      () => finish(new Error('Tool unavailable')),
    );
  });
}
