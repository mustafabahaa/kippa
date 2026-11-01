/**
 * Recovery for the "stale chunk" crash after deployments (ChunkLoadError /
 * "TypeError: Failed to fetch dynamically imported module").
 *
 * After a deploy, old hashed JS/CSS chunks are gone from Firebase Hosting. A
 * still-running tab (or hour-cached HTML) references the old hashes, so the
 * next lazy navigation or module preload 404s. One guarded page reload picks
 * up fresh HTML pointing at the new hashes. A sessionStorage flag stops an
 * infinite reload loop when the failure is a real bug rather than a stale
 * build; any later successful dynamic import clears the flag so recovery
 * stays armed for future deploys.
 */
const RELOAD_FLAG = 'kippa-chunk-reloaded';

// Message fragments browsers emit when a code-split chunk fails to load.
// Covers Chromium, Firefox, and Safari phrasings.
const CHUNK_ERROR_HINTS = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
  'Loading chunk',
  'Loading CSS chunk',
  'Unable to preload CSS',
];

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_ERROR_HINTS.some((hint) => error.message.includes(hint));
}

/** Reload at most once per session for a stale-chunk failure. */
export function reloadOnceForStaleAssets(): boolean {
  if (sessionStorage.getItem(RELOAD_FLAG)) return false;
  sessionStorage.setItem(RELOAD_FLAG, 'true');
  window.location.reload();
  return true;
}

/** A dynamic import succeeded, so the running build matches the deployment. */
export function clearStaleAssetReloadFlag(): void {
  sessionStorage.removeItem(RELOAD_FLAG);
}

/**
 * Vite dispatches `vite:preloadError` when a module preload (including CSS
 * for a dynamic import) fails. Recover once via reload; otherwise leave the
 * error to the nearest error boundary so the user gets the status page
 * instead of a reload loop.
 */
export function installVitePreloadErrorHandler(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (isChunkLoadError(event.payload)) reloadOnceForStaleAssets();
  });
}
