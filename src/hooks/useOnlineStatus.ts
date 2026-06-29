import { useEffect, useState } from 'react';

/**
 * Returns a live boolean reflecting the browser's transport-level connectivity.
 * Crude by design — the real offline data buffering is handled by the Firestore
 * SDK's persistent cache; this hook only drives UI affordances (banner / toasts).
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    () => (typeof navigator === 'undefined' ? true : navigator.onLine)
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
