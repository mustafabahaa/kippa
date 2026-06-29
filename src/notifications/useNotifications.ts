import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, vapidKey } from '../config/firebase';
import { registerFcmToken, unregisterFcmToken, touchFcmToken } from './registerToken';

export type NotificationStatus =
  | 'unsupported'       // browser doesn't support service workers / push
  | 'ios-not-installed' // iOS Safari but not added to Home Screen
  | 'permission-denied' // user denied
  | 'enabled'           // token registered successfully
  | 'pending';          // still working

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
 * Handles the full push-notification registration lifecycle:
 * - Detects iOS Safari and requires Home Screen install.
 * - Requests permission.
 * - Registers the FCM token.
 * - Updates lastSeenAt on app open.
 * - Unregisters on logout.
 *
 * Call this once at the app root, after the user is logged in and has a
 * household.
 */
export function useNotifications(householdId: string | null | undefined): NotificationStatus {
  const [status, setStatus] = useState<NotificationStatus>('pending');
  const currentTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!householdId) return;

    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    // iOS Safari requires Home Screen install for push
    if (isIosSafari() && !isStandalone()) {
      setStatus('ios-not-installed');
      return;
    }

    if (!vapidKey) {
      console.warn('[notifications] VITE_FIREBASE_VAPID_KEY not set');
      setStatus('unsupported');
      return;
    }

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

      // Logged in — register
      const token = await registerFcmToken(householdId, user.uid, vapidKey);
      if (cancelled) return;

      if (token) {
        currentTokenRef.current = token;
        setStatus('enabled');
      } else if (Notification.permission === 'denied') {
        setStatus('permission-denied');
      } else {
        setStatus('pending');
      }
    });

    return () => {
      cancelled = true;
      sub();
    };
  }, [householdId]);

  // Heartbeat: update lastSeenAt when enabled
  useEffect(() => {
    if (status !== 'enabled' || !currentTokenRef.current || !householdId) return;
    touchFcmToken(householdId, currentTokenRef.current).catch(() => {});
  }, [status, householdId]);

  return status;
}
