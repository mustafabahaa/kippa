import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request identity for the MCP server. Tool executes and the firebase/*
 * shims read the linked user from here instead of a browser session.
 */
export const mcpRequestContext = new AsyncLocalStorage<{ uid: string; householdId: string; label: string }>();
