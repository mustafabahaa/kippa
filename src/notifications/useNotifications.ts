import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, vapidKey } from '../config/firebase';
import { registerFcmToken, unregisterFcmToken, touchFcmToken, disableNotifications } from './registerToken';

export type NotificationStatus =
  | 'unsupported'       // browser doesn't support service workers / push
  | 'ios-not-installed' // iOS Safari but not added to Home Screen
  | 'permission-denied' // user denied (must change in OS settings)
  | 'enabled'           // token registered successfully
  | 'pending';          // still working / not yet requested

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Push-notification registration lifecycle.
 *
 * IMPORTANT: on iOS Safari (PWA), the permission request MUST be triggered
 * by a user gesture (a click). Calling requestPermission() on page load fails
 * silently on iOS. So this hook does NOT auto-request permission. Instead it:
 *   - Detects platform support / iOS install state (read via `status`).
 *   - Exposes `requestPermission()` to be called from a button onClick.
 *   - Unregisters the token on logout.
 *   - Refreshes `lastSeenAt` while enabled.
 *
 * On Android/desktop, auto-requesting would also work, but we keep the
 * click-triggered flow uniform across platforms for simplicity.
 */
export function useNotifications(householdId: string | null | undefined) {
  const [status, setStatus] = useState<NotificationStatus>('pending');
  const currentTokenRef = useRef<string | null>(null);

  // Compute the static status (unsupported / ios-not-installed) once.
  useEffect(() => {
    if (!householdId) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    if (isIosSafari() && !isStandalone()) {
      setStatus('ios-not-installed');
      return;
    }

    if (!vapidKey || !auth) {
      setStatus('unsupported');
      return;
    }

    // If already granted (e.g. returning user), reflect that and re-register.
    if (Notification.permission === 'granted') {
      setStatus('pending'); // will resolve to 'enabled' once token registers
    } else {
      setStatus('pending');
    }
  }, [householdId]);

  // Re-register token when already granted (e.g. app reload), and handle
  // logout → unregister. This path does NOT call requestPermission, so it is
  // safe to run outside a user gesture.
  useEffect(() => {
    if (!householdId || !auth) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (isIosSafari() && !isStandalone()) return;
    if (!vapidKey) return;

    let cancelled = false;

    const sub = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      if (!user) {
        // Logged out — unregister
        if (currentTokenRef.current) {
          await unregisterFcmToken(householdId, currentTokenRef.current);
          currentTokenRef.current = null;
        }
        setStatus('pending');
        return;
      }

      // Only auto-register when permission is ALREADY granted (no prompt).
      // If permission is 'default', wait for the user to click the button.
      if (Notification.permission === 'granted') {
        const token = await registerFcmToken(householdId, user.uid, vapidKey);
        if (cancelled) return;
        if (token) {
          currentTokenRef.current = token;
          setStatus('enabled');
        } else {
          setStatus('pending');
        }
      }
    });

    return () => {
      cancelled = true;
      sub();
    };
  }, [householdId]);

  /**
   * Request notification permission and register the token.
   * MUST be called from a user gesture (button onClick) — iOS Safari requires
   * this or the permission prompt fails silently.
   */
  const requestPermission = useCallback(async () => {
    if (!householdId || !auth) return;
    const user = auth.currentUser;
    if (!user) return;

    setStatus('pending');
    const token = await registerFcmToken(householdId, user.uid, vapidKey);
    if (token) {
      currentTokenRef.current = token;
      setStatus('enabled');
    } else if (Notification.permission === 'denied') {
      setStatus('permission-denied');
    } else {
      setStatus('pending');
    }
  }, [householdId]);

  // Heartbeat: update lastSeenAt when enabled
  useEffect(() => {
    if (status !== 'enabled' || !currentTokenRef.current || !householdId) return;
    touchFcmToken(householdId, currentTokenRef.current).catch(() => {});
  }, [status, householdId]);

  /**
   * Disable notifications for this device. Revokes the FCM token and removes
   * the Firestore doc. The browser permission stays 'granted' (only the OS
   * settings can revoke that), so re-enabling is a single tap.
   */
  const disable = useCallback(async () => {
    if (!householdId || !currentTokenRef.current) return;
    await disableNotifications(householdId, currentTokenRef.current);
    currentTokenRef.current = null;
    setStatus('pending');
  }, [householdId]);

  return { status, requestPermission, disable };
}
