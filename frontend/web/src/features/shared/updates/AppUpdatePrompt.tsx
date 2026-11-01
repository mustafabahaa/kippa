import { useEffect } from 'react';
import { closeSnackbar, useSnackbar } from 'notistack';
import { Button } from '@monochrome-ui/design-system';
import { registerSW } from 'virtual:pwa-register';

/**
 * Prompts the user when a new service-worker build is waiting, instead of the
 * old autoUpdate behaviour where a mid-session skipWaiting activation could
 * swap the precache under the running app and break the next lazy navigation.
 * The app only ever reloads on explicit user action, so unsaved work and
 * active operations are never interrupted.
 */
let notifyUpdateAvailable: (() => void) | null = null;
let dismissedForSession = false;

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh: () => {
    if (!dismissedForSession) notifyUpdateAvailable?.();
  },
  // Installed Home Screen apps can stay open for days; re-check for a
  // waiting build hourly and whenever the app returns to the foreground.
  onRegisteredSW: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => {
    void swUrl;
    if (!registration) return;
    window.setInterval(() => void registration.update().catch(() => {}), 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration.update().catch(() => {});
    });
  },
  onRegisterError: (error) => console.error('Service worker registration failed', error),
});

export function AppUpdatePrompt() {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    notifyUpdateAvailable = () => {
      enqueueSnackbar('A new version of Kippa is available.', {
        key: 'app-update-available',
        variant: 'default',
        persist: true,
        action: (snackbarId) => (
          <>
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() => {
                closeSnackbar(snackbarId);
                dismissedForSession = true;
              }}
            >
              Later
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                closeSnackbar(snackbarId);
                void updateServiceWorker(true);
              }}
            >
              Update
            </Button>
          </>
        ),
      });
    };

    return () => {
      notifyUpdateAvailable = null;
    };
  }, [enqueueSnackbar]);

  return null;
}
