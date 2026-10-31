import { readFile } from 'node:fs/promises';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [action, email] = process.argv.slice(2);
if (!['grant', 'revoke'].includes(action) || !email || !email.includes('@')) {
  console.error('Usage: npm run owner-access -- <grant|revoke> <google-account-email>');
  process.exit(2);
}

const firebaseConfig = JSON.parse(await readFile(new URL('../../../.firebaserc', import.meta.url), 'utf8'));
const projectId = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? firebaseConfig.projects?.default;
if (!projectId) {
  console.error('No Firebase project configured. Set GCLOUD_PROJECT or add a default project with firebase use.');
  process.exit(2);
}

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...user.customClaims };
if (action === 'grant') claims.kippaAccess = true;
else delete claims.kippaAccess;
await auth.setCustomUserClaims(user.uid, claims);
console.log(
  `${action === 'grant' ? 'Granted' : 'Revoked'} Kippa access for ${user.email} (${user.uid}) in ${projectId}.`,
);
console.log('The account must sign out and sign in again, or refresh its Firebase ID token, for the change to take effect.');
