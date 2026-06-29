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

  // 2. Get token
  let token: string;
  try {
    token = await getFcmToken(messaging, { vapidKey });
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
