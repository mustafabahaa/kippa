import { doc, setDoc, deleteDoc, getFirestore } from 'firebase/firestore';
import { getToken as getFcmToken } from 'firebase/messaging';
import { getMessagingAsync } from '../config/firebase';

export type DeviceType = 'ios' | 'android' | 'web';

function detectDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
}

/**
 * Requests notification permission, gets an FCM token, and writes it to
 * Firestore under the user's household.
 *
 * Returns the token on success, or null if permission was denied / messaging
 * is unavailable.
 */
export async function registerFcmToken(
  householdId: string,
  uid: string,
  vapidKey: string,
): Promise<string | null> {
  const messaging = await getMessagingAsync();
  if (!messaging) {
    console.warn('[notifications] Messaging not initialized (no VAPID key?)');
    return null;
  }

  // 1. Request permission
  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      console.warn('[notifications] Permission request failed:', e);
      return null;
    }
  }
  if (permission !== 'granted') {
    console.info('[notifications] Permission not granted:', permission);
    return null;
  }

  // 2. Get token.
  // Register the Firebase messaging SW explicitly and pass the registration to
  // getToken(). vite-plugin-pwa registers /sw.js (Workbox) at scope '/' too;
  // if we let Firebase auto-register its SW, the two can fight for control of
  // the scope on iOS Safari and the internal SW handshake silently fails,
  // yielding an empty token. Owning the registration avoids that race.
  let token: string;
  try {
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    // Wait for the SW to be active before asking FCM for a token — on first
    // registration it starts in 'installing'/'waiting' and getToken() would
    // race ahead and return empty.
    if (swReg.active === null) {
      await new Promise<void>((resolve) => {
        const sw = swReg.installing ?? swReg.waiting;
        if (!sw) return resolve();
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve();
        });
      });
    }
    token = await getFcmToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
  } catch (e) {
    console.warn('[notifications] getToken failed:', e);
    return null;
  }
  if (!token) return null;

  // 3. Write to Firestore
  const db = getFirestore();
  const now = new Date().toISOString();
  const tokenRef = doc(db, `households/${householdId}/fcmTokens`, token);
  await setDoc(tokenRef, {
    token,
    uid,
    deviceType: detectDeviceType(),
    createdAt: now,
    lastSeenAt: now,
  });

  return token;
}

/**
 * Deletes the FCM token from Firestore (on logout).
 */
export async function unregisterFcmToken(
  householdId: string,
  token: string,
): Promise<void> {
  const db = getFirestore();
  const tokenRef = doc(db, `households/${householdId}/fcmTokens`, token);
  await deleteDoc(tokenRef).catch(() => {
    // best-effort
  });
}

/**
 * Updates lastSeenAt on app open (heartbeat for stale cleanup).
 */
export async function touchFcmToken(
  householdId: string,
  token: string,
): Promise<void> {
  const db = getFirestore();
  const tokenRef = doc(db, `households/${householdId}/fcmTokens`, token);
  await setDoc(tokenRef, { lastSeenAt: new Date().toISOString() }, { merge: true });
}
