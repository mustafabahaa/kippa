import { doc, setDoc, deleteDoc, getFirestore } from 'firebase/firestore';
import { getToken as getFcmToken, deleteToken as deleteFcmToken } from 'firebase/messaging';
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
  // Pre-register the Firebase messaging SW and pass it to getToken(). The SW
  // activation is awaited with a BOUNDED timeout — on iOS, if another SW
  // (vite-plugin-pwa's Workbox sw.js) controls the page, the messaging SW can
  // stall in 'waiting' indefinitely, so we must not wait forever.
  let token: string;
  try {
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    // Wait up to 3s for the SW to activate; resolve regardless after that.
    await new Promise<void>((resolve) => {
      if (swReg.active) return resolve();
      const sw = swReg.installing ?? swReg.waiting;
      if (!sw) return resolve();
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated' || sw.state === 'redundant') finish();
      });
      setTimeout(finish, 3000);
    });
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

/**
 * Disables notifications for this device: revokes the FCM token from the
 * messaging service and deletes its Firestore doc.
 *
 * Note: this does NOT change the browser-level permission (that stays
 * 'granted' — only the user can revoke it in OS settings). It removes the
 * device's registration so the server can no longer target it. To re-enable,
 * the user taps "Enable notifications" again, which re-registers a fresh token.
 */
export async function disableNotifications(
  householdId: string,
  token: string,
): Promise<void> {
  const messaging = await getMessagingAsync();
  if (messaging) {
    try {
      await deleteFcmToken(messaging);
    } catch (e) {
      console.warn('[notifications] deleteToken failed:', e);
      // Still remove the Firestore doc — don't leave stale tokens.
    }
  }
  await unregisterFcmToken(householdId, token);
}

