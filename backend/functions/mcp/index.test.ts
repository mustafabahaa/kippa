import { createHash } from 'node:crypto';
import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';

const mocks = vi.hoisted(() => {
  const docs = new Map<string, Record<string, unknown>>();
  let authUser: { disabled?: boolean } = {};
  const get = vi.fn(async (path: string) => ({ data: () => docs.get(path) }));
  const getFirestore = vi.fn(() => ({
    collection: (name: string) => ({ doc: (id: string) => ({ get: () => get(`${name}/${id}`) }) }),
    doc: (path: string) => ({ get: () => get(path) }),
  }));
  const getUser = vi.fn(async () => authUser);
  return {
    docs,
    get,
    getFirestore,
    getUser,
    getApps: vi.fn(() => [{}]),
    initializeApp: vi.fn(),
    setAuthUser: (value: { disabled?: boolean }) => { authUser = value; },
    tools: {
      listRecords: {
        description: 'List records', risk: 'read', inputSchema: undefined as z.ZodType<unknown> | undefined,
        execute: vi.fn(async (input: unknown, context: unknown) => ({ rows: [], input, context })),
      },
      createRecord: {
        description: 'Create a record', risk: 'write', inputSchema: undefined as z.ZodType<unknown> | undefined,
        execute: vi.fn(async (input: unknown) => ({ created: input })),
      },
    },
  };
});

vi.mock('firebase-admin/app', () => ({ getApps: mocks.getApps, initializeApp: mocks.initializeApp }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ getUser: mocks.getUser }) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: mocks.getFirestore }));
vi.mock('firebase-functions/v2/https', () => ({ onRequest: (...args: unknown[]) => args[1] }));
vi.mock('../../../frontend/web/src/features/ai/services/tools/index', () => ({ aiToolDefinitions: mocks.tools }));
vi.mock('../../../frontend/web/src/features/ai/services/toolRegistry', () => ({
  parseToolInput: async (definition: { inputSchema: z.ZodType }, input: unknown) => definition.inputSchema.parse(input),
}));

const TOKEN = `kippa_${Buffer.alloc(32, 9).toString('base64url')}`;
const HASH = createHash('sha256').update(TOKEN).digest('hex');
const USER_ID = 'user-1';
const HOUSEHOLD_ID = 'home-1';
mocks.tools.listRecords.inputSchema = z.object({});
mocks.tools.createRecord.inputSchema = z.object({ name: z.string() });

const { kippaMcp } = await import('./index.js');

describe('Kippa MCP HTTP endpoint', () => {
  let server: HttpServer;
  let baseUrl: URL;

  beforeEach(async () => {
    mocks.docs.clear();
    mocks.get.mockClear();
    mocks.getUser.mockClear();
    mocks.tools.listRecords.execute.mockClear();
    mocks.tools.createRecord.execute.mockClear();
    mocks.setAuthUser({ disabled: false });
    mocks.docs.set(`mcpCredentials/${HASH}`, {
      userId: USER_ID, householdId: HOUSEHOLD_ID, label: 'Test',
      createdAt: Date.now(), expiresAt: Date.now() + 60_000,
    });
    mocks.docs.set(`users/${USER_ID}`, { householdIds: [HOUSEHOLD_ID] });
    mocks.docs.set(`households/${HOUSEHOLD_ID}/householdInfo/info`, { createdBy: USER_ID });

    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = Buffer.concat(chunks).toString('utf8');
      (req as typeof req & { body?: unknown }).body = body ? JSON.parse(body) : undefined;
      const expressResponse = Object.assign(res, {
        status(code: number) { res.statusCode = code; return expressResponse; },
        json(value: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); return expressResponse; },
      });
      const handler = kippaMcp as unknown as (
        request: IncomingMessage & { body?: unknown },
        response: ServerResponse,
      ) => Promise<void>;
      await handler(req, expressResponse);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = new URL(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it('requires a bearer token in the header and never accepts a token from the body', async () => {
    const noHeader = await fetch(baseUrl, { method: 'POST', body: JSON.stringify({ token: TOKEN }) });
    expect(noHeader.status).toBe(401);
    expect(noHeader.headers.get('www-authenticate')).toContain('Bearer');

    const queryToken = await fetch(new URL(`/?access_token=${TOKEN}`, baseUrl), { method: 'POST' });
    expect(queryToken.status).toBe(401);
    const pathToken = await fetch(new URL(`/${TOKEN}`, baseUrl), { method: 'POST' });
    expect(pathToken.status).toBe(401);

    const header = await fetch(baseUrl, { method: 'GET', headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(header.status).toBe(405);
    expect(mocks.getUser).toHaveBeenCalledWith(USER_ID);
  });

  it.each([
    ['revoked credential', (credential: Record<string, unknown>) => { credential.revokedAt = Date.now(); }],
    ['expired credential', (credential: Record<string, unknown>) => { credential.expiresAt = Date.now() - 1000; }],
    ['non-owner credential', () => { mocks.docs.set(`households/${HOUSEHOLD_ID}/householdInfo/info`, { createdBy: 'someone-else' }); }],
    ['disabled account', () => { mocks.setAuthUser({ disabled: true }); }],
    ['removed household membership', () => { mocks.docs.set(`users/${USER_ID}`, { householdIds: [] }); }],
  ])('denies a %s', async (...[, mutate]) => {
    const credential = mocks.docs.get(`mcpCredentials/${HASH}`)!;
    mutate(credential);
    const response = await fetch(baseUrl, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: '{}' });
    expect(response.status).toBe(401);
  });

  it('speaks MCP initialize/list/call and denies write tools for a read-only token', async () => {
    const transport = new StreamableHTTPClientTransport(baseUrl, { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } });
    const client = new Client({ name: 'kippa-mcp-test', version: '1.0.0' });
    await client.connect(transport);

    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(['listRecords']);
    expect(listed.tools[0]?.annotations?.readOnlyHint).toBe(true);

    const read = await client.callTool({ name: 'listRecords', arguments: {} });
    expect(read.isError).toBe(false);
    expect(mocks.tools.listRecords.execute).toHaveBeenCalledWith({}, expect.objectContaining({ householdId: HOUSEHOLD_ID, userId: USER_ID }));

    const denied = await client.callTool({ name: 'createRecord', arguments: { name: 'blocked' } });
    expect(denied.isError).toBe(true);
    expect(mocks.tools.createRecord.execute).not.toHaveBeenCalled();
    await client.close();
  });

  it('allows write tools only when the credential enables writes', async () => {
    mocks.docs.get(`mcpCredentials/${HASH}`)!.allowWrites = true;
    const transport = new StreamableHTTPClientTransport(baseUrl, { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } });
    const client = new Client({ name: 'kippa-mcp-write-test', version: '1.0.0' });
    await client.connect(transport);

    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(['listRecords', 'createRecord']);
    const result = await client.callTool({ name: 'createRecord', arguments: { name: 'approved' } });
    expect(result.isError).toBe(false);
    expect(mocks.tools.createRecord.execute).toHaveBeenCalledWith({ name: 'approved' }, expect.objectContaining({ userId: USER_ID, householdId: HOUSEHOLD_ID }));
    await client.close();
  });

  it('rejects invalid tool arguments before execution', async () => {
    const transport = new StreamableHTTPClientTransport(baseUrl, { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } });
    const client = new Client({ name: 'kippa-mcp-validation-test', version: '1.0.0' });
    await client.connect(transport);

    const result = await client.callTool({ name: 'createRecord', arguments: { name: 23 } });
    expect(result.isError).toBe(true);
    expect(mocks.tools.createRecord.execute).not.toHaveBeenCalled();
    await client.close();
  });
});
