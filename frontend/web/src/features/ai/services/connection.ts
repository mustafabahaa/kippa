import { httpsCallable, type HttpsCallableStreamResult } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { requiresAiConnection } from './aiProvider';

export type AiProvider = 'codex';

export type AiConnection = {
  provider: AiProvider;
  connected: boolean;
};

export type AiConnectionDevice = {
  verificationUrl: string;
  code: string;
  attemptId: string;
};

/** The connection gate is only meaningful for providers that need an account connection. */
export const isAiConnectionEnabled = requiresAiConnection;

type ConnectionRequest = { provider: AiProvider };
type ConnectionStreamChunk = {
  type?: unknown;
  verificationUrl?: unknown;
  code?: unknown;
  attemptId?: unknown;
  connected?: unknown;
};

const providerRequest: ConnectionRequest = { provider: 'codex' };

function requireFunctions() {
  if (!functions) throw new Error('Firebase Functions is not configured.');
  return functions;
}

function isSafeVerificationUrl(value: unknown): value is string {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && url.hostname === 'auth.openai.com';
  } catch {
    return false;
  }
}

function readDeviceChunk(chunk: unknown): AiConnectionDevice | null {
  const value = (chunk && typeof chunk === 'object' && 'data' in chunk)
    ? (chunk as { data?: unknown }).data
    : chunk;
  if (!value || typeof value !== 'object') return null;
  const item = value as ConnectionStreamChunk;
  if (item.type !== 'device' || !isSafeVerificationUrl(item.verificationUrl) || typeof item.code !== 'string' || typeof item.attemptId !== 'string') return null;
  return { verificationUrl: item.verificationUrl, code: item.code.slice(0, 64), attemptId: item.attemptId };
}

export async function cancelAiConnection(attemptId: string): Promise<void> {
  await httpsCallable(requireFunctions(), 'cancelAiConnection')({ attemptId });
}

export async function getAiConnection(): Promise<AiConnection> {
  if (!isAiConnectionEnabled) return { provider: 'codex', connected: true };
  const callable = httpsCallable<ConnectionRequest, AiConnection>(requireFunctions(), 'getAiConnection');
  const result = await callable(providerRequest);
  return result.data;
}

export async function startAiConnection(
  onDevice: (device: AiConnectionDevice) => void,
  signal?: AbortSignal,
): Promise<AiConnection> {
  const callable = httpsCallable<ConnectionRequest, AiConnection, ConnectionStreamChunk>(requireFunctions(), 'startAiConnection', { timeout: 600_000 });
  const result: HttpsCallableStreamResult<AiConnection, ConnectionStreamChunk> = await callable.stream(providerRequest, { signal });
  for await (const chunk of result.stream) {
    const device = readDeviceChunk(chunk);
    if (device) onDevice(device);
  }
  return await result.data;
}

export async function disconnectAiConnection(): Promise<void> {
  const callable = httpsCallable<ConnectionRequest, { disconnected: boolean }>(requireFunctions(), 'disconnectAiConnection');
  await callable(providerRequest);
}
