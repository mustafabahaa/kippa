import { getAuth } from 'firebase-admin/auth';
import { mcpRequestContext } from '../requestContext';
import { functions } from './configFirebase';

/**
 * Server-side stand-in for 'firebase/functions'. Kippa libs call deployed
 * HTTPS callables (message ingestion, household membership); on the server we
 * invoke the same endpoints over REST with a short-lived ID token minted for
 * the MCP-linked user, so authorization behaves exactly like the app.
 */
const REGION = process.env.KIPPA_FUNCTIONS_REGION ?? 'us-central1';

function configuration() {
  const project = process.env.GCLOUD_PROJECT;
  const apiKey = process.env.KIPPA_WEB_API_KEY;
  if (!project || !apiKey) throw new Error('MCP callable configuration is missing.');
  return { project, apiKey };
}

const idTokens = new Map<string, { token: string; expiresAt: number }>();

async function idTokenFor(uid: string): Promise<string> {
  const cached = idTokens.get(uid);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const { apiKey } = configuration();
  const customToken = await getAuth().createCustomToken(uid);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const payload = (await response.json()) as { idToken?: string; error?: { message?: string } };
  if (!payload.idToken) {
    throw new Error(`Could not mint an invocation token: ${payload.error?.message ?? response.status}`);
  }
  idTokens.set(uid, { token: payload.idToken, expiresAt: Date.now() + 55 * 60_000 });
  return payload.idToken;
}

export function httpsCallable<Request = unknown, Result = unknown>(functionsRef: unknown, name: string) {
  if (functionsRef !== functions) throw new Error('A configured server functions reference is required.');
  return async (data?: Request): Promise<{ data: Result }> => {
    const context = mcpRequestContext.getStore();
    if (!context) throw new Error('No MCP request context is active for a callable invocation.');
    const { project } = configuration();
    const token = await idTokenFor(context.uid);
    const response = await fetch(`https://${REGION}-${project}.cloudfunctions.net/${name}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: data ?? {} }),
    });
    const payload = (await response.json().catch(() => ({}))) as { result?: unknown; error?: { message?: string } };
    if (!response.ok && !payload.error) throw new Error(`Callable ${name} failed (${response.status}).`);
    if (payload.error) throw new Error(payload.error.message ?? `Callable ${name} failed.`);
    return { data: (payload.result ?? null) as Result };
  };
}
