/**
 * Server-side stand-in for '@/config/firebase'. The MCP bundle swaps this in;
 * interactive browser auth never runs on the server. db/functions are
 * non-null sentinels so client libs' configured checks pass, while the actual
 * data access goes through the Admin-backed dbLib shim.
 */
export const isFirebaseConfigured = true;
export const isFirebaseReady = true;
export const db = { __kippaServerShim: true };
export const functions = { __kippaServerShim: true };
export const auth = undefined;
export const firebaseApp = undefined;
export const vapidKey = undefined;
export async function getMessagingAsync() {
  return null;
}
