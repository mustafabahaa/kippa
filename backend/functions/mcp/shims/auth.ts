/**
 * Server-side stand-in for 'firebase/auth'. Interactive browser sign-in never
 * runs through the MCP server; only the type imports and unused members need
 * to exist for module resolution.
 */
const browserOnly =
  (name: string) =>
  () => {
    throw new Error(`firebase/auth ${name} is browser-only and cannot run on the server.`);
  };

export const signOut = browserOnly('signOut');
export const onAuthStateChanged = browserOnly('onAuthStateChanged');
export const signInWithPopup = browserOnly('signInWithPopup');
export const signInWithCustomToken = browserOnly('signInWithCustomToken');
export const GoogleAuthProvider = class GoogleAuthProvider {};
