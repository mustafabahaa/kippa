import {
  doc,
  setDoc,
  deleteDoc,
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { getToken as getFcmToken, deleteToken as deleteFcmToken } from 'firebase/messaging';
import { getMessagingAsync } from '@/config/firebase';

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
  // 1. Request permission FIRST to preserve the user gesture on iOS/Safari.
  // Any async operation (like getMessagingAsync()) prior to requestPermission()
  // breaks the user gesture trust chain, causing Safari to silently ignore the prompt and hang.
  let permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
  if (permission === 'default' && typeof Notification !== 'undefined') {
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

  // 2. Initialize messaging
  const messaging = await getMessagingAsync();
  if (!messaging) {
    console.warn('[notifications] Messaging not initialized (no VAPID key?)');
    return null;
  }

  // 3. Get token.
  let token: string;
  try {
    const swReg = await navigator.serviceWorker.ready;
    token = await getFcmToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
  } catch (e) {
    console.warn('[notifications] getToken failed:', e);
    return null;
  }
  if (!token) return null;

  // 4. Write to Firestore
  const db = getFirestore();
  const now = new Date().toISOString();
  const deviceId = getOrCreateDeviceId();
  const tokenRef = doc(db, `households/${householdId}/fcmTokens`, token);
  await setDoc(tokenRef, {
    token,
    uid,
    deviceId,
    deviceType: detectDeviceType(),
    createdAt: now,
    lastSeenAt: now,
  });

  // Clean up any other old tokens for this same physical device/browser
  try {
    const tokensColl = collection(db, `households/${householdId}/fcmTokens`);
    const q = query(
      tokensColl,
      where('uid', '==', uid),
      where('deviceId', '==', deviceId)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    let hasDeletes = false;
    snap.forEach((d) => {
      if (d.id !== token) {
        batch.delete(d.ref);
        hasDeletes = true;
      }
    });
    if (hasDeletes) {
      await batch.commit();
    }
  } catch (e) {
    console.warn('[notifications] Failed to clean up stale device tokens:', e);
  }

  return token;
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'unknown-device';
  }
  let deviceId = localStorage.getItem('kippa_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('kippa_device_id', deviceId);
  }
  return deviceId;
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

