import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onMessage } from 'firebase/messaging';
import { auth, getMessagingAsync, vapidKey } from '@/config/firebase';
import {
  registerFcmToken,
  unregisterFcmToken,
  touchFcmToken,
  disableNotifications,
} from '@/notifications/registerToken';

export type NotificationStatus =
  | 'unsupported' // browser doesn't support service workers / push
  | 'ios-not-installed' // iOS Safari but not added to Home Screen
  | 'permission-denied' // user denied (must change in OS settings)
  | 'enabled' // token registered successfully
  | 'pending' // not yet requested (user gesture needed)
  | 'checking'; // checking permission/token state on mount

let foregroundMessageSetup: Promise<void> | null = null;

/**
 * FCM displays notification payloads automatically while the app is in the
 * background. While the app is open, the page must display them itself.
 * Use the service worker so foreground pushes appear as system notifications
 * on iOS Home Screen apps as well as desktop browsers.
 */
function ensureForegroundMessageHandler(): Promise<void> {
  if (foregroundMessageSetup) return foregroundMessageSetup;

  foregroundMessageSetup = (async () => {
    const messaging = await getMessagingAsync();
    if (!messaging) {
      foregroundMessageSetup = null;
      return;
    }

    onMessage(messaging, (payload) => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      const data = payload.data ?? {};
      const title = payload.notification?.title ?? data.title ?? 'Kippa';
      const body = payload.notification?.body ?? data.body ?? '';
      const deepLink = data.deepLink ?? '/';

      void navigator.serviceWorker.ready
        .then((registration) =>
          registration.showNotification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: { deepLink, type: data.type ?? '' },
          }),
        )
        .catch((error) => console.warn('[notifications] Could not show foreground notification:', error));
    });
  })().catch((error) => {
    foregroundMessageSetup = null;
    console.warn('[notifications] Could not initialize foreground messages:', error);
  });

  return foregroundMessageSetup;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

/**
 * Push-notification registration lifecycle.
 *
 * IMPORTANT: on iOS Safari (PWA), the permission prompt must come from a user gesture (a click).
 * Calling requestPermission() on page load fails silently on iOS. So this hook does NOT auto-request permission.
 * Instead it:
 *   - Detects platform support / iOS install state (read via `status`).
 *   - Exposes `requestPermission()` to be called from a button onClick.
 *   - Unregisters the token on logout.
 *   - Refreshes `lastSeenAt` while enabled.
 *
 * On Android/desktop, auto-requesting would also work, but we keep the
 * click-triggered flow uniform across platforms for simplicity.
 */
export function useNotifications(householdId: string | null | undefined) {
  const [status, setStatus] = useState<NotificationStatus>(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return 'unsupported';
    }

    if (isIosSafari() && !isStandalone()) {
      return 'ios-not-installed';
    }

    if (!vapidKey || !auth) {
      return 'unsupported';
    }

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'denied') {
        return 'permission-denied';
      }
      if (Notification.permission === 'default') {
        return 'pending';
      }
    }

    return 'checking';
  });

  const currentTokenRef = useRef<string | null>(null);

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
        setStatus('checking');
        try {
          const token = await registerFcmToken(householdId, user.uid, vapidKey);
          if (cancelled) return;
          if (token) {
            currentTokenRef.current = token;
            setStatus('enabled');
          } else {
            setStatus('pending');
          }
        } catch (error) {
          if (cancelled) return;
          console.warn('[notifications] Could not restore push registration:', error);
          setStatus('pending');
        }
      } else if (Notification.permission === 'default') {
        setStatus('pending');
      } else if (Notification.permission === 'denied') {
        setStatus('permission-denied');
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
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!householdId || !auth) return false;
    const user = auth.currentUser;
    if (!user) return false;

    setStatus('pending');
    try {
      const token = await registerFcmToken(householdId, user.uid, vapidKey);
      if (token) {
        currentTokenRef.current = token;
        setStatus('enabled');
        return true;
      }
      if (Notification.permission === 'denied') setStatus('permission-denied');
      return false;
    } catch (error) {
      console.warn('[notifications] Could not enable push on this device:', error);
      setStatus('pending');
      return false;
    }
  }, [householdId]);

  // Heartbeat: update lastSeenAt when enabled
  useEffect(() => {
    if (status !== 'enabled' || !currentTokenRef.current || !householdId) return;
    touchFcmToken(householdId, currentTokenRef.current).catch(() => {});
  }, [status, householdId]);

  // Install one page-wide FCM handler once this device has push permission.
  // The hook is mounted both at the app shell and on the settings page.
  useEffect(() => {
    if (status === 'enabled') void ensureForegroundMessageHandler();
  }, [status]);

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
