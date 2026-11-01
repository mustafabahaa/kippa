// Vitest stub for the vite-plugin-pwa virtual module (aliased in
// vitest.config.ts). Exposes mutable handles so tests can trigger and assert
// the update flow without a real service worker.
type RegisterSWOptions = {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegisteredSW?: (swUrl: string, registration: unknown) => void;
  onRegisterError?: (error: unknown) => void;
};

export const pwaRegisterStub = {
  onNeedRefresh: undefined as (() => void) | undefined,
  updateCalls: [] as Array<boolean | undefined>,
  reset() {
    // Keep onNeedRefresh: AppUpdatePrompt registers it once at module scope.
    this.updateCalls = [];
  },
};

export function registerSW(options: RegisterSWOptions = {}) {
  pwaRegisterStub.onNeedRefresh = options.onNeedRefresh;
  return (reloadPage?: boolean) => {
    pwaRegisterStub.updateCalls.push(reloadPage);
    return Promise.resolve();
  };
}
