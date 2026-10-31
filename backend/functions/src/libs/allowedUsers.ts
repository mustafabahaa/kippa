import { HttpsError } from 'firebase-functions/v2/https';

type AuthIdentity = {
  uid?: string;
  token?: object;
};

/** Enforce the server-provisioned private access claim at callable boundaries. */
export function requireAllowedUid(auth: AuthIdentity | null | undefined): string {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  if ((auth.token as { kippaAccess?: unknown } | undefined)?.kippaAccess !== true) {
    throw new HttpsError('permission-denied', 'This Kippa account is not authorized.');
  }
  return auth.uid;
}
