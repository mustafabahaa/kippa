import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== ''
);

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(firebaseApp);
    // Persistent IndexedDB cache: lets the SDK buffer writes locally and serve
    // cached reads while offline, auto-syncing on reconnect. Must be set up
    // before any Firestore call and only once — this is the single init point.
    db = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      ignoreUndefinedProperties: true,
    });
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.error(
    'Firebase credentials missing. Copy .env.example to .env and set VITE_FIREBASE_* values.'
  );
}

export const isFirebaseReady = isFirebaseConfigured && !!auth && !!db;

// FCM messaging — lazy-initialized on first request. Null/undefined until
// getMessagingAsync() is awaited. Use the getter in hooks; don't read the
// `messaging` export synchronously (it may not have resolved yet).
let messaging: Messaging | null = null;
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Lazily initializes and returns the Firebase Messaging instance, or null
 * if push isn't supported in this browser / VAPID key is missing.
 */
export async function getMessagingAsync(): Promise<Messaging | null> {
  if (messaging) return messaging;
  if (!firebaseApp || !vapidKey) return null;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (e) {
    console.warn('Firebase messaging initialization failed:', e);
    return null;
  }
}

export { firebaseApp, auth, db, messaging, vapidKey };
