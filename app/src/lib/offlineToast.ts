import type { ProviderContext } from 'notistack';

/** Pure decision: should an otherwise-successful mutation show the offline toast? */
export function shouldShowOfflineToast(isOnline: boolean): boolean {
  return !isOnline;
}

type EnqueueSnackbar = ProviderContext['enqueueSnackbar'];

export interface NotifyOfflineAwareSuccessArgs {
  isOnline: boolean;
  enqueue: EnqueueSnackbar;
}

/**
 * Called from a mutation's onSuccess. When offline, the write was buffered
 * locally by the Firestore SDK — tell the user it will sync on reconnect.
 * When online, do nothing (the caller's own success toast, if any, handles it).
 */
export function notifyOfflineAwareSuccess({ isOnline, enqueue }: NotifyOfflineAwareSuccessArgs): void {
  if (shouldShowOfflineToast(isOnline)) {
    enqueue('Saved — will sync when back online', { variant: 'info' });
  }
}
