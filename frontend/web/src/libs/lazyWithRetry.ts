import { lazy, type ComponentType } from 'react';
import { clearStaleAssetReloadFlag, isChunkLoadError, reloadOnceForStaleAssets } from './chunkRecovery';

/**
 * React.lazy wrapper that turns stale-chunk failures after a deployment into
 * a single transparent reload (see chunkRecovery.ts). Real code bugs still
 * throw, reaching the nearest error boundary.
 */
export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory();
      clearStaleAssetReloadFlag();
      return mod;
    } catch (error) {
      if (!isChunkLoadError(error)) throw error;
      if (!reloadOnceForStaleAssets()) throw error;
      // The page is tearing down; keep the promise pending so React never
      // renders a half-resolved module before unload.
      return new Promise<{ default: T }>(() => {});
    }
  });
}
