import { createHash } from 'node:crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { aiToolDefinitions } from '../../../frontend/web/src/features/ai/services/tools/index';
import { publicUrl, oauthProvider } from './oauthProvider';
export { kippaMcpAuth } from './oauth';
import { mcpRequestContext } from './requestContext';

/**
 * Kippa's MCP endpoint. It exposes the app's real AI tool registry — the same
 * definitions the in-app assistant uses — executed server-side against
 * Firestore with Admin credentials. Identity comes exclusively from the MCP
 * token (never from tool arguments). Credentials default to read-only;
 * explicitly write-enabled credentials authorize immediate tool execution.
 */
const EXCLUDED_TOOLS = new Set([
  // Browser- or app-shell-bound tools that cannot run on a server.
  'getPushNotificationStatus',
  'enablePushNotifications',
  'disablePushNotifications',
  'createHousehold',
  'switchHousehold',
  'requestHouseholdJoin',
  'decideHouseholdJoinRequest',
  'leaveHousehold',
  // Chat rendering is meaningless outside the Kippa conversation UI.
  'renderChart',
  // This endpoint is deliberately bound to one household.
  'listMyHouseholds',
]);

type McpCredential = {
  userId: string;
  householdId: string;
  label: string;
  createdAt: number;
  revokedAt?: number;
  expiresAt?: number;
  allowWrites?: boolean;
  resource?: string;
};

if (!getApps().length) initializeApp();

async function credentialFor(token: string): Promise<McpCredential | null> {
  const hash = createHash('sha256').update(token).digest('hex');
  const snapshot = await getFirestore().collection('mcpCredentials').doc(hash).get();
  const data = snapshot.data() as McpCredential | undefined;
  if (
    !data ||
    data.revokedAt ||
    !data.expiresAt ||
    !Number.isSafeInteger(data.expiresAt) ||
    data.expiresAt <= Date.now()
  )
    return null;
  if (!validSegment(data.userId) || !validSegment(data.householdId)) return null;
  if (data.resource) {
    const authorization = await oauthProvider.verifyAccessToken(token);
    return { ...data, allowWrites: authorization.scopes.includes('kippa:write') };
  }
  const [user, household, authUser] = await Promise.all([
    getFirestore().doc(`users/${data.userId}`).get(),
    getFirestore().doc(`households/${data.householdId}/householdInfo/info`).get(),
    getAuth().getUser(data.userId),
  ]);
  if (
    authUser.disabled ||
    !user.data()?.householdIds?.includes(data.householdId) ||
    household.data()?.createdBy !== data.userId
  )
    return null;
  return data;
}

function validSegment(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !value.includes('/') && value !== '.' && value !== '..';
}

function tokenFromRequest(req: { headers: Record<string, unknown> }): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  return /^Bearer (kippa_[A-Za-z0-9_-]{43})$/i.exec(header)?.[1] ?? null;
}

function permitted(name: string, allowWrites: boolean) {
  const definition = Object.hasOwn(aiToolDefinitions, name) ? aiToolDefinitions[name] : undefined;
  return !!definition && !EXCLUDED_TOOLS.has(name) && (definition.risk === 'read' || allowWrites);
}

function buildServer(context: { uid: string; householdId: string; allowWrites: boolean }) {
  const server = new McpServer({ name: 'kippa', version: '1.0.0' });
  for (const [name, definition] of Object.entries(aiToolDefinitions)) {
    if (!permitted(name, context.allowWrites)) continue;
    server.registerTool(
      name,
      {
        description: definition.description,
        _meta: {
          securitySchemes: [
            { type: 'oauth2', scopes: definition.risk === 'read' ? ['kippa:read'] : ['kippa:read', 'kippa:write'] },
          ],
        },
        inputSchema: definition.inputSchema,
        annotations: {
          readOnlyHint: definition.risk === 'read',
          destructiveHint: definition.risk !== 'read',
          idempotentHint: definition.risk === 'read',
          openWorldHint: true,
        },
      },
      async (input) => {
        try {
          const result = await definition.execute(input, {
            householdId: context.householdId,
            userId: context.uid,
            userDisplayName: 'Kip MCP',
            sourceMessageIds: [],
          });
          return { content: [{ type: 'text', text: JSON.stringify(result ?? { ok: true }) }], isError: false };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'The tool could not complete.';
          return { content: [{ type: 'text', text: message }], isError: true };
        }
      },
    );
  }
  return server;
}

export const kippaMcp = onRequest(
  { invoker: 'public', cors: false, timeoutSeconds: 180, memory: '512MiB' },
  async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    // This server is for remote clients; browser origins are not enabled.
    if (req.headers.origin) {
      res.status(403).json({ error: 'forbidden_origin' });
      return;
    }
    const token = tokenFromRequest(req);
    const credential = token
      ? await credentialFor(token).catch((error) => {
          console.error('kippa:mcp:credential-error', error instanceof Error ? error.message : error);
          return null;
        })
      : null;
    if (!credential) {
      const challenge = process.env.KIPPA_PUBLIC_URL
        ? `Bearer resource_metadata="${publicUrl()}/.well-known/oauth-protected-resource/mcp"`
        : 'Bearer realm="kippa"';
      res.setHeader('WWW-Authenticate', challenge);
      res.status(401).json({ error: 'unauthorized', message: 'A valid Kippa MCP token is required.' });
      return;
    }
    // Stateless streamable HTTP: only POST carries JSON-RPC; GET/DELETE sessions
    // are not supported, per the MCP stateless-server guidance.
    if (req.method !== 'POST') {
      res.status(405).setHeader('Allow', 'POST').json({ error: 'method_not_allowed', message: 'POST only.' });
      return;
    }
    const context = {
      uid: credential.userId,
      householdId: credential.householdId,
      label: credential.label,
      allowWrites: credential.allowWrites === true,
    };
    await mcpRequestContext.run(context, async () => {
      const server = buildServer(context);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });
  },
);
